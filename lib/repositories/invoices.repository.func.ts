"use server";

import { getSupabaseClient } from "./base.repository";
import { Invoice, InvoiceItem, InvoiceStructure } from "@/types/invoice";
import { Logger } from "../utils/logger";

export const getInvoicesByOrgId = async (orgId: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("org_id", orgId);

  if (error) {
    // For empty states, return empty array instead of throwing
    if (error.code === "PGRST116" || error.message.includes("Row not found")) {
      return []; // Return empty array for empty state instead of throwing error
    }
    throw error; // Re-throw other errors (auth/validation/system)
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as Invoice[]));
}

export const getInvoiceByIdWithItems = async (id: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", id)
    .single();

  // If no invoice is found, Supabase returns an error with code 'PGRST116'
  // We treat this as an empty state rather than an error
  if (error) {
    if (error.code === "PGRST116" || error.message.includes("Row not found")) {
      return null; // Return null for empty state instead of throwing error
    }
    throw error; // Re-throw other errors
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as Invoice));
}

export async function createInvoice(invoiceData: any) {
  const supabase = await getSupabaseClient();

  const { data: newInvoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert(invoiceData)
    .select()
    .single();

  if (invoiceError) {
    throw invoiceError;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(newInvoice));
}

export async function createInvoiceWithItems(invoiceData: any) {
  const supabase = await getSupabaseClient();

  // Extract invoice items from the invoice data
  // Remove tax_amount from invoiceOnlyData if it exists, since it's a computed field and not stored in the invoices table
  const {
    invoice_items,
    line_total,
    tax_rate,
    tax_amount,
    total,
    ...invoiceOnlyData
  } = invoiceData;

  console.log("INvoice only Data; ", invoiceOnlyData);

  // Start a transaction-like operation with try-catch
  try {
    // Create the invoice first
    const { data: newInvoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert(invoiceOnlyData)
      .select()
      .single();

    if (invoiceError) {
      throw invoiceError;
    }

    // If there are items, create them with the new invoice ID
    if (
      invoice_items &&
      Array.isArray(invoice_items) &&
      invoice_items.length > 0
    ) {
      const itemsData = invoice_items.map(({ id, line_total, ...rest }) => ({
        ...rest,
        invoice_id: newInvoice.id,
      }));

      console.log("Items data to be inserted: ", itemsData);

      const { data: insertedItems, error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsData)
        .select();

      if (itemsError) {
        // If items insertion fails, we need to delete the invoice to maintain consistency
        // This simulates a rollback behavior
        await supabase.from("invoices").delete().eq("id", newInvoice.id);
        throw itemsError;
      }
    }

    // Return the newly created invoice with items
    const invoiceWithItems = await getInvoiceByIdWithItems(newInvoice.id);
    return JSON.parse(JSON.stringify(invoiceWithItems));
  } catch (error) {
    // Re-throw the error to be handled by the calling function
    throw error;
  }
}

export async function createInvoiceItems(itemsData: any[]) {
  const supabase = await getSupabaseClient();

  const { data: insertedItems, error: itemsError } = await supabase
    .from("invoice_items")
    .insert(itemsData)
    .select();

  if (itemsError) {
    throw itemsError;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(insertedItems as InvoiceItem[]));
}

async function rollbackInvoice(
  supabase: any,
  invoiceId: string,
  invoiceSnapshot: any,
  itemsSnapshot: any[],
): Promise<void> {
  const { error: delErr } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId);

  if (delErr) {
    Logger.error("ROLLBACK", "Failed to delete partially-updated invoice", delErr);
  }

  const { error: insInvErr } = await supabase
    .from("invoices")
    .insert(invoiceSnapshot);

  if (insInvErr) {
    Logger.error("ROLLBACK", "CRITICAL: Failed to restore invoice snapshot", insInvErr);
    throw new Error(
      "Update failed and rollback could not restore the invoice. Database may be inconsistent.",
    );
  }

  if (itemsSnapshot.length > 0) {
    const { error: insItemsErr } = await supabase
      .from("invoice_items")
      .insert(itemsSnapshot);

    if (insItemsErr) {
      Logger.error("ROLLBACK", "CRITICAL: Failed to restore invoice items snapshot", insItemsErr);
      throw new Error(
        "Update failed and rollback could not restore invoice items. Database may be inconsistent.",
      );
    }
  }
}

export async function updateInvoice(
  invoiceId: string,
  updates: Partial<InvoiceStructure>,
): Promise<InvoiceStructure> {
  const supabase = await getSupabaseClient();

  // ── Phase 1: Snapshot existing state ──────────────────────────
  const { data: invoiceSnapshot, error: snapErr } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (snapErr) {
    Logger.error("UPDATE_INVOICE", `Error fetching invoice: ${invoiceId}`, snapErr);
    throw snapErr;
  }

  const { data: itemsSnapshot, error: itemsSnapErr } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId);

  if (itemsSnapErr) {
    Logger.error("UPDATE_INVOICE", `Error fetching items for invoice: ${invoiceId}`, itemsSnapErr);
    throw itemsSnapErr;
  }

  // ── Phase 2: Prepare — strip computed/payment fields ──────────
  const {
    invoice_items,
    tax_amount,
    total,
    paid_amount,
    ...invoiceFields
  } = updates;

  // ── Phase 3: Execute ──────────────────────────────────────────
  try {
    const { error: updateErr } = await supabase
      .from("invoices")
      .update(invoiceFields)
      .eq("id", invoiceId)
      .select("*")
      .single();

    if (updateErr) throw updateErr;

    if (invoice_items !== undefined) {
      const { error: deleteErr } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", invoiceId);

      if (deleteErr) throw deleteErr;

      if (invoice_items.length > 0) {
        const newItems = invoice_items.map((item) => {
          const { id, line_total, ...rest } = item;
          return { ...rest, invoice_id: invoiceId };
        });

        const { error: insertErr } = await supabase
          .from("invoice_items")
          .insert(newItems);

        if (insertErr) throw insertErr;
      }
    }

    // ── Fetch and return final result ─────────────────────────
    const result = await getInvoiceByIdWithItems(invoiceId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    // ── Phase 4: Rollback on failure after invoice update ────
    if (error !== snapErr && error !== itemsSnapErr) {
      await rollbackInvoice(supabase, invoiceId, invoiceSnapshot, itemsSnapshot);
    }
    throw error;
  }
}

export async function deleteInvoice(id: string) {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) {
    throw error;
  }

  return { success: true };
}
