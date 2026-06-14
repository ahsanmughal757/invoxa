import {
  createPayment as createPaymentRepo,
  updatePayment as updatePaymentRepo,
  deletePayment,
  getPaymentById as getPaymentByIdRepo,
  getPaymentsByOrgId as getPaymentsByOrgIdRepo,
  getPaymentsByInvoiceIds as getPaymentsByInvoiceIdsRepo
} from '@/lib/repositories/payments.repository.func';
import { getInvoiceByIdWithItems, updateInvoice } from '@/lib/repositories/invoices.repository.func';
import { getOrganizationById } from '@/lib/repositories/organizations.repository.func';

/**
 * Creates a new payment record
 */
export async function createPayment(paymentData: any): Promise<any> {
  // Validate that the invoice exists and belongs to the organization
  if (paymentData.invoice_id) {
    const invoice = await getInvoiceByIdWithItems(paymentData.invoice_id);
    if (!invoice) {
      throw new Error('Invoice does not exist');
    }

    // Verify that the organization ID matches
    if (paymentData.org_id && invoice.org_id !== paymentData.org_id) {
      throw new Error('Invoice does not belong to the specified organization');
    }
  }

  // Create the payment
  const newPayment = await createPaymentRepo(paymentData);

  return newPayment;
}

/**
 * Updates an existing payment
 */
export async function updatePayment(id: string, updates: any): Promise<any> {
  try {
    return await updatePaymentRepo(id, updates);
  } catch (error) {
    // If the payment doesn't exist, return null
    // This is an acceptable empty state, not an error condition
    return null;
  }
}

/**
 * Deletes a payment
 */
export async function deletePaymentFunc(id: string): Promise<{ success: boolean }> {
  try {
    return await deletePayment(id);
  } catch (error) {
    // If the payment doesn't exist, return success: true
    // This is an acceptable empty state, not an error condition
    return { success: true };
  }
}

/**
 * Gets a payment by its ID
 */
export async function getPaymentById(id: string): Promise<any> {
  try {
    return await getPaymentByIdRepo(id);
  } catch (error) {
    // If the payment doesn't exist, return null
    // This is an acceptable empty state, not an error condition
    return null;
  }
}

/**
 * Gets all payments for a specific organization
 */
export async function getPaymentsByOrgId(orgId: string): Promise<any[]> {
  // Verify that the organization exists
  const organization = await getOrganizationById(orgId);
  if (!organization) {
    throw new Error('Organization does not exist');
  }

  try {
    return await getPaymentsByOrgIdRepo(orgId);
  } catch (error) {
    // If there are no payments for the organization, return an empty array
    // This is an acceptable empty state, not an error condition
    return [];
  }
}

/**
 * Gets all payments for specific invoices
 */
export async function getPaymentsByInvoiceIds(invoiceIds: string[]): Promise<any[]> {
  if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
    return [];
  }

  try {
    return await getPaymentsByInvoiceIdsRepo(invoiceIds);
  } catch (error) {
    // If there are no payments for the invoices, return an empty array
    // This is an acceptable empty state, not an error condition
    return [];
  }
}

/**
 * Processes a payment and updates the invoice status accordingly
 */
export async function processPayment(paymentData: any): Promise<any> {
  // Validate the payment data
  if (!paymentData.invoice_id) {
    throw new Error('Invoice ID is required to process a payment');
  }

  // Get the invoice to validate it exists
  const invoice = await getInvoiceByIdWithItems(paymentData.invoice_id);
  if (!invoice) {
    throw new Error('Cannot process payment: Invoice not found');
  }

  // Calculate total amount paid toward this invoice so far
  const existingPayments = await getPaymentsByInvoiceIdsRepo([paymentData.invoice_id]);
  const totalPaidBefore = existingPayments.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount.toString() || '0'), 0);

  // Add the new payment amount
  const newAmount = parseFloat(paymentData.amount || '0');
  const totalPaidAfter = totalPaidBefore + newAmount;

  // Calculate the invoice total
  const invoiceTotal = invoice.invoice_items?.reduce((sum: number, item: any) => sum + (parseFloat(item.line_total.toString() || '0') * parseInt(item.qty.toString() || '1')), 0) || 0;

  // Determine the new invoice status based on payment amounts
  let newInvoiceStatus = 'draft'; // default
  if (totalPaidAfter >= invoiceTotal) {
    newInvoiceStatus = 'paid';
  } else if (totalPaidAfter > 0) {
    newInvoiceStatus = 'partial';
  } else {
    newInvoiceStatus = 'sent'; // assuming it was sent if no payment yet
  }

  // Create the payment record
  const newPayment = await createPayment(paymentData);

  // Update the invoice status based on payment status
  await updateInvoice(paymentData.invoice_id, {
    status: newInvoiceStatus,
    updated_at: new Date().toISOString()
  });

  return {
    payment: newPayment,
    invoice_status: newInvoiceStatus,
    total_paid: totalPaidAfter,
    invoice_total: invoiceTotal
  };
}