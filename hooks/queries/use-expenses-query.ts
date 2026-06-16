"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Expense } from "@/types/invoice";

async function getExpensesForOrgAction(orgId: string) {
  const { getExpensesForOrg } = await import(
    "@/lib/queries/collaboration/expenses"
  );
  return getExpensesForOrg(orgId);
}

async function createExpenseForOrgAction(
  expenseData: Partial<Omit<Expense, "id" | "org_id">>,
  orgId: string,
  userId: string,
) {
  const { createExpenseForOrg } = await import(
    "@/lib/queries/collaboration/expenses"
  );
  return createExpenseForOrg(expenseData, orgId, userId);
}

async function updateExpenseForOrgAction(
  id: string,
  updates: Partial<Expense>,
  userId: string,
) {
  const { updateExpenseForOrg } = await import(
    "@/lib/queries/collaboration/expenses"
  );
  return updateExpenseForOrg(id, updates, userId);
}

async function deleteExpenseForOrgAction(id: string, userId: string) {
  const { deleteExpenseForOrg } = await import(
    "@/lib/queries/collaboration/expenses"
  );
  return deleteExpenseForOrg(id, userId);
}

export function useExpensesQuery(orgId: string | undefined) {
  return useQuery({
    queryKey: ["expenses", orgId],
    queryFn: () => getExpensesForOrgAction(orgId!),
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function useCreateExpenseMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      userId,
    }: {
      data: Partial<Omit<Expense, "id" | "org_id">>;
      userId: string;
    }) => createExpenseForOrgAction(data, orgId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", orgId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", orgId] });
    },
  });
}

export function useUpdateExpenseMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
      userId,
    }: {
      id: string;
      updates: Partial<Expense>;
      userId: string;
    }) => updateExpenseForOrgAction(id, updates, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", orgId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", orgId] });
    },
  });
}

export function useDeleteExpenseMutation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      deleteExpenseForOrgAction(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", orgId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", orgId] });
    },
  });
}
