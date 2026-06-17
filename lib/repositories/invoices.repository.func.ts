"use server";

import { cache } from "react";
import { getSupabaseClient } from "./base.repository";
import { Invoice, InvoiceItem, InvoiceStructure } from "@/types/invoice";
import { Logger } from "../utils/logger";

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

// BE VERY CAREFUL TO CHANGE ITS A COMPLEX WORKAROUND UPDATE LOGIC
export async function updateInvoice(
  invoiceId: string,
  updates: Partial<InvoiceStructure>,
) {
  let _invoiceSwapMem = null;
  let _invoiceItemsSwapMem = null;

  const supabase = await getSupabaseClient();

  // Save the previous state of invoice here
  const { data: tempInv, error: tempInvError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (tempInvError) {
    Logger.error(
      "UPDATE_INVOICE",
      `Error fetching invoice: ${invoiceId}`,
      tempInvError,
    );
    throw tempInvError;
  }

  _invoiceSwapMem = tempInv;

  const { data: tempInvItems, error: tempInvItemsError } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId);

  if (tempInvItemsError) {
    Logger.error(
      "UPDATE_INVOICE",
      `Error fetching invoice items for invoice: ${invoiceId}`,
      tempInvItemsError,
    );
    throw tempInvItemsError;
  }

  _invoiceItemsSwapMem = tempInvItems;

  if (!_invoiceSwapMem || !_invoiceItemsSwapMem) {
    Logger.error(
      "UPDATE_INVOICE",
      `No invoice with id:${invoiceId} o)r related invoice items found`,
      {},
    );
    throw new Error("No invoice or related invoice items found");
  }

  // Delete the old invoice
  // await supabase.from('invoices').delete().eq('id', )

  // Invoice without invoice_items property
  const { invoice_items, tax_amount, total, ..._inv } = updates;

  const { data: invoiceData, error: invoiceError } = await supabase
    .from("invoices")
    .update(_inv)
    .eq("id", invoiceId)
    .select("*")
    .single();

  if (invoiceError) {
    Logger.error("UPDATE_INVOICE", "Error Updating Invoice", invoiceError);
    throw invoiceError;
  }

  console.log("updates.invoice_items: ", updates.invoice_items);
  const invItemsToUpdate = (updates.invoice_items?.filter((item) => {
    return item.invoice_id && item.id; // already existing line_item
  })) ?? [];

  const l_ItemsToUpdateCleaned = invItemsToUpdate.map((item) => {
    const { id, invoice_id, line_total, ..._item } = item;
    return {
      ..._item,
    };
  });

  const invItemsToInsert = (updates.invoice_items?.filter(
    (item) => !item.invoice_id || !item.id,
  )) ?? [];

  const l_ItemstoInsertCleaned = invItemsToInsert.map((item) => {
    const { id, line_total, ..._item } = item;
    return {
      ..._item,
      invoice_id: invoiceId, // As it still belongs to a certain invoice
    };
  });

  const { data: l_ItemsToUpdate, error: l_ItemsToUpdateError } = await supabase
    .from("invoice_items")
    .update(l_ItemsToUpdateCleaned)
    .eq("invoice_id", invoiceId)
    .select("*");

  if (l_ItemsToUpdateError) {
    Logger.error(
      "UPDATE_INVOICE",
      "Error updating the already existing invoice items",
      l_ItemsToUpdateError,
    );

    // -------------------------------------------------------
    // Incase of failure rollback the 'invoices' table commit
    // -------------------------------------------------------

    // Delete the half updated invoice
    const { data: deleteInv, error: deleteInvError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    if (deleteInvError) {
      Logger.error(
        "UPDATE_INVOICE",
        "Error during rollback invoice",
        deleteInvError,
      );
    }

    const { data: insertedInvoice, error: insertedInvoiceError } =
      await supabase.from("invoices").insert(tempInv).single();

    if (insertedInvoiceError) {
      Logger.error(
        "UPDATE_INVOICE",
        "Error inserting the swap mem invoice",
        insertedInvoiceError,
      );
      throw insertedInvoiceError;
    }

    throw l_ItemsToUpdateError;
  }

  const { data: l_ItemstoInsert, error: l_ItemstoInsertError } = await supabase
    .from("invoice_items")
    .insert(l_ItemstoInsertCleaned)
    .select("*");

  if (l_ItemstoInsertError) {
    Logger.error(
      "UPDATE_INVOICE",
      "Error inserting new line items",
      l_ItemstoInsertError,
    );

    // -------------------------------------------------------
    // Incase of failure rollback the 'invoices' table commit
    // -------------------------------------------------------

    // Delete the half updated invoice
    const { data: deleteInv, error: deleteInvError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    if (deleteInvError) {
      Logger.error(
        "UPDATE_INVOICE",
        "Error during rollback invoice",
        deleteInvError,
      );
    }

    const { data: insertedInvoice, error: insertedInvoiceError } =
      await supabase.from("invoices").insert(tempInv).single();

    if (insertedInvoiceError) {
      Logger.error(
        "UPDATE_INVOICE",
        "Error inserting the swap mem invoice",
        insertedInvoiceError,
      );
      throw insertedInvoiceError;
    }

    throw l_ItemstoInsertError;
  }

  Logger.success("UPDATE_INVOICE", "Invoice Updated", {
    details: {
      invoiceId: invoiceId,
      updates,
    },
  });

  let cleanedData: InvoiceStructure | null = null;
  const allInvItems = [...l_ItemsToUpdate, ...l_ItemstoInsert];

  cleanedData = {
    ...invoiceData,
    invoice_items: allInvItems,
  };

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(cleanedData));
}

export async function deleteInvoice(id: string) {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.from("invoices").delete().eq("id", id);

  if (error) {
    throw error;
  }

  return { success: true };
}
