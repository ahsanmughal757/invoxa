'use server';
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { PaymentRecord, Invoice } from "@/types/invoice";
import { Logger } from "@/lib/utils/logger";
import { logPaymentActivity } from "@/lib/utils/activity-logger";

// Get payments by invoice IDs
export const getPaymentsByInvoiceIds = cache(async (invoiceIds: string[]) => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .in("invoice_id", invoiceIds);

  if (error) {
    Logger.error("GET_PAYMENTS", "Error fetching payments", error, {
      details: { invoiceIds },
    });
    throw error;
  }

  Logger.info("GET_PAYMENTS", "Payments fetched successfully", {
    entityType: "payments",
    details: {
      count: data.length,
      invoiceIds,
    },
  });
  return data as PaymentRecord[];
});

// Get payments for a client based on their Clerk user ID
export const getClientPayments = cache(async (userId: string) => {
  const supabase = await createAdminClient();

  // Get profile matching clerk's userId
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_id", userId)
    .single();

  if (profileError) {
    Logger.error("GET_CLIENT_PAYMENTS", "Error fetching profile", profileError, {
      details: { userId },
    });
    throw profileError;
  }

  // Fetch payments where the associated invoice's client_id matches the profile
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("*")
    .eq("client_id", profile.id);

  if (paymentsError) {
    Logger.error("GET_CLIENT_PAYMENTS", "Error fetching payments", paymentsError, {
      details: { profileId: profile.id },
    });
    throw paymentsError;
  }

  Logger.info("GET_CLIENT_PAYMENTS", "Client payments fetched successfully", {
    entityType: "payments",
    details: {
      count: payments.length,
      profileId: profile.id,
    },
  });

  return payments as PaymentRecord[];
});


// Record payment
export const recordPayment = async (
  paymentData: Partial<Omit<PaymentRecord, "id">>,
  userId: string,
) => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("payments")
    .insert([paymentData])
    .select()
    .single();

  if (error) {
    Logger.error("RECORD_PAYMENT", "Error recording payment", error, {
      details: { invoiceId: paymentData.invoice_id },
    });
    throw error;
  }

  // Get the invoice to get the org_id for activity logging
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("org_id")
    .eq("id", data.invoice_id)
    .single();

  if (invoiceError) {
    Logger.error(
      "GET_INVOICE_FOR_PAYMENT",
      "Error fetching invoice for payment activity logging",
      invoiceError,
      {
        entityId: data.invoice_id,
        details: { paymentId: data.id },
      },
    );
    // Don't throw here, continue with payment recording
  }

  // Re-fetch the updated invoice to get the new paid_amount and status
  // as the database trigger should have updated it.
  const { data: updatedInvoice, error: invoiceFetchError } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", data.invoice_id)
    .single();

  if (invoiceFetchError) {
    Logger.error(
      "RECORD_PAYMENT",
      "Error re-fetching updated invoice after payment",
      invoiceFetchError,
      {
        entityId: data.invoice_id,
        details: { paymentId: data.id },
      },
    );
    throw invoiceFetchError;
  }

  // Log the activity
  if (invoice) {
    try {
      await logPaymentActivity(invoice.org_id, userId, data.id, "created", {
        amount: data.amount,
        method: data.method,
        invoice_id: data.invoice_id,
        received_on: data.received_on,
      });
    } catch (activityError) {
      // Don't throw if activity logging fails, just log the error
      Logger.error(
        "RECORD_PAYMENT_ACTIVITY",
        "Error logging payment creation activity",
        activityError,
        {
          details: {
            orgId: invoice.org_id,
            userId,
            paymentId: data.id,
          },
        },
      );
    }
  }

  Logger.info("RECORD_PAYMENT", "Payment recorded successfully", {
    entityId: data.id,
    entityType: "payment",
    details: {
      invoiceId: data.invoice_id,
      amount: data.amount,
      method: data.method,
      updatedInvoiceStatus: updatedInvoice.status,
    },
  });

  return { payment: data as PaymentRecord, invoice: updatedInvoice as Invoice };
};
