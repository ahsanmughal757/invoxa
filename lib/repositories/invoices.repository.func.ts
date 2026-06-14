"use server";

import { cache } from "react";
import { getSupabaseClient } from "./base.repository";
import { Invoice, InvoiceItem } from "@/types/invoice";

export const getInvoicesByOrgId = cache(async (orgId: string) => {
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
});

export const getInvoiceByIdWithItems = cache(async (id: string) => {
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
});

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
      const itemsData = invoice_items.map(({id, line_total, ...rest}) => ({
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

export async function updateInvoice(id: string, updates: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", id)
    .select("*, invoice_items(*)")
    .single();

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as Invoice));
}

export async function deleteInvoice(id: string) {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) {
    throw error;
  }

  return { success: true };
}
