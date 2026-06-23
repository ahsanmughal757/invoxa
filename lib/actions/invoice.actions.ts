"use server";

import { revalidateTag } from "next/cache";
import {
  createInvoice,
  getInvoiceWithItems,
  updateInvoice,
  deleteInvoice,
  getInvoiceDashboardData,
} from "@/lib/services/invoice.service.func";
import { getSupabaseUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { Logger } from "@/lib/utils/logger";
import { logInvoiceActivity } from "@/lib/utils/activity-logger";
import { getOrganizationsByOwnerId } from "@/lib/repositories/organizations.repository.func";
import { createAdminClient } from "@/lib/supabase/server";
import { Invoice, InvoiceStructure } from "@/types/invoice";
import { generateInvoiceNumber } from "../utils";
import { CACHE_TAGS } from "@/lib/cache-tags";

export interface InvoiceData {
  client_id: string;
  issue_date: string;
  due_date: string;
  amount: number;
  currency: string;
  status: string;
  notes?: string;
  additional_info?: Record<string, any>;
  items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  invoice_items?: Array<{
    description: string;
    qty: number;
    unit_price: number;
    // line_total: number;
  }>;
}

export async function createInvoiceAction(
  invoiceData: InvoiceData,
  orgId: string,
) {
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
      return {
        success: false,
        error: "No Organization found associated with the user!",
      };
    }

    // const orgId = userOrganization.id as string;

    // Transform the invoice data to match expected format
    // Map 'items' to 'invoice_items' with proper field names
    let transformedInvoiceData = {
      ...invoiceData,
      org_id: orgId,
      created_by_profile_id: userProfile.id,
      number: generateInvoiceNumber(),
    };

    console.log("Received invoice data in action: ", invoiceData);
    // const { invoice_items, ...invoiceOnlyData } = transformedInvoiceData;
    // const { tax_amount, ...filteredData } = transformedInvoiceData;

    // If 'items' exists but 'invoice_items' doesn't, transform the data
    if (invoiceData.items && !invoiceData.invoice_items) {
      transformedInvoiceData.invoice_items = invoiceData?.items?.map(
        (item: any) => ({
          description: item.description,
          qty: item.quantity,
          unit_price: item.unit_price,
          line_total: item.total,
        }),
      );
      // Remove the old 'items' field to avoid confusion
      delete transformedInvoiceData.items;
    }

    console.log(
      "transformed invoice data in invoice.action: ",
      transformedInvoiceData,
    );
    // Use the function to create the invoice
    const result = await createInvoice(transformedInvoiceData);

    // Log the activity
    try {
      await logInvoiceActivity(orgId, userProfile.id, result.id, "created", {
        number: result.number,
        client_id: result.client_id,
        total: result.total,
        items_count: result.invoice_items?.length || 0,
      });
    } catch (activityError) {
      Logger.error("CREATE_INVOICE_ACTION_ACTIVITY", "Error logging invoice creation", activityError, {
        details: { orgId, userId, invoiceId: result.id },
      });
    }

    revalidateTag(CACHE_TAGS.INVOICES(orgId));
    revalidateTag(CACHE_TAGS.DASHBOARD(orgId));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error in createInvoiceAction:", error);
    Logger.error(
      "CREATE_INVOICE_ACTION",
      "Unexpected error occurred",
      {},
      { details: { error } },
    );
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteInvoiceAction(invoiceId: string, orgId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const userProfile = await getSupabaseUser();
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    if (!orgId) {
      return {
        success: false,
        error: "Organization ID is required to delete an invoice",
      };
    }

    // Fetch invoice details before deletion for activity metadata
    const supabase = await createAdminClient();
    const { data: currentInvoice } = await supabase
      .from("invoices")
      .select("number, total, client_id")
      .eq("id", invoiceId)
      .single();

    const result = await deleteInvoice(invoiceId);

    // Log the activity
    try {
      await logInvoiceActivity(orgId, userProfile.id, invoiceId, "deleted", {
        number: currentInvoice?.number,
        total: currentInvoice?.total,
        client_id: currentInvoice?.client_id,
      });
    } catch (activityError) {
      Logger.error("DELETE_INVOICE_ACTION_ACTIVITY", "Error logging invoice deletion", activityError, {
        details: { orgId, userId, invoiceId },
      });
    }

    revalidateTag(CACHE_TAGS.INVOICES(orgId));
    revalidateTag(CACHE_TAGS.DASHBOARD(orgId));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error in deleteInvoiceAction:", error);
    Logger.error(
      "DELETE_INVOICE_ACTION",
      "Unexpected error occurred",
      {},
      { details: { error } },
    );
    return { success: false, error: (error as Error).message };
  }
}

