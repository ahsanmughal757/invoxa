"use server";

import { getSupabaseClient } from "./base.repository";
import { Client } from "@/types/invoice";

export const getClientsByOrgId = async (orgId: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("org_id", orgId);

  if (error) {
    // For empty states, return empty array instead of throwing
    if (error.code === "PGRST116" || error.message.includes("Row not found")) {
      return []; // Return empty array for empty state instead of throwing error
    }
    throw error; // Re-throw other errors (auth/validation/system)
  }

  // const serializedData = convertToSerializableObject(data);
  // console.log("-----------Fetched clients for orgId", orgId, ":", data);
  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as Client[]));
}

export const getClientById = async (id: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  // If no client is found, Supabase returns an error with code 'PGRST116'
  // We treat this as an empty state rather than an error
  if (error) {
    if (error.code === "PGRST116" || error.message.includes("Row not found")) {
      return null; // Return null for empty state instead of throwing error
    }
    throw error; // Re-throw other errors
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as Client));
}

export async function createClient(clientData: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("clients")
    .insert(clientData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return data;
}

export async function updateClient(id: string, updates: Partial<Client>) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as Client));
}

export async function deleteClient(id: string) {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    throw error;
  }

  return { success: true };
}
