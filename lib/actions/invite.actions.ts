"use server";

import { revalidateTag } from "next/cache";
import { getSupabaseUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { Logger } from "@/lib/utils/logger";
import { createAdminClient } from "@/lib/supabase/server";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { getUserByEmail } from "../repositories/users.repository.func";

export async function getInviteByTokenAction(token: string) {
  try {
    const supabase = await createAdminClient();

    // Fetch the invite by token
    const { data: invite, error } = await supabase
      .from("organization_invites")
      .select(
        `
        *,
        organization:organizations(*),
        inviter_profile:profiles!inviter_id(*)
      `,
      )
      .eq("token", token)
      .single();

    if (error) {
      // If the error is due to no rows found, treat as empty state
      if (
        error.code === "PGRST116" ||
        error.message.includes("Row not found")
      ) {
        return { success: true, data: { invite: null } }; // Empty state, not error
      }
      // For other errors (system errors), throw
      throw new Error(`Failed to fetch invite: ${error.message}`);
    }

    if (invite.status === "accepted") {
      throw new Error("Invite has already been accepted!"); // Invite already accepted, return it
    }

    // Check if invite is expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new Error("Invite has expired");
    }

    return { success: true, data: { invite } };
  } catch (error) {
    Logger.error(
      "GET_INVITE_BY_TOKEN_ACTION",
      "Failed to get invite by token",
      { error },
      {
        details: { token },
      },
    );
    return { success: false, error: (error as Error).message };
  }
}

export async function acceptInviteAction(token: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const userProfile = await getSupabaseUser();
    console.log("User profile in acceptInviteAction:", userId);
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const supabase = await createAdminClient();

    // Fetch the invite by token
    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .select(
        `
        *,
        organization:organizations(*)
      `,
      )
      .eq("token", token)
      .single();

    if (inviteError) {
      // If the error is due to no rows found, treat as empty state
      if (
        inviteError.code === "PGRST116" ||
        inviteError.message.includes("Row not found")
      ) {
        return { success: false, error: "Invite not found or invalid" }; // Empty state, not system error
      }
      // For other errors (system errors), throw
      throw inviteError;
    }

    // Check if invite is expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new Error("Invitation has expired");
    }

    // Check if user is already a member of this organization
    const { data: existingMembership, error: membershipError } = await supabase
      .from("org_members")
      .select("*")
      .eq("user_id", userProfile.id)
      .eq("org_id", invite.organization_id)
      .maybeSingle();

    if (existingMembership) {
      Logger.error(
        "ACCEPT_INVITE_ACTION",
        "User is already a member of this organization",
        { userId: userProfile.id, orgId: invite.organization_id },
      );
      throw new Error("User is already a member of this organization");
    }

    // Add user to organization
    const { error: membershipInsertError } = await supabase
      .from("org_members")
      .insert({
        user_id: userProfile.id,
        org_id: invite.organization_id,
        role: invite.role || "member",
        created_at: new Date().toISOString(),
      });

    if (membershipInsertError) {
      Logger.error(
        "ACCEPT_INVITE_ACTION",
        "Failed to add user to organization",
        { error: membershipInsertError },
        {
          details: {
            token,
            userId: userProfile.id,
            orgId: invite.organization_id,
          },
        },
      );
      throw new Error(`Failed to add user to organization!`);
    }

    // Change the organization invite status because of accepted
    const { error: updateInviteError } = await supabase
      .from("organization_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        accepted_by_user_id: userProfile.id,
      })
      .eq("token", token);

    if (updateInviteError) {
      Logger.error(
        "ACCEPT_INVITE_ACTION",
        "Failed to update invite status to accepted",
        { error: updateInviteError },
        {
          details: {
            token,
            userId: userProfile.id,
            orgId: invite.organization_id,
          },
        },
      );
      throw new Error(`Failed to update invite status!`);
    }

    // Optionally delete the invite after acceptance
    // await supabase
    //   .from('organization_invites')
    //   .delete()
    //   .eq('id', invite.id);

    revalidateTag(CACHE_TAGS.INVITES(invite.organization_id));
    revalidateTag(CACHE_TAGS.MEMBERS(invite.organization_id));

    return { success: true, data: { organization: invite.organization } };
  } catch (error) {
    Logger.error(
      "ACCEPT_INVITE_ACTION",
      "Failed to accept invite",
      { error: JSON.stringify(error) },
      {
        details: { token, error: JSON.stringify(error) },
      },
    );
    return { success: false, error: (error as Error).message };
  }
}

export async function rejectInviteAction(token: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const supabase = await createAdminClient();

    // Fetch the invite by token
    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .select(
        `
        *,
        organization:organizations(*)
      `,
      )
      .eq("token", token)
      .single();

    if (inviteError) {
      // If the error is due to no rows found, treat as empty state
      if (
        inviteError.code === "PGRST116" ||
        inviteError.message.includes("Row not found")
      ) {
        return { success: false, error: "Invite not found or invalid" }; // Empty state, not system error
      }
      // For other errors (system errors), throw
      throw new Error(`Failed to fetch invite: ${inviteError.message}`);
    }

    // Check if invite is expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      throw new Error("Invite has expired");
    }

    // Update the invite status to rejected
    const { error: updateError } = await supabase
      .from("organization_invites")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    if (updateError) {
      throw new Error(`Failed to reject invite: ${updateError.message}`);
    }

    revalidateTag(CACHE_TAGS.INVITES(invite.organization_id));

    return { success: true, data: { organization: invite.organization } };
  } catch (error) {
    Logger.error(
      "REJECT_INVITE_ACTION",
      "Failed to reject invite",
      { error },
      {
        details: { token },
      },
    );
    return { success: false, error: (error as Error).message };
  }
}

