"use server";

import { getSupabaseClient } from "./base.repository";
import { Logger } from "../utils/logger";

export const getUserById = async (id: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116" || error.message.includes("Row not found")) {
      Logger.error("GET_USER_BY_ID", "No user found!", error);
      return null; // Return null for empty state instead of throwing error
    }
    Logger.error("GET_USER_BY_ID", "Error occured finding user.", error);
    return null;
    // throw error; // Re-throw other errors
  }

  // Ensure the returned data is a plain object
  Logger.info("GET_USER_BY_ID", `User fetched id: ${id}`);
  return data;
}

export const getUserByClerkId = async (clerkId: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", clerkId)
    .maybeSingle();

  if (error) {
    // For empty states, return null instead of throwing
    if (error.code === "PGRST116" || error.message.includes("Row not found")) {
      Logger.error("GET_USER_BY_CLERK_ID", "No user found!", error);
      return null; // Return null for empty state instead of throwing error
    }
    Logger.error("GET_USER_BY_CLERK_ID", "Error occured finding user.", error);
    throw error; // Re-throw other errors (auth/validation/system)
  }

  // Ensure the returned data is a plain object
  Logger.info("GET_USER_BY_CLERK_ID", `User fetched clerk id : ${clerkId}.`);
  return data;
}

export async function getUserByEmail(email: string) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      // PGRST116: Row not found
      Logger.error("GET_USER_BY_EMAIL", "No user found", error);
      return null;
    }

    Logger.error("GET_USER_BY_EMAIL", "Error finding user!", error);
    return null;
  }

  // Ensure the returned data is a plain object
  Logger.info("GET_USER_BY_EMAIL", `User fetched by email : ${email}.`);
  return data;
}

export async function getUsersByEmails(emails: string[]) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("email", emails);

  if (error) {
    // For empty states, return empty array instead of throwing
    if (error.code === "PGRST116" || error.message.includes("Row not found")) {
      Logger.error("GET_USER_BY_EMAILS", "Error users found!", error);
      return []; // Return empty array for empty state instead of throwing error
    }

    Logger.error("GET_USER_BY_EMAILS", "Error finding users!", error);
    return [];
    throw error; // Re-throw other errors (auth/validation/system)
  }

  // Ensure the returned data is a plain object
  Logger.info(
    "GET_USER_BY_EMAILS",
    `Users fetched by emails : ${JSON.stringify(emails)}.`,
  );
  return data;
}

export async function getUsersByIds(ids: string[]) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("id", ids);

  if (error) {
    // For empty states, return empty array instead of throwing
    if (error.code === "PGRST116" || error.message.includes("Row not found")) {
      Logger.error("GET_USERS_BY_IDS", "No users found!", error);
      return []; // Return empty array for empty state instead of throwing error
    }
    Logger.error("GET_USERS_BY_IDS", "Error finding users!", error);
    return [];
    // throw error; // Re-throw other errors (auth/validation/system)
  }

  // Ensure the returned data is a plain object
  Logger.info(
    "GET_USER_BY_EMAILS",
    `Users fetched by ids : ${JSON.stringify(ids)}`,
  );
  return data;
}

export async function createUser(userData: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .insert(userData)
    .select("id")
    .single();

  if (error) {
    Logger.error("CREATE_USER", "Error creating user profile!", error);
    return null;
  }

  // Ensure the returned data is a plain object
  Logger.info("CREATE_USER", `User created with id : ${data.id}`);
  return data;
}

export async function updateUser(id: string, updates: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    Logger.error("UPDATE_USER", "Error updating user profile!", error);
    return null;
  }

  // Ensure the returned data is a plain object
  Logger.info("UPDATE_USER", `User updated with id : ${data.id}`);
  return data;
}

export async function deleteUser(id: string) {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.from("profiles").delete().eq("id", id);

  if (error) {
    Logger.error("DELETE_USER", "Error deleting user profile!", error);
    return false;
  }
  Logger.info("DELETE_USER", `User deleted with id : ${id}`);
  return true;
}
