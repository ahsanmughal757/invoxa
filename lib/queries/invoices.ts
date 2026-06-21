"use server";
import { createAdminClient } from "@/lib/supabase/server";
import { Invoice, InvoiceItem } from "@/types/invoice";
import { generateInvoiceNumber } from "@/lib/utils";
import { Logger } from "@/lib/utils/logger";
import { logInvoiceActivity } from "@/lib/utils/activity-logger";
import { createInvoiceWithItems as createInvoiceWithItemsRepo } from "@/lib/repositories/invoices.repository.func";

// Get invoices by organization ID
export const getInvoicesByOrgId = async (orgId: string) => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("org_id", orgId);

  if (error) {
    Logger.error("GET_INVOICES", "Error fetching invoices", error, { orgId });
    throw error;
  }

  Logger.info("GET_INVOICES", "Invoices fetched successfully", {
    orgId,
    entityType: "invoices",
    details: { count: data.length },
  });
  return data as Invoice[];
}

// Get invoice by ID with items
export const getInvoiceByIdWithItems = async (id: string) => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('Row not found')) {
      // Invoice not found - return null as empty state
      Logger.info("GET_INVOICE", "Invoice not found", {
        entityId: id,
        entityType: "invoice",
      });
      return null;
    }
    
    Logger.error("GET_INVOICE", "Error fetching invoice", error, {
      entityId: id,
    });
    throw error;
  }

  Logger.info("GET_INVOICE", "Invoice fetched successfully", {
    entityId: id,
    entityType: "invoice",
  });
  return data as Invoice;
}

// Create invoice with items using transactional approach
export const createInvoice = async (
  invoiceData: Partial<
    Omit<Invoice, "id" | "created_at" | "updated_at" | "org_id">
  >,
  orgId: string,
  userId: string, // Add userId parameter for activity logging
) => {
  if (!orgId) {
    const error = new Error("Organization ID not found");
    Logger.error("CREATE_INVOICE", "Organization ID not found", error, {
      orgId,
    });
    throw error;
  }
  if (!invoiceData.client_id) {
    const error = new Error("Client ID is required to create an invoice.");
    Logger.error("CREATE_INVOICE", "Client ID is required", error, { orgId });
    throw error;
  }

  // Prepare the invoice data with org_id
  const invoiceDataWithOrg = {
    ...invoiceData,
    org_id: orgId,
    number: invoiceData.number || generateInvoiceNumber()
  };

  // Use the transactional function to create invoice and items together
  const newInvoice = await createInvoiceWithItemsRepo(invoiceDataWithOrg);

  if (!newInvoice) {
    const error = new Error("Failed to create invoice");
    Logger.error("CREATE_INVOICE", "Failed to create invoice", error, {
      orgId,
    });
    throw error;
  }

  // Log the activity
  try {
    await logInvoiceActivity(orgId, userId, newInvoice.id, "created", {
      number: newInvoice.number,
      client_id: newInvoice.client_id,
      total: newInvoice.total,
      items_count: newInvoice.invoice_items?.length || 0,
    });
  } catch (activityError) {
    // Don't throw if activity logging fails, just log the error
    Logger.error(
      "CREATE_INVOICE_ACTIVITY",
      "Error logging invoice creation activity",
      activityError,
      {
        details: {
          orgId,
          userId,
          invoiceId: newInvoice.id,
        }
      },
    );
  }

  Logger.info("CREATE_INVOICE", "Invoice created successfully", {
    entityId: newInvoice.id,
    entityType: "invoice",
    orgId,
    details: {
      number: newInvoice.number,
      client_id: newInvoice.client_id,
      items_count: newInvoice.invoice_items?.length || 0,
    },
  });
  return newInvoice as Invoice;
};

// Update invoice
export const updateInvoice = async (
  id: string,
  updates: Partial<Omit<Invoice, "invoice_items">>,
  userId: string,
) => {
  const supabase = await createAdminClient();

  // Get the current invoice to get the org_id for activity logging
  const { data: currentInvoice, error: fetchError } = await supabase
    .from("invoices")
    .select("org_id")
    .eq("id", id)
    .single();

  if (fetchError) {
    Logger.error(
      "FETCH_INVOICE_FOR_UPDATE",
      "Error fetching invoice for update",
      fetchError,
      { entityId: id },
    );
    throw fetchError;
  }

  // Destructure to exclude generated columns (tax_amount, total) that are calculated by the database
  const { tax_amount, total, ...updatesToApply } = updates;

  const { data, error } = await supabase
    .from("invoices")
    .update(updatesToApply)
    .eq("id", id)
    .select("*, invoice_items(*)")
    .single();

  if (error) {
    Logger.error("UPDATE_INVOICE", "Error updating invoice", error, {
      entityId: id,
    });
    throw error;
  }

  // Log the activity
  try {
    await logInvoiceActivity(currentInvoice.org_id, userId, id, "updated", {
      updated_fields: Object.keys(updates),
      number: data?.number,
    });
  } catch (activityError) {
    // Don't throw if activity logging fails, just log the error
    Logger.error(
      "UPDATE_INVOICE_ACTIVITY",
      "Error logging invoice update activity",
      activityError,
      {
        details: {
          userId,
          orgId: currentInvoice.org_id,
          invoiceId: id,
        }
      },
    );
  }

  Logger.info("UPDATE_INVOICE", "Invoice updated successfully", {
    entityId: id,
    entityType: "invoice",
    details: { updatedFields: Object.keys(updates) },
  });
  return data as Invoice;
};

// Delete invoice
export const deleteInvoice = async (id: string, userId: string) => {
  const supabase = await createAdminClient();

  // Get the current invoice to get the org_id for activity logging
  const { data: currentInvoice, error: fetchError } = await supabase
    .from("invoices")
    .select("org_id, number")
    .eq("id", id)
    .single();

  if (fetchError) {
    Logger.error(
      "FETCH_INVOICE_FOR_DELETE",
      "Error fetching invoice for deletion",
      fetchError,
      { entityId: id },
    );
    throw fetchError;
  }

  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) {
    Logger.error("DELETE_INVOICE", "Error deleting invoice", error, {
      entityId: id,
    });
    throw error;
  }

  // Log the activity
  try {
    await logInvoiceActivity(currentInvoice.org_id, userId, id, "deleted", {
      number: currentInvoice.number,
    });
  } catch (activityError) {
    // Don't throw if activity logging fails, just log the error
    Logger.error(
      "DELETE_INVOICE_ACTIVITY",
      "Error logging invoice deletion activity",
      activityError,
      {
        details: {
          orgId: currentInvoice.org_id,
          userId,
          invoiceId: id,
        }
      },
    );
  }

  Logger.info("DELETE_INVOICE", "Invoice deleted successfully", {
    entityId: id,
    entityType: "invoice",
  });
  return { success: true };
};
