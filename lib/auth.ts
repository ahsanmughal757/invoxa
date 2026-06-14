"use server"
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "./supabase/server";

export async function getSupabaseUser() {
  const { userId } = await auth();
  const supabase = await createAdminClient();
  if (!userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  return data;
}
