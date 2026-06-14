"use server";

import { cache } from "react";
import { createAdminClient } from '@/lib/supabase/server';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { Logger } from '@/lib/utils/logger';
import { generateInvoiceNumber } from '@/lib/utils';
import { createInvoiceWithItems as createInvoiceWithItemsRepo } from '@/lib/repositories/invoices.repository.func';

// Get invoices for an organization (accessible by members)
export const getInvoicesForOrg = cache(async (orgId: string) => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('org_id', orgId);

  if (error) {
    Logger.error('GET_INVOICES_FOR_ORG', 'Error fetching invoices for organization', error, { orgId });
    throw error;
  }

  Logger.info('GET_INVOICES_FOR_ORG', 'Invoices fetched successfully for organization', { orgId, entityType: 'invoices', details: { count: data.length } });
  return data as Invoice[];
});

// Create invoice for an organization (accessible by members) using transactional approach
export const createInvoiceForOrg = async (
  invoiceData: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'org_id'>>,
  orgId: string,
  userId: string
) => {
  if (!orgId) {
    const error = new Error("Organization ID not found");
    Logger.error('CREATE_INVOICE_FOR_ORG', 'Organization ID not found', error, { orgId });
    throw error;
  }
  if (!invoiceData.client_id) {
    const error = new Error("Client ID is required to create an invoice.");
    Logger.error('CREATE_INVOICE_FOR_ORG', 'Client ID is required', error, { orgId });
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
    Logger.error('CREATE_INVOICE_FOR_ORG', 'Failed to create invoice', error, { orgId });
    throw error;
  }

  Logger.info('CREATE_INVOICE_FOR_ORG', 'Invoice created successfully for organization', {
    entityId: newInvoice.id,
    entityType: 'invoice',
    orgId,
    details: {
      number: newInvoice.number,
      client_id: newInvoice.client_id,
      items_count: newInvoice.invoice_items?.length || 0
    }
  });
  return newInvoice as Invoice;
};

// Update invoice for an organization (accessible by members)
export const updateInvoiceForOrg = async (id: string, updates: Partial<Omit<Invoice, 'invoice_items'>>, userId: string) => {
  const supabase = await createAdminClient();

  // Get the current invoice to get the org_id for validation
  const { data: currentInvoice, error: fetchError } = await supabase
    .from('invoices')
    .select('org_id')
    .eq('id', id)
    .single();

  if (fetchError) {
    Logger.error('FETCH_INVOICE_FOR_UPDATE', 'Error fetching invoice for update', fetchError, { entityId: id });
    throw fetchError;
  }

  // Destructure to exclude generated columns (tax_amount, total) that are calculated by the database
  const { tax_amount, total, ...updatesToApply } = updates;

  const { data, error } = await supabase
    .from('invoices')
    .update(updatesToApply)
    .eq('id', id)
    .select('*, invoice_items(*)')
    .single();

  if (error) {
    Logger.error('UPDATE_INVOICE_FOR_ORG', 'Error updating invoice', error, { entityId: id });
    throw error;
  }

  Logger.info('UPDATE_INVOICE_FOR_ORG', 'Invoice updated successfully for organization', {
    entityId: id,
    entityType: 'invoice',
    details: { updatedFields: Object.keys(updates) }
  });
  return data as Invoice;
};

// Delete invoice for an organization (accessible by members)
export const deleteInvoiceForOrg = async (id: string, userId: string) => {
  const supabase = await createAdminClient();

  // Get the current invoice to get the org_id for validation
  const { data: currentInvoice, error: fetchError } = await supabase
    .from('invoices')
    .select('org_id')
    .eq('id', id)
    .single();

  if (fetchError) {
    Logger.error('FETCH_INVOICE_FOR_DELETE', 'Error fetching invoice for deletion', fetchError, { entityId: id });
    throw fetchError;
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) {
    Logger.error('DELETE_INVOICE_FOR_ORG', 'Error deleting invoice', error, { entityId: id });
    throw error;
  }

  Logger.info('DELETE_INVOICE_FOR_ORG', 'Invoice deleted successfully from organization', { entityId: id, entityType: 'invoice' });
  return { success: true };
};