"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllInvoicesAction,
  getInvoiceByIdAction,
  createInvoiceAction,
  updateInvoiceAction,
  deleteInvoiceAction,
  InvoiceData,
} from "@/lib/actions/invoice.actions";
import { Invoice, InvoiceStructure } from "@/types/invoice";
import { getInvoicesByOrgId } from "@/lib/queries/invoices";

export function useInvoicesQuery(orgId: string | undefined) {
  return useQuery({
    queryKey: ["invoices", orgId],
    queryFn: () => getInvoicesByOrgId(orgId!),
    enabled: !!orgId,
    staleTime: 30_000,
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
    mutationFn: (data: InvoiceData) => createInvoiceAction(data, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", orgId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", orgId] });
    },
  });
}

export function useUpdateInvoiceMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: InvoiceStructure }) =>
      updateInvoiceAction(id, updates, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", orgId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", orgId] });
    },
  });
}

export function useDeleteInvoiceMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteInvoiceAction(id, orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", orgId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", orgId] });
    },
  });
}
