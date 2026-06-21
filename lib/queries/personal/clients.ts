'use server';
"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { Client } from "@/types/invoice";
import { Logger } from "@/lib/utils/logger";
import { logClientActivity } from "@/lib/utils/activity-logger";

// Get clients by organization ID
export const getClientsByOrgId = async (orgId: string) => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("org_id", orgId);

  if (error) {
    Logger.error("GET_CLIENTS", "Error fetching clients", error, { orgId });
    throw error;
  }

  Logger.info("GET_CLIENTS", "Clients fetched successfully", {
    orgId,
    entityType: "clients",
    details: { count: data.length },
  });
  return data as Client[];
}

// Create client
export const createClient = async (
  clientData: Partial<Client>,
  orgId: string,
  userId: string,
) => {
  try {
    if (!orgId) {
      const error = new Error("Organization ID not found");
      Logger.error("CREATE_CLIENT", "Organization ID not found", error, {
        orgId,
      });
      throw error;
    }

    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("clients")
      .insert([{ ...clientData, org_id: orgId }])
      .select()
      .single();

    if (error) {
      Logger.error("CREATE_CLIENT", "Error creating client", error, { orgId });
      throw error;
    }

    // Log the activity
    try {
      await logClientActivity(orgId, userId, data.id, "created", {
        name: data.name,
        email: data.email,
        company: data.company,
      });
    } catch (activityError) {
      // Don't throw if activity logging fails, just log the error
      Logger.error(
        "CREATE_CLIENT_ACTIVITY",
        "Error logging client creation activity",
        activityError,
        {
          details: { orgId, userId, clientId: data.id },
        },
      );
    }

    Logger.info("CREATE_CLIENT", "Client created successfully", {
      entityId: data.id,
      entityType: "client",
      orgId,
      details: { name: data.name, email: data.email },
    });
    return data as Client;
  } catch (error) {
    Logger.error("CREATE_CLIENT", "Exception creating client", error, {
      orgId,
    });
    throw new Error(error as any);
  }
};

// Update client
export const updateClient = async (
  id: string,
  updates: Partial<Client>,
  userId: string,
) => {
  try {
    const supabase = await createAdminClient();

    // Get the current client to get the org_id for activity logging
    const { data: currentClient, error: fetchError } = await supabase
      .from("clients")
      .select("org_id")
      .eq("id", id)
      .single();

    if (fetchError) {
      Logger.error(
        "FETCH_CLIENT_FOR_UPDATE",
        "Error fetching client for update",
        fetchError,
        { entityId: id },
      );
      throw fetchError;
    }

    const { data, error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      Logger.error("UPDATE_CLIENT", "Error updating client", error, {
        entityId: id,
      });
      throw error;
    }

    // Log the activity
    try {
      await logClientActivity(currentClient.org_id, userId, id, "updated", {
        updated_fields: Object.keys(updates),
        name: data?.name,
        email: data?.email,
      });
    } catch (activityError) {
      // Don't throw if activity logging fails, just log the error
      Logger.error(
        "UPDATE_CLIENT_ACTIVITY",
        "Error logging client update activity",
        activityError,
        {
          details: {
            orgId: currentClient.org_id,
            userId,
            clientId: id,
          },
        },
      );
    }

    Logger.info("UPDATE_CLIENT", "Client updated successfully", {
      entityId: id,
      entityType: "client",
      details: { updatedFields: Object.keys(updates) },
    });
    return data as Client;
  } catch (error) {
    Logger.error("UPDATE_CLIENT", "Exception updating client", error, {
      entityId: id,
    });
    throw new Error(error as any);
  }
};

// Delete client
export const deleteClient = async (id: string, userId: string) => {
  const supabase = await createAdminClient();

  // Get the current client to get the org_id for activity logging
  const { data: currentClient, error: fetchError } = await supabase
    .from("clients")
    .select("org_id, name, email")
    .eq("id", id)
    .single();

  if (fetchError) {
    Logger.error(
      "FETCH_CLIENT_FOR_DELETE",
      "Error fetching client for deletion",
      fetchError,
      { entityId: id },
    );
    throw fetchError;
  }

  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    Logger.error("DELETE_CLIENT", "Error deleting client", error, {
      entityId: id,
    });
    throw error;
  }

  // Log the activity
  try {
    await logClientActivity(currentClient.org_id, userId, id, "deleted", {
      name: currentClient.name,
      email: currentClient.email,
    });
  } catch (activityError) {
    // Don't throw if activity logging fails, just log the error
    Logger.error(
      "DELETE_CLIENT_ACTIVITY",
      "Error logging client deletion activity",
      activityError,
      {
        details: {
          orgId: currentClient.org_id,
          userId,
          clientId: id,
        },
      },
    );
  }

  Logger.info("DELETE_CLIENT", "Client deleted successfully", {
    entityId: id,
    entityType: "client",
  });
  return { success: true };
};
