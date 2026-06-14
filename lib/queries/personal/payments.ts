"use server";

import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { PaymentRecord } from "@/types/invoice";
import { Logger } from "@/lib/utils/logger";

// Get personal payments for a user (both organization and personal payments)
export const getPersonalPayments = cache(async (userId: string) => {
  const supabase = await createAdminClient();

  // First get the user's profile to get the profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (profileError || !profile) {
    Logger.error(
      "GET_PERSONAL_PAYMENTS",
      "Error fetching user profile",
      profileError,
      { userId },
    );
    throw profileError || new Error("User profile not found");
  }

  // Get the organizations the user is a member of
  const { data: orgMemberships, error: orgError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", profile.id);

  if (orgError) {
    Logger.error(
      "GET_PERSONAL_PAYMENTS",
      "Error fetching user organization memberships",
      orgError,
      { userId },
    );
    throw orgError;
  }

  const orgIds = orgMemberships.map((member) => member.org_id);

  // Get payments for invoices in the user's organizations
  let orgPayments: any[] = [];
  if (orgIds.length > 0) {
    const { data: invoiceIdsResult, error: invoiceIdsError } = await supabase
      .from("invoices")
      .select("id")
      .in("org_id", orgIds);

    if (invoiceIdsError) {
      Logger.error(
        "GET_PERSONAL_PAYMENTS",
        "Error fetching invoice IDs for organization",
        invoiceIdsError,
        { userId },
      );
      throw invoiceIdsError;
    }

    const invoiceIds = invoiceIdsResult.map((inv) => inv.id);

    if (invoiceIds.length > 0) {
      const { data: orgPaymentsResult, error: orgPaymentsError } =
        await supabase
          .from("payments")
          .select("*")
          .in("invoice_id", invoiceIds)
          .order("created_at", { ascending: false });

      if (orgPaymentsError) {
        Logger.error(
          "GET_PERSONAL_PAYMENTS",
          "Error fetching organization payments",
          orgPaymentsError,
          { userId },
        );
        throw orgPaymentsError;
      }

      orgPayments = orgPaymentsResult;
    }
  }

  // Also get personal payments (if any exist)
  const { data: personalPayments, error: personalPaymentsError } =
    await supabase
      .from("payments")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

  if (personalPaymentsError) {
    Logger.warn("GET_PERSONAL_PAYMENTS", "Error fetching personal payments", {
      details: {
        error: personalPaymentsError,
      },
    });
    // Continue with just organization payments
  }

  // Combine both organization and personal payments
  const allPayments = [...orgPayments, ...(personalPayments || [])];

  // Sort combined results by created_at descending
  allPayments.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  Logger.info(
    "GET_PERSONAL_PAYMENTS",
    "Personal payments fetched successfully",
    {
      userId,
      entityType: "personal_payments",
      details: { count: allPayments.length },
    },
  );
  return allPayments as PaymentRecord[];
});

// Create a personal payment for a user
export const createPersonalPayment = async (
  paymentData: Partial<Omit<PaymentRecord, "id">>,
  userId: string,
) => {
  const supabase = await createAdminClient();

  // Get the user's profile to get the profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (profileError || !profile) {
    Logger.error(
      "CREATE_PERSONAL_PAYMENT",
      "Error fetching user profile",
      profileError,
      { userId },
    );
    throw profileError || new Error("User profile not found");
  }

  // Verify that the invoice belongs to the user's organization
  if (paymentData.invoice_id) {
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("org_id")
      .eq("id", paymentData.invoice_id)
      .single();

    if (invoiceError || !invoice) {
      Logger.error(
        "CREATE_PERSONAL_PAYMENT",
        "Error fetching invoice for payment",
        invoiceError,
        {
          details: {
            userId,
            invoiceId: paymentData.invoice_id,
          },
        },
      );
      throw invoiceError || new Error("Invoice not found");
    }

    // Check if user has access to this invoice (belongs to their organization)
    if (invoice.org_id) {
      const hasAccess = await userHasOrgAccess(invoice.org_id, profile.id);
      if (!hasAccess) {
        const error = new Error(
          "Unauthorized: You do not have access to this invoice",
        );
        Logger.error(
          "CREATE_PERSONAL_PAYMENT",
          "Unauthorized access attempt",
          error,
          {
            details: {
              userId,
              invoiceId: paymentData.invoice_id,
            },
          },
        );
        throw error;
      }
    }
  }

  const { data, error } = await supabase
    .from("payments")
    .insert([{ ...paymentData, user_id: profile.id }])
    .select()
    .single();

  if (error) {
    Logger.error(
      "CREATE_PERSONAL_PAYMENT",
      "Error creating personal payment",
      error,
      { userId },
    );
    throw error;
  }

  Logger.info(
    "CREATE_PERSONAL_PAYMENT",
    "Personal payment created successfully",
    {
      entityId: data.id,
      entityType: "payment",
      userId,
      details: {
        amount: data.amount,
        method: data.method,
      },
    },
  );
  return data as PaymentRecord;
};