export async function getAllInvoicesAction() {
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
    let ownerClerkId = userProfile.clerk_user_id;

    const userOrganization = await getOrganizationsByOwnerId(ownerClerkId);

    if (!userOrganization) {
      // Return success with empty data for empty state
      return {
        success: true,
        data: {
          organization: null,
          clients: [],
          invoices: [],
          expenses: [],
          payments: [],
        },
      };
    }

    const orgId = userOrganization.id as string;

    try {
      const dashboardData = await getInvoiceDashboardData(orgId, userId);

      return { success: true, data: dashboardData };
    } catch (serviceError: any) {
      Logger.error(
        "GET_INVOICES_ACTION",
        "Error in InvoiceService",
        { userId },
        { details: { error: serviceError.message } },
      );
      // Return empty data instead of throwing for empty states
      return {
        success: true,
        data: {
          organization: userOrganization,
          clients: [],
          invoices: [],
          expenses: [],
          payments: [],
        },
      };
    }
  } catch (error) {
    console.error("Error in getAllInvoicesAction:", error);
    Logger.error(
      "GET_INVOICES_ACTION",
      "Unexpected error occurred",
      {},
      { details: { error } },
    );
    return { success: false, error: (error as Error).message };
  }
}

export async function getInvoiceByIdAction(invoiceId: string) {
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
    let ownerClerkId = userProfile.clerk_user_id;

    const userOrganization = await getOrganizationsByOwnerId(ownerClerkId);

    if (!userOrganization) {
      // Return success with null data for empty state
      return { success: true, data: null };
    }

    const orgId = userOrganization.id as string;

    // Use the function to get specific invoice
    const result = await getInvoiceWithItems(invoiceId);

    // Return success with null data if invoice not found (empty state)
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in getInvoiceByIdAction:", error);
    Logger.error(
      "GET_INVOICE_BY_ID_ACTION",
      "Unexpected error occurred",
      {},
      { details: { error } },
    );
    return { success: false, error: (error as Error).message };
  }
}

export async function updateInvoiceAction(
  invoiceId: string,
  updates: InvoiceStructure,
  orgId: string,
) {
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
      return {
        success: false,
        error: "No Organization found associated with the user!",
      };
    }

    // const orgId = userOrganization.id as string;

    // Use the function to update the invoice
    const result = await updateInvoice(invoiceId, updates);

    // Log the activity
    if (result) {
      try {
        await logInvoiceActivity(orgId, userProfile.id, invoiceId, "updated", {
          updated_fields: Object.keys(updates),
          number: result.number,
        });
      } catch (activityError) {
        Logger.error("UPDATE_INVOICE_ACTION_ACTIVITY", "Error logging invoice update", activityError, {
          details: { orgId, userId, invoiceId },
        });
      }
    }

    revalidateTag(CACHE_TAGS.INVOICES(orgId));
    revalidateTag(CACHE_TAGS.DASHBOARD(orgId));

    // Since the function now handles empty states gracefully, we can return the result directly
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in updateInvoiceAction:", error);
    Logger.error(
      "UPDATE_INVOICE_ACTION",
      "Unexpected error occurred",
      {},
      { details: { error } },
    );
    return { success: false, error: (error as Error).message };
  }
}
