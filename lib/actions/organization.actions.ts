"use server";

import {
  createOrganization,
  getOrganizationByOwnerId,
  updateOrganization as updateOrgRepo,
} from "@/lib/repositories/organizations.repository.func";
import { getUserByClerkId } from "@/lib/repositories/users.repository.func";
import { getSupabaseUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";
import { logSuccess, Logger } from "@/lib/utils/logger";
import { createAdminClient } from "@/lib/supabase/server";
import { CACHE_TAGS } from "@/lib/cache-tags";

export interface OrganizationData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  tax_id?: string;
  logo_url?: string;
  branding?: any;
}

export async function createOrganizationAction(orgData: OrganizationData) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("Unauthorized");
    }

    const userProfile = await getUserByClerkId(userId);

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const result = await createOrganization({
      ...orgData,
      owner_user_id: userProfile.id,
      owner_clerk_id: userId,
    });

    // Log successful organization creation
    logSuccess.organizationCreated(result.id, userId);

    revalidateTag(CACHE_TAGS.ORGANIZATIONS(userId));

    return { success: true, data: result };
  } catch (error) {
    const { userId: currentUserId } = await auth();
    Logger.error(
      "CREATE_ORGANIZATION_ACTION",
      "Failed to create organization",
      error,
      {
        userId: currentUserId,
      },
    );
    return { success: false, error: (error as Error).message };
  }
}

export async function updateOrganizationAction(
  orgId: string,
  orgData: Partial<OrganizationData>,
) {
  let userId, userProfile, currentOrgId;
  try {
    ({ userId } = await auth());
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get user profile to get organization ID
    userProfile = await getSupabaseUser();
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    currentOrgId = userProfile.org_id;
    if (!currentOrgId) {
      throw new Error("Organization ID not found");
    }

    // Handle the type properly since orgId can be null
    const orgIdStr = currentOrgId;

    const result = await updateOrgRepo(orgIdStr, orgData);

    // Sanitize the result to ensure it's properly serializable
    const sanitizedResult = result
      ? {
          ...result,
          // Ensure branding is properly serialized if it exists
          branding: result.branding
            ? JSON.parse(JSON.stringify(result.branding))
            : undefined,
        }
      : null;

    // Log successful organization update
    logSuccess.organizationUpdated(orgIdStr, userId);

    revalidateTag(CACHE_TAGS.ORGANIZATIONS(userId));

    return { success: true, data: sanitizedResult };
  } catch (error) {
    // Need to get userId again since it might have changed after error
    const { userId: currentUserId } = await auth();
    // Get user profile again to get org_id in case of error
    const currentUserProfile = await getSupabaseUser();
    const currentOrgIdFromProfile = currentUserProfile?.org_id ?? undefined;

    Logger.error(
      "UPDATE_ORGANIZATION_ACTION",
      "Failed to update organization",
      error,
      {
        userId: currentUserId,
        entityId: currentOrgIdFromProfile,
      },
    );
    return { success: false, error: (error as Error).message };
  }
}

