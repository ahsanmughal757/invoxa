"use client";

import { getClientsByOrgId } from "@/lib/repositories/clients.repository.func";
import {
  handleAsyncOperation,
  isEmptyState,
  isError,
} from "@/lib/utils/error-handler";
import { Client, PaymentRecord } from "@/types/invoice";
import { createContext, useContext, useEffect, useState } from "react";
import { useSelectedOrganization } from "./use-selected-org";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { useInvoices } from "./use-invoices";
import { useOrganization } from "./use-organization";
import { getPaymentsByOrgId } from "@/lib/services/payment.service.func";
import { getPaymentsByInvoiceIds } from "@/lib/queries/payments";

const PaymentContext = createContext<{
  payments: PaymentRecord[];
  setPayments: (payments: PaymentRecord[] | []) => void;
  // Loading state flags
  isLoading: boolean;
  isEmpty: boolean;
  isError: boolean;
  errorMessage: string | null;
  isReady: boolean;
  recordPayment: (paymentData: Partial<Omit<PaymentRecord, "id">>) => void;
  updatePayment: (id: string, updates: Partial<PaymentRecord>) => void;
  deletePayment: (id: string) => void;
} | null>(null);

export const PaymentsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { userId } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[] | []>([]);
  const { selectedOrganization, isEmpty: orgIsEmpty, isLoading: orgIsLoading } = useOrganization();
  const { invoices, setInvoices } = useInvoices();

  // Loading state flags
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      if (invoices && invoices.length > 0) {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage(null);

        const invoiceIds = invoices.map((inv) => inv.id);
        const paymentsData = await fetchPayments(invoiceIds);

        const data = paymentsData || [];
        setPayments(data);
        setIsLoading(false);
        setIsEmpty(data.length === 0);
        setIsReady(data.length > 0);
      } else if (selectedOrganization && invoices && invoices.length === 0) {
        // Org selected but no invoices means no payments either
        setPayments([]);
        setIsLoading(false);
        setIsEmpty(true);
        setIsReady(false);
      } else if (!orgIsLoading && (orgIsEmpty || !selectedOrganization)) {
        // Org loading complete, no org found → show empty state, not infinite loading
        setIsLoading(false);
        setIsEmpty(true);
        setIsReady(false);
      } else {
        // Still loading org or invoices
        setIsLoading(true);
      }
    })();
  }, [selectedOrganization, invoices, orgIsLoading, orgIsEmpty]);

  // Fetch clients from the server when the provider mounts
  async function fetchPayments(invoice_ids: string[]) {
    try {
      const payments = await handleAsyncOperation(() =>
        getPaymentsByInvoiceIds(invoice_ids),
      );

      return payments.data;
    } catch (error) {
      toast.error("Error fetching Payments");
      console.error(error);
      return [];
    }
  }

  // Payment operations
  const recordPayment = async (
    paymentData: Partial<Omit<PaymentRecord, "id">>,
  ) => {
    if (!userId) {
      console.error("User not logged in!");
      throw new Error("User not logged in!");
    }

    if (!selectedOrganization?.id) {
      throw new Error("Organization not found");
    }

    const result = await handleAsyncOperation(async () => {
      const { recordPaymentForOrg } =
        await import("@/lib/queries/collaboration/payments");
      return await recordPaymentForOrg(
        paymentData,
        selectedOrganization.id!,
        userId,
      );
    });

    if (isError(result)) {
      throw new Error(result.error || "Failed to record payment");
    }

    if (isEmptyState(result) || !result.data) {
      throw new Error("Payment recording failed - no data returned");
    }

    // Update local state
    setPayments((prev) => [...prev, result.data.payment]);
    // Update the corresponding invoice
    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === result.data.invoice.id ? result.data.invoice : invoice,
      ),
    );
    return result.data.payment;
  };

  const updatePayment = async (id: string, updates: Partial<PaymentRecord>) => {
    if (!userId) {
      console.error("User not logged in!");
      throw new Error("User not logged in!");
    }

    const result = await handleAsyncOperation(async () => {
      const { updatePaymentForOrg } =
        await import("@/lib/queries/collaboration/payments");
      return await updatePaymentForOrg(id, updates, userId);
    });

    if (isError(result)) {
      throw new Error(result.error || "Failed to update payment");
    }

    if (isEmptyState(result) || !result.data) {
      // Payment might have been deleted, remove from local state
      setPayments((prev) => prev.filter((payment) => payment.id !== id));
      return null;
    }

    // Update local state
    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === id ? result.data.payment : payment,
      ),
    );
    // Update the corresponding invoice
    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === result.data.invoice.id ? result.data.invoice : invoice,
      ),
    );
    return result.data.payment;
  };

  const deletePayment = async (id: string) => {
    if (!userId) {
      console.error("User not logged in!");
      throw new Error("User not logged in!");
    }

    const result = await handleAsyncOperation(async () => {
      const { deletePaymentForOrg } =
        await import("@/lib/queries/collaboration/payments");
      return await deletePaymentForOrg(id, userId);
    });

    if (isError(result)) {
      throw new Error(result.error || "Failed to delete payment");
    }

    // Update local state - remove payment regardless of whether it was found (empty state or success)
    setPayments((prev) => prev.filter((payment) => payment.id !== id));

    // Update the corresponding invoice if data is available
    if (result.data?.invoice) {
      setInvoices((prev) =>
        prev.map((invoice) =>
          invoice.id === result.data.invoice.id ? result.data.invoice : invoice,
        ),
      );
    }

    return true; // Indicate success
  };

  return (
    <PaymentContext.Provider
      value={{
        payments,
        setPayments,
        isLoading,
        isEmpty,
        isError: hasError,
        errorMessage,
        isReady,
        recordPayment,
        updatePayment,
        deletePayment,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayments = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayments must be used within a PaymentsProvider");
  }

  return context;
};
