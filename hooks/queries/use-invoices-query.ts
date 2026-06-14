"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllInvoicesAction,
  getInvoiceByIdAction,
  createInvoiceAction,
  updateInvoiceAction,
  InvoiceData,
} from "@/lib/actions/invoice.actions";
import { Invoice } from "@/types/invoice";
import { CACHE_TAGS } from "@/lib/cache-tags";

export function useInvoicesQuery(orgId: string | undefined) {
  return useQuery({
    queryKey: ["invoices", orgId],
    queryFn: () => getAllInvoicesAction(),
    enabled: !!orgId,
    staleTime: 30_000,
    select: (data) => {
      if (!data.success || !data.data) return { invoices: [] };
      return {
        invoices: data.data.invoices || [],
        clients: data.data.clients || [],
        expenses: data.data.expenses || [],
        payments: data.data.payments || [],
        organization: data.data.organization,
      };
    },
  });
}

export function useInvoiceQuery(invoiceId: string | undefined) {
  return useQuery({
    queryKey: ["invoices", "detail", invoiceId],
    queryFn: () => getInvoiceByIdAction(invoiceId!),
    enabled: !!invoiceId,
    staleTime: 30_000,
  });
}

export function useCreateInvoiceMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InvoiceData) => createInvoiceAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", orgId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", orgId] });
    },
  });
}

export function useUpdateInvoiceMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Invoice> }) =>
      updateInvoiceAction(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", orgId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", orgId] });
    },
  });
}
