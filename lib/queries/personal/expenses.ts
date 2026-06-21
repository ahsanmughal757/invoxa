"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { Expense } from "@/types/invoice";
import { Logger } from "@/lib/utils/logger";

// Get personal expenses for a user (not tied to an organization)
export const getPersonalExpenses = async (userId: string) => {
  const supabase = await createAdminClient();

  // First get the user's profile to get the profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (profileError || !profile) {
    Logger.error(
      "GET_PERSONAL_EXPENSES",
      "Error fetching user profile",
      profileError,
      { userId },
    );
    throw profileError || new Error("User profile not found");
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .or(`org_id.is.null,user_id.eq.${profile.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    Logger.error(
      "GET_PERSONAL_EXPENSES",
      "Error fetching personal expenses",
      error,
      { userId },
    );
    throw error;
  }

  Logger.info(
    "GET_PERSONAL_EXPENSES",
    "Personal expenses fetched successfully",
    {
      userId,
      entityType: "personal_expenses",
      details: { count: data.length },
    },
  );
  return data as Expense[];
}

// Create a personal expense for a user
export const createPersonalExpense = async (
  expenseData: Partial<Omit<Expense, "id" | "org_id">>,
  userId: string,
) => {
  const supabase = await createAdminClient();

  // Get the user's profile to get the profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (profileError || !profile) {
    Logger.error(
      "CREATE_PERSONAL_EXPENSE",
      "Error fetching user profile",
      profileError,
      { userId },
    );
    throw profileError || new Error("User profile not found");
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert([{ ...expenseData, user_id: profile.id }])
    .select()
    .single();

  if (error) {
    Logger.error(
      "CREATE_PERSONAL_EXPENSE",
      "Error creating personal expense",
      error,
      { userId },
    );
    throw error;
  }

  Logger.info(
    "CREATE_PERSONAL_EXPENSE",
    "Personal expense created successfully",
    {
      entityId: data.id,
      entityType: "expense",
      userId,
      details: {
        description: data.description,
        amount: data.amount,
      },
    },
  );
  return data as Expense;
};

// Update a personal expense
export const updatePersonalExpense = async (
  id: string,
  updates: Partial<Expense>,
  userId: string,
) => {
  const supabase = await createAdminClient();

  // Get the user's profile to get the profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (profileError || !profile) {
    Logger.error(
      "UPDATE_PERSONAL_EXPENSE",
      "Error fetching user profile",
      profileError,
      { details: { userId, expenseId: id } },
    );
    throw profileError || new Error("User profile not found");
  }

  // Verify that the expense belongs to the user
  const { data: expense, error: fetchError } = await supabase
    .from("expenses")
    .select("id, user_id, org_id")
    .eq("id", id)
    .single();

  if (fetchError || !expense) {
    Logger.error(
      "UPDATE_PERSONAL_EXPENSE",
      "Error fetching expense for update",
      fetchError,
      { details: { userId, expenseId: id } },
    );
    throw fetchError || new Error("Expense not found");
  }

  // Check if the expense belongs to the user (either personal or in their organization)
  const hasAccess =
    expense.user_id === profile.id ||
    (expense.org_id && (await userHasOrgAccess(expense.org_id, profile.id)));

  if (!hasAccess) {
    const error = new Error(
      "Unauthorized: You do not have access to this expense",
    );
    Logger.error(
      "UPDATE_PERSONAL_EXPENSE",
      "Unauthorized access attempt",
      error,
      { details: { userId, expenseId: id } },
    );
    throw error;
  }

  const { data: result, error: updateError } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    Logger.error(
      "UPDATE_PERSONAL_EXPENSE",
      "Error updating personal expense",
      updateError,
      { details: { userId, expenseId: id } },
    );
    throw updateError;
  }

  Logger.info(
    "UPDATE_PERSONAL_EXPENSE",
    "Personal expense updated successfully",
    {
      entityId: id,
      entityType: "expense",
      userId,
      details: { updatedFields: Object.keys(updates) },
    },
  );
  return result as Expense;
};

// Delete a personal expense
export const deletePersonalExpense = async (id: string, userId: string) => {
  const supabase = await createAdminClient();

  // Get the user's profile to get the profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (profileError || !profile) {
    Logger.error(
      "DELETE_PERSONAL_EXPENSE",
      "Error fetching user profile",
      profileError,
      { details: { userId, expenseId: id } },
    );
    throw profileError || new Error("User profile not found");
  }

  // Verify that the expense belongs to the user
  const { data: expense, error: fetchError } = await supabase
    .from("expenses")
    .select("id, user_id, org_id")
    .eq("id", id)
    .single();

  if (fetchError || !expense) {
    Logger.error(
      "DELETE_PERSONAL_EXPENSE",
      "Error fetching expense for deletion",
      fetchError,
      { details: { userId, expenseId: id } },
    );
    throw fetchError || new Error("Expense not found");
  }

  // Check if the expense belongs to the user (either personal or in their organization)
  const hasAccess =
    expense.user_id === profile.id ||
    (expense.org_id && (await userHasOrgAccess(expense.org_id, profile.id)));

  if (!hasAccess) {
    const error = new Error(
      "Unauthorized: You do not have access to this expense",
    );
    Logger.error(
      "DELETE_PERSONAL_EXPENSE",
      "Unauthorized access attempt",
      error,
      { details: { userId, expenseId: id } },
    );
    throw error;
  }

  const { error: deleteError } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id);

  if (deleteError) {
    Logger.error(
      "DELETE_PERSONAL_EXPENSE",
      "Error deleting personal expense",
      deleteError,
      { details: { userId, expenseId: id } },
    );
    throw deleteError;
  }

  Logger.info(
    "DELETE_PERSONAL_EXPENSE",
    "Personal expense deleted successfully",
    {
      entityId: id,
      entityType: "expense",
      userId,
    },
  );
  return { success: true };
};

// Helper function to check if user has access to an organization
const userHasOrgAccess = async (
  orgId: string,
  userId: string,
): Promise<boolean> => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("org_members")
    .select("id")
    .eq("org_id", orgId)
    .eq("user_id", (await getUserProfileId(userId)) || "")
    .single();

  return !error && !!data;
};

// Helper function to get user profile ID
const getUserProfileId = async (userId: string): Promise<string | null> => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
};
