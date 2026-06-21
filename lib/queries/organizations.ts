"use server";
import { createAdminClient } from "@/lib/supabase/server";
import { Organization, OrganizationMember } from "@/types/invoice";
import { Logger } from "@/lib/utils/logger";

// Get organization by ID
export const getOrganizationById = async (id: string) => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116" || error.message.includes("Row not found")) {
      // Organization not found - return null as empty state
      Logger.info("GET_ORGANIZATION", "Organization not found", {
        entityId: id,
        entityType: "organization",
      });
      return null;
    }

    Logger.error("GET_ORGANIZATION", "Error fetching organization", error, {
      entityId: id,
    });
    throw error;
  }

  Logger.info("GET_ORGANIZATION", "Organization fetched successfully", {
    entityId: id,
    entityType: "organization",
  });
  return data as Organization;
}

// Update organization
export const updateOrganization = async (
  id: string,
  orgData: Partial<Organization>,
) => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("organizations")
    .update(orgData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    Logger.error("UPDATE_ORGANIZATION", "Error updating organization", error, {
      entityId: id,
    });
    throw error;
  }

  Logger.info("UPDATE_ORGANIZATION", "Organization updated successfully", {
    entityId: id,
    entityType: "organization",
    details: { updatedFields: Object.keys(orgData) },
  });
  return data as Organization;
};

// Create organization
export const createOrganization = async (
  orgData: Partial<Omit<Organization, "id">>,
  userId: string,
) => {
  const supabase = await createAdminClient();

  // Get the profile id first to create the organization with owner_user_id
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", userId)
    .single();

  if (profileError) {
    Logger.error(
      "CREATE_ORGANIZATION",
      "Error fetching profile",
      profileError,
      { userId },
    );
    throw profileError;
  }

  if (!profileData) {
    const error = new Error("Profile not found for current user");
    Logger.error(
      "CREATE_ORGANIZATION",
      "Profile not found for current user",
      error,
      { userId },
    );
    throw error;
  }

  const org_data_cleaned = {
    name: orgData.name,
    logo_url: orgData.logo_url,
    branding: orgData.branding,
    created_at: orgData.created_at,
  };

  const { data, error } = await supabase
    .from("organizations")
    .insert([
      {
        owner_user_id: profileData.id,
        owner_clerk_id: profileData.clerk_user_id,
        ...org_data_cleaned,
      },
    ])
    .select()
    .single();

  if (error) {
    Logger.error("CREATE_ORGANIZATION", "Error creating organization", error, {
      userId,
    });
    throw error;
  }

  Logger.info("CREATE_ORGANIZATION", "Organization created successfully", {
    entityId: data.id,
    entityType: "organization",
    userId,
  });
  return data;
};

// Get organization by owner user ID
export const getOrganizationsByOwnerId = async (
  ownerUserId: string | null | undefined) => {
    const supabase = await createAdminClient();

    if (!ownerUserId) {
      console.log(
        "Owner user ID is required to fetch organization, received:",
        ownerUserId,
      );
      return null;
    }

    console.log("ownerUserId: ", ownerUserId);
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_clerk_id", ownerUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "Row not found" error
      Logger.error(
        "GET_ORGANIZATION",
        "Error fetching organization by owner ID",
        error,
        { entityId: ownerUserId ? ownerUserId : undefined },
      );
      throw error;
    }

    if (!data) {
      Logger.info("GET_ORGANIZATION", "No organization found for owner", {
        entityId: ownerUserId ? ownerUserId : undefined,
        entityType: "organization",
      });
      return null;
    }

    Logger.info(
      "GET_ORGANIZATION",
      "Organization fetched successfully by owner ID",
      {
        entityId: data.id,
        entityType: "organization",
      },
    );
    return data as Organization;
  }

