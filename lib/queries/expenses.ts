"use server";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { Expense } from "@/types/invoice";
import { Logger } from "@/lib/utils/logger";
import { logExpenseActivity } from "@/lib/utils/activity-logger";

// Get expenses by organization ID
export const getExpensesByOrgId = cache(async (orgId: string) => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("org_id", orgId);

  if (error) {
    Logger.error("GET_EXPENSES", "Error fetching expenses", error, { orgId });
    throw error;
  }

  Logger.info("GET_EXPENSES", "Expenses fetched successfully", {
    orgId,
    entityType: "expenses",
    details: { count: data.length },
  });
  return data as Expense[];
});

// Create expense
export const createExpense = async (
  expenseData: Partial<Omit<Expense, "id" | "org_id">>,
  orgId: string,
  userId: string,
) => {
  if (!orgId) {
    const error = new Error("Organization ID not found");
    Logger.error("CREATE_EXPENSE", "Organization ID not found", error, {
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
    Logger.error("CREATE_EXPENSE", "Error creating expense", error, { orgId });
    throw error;
  }

  // Log the activity
  try {
    await logExpenseActivity(orgId, userId, data.id, "created", {
      description: data.description,
      amount: data.amount,
      date: data.date,
    });
  } catch (activityError) {
    // Don't throw if activity logging fails, just log the error
    Logger.error(
      "CREATE_EXPENSE_ACTIVITY",
      "Error logging expense creation activity",
      activityError,
      {
        details: {
          orgId,
          userId,
          expenseId: data.id,
        },
      },
    );
  }

  Logger.info("CREATE_EXPENSE", "Expense created successfully", {
    entityId: data.id,
    entityType: "expense",
    orgId,
    details: {
      description: data.description,
      amount: data.amount,
      date: data.date,
    },
  });
  return data as Expense;
};

// Update expense
export const updateExpense = async (
  id: string,
  updates: Partial<Expense>,
  userId: string,
) => {
  const supabase = await createAdminClient();

  // Get the current expense to get the org_id for activity logging
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
    Logger.error("UPDATE_EXPENSE", "Error updating expense", error, {
      entityId: id,
    });
    throw error;
  }

  // Log the activity
  try {
    await logExpenseActivity(currentExpense.org_id, userId, id, "updated", {
      updated_fields: Object.keys(updates),
      description: data?.description,
      amount: data?.amount,
    });
  } catch (activityError) {
    // Don't throw if activity logging fails, just log the error
    Logger.error(
      "UPDATE_EXPENSE_ACTIVITY",
      "Error logging expense update activity",
      activityError,
      {
        details: {
          orgId: currentExpense.org_id,
          userId,
          expenseId: id,
        },
      },
    );
  }

  Logger.info("UPDATE_EXPENSE", "Expense updated successfully", {
    entityId: id,
    entityType: "expense",
    details: { updatedFields: Object.keys(updates) },
  });
  return data as Expense;
};

// Delete expense
export const deleteExpense = async (id: string, userId: string) => {
  const supabase = await createAdminClient();

  // Get the current expense to get the org_id for activity logging
  const { data: currentExpense, error: fetchError } = await supabase
    .from("expenses")
    .select("org_id, description, amount")
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
    Logger.error("DELETE_EXPENSE", "Error deleting expense", error, {
      entityId: id,
    });
    throw error;
  }

  // Log the activity
  try {
    await logExpenseActivity(currentExpense.org_id, userId, id, "deleted", {
      description: currentExpense.description,
      amount: currentExpense.amount,
    });
  } catch (activityError) {
    // Don't throw if activity logging fails, just log the error
    Logger.error(
      "DELETE_EXPENSE_ACTIVITY",
      "Error logging expense deletion activity",
      activityError,
      {
        details: {
          orgId: currentExpense.org_id,
          userId,
          expenseId: id,
        },
      },
    );
  }

  Logger.info("DELETE_EXPENSE", "Expense deleted successfully", {
    entityId: id,
    entityType: "expense",
  });
  return { success: true };
};
