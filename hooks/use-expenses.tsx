"use client";

import { getClientsByOrgId } from "@/lib/repositories/clients.repository.func";
import {
  handleAsyncOperation,
  isEmptyState,
  isError,
} from "@/lib/utils/error-handler";
import { Expense } from "@/types/invoice";
import { createContext, useContext, useEffect, useState } from "react";
import { useSelectedOrganization } from "./use-selected-org";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { useInvoices } from "./use-invoices";
import { useOrganization } from "./use-organization";

type ExpenseContextType = {
  expenses: Expense[] | [];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[] | []>>;
  // Loading state flags
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
  // const [organizations, setOrganizations] = useState<Organization[] | []>([]);
  const [expenses, setExpenses] = useState<Expense[] | []>([]);
  const { selectedOrganization, isEmpty: orgIsEmpty, isLoading: orgIsLoading } = useOrganization();

  // Loading state flags
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      if (selectedOrganization?.id) {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage(null);

        try {
          const expenseData = await getOrgExpenses(selectedOrganization.id);
          const data = expenseData || [];
          setExpenses(data);
          setIsLoading(false);
          setIsEmpty(data.length === 0);
          setIsReady(data.length > 0);
        } catch (error) {
          console.error("Error fetching expenses:", error);
          setIsLoading(false);
          setIsEmpty(false);
          setHasError(true);
          setErrorMessage(error instanceof Error ? error.message : "Failed to load expenses");
          setIsReady(false);
        }
      } else if (!orgIsLoading && (orgIsEmpty || !selectedOrganization)) {
        // Org loading complete, no org found → show empty state, not infinite loading
        setIsLoading(false);
        setIsEmpty(true);
        setIsReady(false);
      } else {
        // Still loading org
        setIsLoading(true);
      }
    })();
  }, [selectedOrganization, orgIsLoading, orgIsEmpty]);

  const getOrgExpenses = async (orgId: string) => {
    if (!orgId) {
      throw new Error("Organization not found!");
    }

    const result = await handleAsyncOperation(async () => {
      const { getExpensesForOrg } =
        await import("@/lib/queries/collaboration/expenses");
      return await getExpensesForOrg(orgId);
    });

    if (isError(result)) {
      throw new Error(
        result.error || "Failed to get expenses for organization",
      );
    }

    // Return empty array if no expenses found (no longer throws)
    if (isEmptyState(result) || !result.data) {
      return [];
    }

    return result.data;
  };

  // Expense operations
  const createExpense = async (
    expenseData: Partial<Omit<Expense, "id" | "org_id">>,
  ) => {
    if (!userId) {
      throw new Error("User not logged in to create expense!");
    }

    const result = await handleAsyncOperation(async () => {
      const { createExpenseForOrg } =
        await import("@/lib/queries/collaboration/expenses");
      return await createExpenseForOrg(
        expenseData,
        selectedOrganization?.id || "",
        userId,
      );
    });

    if (isError(result)) {
      throw new Error(result.error || "Failed to create expense");
    }

    if (isEmptyState(result) || !result.data) {
      throw new Error("Expense creation failed - no data returned");
    }

    // Update local state
    setExpenses((prev) => [...prev, result.data]);

    console.log("Expense created!");
    return result.data;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (!userId) {
      throw new Error("User not logged in to update expense!");
    }

    const result = await handleAsyncOperation(async () => {
      const { updateExpenseForOrg } =
        await import("@/lib/queries/collaboration/expenses");
      return await updateExpenseForOrg(id, updates, userId);
    });

    if (isError(result)) {
      throw new Error(result.error || "Failed to update expense");
    }

    if (isEmptyState(result) || !result.data) {
      // Expense might have been deleted, remove from local state
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      return null;
    }

    setExpenses((prev) =>
      prev.map((exp) => (exp.id === id ? result.data : exp)),
    );
    return result.data;
  };

  const deleteExpense = async (id: string) => {
    if (!userId) {
      throw new Error("User not logged in to delete expense!");
    }

    const result = await handleAsyncOperation(async () => {
      const { deleteExpenseForOrg } =
        await import("@/lib/queries/collaboration/expenses");
      return await deleteExpenseForOrg(id, userId);
    });

    if (isError(result)) {
      throw new Error(result.error || "Failed to delete expense");
    }

    // Remove from local state regardless of whether it existed (empty state or success)
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  return (
    <ExpenseContext.Provider
      value={{
        expenses,
        setExpenses,
        isLoading,
        isEmpty,
        isError: hasError,
        errorMessage,
        isReady,
        getOrgExpenses,
        createExpense,
        updateExpense,
        deleteExpense,
      }}
    >
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
