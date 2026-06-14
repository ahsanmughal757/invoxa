import { getSupabaseClient } from "../base.repository";
import { Expense } from "@/types/invoice";

async function userHasOrgAccessFunc(orgId: string, userId: string): Promise<boolean> {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("org_members")
    .select("id")
    .eq("org_id", orgId)
    .eq("user_id", await getUserProfileIdFunc(userId) || "")
    .single();

  return !error && !!data;
}

async function getUserProfileIdFunc(userId: string): Promise<string | null> {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data.id;
}

export async function getPersonalExpenses(userId: string) {
  const supabase = await getSupabaseClient();

  // First get the user's profile to get the profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (profileError || !profile) {
    throw profileError || new Error("User profile not found");
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .or(`org_id.is.null,user_id.eq.${profile.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as Expense[]));
}

export async function createPersonalExpense(expenseData: any, userId: string) {
  const supabase = await getSupabaseClient();

  // Get the user's profile to get the profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (profileError || !profile) {
    throw profileError || new Error("User profile not found");
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert([{ ...expenseData, user_id: profile.id }])
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as Expense));
}

export async function updatePersonalExpense(id: string, updates: any, userId: string) {
  const supabase = await getSupabaseClient();

  // Get the user's profile to get the profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (profileError || !profile) {
    throw profileError || new Error("User profile not found");
  }

  // Verify that the expense belongs to the user
  const { data: expense, error: fetchError } = await supabase
    .from("expenses")
    .select("id, user_id, org_id")
    .eq("id", id)
    .single();

  if (fetchError || !expense) {
    throw fetchError || new Error("Expense not found");
  }

  // Check if the expense belongs to the user (either personal or in their organization)
  const hasAccess =
    expense.user_id === profile.id ||
    (expense.org_id && await userHasOrgAccessFunc(expense.org_id, profile.id));

  if (!hasAccess) {
    throw new Error("Unauthorized: You do not have access to this expense");
  }

  const { data: result, error: updateError } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    throw updateError;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(result as Expense));
}

export async function deletePersonalExpense(id: string, userId: string) {
  const supabase = await getSupabaseClient();

  // Get the user's profile to get the profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (profileError || !profile) {
    throw profileError || new Error("User profile not found");
  }

  // Verify that the expense belongs to the user
  const { data: expense, error: fetchError } = await supabase
    .from("expenses")
    .select("id, user_id, org_id")
    .eq("id", id)
    .single();

  if (fetchError || !expense) {
    throw fetchError || new Error("Expense not found");
  }

  // Check if the expense belongs to the user (either personal or in their organization)
  const hasAccess =
    expense.user_id === profile.id ||
    (expense.org_id && await userHasOrgAccessFunc(expense.org_id, profile.id));

  if (!hasAccess) {
    throw new Error("Unauthorized: You do not have access to this expense");
  }

  const { error: deleteError } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id);

  if (deleteError) {
    throw deleteError;
  }

  return { success: true };
}