export async function createInviteAction(
  organization_id: string,
  email: string,
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const userProfile = await getSupabaseUser();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const invitedUserProfile = await getUserByEmail(email);

    if (!invitedUserProfile) {
      Logger.warn(
        "CREATE_INVITE_ACTION",
        "No user found with the provided email",
      );
      throw new Error("No user found with the provided email");
    }

    // Verify that the user belongs to the organization
    // if (userProfile.org_id !== organization_id) {
    //   throw new Error('User does not belong to this organization');
    // }

    const supabase = await createAdminClient();

    // Generate a unique token for the invite
    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Insert the invite into the database
    const { data: newInvite, error: insertError } = await supabase
      .from("organization_invites")
      .insert({
        organization_id,
        email,
        token,
        inviter_id: userProfile.id,
        expires_at: expiresAt.toISOString(),
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      Logger.error(
        "CREATE_INVITE_ACTION",
        "Failed to create invite in database",
        { error: insertError },
        {
          details: { organization_id, email },
        },
      );
      throw new Error(`Failed to create invite`);
    }

    // Create the invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/invite/${token}`;

    revalidateTag(CACHE_TAGS.INVITES(organization_id));

    return {
      success: true,
      data: {
        inviteLink,
        expires_at: newInvite.expires_at,
        id: newInvite.id,
      },
    };
  } catch (error) {
    Logger.error(
      "CREATE_INVITE_ACTION",
      "Failed to create invite",
      { error },
      {
        details: { organization_id, email },
      },
    );
    return { success: false, error: (error as Error).message };
  }
}

export async function revokeInviteAction(inviteId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const userProfile = await getSupabaseUser();
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const supabase = await createAdminClient();

    // Fetch the invite to verify ownership
    const { data: invite, error: fetchError } = await supabase
      .from("organization_invites")
      .select(
        `
        *,
        organization:organizations(*)
      `,
      )
      .eq("id", inviteId)
      .single();

    if (fetchError) {
      // If the error is due to no rows found, treat as empty state
      if (
        fetchError.code === "PGRST116" ||
        fetchError.message.includes("Row not found")
      ) {
        return { success: false, error: "Invite not found or invalid" }; // Empty state, not system error
      }
      // For other errors (system errors), throw
      throw new Error(`Failed to fetch invite: ${fetchError.message}`);
    }

    // Verify that the user is the inviter or an admin of the organization
    if (
      invite.inviter_user_id !== userProfile.id &&
      invite.organization.owner_user_id !== userProfile.id
    ) {
      throw new Error("You do not have permission to revoke this invite");
    }

    // Update the invite status to revoked
    const { error: updateError } = await supabase
      .from("organization_invites")
      .update({
        status: "revoked",
        updated_at: new Date().toISOString(),
      })
      .eq("id", inviteId);

    if (updateError) {
      throw new Error(`Failed to revoke invite: ${updateError.message}`);
    }

    revalidateTag(CACHE_TAGS.INVITES(invite.organization_id));

    return { success: true, data: { id: inviteId } };
  } catch (error) {
    Logger.error(
      "REVOKE_INVITE_ACTION",
      "Failed to revoke invite",
      { error },
      {
        details: { inviteId },
      },
    );
    return { success: false, error: (error as Error).message };
  }
}

export async function getOrganizationInvitesAction(organizationId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const userProfile = await getSupabaseUser();
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    // Verify that the user belongs to the organization
    // if (userProfile.org_id !== organizationId) {
    //   Logger.error(
    //     "GET_ORGANIZATION_INVITES_ACTION",
    //     "User does not belong to this organization",
    //     { details: { organizationId, userId } },
    //   );
    //   throw new Error("User does not belong to this organization");
    // }

    const supabase = await createAdminClient();

    // Fetch invites for the organization
    const { data: invites, error: invitesError } = await supabase
      .from("organization_invites")
      .select(
        `
        *,
        inviter:profiles!inviter_id(name, email),
        accepted_user:profiles!accepted_by_user_id(id, name, email)
      `,
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (invitesError) {
      Logger.error(
        "GET_ORGANIZATION_INVITES_ACTION",
        "Failed to fetch invites ",
        { error: invitesError },
        { details: { organizationId } },
      );
      throw new Error(`Failed to fetch invites`);
    }

    // Also fetch members who joined via invites
    const { data: joinedUsers, error: membersError } = await supabase
      .from("org_members")
      .select(
        `
        *,
        user:profiles(*)
      `,
      )
      .eq("org_id", organizationId)
    
    if (membersError) {
      Logger.error(
        "GET_ORGANIZATION_INVITES_ACTION",
        "Failed to fetch joined users from invites",
        { error: membersError },
        { details: { organizationId } },
      );
      throw new Error(`Failed to fetch joined users`);
    }

    console.log("invites Data: ===", {
      invites,
      joinedUsersFromInvites: joinedUsers,
    });
    

    return {
      success: true,
      data: {
        invites,
        joinedUsersFromInvites: joinedUsers,
      },
    };
  } catch (error) {
    Logger.error(
      "GET_ORGANIZATION_INVITES_ACTION",
      "Failed to get organization invites",
      { error },
      {
        details: { organizationId, error },
      },
    );
    return { success: false, error: error };
  }
}
