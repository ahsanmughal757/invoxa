"use server";

import { revalidateTag } from "next/cache";
import { getSupabaseUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { Logger } from "@/lib/utils/logger";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { createAdminClient } from "@/lib/supabase/server";
import { getMembersByOrgId, getMemberByOrgAndUserId, createMember, updateMember, deleteMember } from "@/lib/repositories/members.repository.func";
import { getOrganizationById } from "@/lib/repositories/organizations.repository.func";
import { getUserByClerkId } from "@/lib/repositories/users.repository.func";

export type MemberRole = "owner" | "admin" | "member";

export interface MemberData {
  id?: string;
  org_id: string;
  user_id: string;
  role: MemberRole;
}

export interface MemberWithProfile {
  id: string;
  org_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
  profile: {
    id: string;
    clerk_user_id: string;
    name: string | null;
    email: string | null;
  } | null;
}

/**
 * Get all members for an organization with their profiles
 */
export async function getMembersForOrganizationAction(orgId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();

    // Get members with profile information
    const { data: members, error } = await supabase
      .from("org_members")
      .select(
        `
        id,
        org_id,
        user_id,
        role,
        created_at,
        profile:user_id (
          id,
          clerk_user_id,
          name,
          email
        )
      `
      )
      .eq("org_id", orgId);

    if (error) {
      if (error.code === "PGRST116" || error.message.includes("Row not found")) {
        Logger.info("GET_MEMBERS_ACTION", "No members found for organization", {
          orgId,
        });
        return { success: true, data: [] };
      }
      Logger.error("GET_MEMBERS_ACTION", "Error fetching members", error, {
        orgId,
      });
      return { success: false, error: error.message };
    }

    console.log("Raw members data from DB:", members);

    // Transform data to include profile
    const membersWithProfiles: MemberWithProfile[] = members.map((m) => ({
      ...m,
      profile: Array.isArray(m.profile) ? m.profile[0] || null : m.profile || null,
    }));

    Logger.info("GET_MEMBERS_ACTION", "Members fetched successfully", {
      orgId,
      details: { count: membersWithProfiles.length },
    });

    return { success: true, data: membersWithProfiles };
  } catch (error) {
    Logger.error("GET_MEMBERS_ACTION", "Unexpected error fetching members", error, {
      orgId,
    });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Add a member to an organization
 */
export async function addMemberAction(orgId: string, userId: string, role: MemberRole = "member") {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return { success: false, error: "Unauthorized" };
    }

    const currentUserProfile = await getSupabaseUser();
    if (!currentUserProfile) {
      return { success: false, error: "Current user profile not found" };
    }

    // Verify current user has permission to add members
    const currentMembership = await getMemberByOrgAndUserId(orgId, currentUserProfile.id);
    const organization = await getOrganizationById(orgId);

    const isOwner = organization?.owner_user_id === currentUserProfile.id;
    const isAdmin = currentMembership?.role === "admin";

    if (!isOwner && !isAdmin) {
      return { success: false, error: "Only owners and admins can add members" };
    }

    // Check if user is already a member
    const existingMember = await getMemberByOrgAndUserId(orgId, userId);
    if (existingMember) {
      return { 
        success: false, 
        error: "User is already a member of this organization" 
      };
    }

    // Add the member
    const newMember = await createMember({
      org_id: orgId,
      user_id: userId,
      role,
      created_at: new Date().toISOString(),
    });

    Logger.info("ADD_MEMBER_ACTION", "Member added successfully", {
      orgId,
      details: { addedUserId: userId, role, addedBy: currentUserId },
    });

    revalidateTag(CACHE_TAGS.MEMBERS(orgId));

    return { success: true, data: newMember };
  } catch (error) {
    Logger.error("ADD_MEMBER_ACTION", "Error adding member", error, {
      orgId,
      userId,
    });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update a member's role in an organization
 */
export async function updateMemberRoleAction(
  orgId: string,
  targetUserId: string,
  newRole: MemberRole
) {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return { success: false, error: "Unauthorized" };
    }

    const currentUserProfile = await getSupabaseUser();
    if (!currentUserProfile) {
      return { success: false, error: "Current user profile not found" };
    }

    // Only owners can change roles
    const organization = await getOrganizationById(orgId);
    if (organization?.owner_user_id !== currentUserProfile.id) {
      return { success: false, error: "Only owners can change member roles" };
    }

    // Get the target member
    const targetMember = await getMemberByOrgAndUserId(orgId, targetUserId);
    if (!targetMember) {
      return { success: false, error: "Member not found" };
    }

    // Prevent demoting the last owner (shouldn't happen but safety check)
    if (targetMember.role === "owner") {
      return { success: false, error: "Cannot change owner role. Transfer ownership instead." };
    }

    // Update the role
    const updatedMember = await updateMember(targetMember.id, { role: newRole });

    Logger.info("UPDATE_MEMBER_ROLE_ACTION", "Member role updated successfully", {
      orgId,
      details: { targetUserId, newRole, updatedBy: currentUserId },
    });

    revalidateTag(CACHE_TAGS.MEMBERS(orgId));

    return { success: true, data: updatedMember };
  } catch (error) {
    Logger.error("UPDATE_MEMBER_ROLE_ACTION", "Error updating member role", error, {
      orgId,
      details: { targetUserId },
    });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Remove a member from an organization
 */
export async function removeMemberAction(orgId: string, targetUserId: string) {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return { success: false, error: "Unauthorized" };
    }

    const currentUserProfile = await getSupabaseUser();
    if (!currentUserProfile) {
      return { success: false, error: "Current user profile not found" };
    }

    // Get the target member
    const targetMember = await getMemberByOrgAndUserId(orgId, targetUserId);
    if (!targetMember) {
      return { success: false, error: "Member not found" };
    }

    // Get current user's membership
    const currentMembership = await getMemberByOrgAndUserId(orgId, currentUserProfile.id);
    const organization = await getOrganizationById(orgId);

    const isOwner = organization?.owner_user_id === currentUserProfile.id;
    const isAdmin = currentMembership?.role === "admin";

    // Check permissions: owner can remove anyone, admin can remove members, users can only remove themselves
    const isSelf = targetUserId === currentUserProfile.id;
    
    if (!isOwner && !isAdmin && !isSelf) {
      return { success: false, error: "You don't have permission to remove this member" };
    }

    // Admins cannot remove other admins or owners
    if (isAdmin && (targetMember.role === "admin" || targetMember.role === "owner")) {
      return { success: false, error: "Admins can only remove regular members" };
    }

    // Prevent removing the last owner
    if (targetMember.role === "owner") {
      // Get all owners
      const supabase = await createAdminClient();
      const { data: allMembers } = await supabase
        .from("org_members")
        .select("role")
        .eq("org_id", orgId)
        .eq("role", "owner");

      const ownerCount = allMembers?.length || 0;
      if (ownerCount <= 1) {
        return { 
          success: false, 
          error: "Cannot remove the last owner. Transfer ownership first." 
        };
      }
    }

    // Remove the member
    await deleteMember(targetMember.id);

    Logger.info("REMOVE_MEMBER_ACTION", "Member removed successfully", {
      orgId,
      details: { removedUserId: targetUserId, removedBy: currentUserId, wasSelf: isSelf },
    });

    revalidateTag(CACHE_TAGS.MEMBERS(orgId));

    return { success: true, data: { id: targetMember.id } };
  } catch (error) {
    Logger.error("REMOVE_MEMBER_ACTION", "Error removing member", error, {
      orgId,
      details: { targetUserId },
    });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Leave an organization (self-removal for non-owners)
 */
export async function leaveOrganizationAction(orgId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const currentUserProfile = await getSupabaseUser();
    if (!currentUserProfile) {
      return { success: false, error: "User profile not found" };
    }

    // Check if user is the owner
    const organization = await getOrganizationById(orgId);
    if (organization?.owner_user_id === currentUserProfile.id) {
      return { 
        success: false, 
        error: "Owners cannot leave their organization. Transfer ownership or delete the organization instead." 
      };
    }

    // Get the membership
    const membership = await getMemberByOrgAndUserId(orgId, currentUserProfile.id);
    if (!membership) {
      return { success: false, error: "You are not a member of this organization" };
    }

    // Remove the member
    await deleteMember(membership.id);

    Logger.info("LEAVE_ORGANIZATION_ACTION", "User left organization successfully", {
      orgId,
      details: { userId },
    });

    revalidateTag(CACHE_TAGS.MEMBERS(orgId));

    return { success: true, data: { id: membership.id } };
  } catch (error) {
    Logger.error("LEAVE_ORGANIZATION_ACTION", "Error leaving organization", error, {
      orgId,
    });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Transfer ownership to another member
 */
export async function transferOwnershipAction(orgId: string, newOwnerId: string) {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return { success: false, error: "Unauthorized" };
    }

    const currentUserProfile = await getSupabaseUser();
    if (!currentUserProfile) {
      return { success: false, error: "Current user profile not found" };
    }

    // Verify current user is the owner
    const organization = await getOrganizationById(orgId);
    if (!organization) {
      return { success: false, error: "Organization not found" };
    }

    if (organization.owner_user_id !== currentUserProfile.id) {
      return { success: false, error: "Only the current owner can transfer ownership" };
    }

    // Verify the new owner is a member
    const newOwnerMember = await getMemberByOrgAndUserId(orgId, newOwnerId);
    if (!newOwnerMember) {
      return { success: false, error: "New owner must be a member of the organization" };
    }

    const supabase = await createAdminClient();

    // Update the organization owner
    const { error: updateOrgError } = await supabase
      .from("organizations")
      .update({ owner_user_id: newOwnerId })
      .eq("id", orgId);

    if (updateOrgError) {
      Logger.error("TRANSFER_OWNERSHIP_ACTION", "Error updating organization owner", updateOrgError, {
        orgId,
        details: { newOwnerId },
      });
      return { success: false, error: "Failed to transfer ownership" };
    }

    // Update the old owner's membership to member
    const currentMembership = await getMemberByOrgAndUserId(orgId, currentUserProfile.id);
    if (currentMembership) {
      await updateMember(currentMembership.id, { role: "member" });
    }

    // Update the new owner's membership to owner
    await updateMember(newOwnerMember.id, { role: "owner" });

    Logger.info("TRANSFER_OWNERSHIP_ACTION", "Ownership transferred successfully", {
      orgId,
      details: { fromUserId: currentUserProfile.id, toUserId: newOwnerId },
    });

    revalidateTag(CACHE_TAGS.MEMBERS(orgId));
    revalidateTag(CACHE_TAGS.ORGANIZATIONS(currentUserId));

    return { success: true, data: { organization_id: orgId, new_owner_id: newOwnerId } };
  } catch (error) {
    Logger.error("TRANSFER_OWNERSHIP_ACTION", "Error transferring ownership", error, {
      orgId,
      details: { newOwnerId },
    });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get count of owners in an organization
 */
export async function getOwnerCountAction(orgId: string) {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("org_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("role", "owner");

    if (error) {
      Logger.error("GET_OWNER_COUNT_ACTION", "Error counting owners", error, { orgId });
      return { success: false, error: error.message };
    }

    return { success: true, data: { count: data?.length || 0 } };
  } catch (error) {
    Logger.error("GET_OWNER_COUNT_ACTION", "Error counting owners", error, { orgId });
    return { success: false, error: (error as Error).message };
  }
}
