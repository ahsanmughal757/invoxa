"use client";

import { Badge } from '@/components/ui/badge';
import { Invoice } from '@/types/invoice';
import { getComputedInvoiceState, getInvoiceStateColorClass, getInvoiceStateLabel } from '@/lib/invoice-state';

interface InvoiceStateBadgeProps {
  invoice: Invoice | any; // Accept both regular Invoice and extended InvoiceWithComputedFields
}

export function InvoiceStateBadge({ invoice }: InvoiceStateBadgeProps) {
  // Use DB-computed status if available, otherwise fall back to client-side calculation
  const state = invoice.computed_status || getComputedInvoiceState(invoice);
  const colorClass = getInvoiceStateColorClass(state);
  const label = getInvoiceStateLabel(state);

  return (
    <Badge className={colorClass}>
      {label}
    </Badge>
  );
}

interface SimpleInvoiceStateBadgeProps {
  state: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue';
}

export function SimpleInvoiceStateBadge({ state }: SimpleInvoiceStateBadgeProps) {
  const colorClass = getInvoiceStateColorClass(state);
  const label = getInvoiceStateLabel(state);

  return (
    <Badge className={colorClass}>
      {label}
    </Badge>
  );
}