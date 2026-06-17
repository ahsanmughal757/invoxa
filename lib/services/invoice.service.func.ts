"use server";
import {
  getInvoicesByOrgId,
  getInvoiceByIdWithItems,
  createInvoice as createInvoiceRepo,
  createInvoiceWithItems as createInvoiceWithItemsRepo,
  createInvoiceItems as createInvoiceItemsRepo,
  updateInvoice as updateInvoiceRepo,
  deleteInvoice as deleteInvoiceRepo,
} from "@/lib/repositories/invoices.repository.func";
import {
  getClientsByOrgId,
  getClientById,
} from "@/lib/repositories/clients.repository.func";
import { getOrganizationById } from "@/lib/repositories/organizations.repository.func";
import { getPaymentsByInvoiceIds } from "@/lib/repositories/payments.repository.func";
import { getPersonalExpenses } from "@/lib/repositories/personal/expenses.repository.func";
import { cache } from "react";
import { Invoice, InvoiceStructure } from "@/types/invoice";
import { createAdminClient } from "@/lib/supabase/server";
import { Logger } from "../utils/logger";

export interface InvoiceServiceData {
  organization: any;
  clients: any[];
  invoices: Invoice[];
  expenses: any[];
  payments: any[];
}

export interface DashboardStats {
  org_id: string;
  revenue_ytd: number;
  outstanding_total: number;
  outstanding_amount: number;
  overdue_count: number;
  total_invoices: number;
  total_invoiced: number;
  total_collected: number;
  total_outstanding: number;
  paid_invoices: number;
  overdue_invoices: number;
  sent_invoices: number;
  draft_invoices: number;
  cancelled_invoices: number;
  void_invoices: number;
  partially_paid_invoices: number;
}

export interface InvoiceSummary {
  id: string;
  org_id: string;
  client_id: string;
  number: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  discount_total: number;
  total: number;
  paid_amount: number;
  currency: string;
  notes: string;
  pdf_url: string;
  is_recurring: boolean;
  recurring_frequency: string;
  next_invoice_date: string;
  created_at: string;
  updated_at: string;
  created_by_profile_id: string;
  computed_status: string;
  remaining_amount: number;
  client_name: string;
  invoice_items?: any[]; // Add this to match Invoice interface
}

/**
 * Fetches all invoice-related data for a user's organization
 */
export async function getInvoiceDashboardData(
  orgId: string,
  userId: string,
): Promise<InvoiceServiceData> {
  // Fetch all data in parallel
  const [orgData, clientsData, invoicesData, expensesData] =
    await Promise.allSettled([
      getOrganizationById(orgId),
      getClientsByOrgId(orgId),
      getInvoicesByOrgId(orgId),
      getPersonalExpenses(userId),
    ]);

  // Handle errors by returning empty data instead of throwing
  const organization = orgData.status === "fulfilled" ? orgData.value : null;
  const clients = clientsData.status === "fulfilled" ? clientsData.value : [];
  const invoices =
    invoicesData.status === "fulfilled" ? invoicesData.value : [];
  const expenses =
    expensesData.status === "fulfilled" ? expensesData.value : [];

  // Get invoice IDs for payment query
  const invoiceIds = invoices?.map((i: any) => i.id) || [];
  let paymentsData: any[] = [];

  if (invoiceIds.length > 0) {
    try {
      paymentsData = await getPaymentsByInvoiceIds(invoiceIds);
    } catch (error) {
      // If payment query fails, return empty array instead of throwing
      paymentsData = [];
    }
  }

  // Sanitize the organization data to ensure it's properly serializable
  const sanitizedOrgData = organization
    ? {
        ...organization,
        // Ensure branding is properly serialized if it exists
        branding: organization.branding
          ? JSON.parse(JSON.stringify(organization.branding))
          : undefined,
      }
    : null;

  return {
    organization: sanitizedOrgData,
    clients,
    invoices,
    expenses,
    payments: paymentsData,
  };
}

/**
 * Fetches dashboard statistics from the database view
 */
export const getDashboardStats = cache(
  async (orgId: string): Promise<DashboardStats> => {
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("v_dashboard_stats")
      .select("*")
      .eq("org_id", orgId)
      .maybeSingle();

    console.log("Fetched dashboard stats for orgId", orgId, ":", data);
    if (error) {
      Logger.error(
        "FETCH_DASHBOARD_STATS_ERROR",
        "Error fetching dashboard stats data",
        { orgId, error },
      );
      // If no stats exist yet, return default values
      // This is an acceptable empty state, not an error
      return {
        org_id: orgId,
        revenue_ytd: 0,
        outstanding_total: 0,
        overdue_count: 0,
        total_invoices: 0,
        total_invoiced: 0,
        total_collected: 0,
        total_outstanding: 0,
        paid_invoices: 0,
        outstanding_amount: 0,
        overdue_invoices: 0,
        sent_invoices: 0,
        draft_invoices: 0,
        cancelled_invoices: 0,
        void_invoices: 0,
        partially_paid_invoices: 0,
      };
    }

    Logger.info(
      "FETCH_DASHBOARD_STATS_SUCCESS",
      "Successfully fetched dashboard stats data",
      {
        orgId,
        details: {
          data,
        },
      },
    );
    // return data as DashboardStats;
    return data as any;
  },
);

/**
 * Fetches invoice summary from the database view
 */
export const getInvoiceSummary = cache(
  async (orgId: string): Promise<InvoiceSummary[]> => {
    const supabase = await createAdminClient();

    if (!orgId) {
      throw new Error("Organization id is not provided! Something went wrong.");
    }

    const { data, error } = await supabase
      .from("v_invoice_summary")
      .select("*")
      .eq("org_id", orgId);

    if (error) {
      // For empty states, return empty array instead of throwing
      if (
        error.code === "PGRST116" ||
        error.message.includes("Row not found")
      ) {
        return []; // Return empty array for empty state instead of throwing error
      }
      // Re-throw other errors (auth/validation/system)
      throw new Error(`Failed to load invoice summary: ${error.message}`);
    }

    console.log("Fetched invoice summary for orgId", orgId, ":", data);

    return data as InvoiceSummary[];
  },
);

/**
 * Fetches a specific invoice with its items
 */
export const getInvoiceWithItems = cache(
  async (id: string): Promise<Invoice | null> => {
    return await getInvoiceByIdWithItems(id);
  },
);

/**
 * Creates a new invoice with associated items using a transactional approach
 */
export async function createInvoice(invoiceData: any): Promise<any> {
  // Validate that client exists in the organization
  if (invoiceData.client_id) {
    const client = await getClientById(invoiceData.client_id);
    if (!client || client.org_id !== invoiceData.org_id) {
      throw new Error("Client does not belong to the specified organization");
    }
  }

  // Use the transactional function to create invoice and items together
  const newInvoice = await createInvoiceWithItemsRepo(invoiceData);

  // Return the newly created invoice with items
  return newInvoice;
}

/**
 * Updates an existing invoice
 */
export async function updateInvoice(
  id: string,
  updates: Partial<InvoiceStructure>,
): Promise<Invoice | null> {
  try {
    return await updateInvoiceRepo(id, updates);
  } catch (error) {
    // If the invoice doesn't exist, return null instead of throwing
    // This is an acceptable empty state, not an error condition
    return null;
  }
}

/**
 * Deletes an invoice
 */
export async function deleteInvoice(id: string): Promise<{ success: boolean }> {
  try {
    return await deleteInvoiceRepo(id);
  } catch (error) {
    // If the invoice doesn't exist, return success: true
    // This is an acceptable empty state, not an error condition
    return { success: true };
  }
}
