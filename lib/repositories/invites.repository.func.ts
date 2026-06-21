"use server";

import { getSupabaseClient } from "./base.repository";

export async function createInvite(inviteData: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("organization_invites")
    .insert(inviteData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data));
}

export async function getInviteByToken(token: string) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("organization_invites")
    .select('*, organization:organizations(id, name, owner_user_id), inviter_profile:profiles!organization_invites_inviter_id_fkey(id, name, email)')
    .eq("token", token)
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

export const getInviteById = async (id: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("organization_invites")
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

export async function updateInvite(id: string, updates: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("organization_invites")
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

export async function deleteInvite(id: string) {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.from("organization_invites").delete().eq("id", id);

  if (error) {
    throw error;
  }

  return { success: true };
}

export const getInvitesByOrganizationId = async (organizationId: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("organization_invites")
    .select("*")
    .eq("organization_id", organizationId);

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

export const getInvitesByUserId = async (userId: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("organization_invites")
    .select("*")
    .eq("inviter_id", userId);

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

export async function getReceivedInvitesByEmail(email: string) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("organization_invites")
    .select("*")
    .eq("email", email)
    .neq("status", "accepted"); // Only get non-accepted invites

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