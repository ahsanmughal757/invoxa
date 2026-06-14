"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPaymentsByInvoiceIds } from "@/lib/repositories/payments.repository.func";
import { PaymentRecord } from "@/types/invoice";

async function recordPaymentForOrgAction(
  paymentData: Partial<Omit<PaymentRecord, "id">>,
  orgId: string,
  userId: string,
) {
  const { recordPaymentForOrg } = await import(
    "@/lib/queries/collaboration/payments"
  );
  return recordPaymentForOrg(paymentData, orgId, userId);
}

async function updatePaymentForOrgAction(
  id: string,
  updates: Partial<PaymentRecord>,
  userId: string,
) {
  const { updatePaymentForOrg } = await import(
    "@/lib/queries/collaboration/payments"
  );
  return updatePaymentForOrg(id, updates, userId);
}

async function deletePaymentForOrgAction(id: string, userId: string) {
  const { deletePaymentForOrg } = await import(
    "@/lib/queries/collaboration/payments"
  );
  return deletePaymentForOrg(id, userId);
}

export function usePaymentsQuery(invoiceIds: string[]) {
  return useQuery({
    queryKey: ["payments", invoiceIds],
    queryFn: () => getPaymentsByInvoiceIds(invoiceIds),
    enabled: invoiceIds.length > 0,
    staleTime: 30_000,
  });
}

export function useRecordPaymentMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      userId,
    }: {
      data: Partial<Omit<PaymentRecord, "id">>;
      userId: string;
    }) => recordPaymentForOrgAction(data, orgId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdatePaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
      userId,
    }: {
      id: string;
      updates: Partial<PaymentRecord>;
      userId: string;
    }) => updatePaymentForOrgAction(id, updates, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeletePaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      deletePaymentForOrgAction(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
