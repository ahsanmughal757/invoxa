"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { Expense } from "@/types/invoice";
import { Logger } from "@/lib/utils/logger";

// Get expenses for an organization (accessible by members)
export const getExpensesForOrg = async (orgId: string) => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("org_id", orgId);

  if (error) {
    Logger.error(
      "GET_EXPENSES_FOR_ORG",
      "Error fetching expenses for organization",
      error,
      { orgId },
    );
    throw error;
  }

  Logger.info(
    "GET_EXPENSES_FOR_ORG",
    "Expenses fetched successfully for organization",
    {
      orgId,
      entityType: "expenses",
      details: { count: data.length },
    },
  );
  return data as Expense[];
}

// Create expense for an organization (accessible by members)
export const createExpenseForOrg = async (
  expenseData: Partial<Omit<Expense, "id" | "created_at" | "org_id">>,
  orgId: string,
  userId: string,
) => {
  if (!orgId) {
    const error = new Error("Organization ID not found");
    Logger.error("CREATE_EXPENSE_FOR_ORG", "Organization ID not found", error, {
      orgId,
    });
    throw error;
  }

  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("expenses")
    .insert([{ ...expenseData, org_id: orgId }])
    .select()
    .single();

  if (error) {
    Logger.error("CREATE_EXPENSE_FOR_ORG", "Error creating expense", error, {
      orgId,
    });
    throw error;
  }

  Logger.info(
    "CREATE_EXPENSE_FOR_ORG",
    "Expense created successfully for organization",
    {
      entityId: data.id,
      entityType: "expense",
      orgId,
      details: {
        description: data.description,
        amount: data.amount,
        date: data.date,
      },
    },
  );
  return data as Expense;
};

// Update expense for an organization (accessible by members)
export const updateExpenseForOrg = async (
  id: string,
  updates: Partial<Expense>,
  userId: string,
) => {
  const supabase = await createAdminClient();

  // Get the current expense to get the org_id for validation
  const { data: currentExpense, error: fetchError } = await supabase
    .from("expenses")
    .select("org_id")
    .eq("id", id)
    .single();

  if (fetchError) {
    Logger.error(
      "FETCH_EXPENSE_FOR_UPDATE",
      "Error fetching expense for update",
      fetchError,
      { entityId: id },
    );
    throw fetchError;
  }

  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    Logger.error("UPDATE_EXPENSE_FOR_ORG", "Error updating expense", error, {
      entityId: id,
    });
    throw error;
  }

  Logger.info(
    "UPDATE_EXPENSE_FOR_ORG",
    "Expense updated successfully for organization",
    {
      entityId: id,
      entityType: "expense",
      details: { updatedFields: Object.keys(updates) },
    },
  );
  return data as Expense;
};

// Delete expense for an organization (accessible by members)
export const deleteExpenseForOrg = async (id: string, userId: string) => {
  const supabase = await createAdminClient();

  // Get the current expense to get the org_id for validation
  const { data: currentExpense, error: fetchError } = await supabase
    .from("expenses")
    .select("org_id")
    .eq("id", id)
    .single();

  if (fetchError) {
    Logger.error(
      "FETCH_EXPENSE_FOR_DELETE",
      "Error fetching expense for deletion",
      fetchError,
      { entityId: id },
    );
    throw fetchError;
  }

  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    Logger.error("DELETE_EXPENSE_FOR_ORG", "Error deleting expense", error, {
      entityId: id,
    });
    throw error;
  }

  Logger.info(
    "DELETE_EXPENSE_FOR_ORG",
    "Expense deleted successfully from organization",
    { entityId: id, entityType: "expense" },
  );
  return { success: true };
};
