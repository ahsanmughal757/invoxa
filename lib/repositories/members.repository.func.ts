"use server";

import { getSupabaseClient } from "./base.repository";

export const getMembersByOrgId = async (orgId: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("org_members")
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
  return JSON.parse(JSON.stringify(data));
}

export const getMemberById = async (id: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("org_members")
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
  return JSON.parse(JSON.stringify(data));
}

export async function createMember(memberData: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("org_members")
    .insert(memberData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data));
}

export async function updateMember(id: string, updates: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("org_members")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data));
}

export async function deleteMember(id: string) {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.from("org_members").delete().eq("id", id);

  if (error) {
    throw error;
  }

  return { success: true };
}

export const getMemberByOrgAndUserId = async (orgId: string, userId: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("org_members")
    .select("*")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data));
}