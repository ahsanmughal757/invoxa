"use client";

import { ExpenseTracking } from "@/components/expenses/expense-tracking";
import { Receipt } from "lucide-react";
import { useExpenses } from "@/hooks/use-expenses";
import { useOrganization } from "@/hooks/use-organization";
import {
  LoadingState,
  EmptyState,
  ErrorState,
  ReadyState,
} from "@/components/ui/state-components";

export default function ExpensesPage() {
  const { selectedOrganization: organization } = useOrganization();
  const {
    expenses,
    createExpense,
    updateExpense,
    deleteExpense,
    isLoading,
    isEmpty,
    isError,
    errorMessage,
    isReady,
  } = useExpenses();

  // Loading State
  if (isLoading) {
    return <LoadingState message="Loading your expenses..." size="large" />;
  }

  // Error State
  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Expenses"
        description={
          errorMessage ||
          "There was an issue retrieving your expenses. Please try again later."
        }
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Empty State
  if (isEmpty) {
    return (
      <div className="space-y-6">
        {/*<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Receipt className="h-8 w-8 mr-3 text-red-600" />
              Organization Expenses
            </h1>
            <p className="text-gray-600 mt-1">
              All expenses belonging to{" "}
              {organization?.name || "your organization"}
            </p>
          </div>
        </div>*/}

        <ExpenseTracking
          expenses={[]}
          onCreateExpense={createExpense}
          onUpdateExpense={updateExpense}
          onDeleteExpense={deleteExpense}
        />
      </div>
    );
  }

  // Ready State
  if (isReady) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Receipt className="h-8 w-8 mr-3 text-red-600" />
              Organization Expenses
            </h1>
            <p className="text-gray-600 mt-1">
              All expenses belonging to{" "}
              {organization?.name || "your organization"}
            </p>
          </div>
        </div>

        <ExpenseTracking
          expenses={expenses}
          onCreateExpense={createExpense}
          onUpdateExpense={updateExpense}
          onDeleteExpense={deleteExpense}
        />
      </div>
    );
  }

  // Fallback
  return <LoadingState message="Preparing expenses..." size="large" />;
}
