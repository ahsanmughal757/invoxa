"use server";

import {
  createInvoice as createInvoiceFunc,
  updateInvoice as updateInvoiceFunc,
  deleteInvoice as deleteInvoiceFunc,
} from "@/lib/services/invoice.service.func";
import { processPayment as processPaymentFunc } from "@/lib/services/payment.service.func";

export async function createInvoice(formData: FormData) {
  try {
    const invoiceData = Object.fromEntries(formData.entries());

    // Convert form data to proper types
    const processedData = {
      ...invoiceData,
      org_id: invoiceData.org_id as string,
      client_id: invoiceData.client_id as string,
      status: invoiceData.status as string,
      issue_date: invoiceData.issue_date as string,
      due_date: invoiceData.due_date as string,
      invoice_items: invoiceData.invoice_items
        ? JSON.parse(invoiceData.invoice_items as string)
        : [],
    };

    const result = await createInvoiceFunc(processedData);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating invoice:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create invoice",
    };
  }
}

export async function updateInvoice(id: string, formData: FormData) {
  try {
    const updates = Object.fromEntries(formData.entries());

    // Process the form data appropriately
    const processedUpdates = {
      ...updates,
      status: updates.status as "draft" | "sent" | "paid" | "overdue" | "void" | "cancelled" | "partially_paid",
      issue_date: updates.issue_date as string,
      due_date: updates.due_date as string,
      invoice_items: updates.invoice_items
        ? JSON.parse(updates.invoice_items as string)
        : undefined,
    };

    const result = await updateInvoiceFunc(id, processedUpdates);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating invoice:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update invoice",
    };
  }
}

export async function deleteInvoice(id: string) {
  try {
    const result = await deleteInvoiceFunc(id);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete invoice",
    };
  }
}

export async function createInvoicePayment(formData: FormData) {
  try {
    const paymentData = Object.fromEntries(formData.entries());

    const processedData = {
      ...paymentData,
      invoice_id: paymentData.invoice_id as string,
      org_id: paymentData.org_id as string,
      amount: parseFloat(paymentData.amount as string),
      payment_method: paymentData.payment_method as string,
      notes: paymentData.notes as string,
    };

    const result = await processPaymentFunc(processedData);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error creating payment:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create payment",
    };
  }
}

// Additional invoice-related actions
export async function updateInvoiceStatus(id: string, status: "draft" | "sent" | "paid" | "overdue" | "void" | "cancelled" | "partially_paid") {
  try {
    const result = await updateInvoiceFunc(id, { status });
    return { success: true, data: result };
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update invoice status",
    };
  }
}
