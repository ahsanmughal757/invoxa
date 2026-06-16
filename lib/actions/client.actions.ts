"use server";

import { revalidateTag } from "next/cache";
import {
  createClient,
  updateClient,
  deleteClient,
  getClientsByOrgId,
} from "@/lib/repositories/clients.repository.func";
import { getSupabaseUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { logSuccess, Logger } from "@/lib/utils/logger";
import {
  getOrganizationById,
  getOrganizationsByOwnerId,
} from "@/lib/repositories/organizations.repository.func";
import { getMemberAssociatedOrganization } from "../queries/organizations";
import { Organization, OrganizationMember } from "@/types/invoice";
import { CACHE_TAGS } from "@/lib/cache-tags";

export interface ClientData {
  name: string;
  email: string;
  org_id: string;
  company_name?: string;
  billing_address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  tax_id?: string;
  notes?: string;
}

export async function createClientAction(clientData: ClientData) {
  let userId: string | undefined | null;
  let userProfile: any;
  let orgId: string | null | undefined;

  try {
    ({ userId } = await auth());

    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get user profile to get organization ID
    userProfile = await getSupabaseUser();
    if (!userProfile) {
      Logger.error(
        "CREATE_CLIENT_ACTION",
        "User profile not found for clerk user.",
        "User profile not found",
        {
          userId,
          orgId: orgId,
        },
      );
      return {
        success: false,
        error: "User profile not found",
      };
    }

    // Get organization ID from user profile
    const ownerClerkId = userProfile.clerk_user_id;

    const userOrganization = await getOrganizationsByOwnerId(ownerClerkId);

    if (!userOrganization) {
      return {
        success: false,
        error: "No Organization found associated with the user!",
      };
    }

    const orgIdStr = userOrganization.id;

    const result = await createClient({ ...clientData });

    // Log successful client creation
    logSuccess.clientCreated(result.id, userId, orgIdStr);

    revalidateTag(CACHE_TAGS.CLIENTS(orgIdStr));

    return { success: true, data: result };
  } catch (error) {
    // Convert null to undefined for the logger
    const currentOrgId = userProfile?.org_id ?? undefined;
    Logger.error("CREATE_CLIENT_ACTION", "Failed to create client", error, {
      userId,
      orgId: currentOrgId,
    });
    return { success: false, error: (error as Error).message };
  }
}

export async function createClientForOrgAction(
  clientData: ClientData,
  orgData: Partial<Organization>,
) {
  let userId: string | undefined | null;
  let userProfile: any;
  let orgId: string | null | undefined;

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

    // Get organization ID from user profile
    const ownerClerkId = userProfile.clerk_user_id;

    const userOrganization = await getOrganizationsByOwnerId(ownerClerkId);

    if (!userOrganization) {
      return {
        success: false,
        error: "No Organization found associated with the user!",
      };
    }

    const orgIdStr = userOrganization.id as string;

    const result = await createClient({ ...clientData });

    // Log successful client creation
    logSuccess.clientCreated(result.id, userId, orgIdStr);

    revalidateTag(CACHE_TAGS.CLIENTS(orgIdStr));

    return { success: true, data: result };
  } catch (error) {
    // Convert null to undefined for the logger
    const currentOrgId = userProfile?.org_id ?? undefined;
    Logger.error("CREATE_CLIENT_ACTION", "Failed to create client", error, {
      userId,
      orgId: currentOrgId,
    });
    return { success: false, error: (error as Error).message };
  }
}