// Update a personal payment
export const updatePersonalPayment = async (
  id: string,
  updates: Partial<PaymentRecord>,
  userId: string,
) => {
  const supabase = await createAdminClient();

  // Get the user's profile to get the profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (profileError || !profile) {
    Logger.error(
      "UPDATE_PERSONAL_PAYMENT",
      "Error fetching user profile",
      profileError,
      {
        details: {
          userId,
          paymentId: id,
        },
      },
    );
    throw profileError || new Error("User profile not found");
  }

  // Verify that the payment belongs to the user (through invoice)
  const { data: payment, error: fetchError } = await supabase
    .from("payments")
    .select(
      `
      id,
      invoice_id,
      invoices!invoice_id(org_id)
    `,
    )
    .eq("id", id)
    .single();

  if (fetchError || !payment) {
    Logger.error(
      "UPDATE_PERSONAL_PAYMENT",
      "Error fetching payment for update",
      fetchError,
      { userId, details: { paymentId: id } },
    );
    throw fetchError || new Error("Payment not found");
  }

  // Check if user has access to this payment (either personal or in their organization)
  const invoicesArray = Array.isArray(payment.invoices) ? payment.invoices : [payment.invoices];
  if (invoicesArray[0]?.org_id) {
    const hasAccess = await userHasOrgAccess(
      invoicesArray[0].org_id,
      profile.id,
    );
    if (!hasAccess) {
      const error = new Error(
        "Unauthorized: You do not have access to this payment",
      );
      Logger.error(
        "UPDATE_PERSONAL_PAYMENT",
        "Unauthorized access attempt",
        error,
        { details: { userId, paymentId: id } },
      );
      throw error;
    }
  }

  const { data: result, error: updateError } = await supabase
    .from("payments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    Logger.error(
      "UPDATE_PERSONAL_PAYMENT",
      "Error updating personal payment",
      updateError,
      { details: { userId, paymentId: id } },
    );
    throw updateError;
  }

  Logger.info(
    "UPDATE_PERSONAL_PAYMENT",
    "Personal payment updated successfully",
    {
      entityId: id,
      entityType: "payment",
      userId,
      details: { updatedFields: Object.keys(updates) },
    },
  );
  return result as PaymentRecord;
};

// Delete a personal payment
export const deletePersonalPayment = async (id: string, userId: string) => {
  const supabase = await createAdminClient();

  // Get the user's profile to get the profile ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (profileError || !profile) {
    Logger.error(
      "DELETE_PERSONAL_PAYMENT",
      "Error fetching user profile",
      profileError,
      { details: { userId, paymentId: id } },
    );
    throw profileError || new Error("User profile not found");
  }

  // Verify that the payment belongs to the user (through invoice)
  const { data: payment, error: fetchError } = await supabase
    .from("payments")
    .select(
      `
      id,
      invoice_id,
      invoices!invoice_id(org_id)
    `,
    )
    .eq("id", id)
    .single();

  if (fetchError || !payment) {
    Logger.error(
      "DELETE_PERSONAL_PAYMENT",
      "Error fetching payment for deletion",
      fetchError,
      { userId, details: { paymentId: id } },
    );
    throw fetchError || new Error("Payment not found");
  }

  // Check if user has access to this payment (either personal or in their organization)
  const invoicesArray = Array.isArray(payment.invoices) ? payment.invoices : [payment.invoices];
  if (invoicesArray[0]?.org_id) {
    const hasAccess = await userHasOrgAccess(
      invoicesArray[0].org_id,
      profile.id,
    );
    if (!hasAccess) {
      const error = new Error(
        "Unauthorized: You do not have access to this payment",
      );
      Logger.error(
        "DELETE_PERSONAL_PAYMENT",
        "Unauthorized access attempt",
        error,
        { details: { userId, paymentId: id } },
      );
      throw error;
    }
  }

  const { error: deleteError } = await supabase
    .from("payments")
    .delete()
    .eq("id", id);

  if (deleteError) {
    Logger.error(
      "DELETE_PERSONAL_PAYMENT",
      "Error deleting personal payment",
      deleteError,
      { details: { userId, paymentId: id } },
    );
    throw deleteError;
  }

  Logger.info(
    "DELETE_PERSONAL_PAYMENT",
    "Personal payment deleted successfully",
    {
      entityId: id,
      entityType: "payment",
      userId,
    },
  );
  return { success: true };
};

// Helper function to check if user has access to an organization
const userHasOrgAccess = async (
  orgId: string,
  profileId: string,
): Promise<boolean> => {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("org_members")
    .select("id")
    .eq("org_id", orgId)
    .eq("user_id", profileId)
    .single();

  return !error && !!data;
};
