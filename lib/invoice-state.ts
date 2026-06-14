/**
 * Invoice State Management
 * 
 * Determines invoice state based on payment data rather than manual status setting.
 * This ensures accurate state representation that reflects actual payment status.
 */

import { Invoice } from '@/types/invoice';

/**
 * Calculates the computed state of an invoice based on payment data
 * instead of relying on manually set status values.
 */
export function getComputedInvoiceState(invoice: Invoice): 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' {
  const paidAmount = invoice.paid_amount || 0;
  const isFullyPaid = paidAmount >= invoice.total;

  // If fully paid, state is always 'paid'
  if (isFullyPaid) {
    return 'paid';
  }

  // Only consider overdue for invoices that have been sent (not drafts)
  // Drafts don't have due dates that matter for overdue status
  const isSentInvoice = invoice.status !== 'draft';
  const isOverdue = isSentInvoice && new Date(invoice.due_date) < new Date() && !isFullyPaid;

  // If overdue and not fully paid, state is 'overdue'
  if (isOverdue) {
    return 'overdue';
  }

  // If no payments made yet
  if (paidAmount === 0) {
    return invoice.status as 'draft' | 'sent'; // Use original status for draft/sent distinction
  }

  // If some payments made but not full amount
  if (paidAmount > 0 && !isFullyPaid) {
    return 'partially_paid';
  }

  // Default fallback (shouldn't normally reach here)
  return invoice.status as 'draft' | 'sent' | 'overdue';
}

/**
 * Gets the display-friendly label for an invoice state
 */
export function getInvoiceStateLabel(state: ReturnType<typeof getComputedInvoiceState>): string {
  const labels: Record<string, string> = {
    draft: 'Draft',
    sent: 'Sent',
    partially_paid: 'Partially Paid',
    paid: 'Paid',
    overdue: 'Overdue'
  };
  
  return labels[state] || state;
}

/**
 * Gets the appropriate badge color class for an invoice state
 */
export function getInvoiceStateColorClass(state: ReturnType<typeof getComputedInvoiceState>): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    partially_paid: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800'
  };
  
  return colors[state];
}

/**
 * Checks if an invoice is in a paid state (fully or partially)
 */
export function isInvoicePaidOrPartiallyPaid(invoice: Invoice): boolean {
  const state = getComputedInvoiceState(invoice);
  return state === 'paid' || state === 'partially_paid';
}

/**
 * Checks if an invoice is fully paid
 */
export function isInvoiceFullyPaid(invoice: Invoice): boolean {
  return getComputedInvoiceState(invoice) === 'paid';
}