export async function updateClientAction(
  clientId: string,
  orgId: string,
  updates: Partial<ClientData>,
) {
  let userId, userProfile, id;
  try {
    ({ userId } = await auth());
    if (!userId) {
      throw new Error("Unauthorized");
    }

    if (!clientId) {
      throw new Error("Client ID is required");
    }

    // Get user profile to get organization ID
    userProfile = await getSupabaseUser();
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const userOrganization = await getOrganizationsByOwnerId(orgId);

    if (!userOrganization.id) {
      throw new Error("Organization not found!");
    }

    // Handle the type properly since orgId can be null
    const result = await updateClient(clientId, updates);

    // Log successful client update
    logSuccess.clientUpdated(clientId, userId, orgId);

    revalidateTag(CACHE_TAGS.CLIENTS(orgId));

    return { success: true, data: result };
  } catch (error: any) {
    // Convert null to undefined for the logger
    const currentOrgId = userProfile?.org_id ?? undefined;
    Logger.error("UPDATE_CLIENT_ACTION", "Failed to update client", error, {
      userId,
      entityId: id,
      orgId: currentOrgId,
    });
    return { success: false, error: error.message };
  }
}

export async function deleteClientAction(clientId: string) {
  let userId, userProfile, id;
  try {
    ({ userId } = await auth());
    if (!userId) {
      throw new Error("Unauthorized");
    }
    if (!clientId) {
      throw new Error("Client ID is required");
    }

    // Get user profile to get organization ID
    userProfile = await getSupabaseUser();
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    await deleteClient(clientId);

    // Log successful client deletion
    Logger.success(
      "DELETE_CLIENT_ACTION",
      `Client deleted successfully clientId: ${clientId}`,
      null,
    );

    revalidateTag(CACHE_TAGS.CLIENTS(userProfile.org_id));

    return { success: true };
  } catch (error) {
    // Convert null to undefined for the logger
    const currentOrgId = userProfile?.org_id ?? undefined;
    Logger.error("DELETE_CLIENT_ACTION", "Failed to delete client", error, {
      userId,
      entityId: !id ? undefined : id, // cast null id to undefined
      orgId: currentOrgId,
    });
    return { success: false, error: (error as Error).message };
  }
}

export async function getAllClientsAction(orgId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get user profile to get organization ID
    const userProfile = await getSupabaseUser();
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    // Get organization ID from user profile
    // let ownerClerkId = userProfile.clerk_user_id;

    // const userOrganization = await getOrganizationsByOwnerId(ownerClerkId);

    if (!orgId) {
      // Return success with empty array for empty state
      Logger.error(
        "GET_ALL_CLIENTS_ACTION",
        "No organization associated with the authorized user.",
        {},
      );
      return { success: true, data: [] };
    }

    // const orgId = userOrganization.id;
    console.log("Org ID: -------------->", orgId);

    const clients = await getClientsByOrgId(orgId);

    return { success: true, data: clients };
  } catch (error) {
    Logger.error("GET_ALL_CLIENTS_ACTION", "Failed to get clients", error, {});
    // Return empty array instead of throwing for empty state
    return { success: true, data: [] };
  }
}

export async function createClientForMemberOrganizationAction(
  clientData: ClientData,
  selectedOrgId: string,
) {
  let userId: string | undefined | null;
  let userProfile: any;
  let orgId: string | null | undefined;

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

    // Get organization ID from user profile
    const ownerClerkId = userProfile.clerk_user_id;

    const userMemberOrganizations =
      await getMemberAssociatedOrganization(ownerClerkId);

    if (userMemberOrganizations?.length === 0) {
      return {
        success: false,
        error: "No Member Organizations found associated with the user!",
      };
    }

    const userOrganization: OrganizationMember | undefined =
      userMemberOrganizations?.find((org) => org.id === selectedOrgId);

    if (!userOrganization) {
      return {
        success: false,
        error:
          "Selected Member Organization not found associated with the user!",
      };
    }

    const orgIdStr = userOrganization.org_id as string;

    const result = await createClient({ ...clientData, org_id: orgIdStr });

    // Log successful client creation
    logSuccess.clientCreated(result.id, userId, orgIdStr);

    revalidateTag(CACHE_TAGS.CLIENTS(orgIdStr));

    return { success: true, data: result };
  } catch (error) {
    // Convert null to undefined for the logger
    const currentOrgId = userProfile?.org_id ?? undefined;
    Logger.error("CREATE_CLIENT_ACTION", "Failed to create client", error, {
      userId,
      orgId: currentOrgId,
    });
    return { success: false, error: (error as Error).message };
  }
}
