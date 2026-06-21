"use server";

import { getClientsByOrgId } from "@/lib/queries/clients";
import { getInvoicesByOrgId } from "@/lib/queries/invoices";
import { getPaymentsByInvoiceIds } from "@/lib/queries/payments";
import { Client, Invoice, PaymentRecord } from "@/types/invoice";

export interface ClientProfileData {
  client: Client;
  invoices: Invoice[];
  payments: PaymentRecord[];
}

export const getClientProfileData = async (
  orgId: string, clientId: string): Promise<ClientProfileData> => {
    // Get all clients for the organization
    const clients = await getClientsByOrgId(orgId);
    const client = clients.find((c) => c.id === clientId);

    if (!client) {
      throw new Error("Client not found");
    }

    // Get all invoices for the organization
    const allInvoices = await getInvoicesByOrgId(orgId);
    const clientInvoices = allInvoices.filter(
      (inv) => inv.client_id === clientId,
    );

    // Get all payments for the client's invoices
    const invoiceIds = clientInvoices.map((inv) => inv.id);
    const payments =
      invoiceIds.length > 0 ? await getPaymentsByInvoiceIds(invoiceIds) : [];

    return {
      client,
      invoices: clientInvoices,
      payments,
    };
  }
