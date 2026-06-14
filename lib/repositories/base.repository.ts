"use server";
import { createAdminClient } from "@/lib/supabase/server";

// Export a function that returns the Supabase client
export async function getSupabaseClient() {
  return await createAdminClient();
}