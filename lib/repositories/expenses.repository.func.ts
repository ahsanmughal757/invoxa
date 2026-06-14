"use server";

import { cache } from "react";
import { getSupabaseClient } from "./base.repository";
import { Expense } from "@/types/invoice";

export const getExpensesByOrgId = cache(async (orgId: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("org_id", orgId);

  if (error) {
    // For empty states, return empty array instead of throwing
    if (error.code === 'PGRST116' || error.message.includes('Row not found')) {
      return []; // Return empty array for empty state instead of throwing error
    }
    throw error; // Re-throw other errors (auth/validation/system)
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as Expense[]));
});

export const getExpenseById = cache(async (id: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    // For empty states, return null instead of throwing
    if (error.code === 'PGRST116' || error.message.includes('Row not found')) {
      return null; // Return null for empty state instead of throwing error
    }
    throw error; // Re-throw other errors (auth/validation/system)
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as Expense));
});

export async function createExpense(expenseData: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("expenses")
    .insert(expenseData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as Expense));
}

export async function updateExpense(id: string, updates: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as Expense));
}

export async function deleteExpense(id: string) {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    throw error;
  }

  return { success: true };
}