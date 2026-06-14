'use server';

import { createPayment as createPaymentFunc, updatePayment as updatePaymentFunc, deletePaymentFunc, processPayment as processPaymentFunc } from '@/lib/services/payment.service.func';

export async function createPayment(formData: FormData) {
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

    const result = await createPaymentFunc(processedData);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating payment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create payment' };
  }
}

export async function updatePayment(id: string, formData: FormData) {
  try {
    const updates = Object.fromEntries(formData.entries());

    const processedUpdates = {
      ...updates,
      amount: updates.amount ? parseFloat(updates.amount as string) : undefined,
      payment_method: updates.payment_method as string,
      notes: updates.notes as string,
    };

    const result = await updatePaymentFunc(id, processedUpdates);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error updating payment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update payment' };
  }
}

export async function deletePayment(id: string) {
  try {
    const result = await deletePaymentFunc(id);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error deleting payment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete payment' };
  }
}

export async function processPayment(formData: FormData) {
  try {
    const paymentData = Object.fromEntries(formData.entries());

    const processedData = {
      ...paymentData,
      invoice_id: paymentData.invoice_id as string,
      org_id: paymentData.org_id as string,
      amount: parseFloat(paymentData.amount as string),
    };

    const result = await processPaymentFunc(processedData);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error processing payment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to process payment' };
  }
}

// Additional payment-related actions
export async function recordPayment(formData: FormData) {
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
    console.error('Error recording payment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to record payment' };
  }
}