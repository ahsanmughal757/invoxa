"use client";

import {
  handleAsyncOperation,
  isError as isHandlerError,
} from "@/lib/utils/error-handler";
import { Expense } from "@/types/invoice";
import { createContext, useContext, useMemo } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { useOrganization } from "./use-organization";
import {
  useExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} from "@/hooks/queries/use-expenses-query";

type ExpenseContextType = {
  expenses: Expense[] | [];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[] | []>>;
  isLoading: boolean;
  isEmpty: boolean;
  isError: boolean;
  errorMessage: string | null;
  isReady: boolean;
  getOrgExpenses: (orgId: string) => Promise<any>;
  createExpense: (
    expenseData: Partial<Omit<Expense, "id" | "org_id">>,
  ) => Promise<Expense>;
  updateExpense: (
    id: string,
    updates: Partial<Expense>,
  ) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<void>;
};

const ExpenseContext = createContext<ExpenseContextType | null>(null);

export const ExpenseProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userId } = useAuth();
  const { selectedOrganization, isEmpty: orgIsEmpty, isLoading: orgIsLoading } = useOrganization();
  const orgId = selectedOrganization?.id;

  const { data: expenses = [], isLoading, isError, error, isFetched } = useExpensesQuery(orgId);
  const createMutation = useCreateExpenseMutation(orgId || "");
  const updateMutation = useUpdateExpenseMutation(orgId || "");
  const deleteMutation = useDeleteExpenseMutation(orgId || "");

  const getOrgExpenses = async (orgIdParam: string) => {
    const result = await handleAsyncOperation(async () => {
      const { getExpensesForOrg } = await import("@/lib/queries/collaboration/expenses");
      return await getExpensesForOrg(orgIdParam);
    });
    if (isHandlerError(result)) {
      throw new Error(result.error || "Failed to get expenses for organization");
    }
    return result.data || [];
  };

  const createExpense = async (
    expenseData: Partial<Omit<Expense, "id" | "org_id">>,
  ) => {
    if (!userId) throw new Error("User not logged in to create expense!");
    const result = await createMutation.mutateAsync({ data: expenseData, userId });
    return result;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (!userId) throw new Error("User not logged in to update expense!");
    const result = await updateMutation.mutateAsync({ id, updates, userId });
    return result;
  };

  const deleteExpense = async (id: string) => {
    if (!userId) throw new Error("User not logged in to delete expense!");
    await deleteMutation.mutateAsync({ id, userId });
  };

  const setExpenses = () => {};

  const contextValue = useMemo(() => {
    const isEmptyState = !orgIsLoading && !orgIsEmpty && orgId
      ? isFetched && !isLoading && expenses.length === 0
      : !orgIsLoading && (orgIsEmpty || !orgId);

    return {
      expenses,
      setExpenses,
      isLoading: orgId ? isLoading : false,
      isEmpty: isEmptyState,
      isError,
      errorMessage: error?.message || null,
      isReady: isFetched && !isLoading && expenses.length > 0,
      getOrgExpenses,
      createExpense,
      updateExpense,
      deleteExpense,
    };
  }, [expenses, isLoading, isError, error, isFetched, orgId, orgIsLoading, orgIsEmpty]);

  return (
    <ExpenseContext.Provider value={contextValue}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = (): ExpenseContextType => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }
  return context;
};
