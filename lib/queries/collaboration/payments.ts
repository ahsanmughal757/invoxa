"use server";
import { createAdminClient } from '@/lib/supabase/server';
import { PaymentRecord, Invoice } from '@/types/invoice';
import { Logger } from '@/lib/utils/logger';
import { logPaymentActivity } from '@/lib/utils/activity-logger';

// Get payments for an organization (accessible by members)
export const getPaymentsForOrg = async (orgId: string) => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('payments')
    .select('*, invoices!invoice_id(id, org_id)')
    .eq('invoices.org_id', orgId);

  if (error) {
    Logger.error('GET_PAYMENTS_FOR_ORG', 'Error fetching payments for organization', error, { orgId });
    throw error;
  }

  Logger.info('GET_PAYMENTS_FOR_ORG', 'Payments fetched successfully for organization', { orgId, entityType: 'payments', details: { count: data.length } });
  return data as PaymentRecord[];
}

// Record payment for an organization (accessible by members)
export const recordPaymentForOrg = async (
  paymentData: Partial<Omit<PaymentRecord, 'id' | 'created_at'>>,
  orgId: string,
  userId: string
) => {


  console.log('Recording payment for organization', paymentData ); // Debug log
  if (!orgId) {
    const error = new Error("Organization ID not found");
    Logger.error('RECORD_PAYMENT_FOR_ORG', 'Organization ID not found', error, { orgId });
    throw error;
  }
  if (!paymentData.invoice_id) {
    const error = new Error("Invoice ID is required to record a payment.");
    Logger.error('RECORD_PAYMENT_FOR_ORG', 'Invoice ID is required', error, { orgId });
    throw error;
  }

  const supabase = await createAdminClient();

  // Verify that the invoice belongs to the organization
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id')
    .eq('id', paymentData.invoice_id)
    .eq('org_id', orgId)
    .single();

  if (invoiceError || !invoice) {
    const error = new Error("Invoice does not belong to this organization");
    Logger.error('RECORD_PAYMENT_FOR_ORG', 'Invoice does not belong to organization', error, { orgId, details: { invoiceId: paymentData.invoice_id } });
    throw error;
  }

  const { data, error } = await supabase
    .from('payments')
    .insert([paymentData])
    .select()
    .single();

  if (error) {
    Logger.error('RECORD_PAYMENT_FOR_ORG', 'Error recording payment', error, { orgId, details: { invoiceId: paymentData.invoice_id } });
    throw error;
  }

  // Log the activity
  try {
    await logPaymentActivity(orgId, userId, data.id, "created", {
      amount: data.amount,
      method: data.method,
      invoice_id: data.invoice_id,
      received_on: data.received_on,
    });
  } catch (activityError) {
    Logger.error("RECORD_PAYMENT_FOR_ORG_ACTIVITY", "Error logging payment creation", activityError, {
      details: { orgId, userId, paymentId: data.id },
    });
  }

  // Re-fetch the updated invoice to get the new paid_amount and status
  // as the database trigger should have updated it.
  const { data: updatedInvoice, error: invoiceFetchError } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', paymentData.invoice_id)
    .single();

  if (invoiceFetchError) {
    Logger.error('RECORD_PAYMENT_FOR_ORG', 'Error re-fetching updated invoice after payment', invoiceFetchError, {
      entityId: paymentData.invoice_id,
      details: { paymentId: data.id }
    });
    throw invoiceFetchError;
  }

  Logger.info('RECORD_PAYMENT_FOR_ORG', 'Payment recorded successfully for organization', {
    entityId: data.id,
    entityType: 'payment',
    orgId,
    details: {
      invoiceId: data.invoice_id,
      amount: data.amount,
      method: data.method,
      updatedInvoiceStatus: updatedInvoice.status
    }
  });

  return { payment: data as PaymentRecord, invoice: updatedInvoice as Invoice };
};