export const getMemberAssociatedOrganization = async (
  ownerUserId: string) => {
    const supabase = await createAdminClient();

    if (!ownerUserId) {
      console.log(
        "User ID is required to fetch organization for the member, received:",
        ownerUserId,
      );
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_user_id", ownerUserId)
      .maybeSingle();

    if (profileError) {
      Logger.error(
        "MEMBER_ORGANIZATION",
        "Error fetching users member organization",
        profileError,
        {
          userId: ownerUserId,
        },
      );
      throw profileError;
    }

    if (!profile) {
      Logger.info(
        "MEMBER_ORGANIZATION",
        "No member organization found for given user",
        {
          userId: ownerUserId,
        },
      );
      return [];
    }

    const { data, error } = await supabase
      .from("org_members")
      .select(
        `
      *,
      organization:organizations(*)
      `,
      )
      .eq("user_id", profile?.id);

    if (error) {
      // PGRST116 is "Row not found" error
      Logger.error(
        "MEMBER_ORGANIZATION",
        "Error fetching member organization by member ID",
        error,
        { entityId: ownerUserId ? ownerUserId : undefined },
      );
      throw error;
    }

    if (!data) {
      Logger.info(
        "MEMBER_ORGANIZATION",
        "No member organizations found for given user",
        {
          entityId: ownerUserId ? ownerUserId : undefined,
          entityType: "organization",
        },
      );
      return null;
    }

    Logger.info(
      "MEMBER_ORGANIZATION",
      "Member organizations fetched successfully by member ID",
      {
        entityId: data[0]?.id,
        entityType: "org_members",
      },
    );

    return data as OrganizationMember[];
  }

// Get profile by user ID
export const getProfileByUserId = async (userId: string) => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116" || error.message.includes("Row not found")) {
      // Profile not found - return null as empty state
      Logger.info("GET_PROFILE", "Profile not found", {
        userId,
        entityType: "profile",
      });
      return null;
    }

    Logger.error("GET_PROFILE", "Error fetching profile", error, { userId });
    throw error;
  }

  Logger.info("GET_PROFILE", "Profile fetched successfully", {
    userId,
    entityType: "profile",
  });
  return data;
}

/**
 * Get all organizations for a user (both owned and member organizations)
 */
export const getUserOrganizations = async (userId: string) => {
  const supabase = await createAdminClient();

  if (!userId) {
    Logger.info("GET_USER_ORGANIZATIONS", "No user ID provided");
    return [];
  }

  try {
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, clerk_user_id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (profileError) {
      Logger.error(
        "GET_USER_ORGANIZATIONS",
        "Error fetching profile",
        profileError,
        { userId },
      );
      throw profileError;
    }

    if (!profile) {
      Logger.info("GET_USER_ORGANIZATIONS", "Profile not found", { userId });
      return [];
    }

    // Get owned organizations
    const { data: ownedOrgs, error: ownedError } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_clerk_id", profile.clerk_user_id);

    if (ownedError && ownedError.code !== "PGRST116") {
      Logger.error(
        "GET_USER_ORGANIZATIONS",
        "Error fetching owned organizations",
        ownedError,
        { userId },
      );
      throw ownedError;
    }

    // Get member organizations
    const { data: memberOrgs, error: memberError } = await supabase
      .from("org_members")
      .select(
        `
        id,
        org_id,
        role,
        created_at,
        organization:organizations (*)
      `,
      )
      .eq("user_id", profile.id);

    if (memberError && memberError.code !== "PGRST116") {
      Logger.error(
        "GET_USER_ORGANIZATIONS",
        "Error fetching member organizations",
        memberError,
        { userId },
      );
      throw memberError;
    }

    // Combine results
    const organizations: Organization[] = ownedOrgs ? [...ownedOrgs] : [];

    if (memberOrgs) {
      memberOrgs.forEach((membership: any) => {
        if (membership.organization) {
          organizations.push({
            id: membership.organization.id || "",
            owner_user_id: membership.organization.owner_user_id,
            name: membership.organization.name,
            email: membership.organization.email,
            logo_url: membership.organization.logo_url,
            branding: membership.organization.branding,
            created_at: membership.organization.created_at,
          });
        }
      });
    }

    Logger.info(
      "GET_USER_ORGANIZATIONS",
      "User organizations fetched successfully",
      {
        userId,
        details: { count: organizations.length },
      },
    );

    return organizations as Organization[];
  } catch (error) {
    Logger.error(
      "GET_USER_ORGANIZATIONS",
      "Unexpected error fetching user organizations",
      error,
      { userId },
    );
    throw error;
  }
}

/**
 * Set user's active organization
 */
export const setUserActiveOrganization = async (
  userId: string,
  orgId: string | null,
) => {
  const supabase = await createAdminClient();

  if (!userId) {
    Logger.info("SET_ACTIVE_ORGANIZATION", "No user ID provided");
    return null;
  }

  try {
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (profileError) {
      Logger.error(
        "SET_ACTIVE_ORGANIZATION",
        "Error fetching profile",
        profileError,
        { userId },
      );
      throw profileError;
    }

    if (!profile) {
      Logger.info("SET_ACTIVE_ORGANIZATION", "Profile not found", { userId });
      return null;
    }

    // Update active organization
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ org_id: orgId })
      .eq("id", profile.id);

    if (updateError) {
      Logger.error(
        "SET_ACTIVE_ORGANIZATION",
        "Error updating active organization",
        updateError,
        { userId, orgId },
      );
      throw updateError;
    }

    Logger.info("SET_ACTIVE_ORGANIZATION", "Active organization updated", {
      userId,
      orgId,
    });

    return { org_id: orgId };
  } catch (error) {
    Logger.error(
      "SET_ACTIVE_ORGANIZATION",
      "Unexpected error setting active organization",
      error,
      { userId, orgId },
    );
    throw error;
  }
};
