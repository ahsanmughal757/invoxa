"use server";

import { cache } from "react";
import { getSupabaseClient } from "./base.repository";
import { PaymentRecord } from "@/types/invoice";

export const getPaymentsByInvoiceIds = cache(async (invoiceIds: string[]) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .in("invoice_id", invoiceIds);

  if (error) {
    // For empty states, return empty array instead of throwing
    if (error.code === 'PGRST116' || error.message.includes('Row not found')) {
      return []; // Return empty array for empty state instead of throwing error
    }
    throw error; // Re-throw other errors (auth/validation/system)
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as PaymentRecord[]));
});

export const getPaymentsByOrgId = cache(async (orgId: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("payments")
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
  return JSON.parse(JSON.stringify(data as PaymentRecord[]));
});

export async function createPayment(paymentData: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("payments")
    .insert(paymentData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as PaymentRecord));
}

export async function updatePayment(id: string, updates: any) {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("payments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as PaymentRecord));
}

export async function deletePayment(id: string) {
  const supabase = await getSupabaseClient();

  const { error } = await supabase.from("payments").delete().eq("id", id);

  if (error) {
    throw error;
  }

  return { success: true };
}

export const getPaymentById = cache(async (id: string) => {
  const supabase = await getSupabaseClient();

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.message.includes('Row not found')) {
      return null; // Return null for empty state instead of throwing error
    }
    throw error; // Re-throw other errors
  }

  // Ensure the returned data is a plain object
  return JSON.parse(JSON.stringify(data as PaymentRecord));
});