export async function getOrganizationAction() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get user profile by clerk_user_id to get the owner_user_id
    const userProfile = await getSupabaseUser();
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    // Get the organization using the owner_user_id
    const organization = await getOrganizationByOwnerId(
      userProfile.clerk_user_id,
    );

    // Return success with null data if organization not found (empty state)
    // Sanitize the organization data to ensure it's properly serializable
    const sanitizedOrganization = organization
      ? {
          ...organization,
          // Ensure branding is properly serialized if it exists
          branding: organization.branding
            ? JSON.parse(JSON.stringify(organization.branding))
            : undefined,
        }
      : null;

    // Log successful organization retrieval
    if (organization) {
      Logger.info(
        "GET_ORGANIZATION_ACTION",
        "Organization retrieved successfully",
        {
          userId,
          entityId: organization.id,
          entityType: "organization",
        },
      );
    } else {
      Logger.info("GET_ORGANIZATION_ACTION", "No organization found for user", {
        userId,
        entityType: "organization",
      });
    }

    return { success: true, data: sanitizedOrganization };
  } catch (error) {
    const { userId: currentUserId } = await auth();
    const currentUserProfile = await getSupabaseUser();
    const currentOrgId = currentUserProfile?.org_id ?? undefined;

    Logger.error(
      "GET_ORGANIZATION_ACTION",
      "Failed to retrieve organization",
      error,
      {
        userId: currentUserId,
        entityId: currentOrgId,
      },
    );
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get all organizations for the current user (both owned and member organizations)
 */
export async function getOrganizationsForUserAction() {
  try {
    const { userId } = await auth();

    if (!userId) {
      Logger.error(
        "GET_ORGANIZATIONS_ACTION",
        "Unauthorized access attempt to fetch organizations",
        { userId },
      );
      return { success: false, error: "Unauthorized" };
    }

    const userProfile = await getSupabaseUser();
    if (!userProfile) {
      return { success: false, error: "User profile not found" };
    }

    const supabase = await createAdminClient();

    // Get organizations where user is owner
    const ownedOrgs = await getOrganizationByOwnerId(userProfile.clerk_user_id);

    // Get organizations where user is a member
    const { data: memberOrgs, error: memberError } = await supabase
      .from("org_members")
      .select(
        `
        id,
        org_id,
        role,
        created_at,
        organization:organizations (
          id,
          owner_user_id,
          name,
          email,
          logo_url,
          branding,
          created_at
        )
      `,
      )
      .eq("user_id", userProfile.id);

    if (memberError && memberError.code !== "PGRST116") {
      Logger.error(
        "GET_ORGANIZATIONS_ACTION",
        "Error fetching member organizations",
        memberError,
        { userId },
      );
      return { success: false, error: memberError.message };
    }

    // Combine and format organizations
    const organizations: Array<{
      id: string;
      name: string;
      logo_url?: string;
      branding?: any;
      email?: string;
      bankDetails?: any;
      created_at: string;
      userRole: "owner" | "admin" | "member";
    }> = [];

    // Add owned organization
    if (ownedOrgs?.length > 0) {
      ownedOrgs.map((org: any) => {
        organizations.push({
          ...org,
          branding: org.branding
            ? JSON.parse(JSON.stringify(org.branding))
            : undefined,
          bankDetails: org.bankDetails,
          email: org.email,
          userRole: "owner" as const,
        });
      });
    }

    // Add member organizations
    if (memberOrgs && Array.isArray(memberOrgs)) {
      memberOrgs.forEach((membership: any) => {
        if (membership.organization) {
          organizations.push({
            id: membership.organization.id || "",
            name: membership.organization.name,
            logo_url: membership.organization.logo_url,
            branding: membership.organization.branding
              ? JSON.parse(JSON.stringify(membership.organization.branding))
              : undefined,
            bankDetails: membership.organization.bankDetails,
            created_at: membership.organization.created_at,
            userRole: membership.role as "owner" | "admin" | "member",
          });
        }
      });
    }

    Logger.info(
      "GET_ORGANIZATIONS_ACTION",
      "Organizations fetched successfully",
      {
        userId,
        details: { count: organizations.length },
      },
    );

    return { success: true, data: organizations };
  } catch (error) {
    const { userId: currentUserId } = await auth();
    Logger.error(
      "GET_ORGANIZATIONS_ACTION",
      "Failed to fetch organizations",
      error,
      { userId: currentUserId },
    );
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Switch active organization for the current user
 */
export async function switchActiveOrganizationAction(orgId: string | null) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const userProfile = await getSupabaseUser();

    if (!userProfile) {
      return { success: false, error: "User profile not found" };
    }

    // If orgId is null, just clear the active organization
    if (!orgId) {
      const { error } = await supabase
        .from("profiles")
        .update({ org_id: null })
        .eq("id", userProfile.id);

      if (error) {
        Logger.error(
          "SWITCH_ORGANIZATION_ACTION",
          "Error clearing active organization",
          error,
          { userId },
        );
        return { success: false, error: "Failed to switch organization" };
      }

      Logger.info("SWITCH_ORGANIZATION_ACTION", "Active organization cleared", {
        userId,
      });

      revalidateTag(CACHE_TAGS.ORGANIZATIONS(userId));

      return { success: true, data: { org_id: null } };
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from("org_members")
      .select("id")
      .eq("org_id", orgId)
      .eq("user_id", userProfile.id)
      .maybeSingle();

    // Also check if user is the owner
    const { data: ownedOrg } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", orgId)
      .eq("owner_user_id", userProfile.id)
      .maybeSingle();

    if (!membership && !ownedOrg) {
      return {
        success: false,
        error: "You don't have access to this organization",
      };
    }

    // Update the user's active organization
    const { error } = await supabase
      .from("profiles")
      .update({ org_id: orgId })
      .eq("id", userProfile.id);

    if (error) {
      Logger.error(
        "SWITCH_ORGANIZATION_ACTION",
        "Error switching organization",
        error,
        { userId, orgId },
      );
      return { success: false, error: "Failed to switch organization" };
    }

    Logger.info(
      "SWITCH_ORGANIZATION_ACTION",
      "Organization switched successfully",
      { userId, orgId },
    );

    revalidateTag(CACHE_TAGS.ORGANIZATIONS(userId));

    return { success: true, data: { org_id: orgId } };
  } catch (error) {
    const { userId: currentUserId } = await auth();
    Logger.error(
      "SWITCH_ORGANIZATION_ACTION",
      "Failed to switch organization",
      error,
      { userId: currentUserId, orgId },
    );
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete an organization with id for the current user
 */
export async function deleteOrganizationAction(orgId: string | null) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    const supabase = await createAdminClient();
    const userProfile = await getSupabaseUser();

    if (!userProfile) {
      Logger.error(
        "DELETE_ORGANIZATION_ACTION",
        `User profile not found for clerk id : ${userId}`,
        {
          userId,
        },
      );
      return { success: false, error: "User profile not found" };
    }

    if (!orgId) {
      Logger.error(
        "DELETE_ORGANIZATION_ACTION",
        `Error deleting organization: ${orgId}`,
        { userId, orgId },
      );
      return {
        success: false,
        error: "Organization Identifier is required for organization deletion!",
      };
    }

    const { error } = await supabase
      .from("organizations")
      .delete()
      .eq("id", orgId);

    if (error) {
      Logger.error(
        "DELETE_ORGANIZATION_ACTION",
        `Error deleting organization: ${orgId}`,
        error,
        { userId },
      );
      return { success: false, error: "Failed to delete organization" };
    }

    Logger.info(
      "DELETE_ORGANIZATION_ACTION",
      `Deleted the organization: ${orgId}`,
      {
        userId,
      },
    );

    revalidateTag(CACHE_TAGS.ORGANIZATIONS(userId));

    return {
      success: true,
      data: { org_id: orgId },
    };
  } catch (error) {
    const { userId: currentUserId } = await auth();
    Logger.error(
      "SWITCH_ORGANIZATION_ACTION",
      "Failed to switch organization",
      error,
      { userId: currentUserId, orgId },
    );
    return { success: false, error: (error as Error).message };
  }
}