// Update payment for an organization (accessible by members)
export const updatePaymentForOrg = async (id: string, updates: Partial<PaymentRecord>, userId: string) => {
  const supabase = await createAdminClient();

  // Get the current payment to get the invoice_id and verify org access
  const { data: currentPayment, error: fetchError } = await supabase
    .from('payments')
    .select('invoice_id, invoices!invoice_id(org_id)')
    .eq('id', id)
    .single();

  if (fetchError) {
    Logger.error('FETCH_PAYMENT_FOR_UPDATE', 'Error fetching payment for update', fetchError, { entityId: id });
    throw fetchError;
  }

  if (!currentPayment || !currentPayment.invoices) {
    const error = new Error("Payment or associated invoice not found");
    Logger.error('FETCH_PAYMENT_FOR_UPDATE', 'Payment or associated invoice not found', error, { entityId: id });
    throw error;
  }

  const invoicesArray = Array.isArray(currentPayment.invoices) ? currentPayment.invoices : [currentPayment.invoices];
  const orgId = invoicesArray[0]?.org_id;

  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    Logger.error('UPDATE_PAYMENT_FOR_ORG', 'Error updating payment', error, { entityId: id });
    throw error;
  }

  // Log the activity
  try {
    await logPaymentActivity(orgId, userId, id, "updated", {
      updated_fields: Object.keys(updates),
      amount: data?.amount,
      invoice_id: currentPayment.invoice_id,
    });
  } catch (activityError) {
    Logger.error("UPDATE_PAYMENT_FOR_ORG_ACTIVITY", "Error logging payment update", activityError, {
      details: { orgId, userId, paymentId: id },
    });
  }

  // Re-fetch the updated invoice to get the new paid_amount and status
  const { data: updatedInvoice, error: invoiceFetchError } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', currentPayment.invoice_id)
    .single();

  if (invoiceFetchError) {
    Logger.error('UPDATE_PAYMENT_FOR_ORG', 'Error re-fetching updated invoice after payment update', invoiceFetchError, {
      entityId: currentPayment.invoice_id,
      details: { paymentId: data.id }
    });
    throw invoiceFetchError;
  }

  Logger.info('UPDATE_PAYMENT_FOR_ORG', 'Payment updated successfully for organization', {
    entityId: id,
    entityType: 'payment',
    orgId,
    details: { updatedFields: Object.keys(updates) }
  });

  return { payment: data as PaymentRecord, invoice: updatedInvoice as Invoice };
};

// Delete payment for an organization (accessible by members)
export const deletePaymentForOrg = async (id: string, userId: string) => {
  const supabase = await createAdminClient();

  // Get the current payment to get the invoice_id and verify org access
  const { data: currentPayment, error: fetchError } = await supabase
    .from('payments')
    .select('invoice_id, invoices!invoice_id(org_id)')
    .eq('id', id)
    .single();

  if (fetchError) {
    Logger.error('FETCH_PAYMENT_FOR_DELETE', 'Error fetching payment for deletion', fetchError, { entityId: id });
    throw fetchError;
  }

  if (!currentPayment || !currentPayment.invoices) {
    const error = new Error("Payment or associated invoice not found");
    Logger.error('FETCH_PAYMENT_FOR_DELETE', 'Payment or associated invoice not found', error, { entityId: id });
    throw error;
  }

  const invoicesArray = Array.isArray(currentPayment.invoices) ? currentPayment.invoices : [currentPayment.invoices];
  const orgId = invoicesArray[0]?.org_id;

  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id);

  if (error) {
    Logger.error('DELETE_PAYMENT_FOR_ORG', 'Error deleting payment', error, { entityId: id });
    throw error;
  }

  // Log the activity
  try {
    await logPaymentActivity(orgId, userId, id, "deleted", {
      invoice_id: currentPayment.invoice_id,
    });
  } catch (activityError) {
    Logger.error("DELETE_PAYMENT_FOR_ORG_ACTIVITY", "Error logging payment deletion", activityError, {
      details: { orgId, userId, paymentId: id },
    });
  }

  // Re-fetch the updated invoice to get the new paid_amount and status
  const { data: updatedInvoice, error: invoiceFetchError } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', currentPayment.invoice_id)
    .single();

  if (invoiceFetchError) {
    Logger.error('DELETE_PAYMENT_FOR_ORG', 'Error re-fetching updated invoice after payment deletion', invoiceFetchError, {
      entityId: currentPayment.invoice_id
    });
    throw invoiceFetchError;
  }

  Logger.info('DELETE_PAYMENT_FOR_ORG', 'Payment deleted successfully from organization', { 
    entityId: id, 
    entityType: 'payment',
    orgId,
    details: { 
      invoiceId: currentPayment.invoice_id,
      updatedInvoiceStatus: updatedInvoice.status
    }
  });

  return { success: true, invoice: updatedInvoice as Invoice };
};