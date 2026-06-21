"use server";

import { getSupabaseClient } from "./base.repository";

export async function createNotification(notificationData: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("notifications")
    .insert(notificationData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data));
}

export const getNotificationsByUserId = async (userId: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data));
}

export async function updateNotification(id: string, updates: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("notifications")
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

export async function deleteNotification(id: string) {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.from("notifications").delete().eq("id", id);

  if (error) {
    throw error;
  }

  return { success: true };
}

export async function markNotificationAsRead(notificationId: string, recipientUserId: string) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("is_read", false)
    .eq("recipient_user_id", recipientUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('Row not found')) {
      return null; // Return null for empty state instead of throwing error
    }
    throw error; // Re-throw other errors
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data));
}

export async function markAllNotificationsAsRead(recipientUserId: string) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_user_id", recipientUserId)
    .eq("is_read", false);

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data));
}