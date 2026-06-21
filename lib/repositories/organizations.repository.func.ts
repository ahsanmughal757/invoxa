"use server";

import { getSupabaseClient } from "./base.repository";
import { Organization } from "@/types/invoice";

export const getOrganizationById = async (id: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    // For empty states, return null instead of throwing
    if (error.code === "PGRST116" || error.message.includes("Row not found")) {
      return null; // Return null for empty state instead of throwing error
    }
    throw error; // Re-throw other errors (auth/validation/system)
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as Organization));
}

export async function updateOrganization(id: string, orgData: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("organizations")
    .update(orgData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as Organization));
}

export async function createOrganization(orgData: any) {
  const supabase = await getSupabaseClient();

  console.log("Creating organization with data:", orgData);

  const { data, error } = await supabase
    .from("organizations")
    .insert(orgData)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data));
}

export const getOrganizationsByOwnerId = async (
  ownerUserId: string | null | undefined) => {
    const supabase = await getSupabaseClient();

    if (!ownerUserId) {
      return null;
    }

    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("owner_clerk_id", ownerUserId)
      .order("created_at", { ascending: false });

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    // Ensure the returned data is a plain object
    return data ? JSON.parse(JSON.stringify(data)) : null;
  }

export const getMemberAssociatedOrganization = async (
  ownerUserId: string) => {
    const supabase = await getSupabaseClient();

    if (!ownerUserId) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("clerk_user_id", ownerUserId)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (!profile) {
      return [];
    }

    const { data, error } = await supabase
      .from("org_members")
      .select(
        `
      *,
      organization:organizations(*)
    `,
      )
      .eq("user_id", profile?.id);

    if (error) {
      throw error;
    }

    // Ensure the returned data is a plain object
    return JSON.parse(JSON.stringify(data as Organization[]));
  }

export const getProfileByUserId = async (userId: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data));
}
