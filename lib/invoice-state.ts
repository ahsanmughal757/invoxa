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
export function getComputedInvoiceState(invoice: Invoice): string {
  // Pass through cancelled/void as-is
  if (invoice.status === 'cancelled' || invoice.status === 'void') {
    return invoice.status;
  }

  const paidAmount = invoice.paid_amount || 0;
  const isFullyPaid = paidAmount >= invoice.total;

  if (isFullyPaid) {
    return 'paid';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSentInvoice = invoice.status !== 'draft';
  const isOverdue = isSentInvoice && new Date(invoice.due_date) < today && !isFullyPaid;

  if (isOverdue) {
    return 'overdue';
  }

  if (paidAmount === 0) {
    return invoice.status;
  }

  if (paidAmount > 0 && !isFullyPaid) {
    return 'partially_paid';
  }

  return invoice.status;
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
    overdue: 'Overdue',
    cancelled: 'Cancelled',
    void: 'Void',
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
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-500',
    void: 'bg-gray-100 text-gray-400',
  };
  
  return colors[state] || 'bg-gray-100 text-gray-500';
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