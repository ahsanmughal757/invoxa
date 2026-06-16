"use client";

import { PaymentRecord } from "@/types/invoice";
import { createContext, useContext, useMemo } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { useOrganization } from "./use-organization";
import {
  usePaymentsQuery,
  useRecordPaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
} from "@/hooks/queries/use-payments-query";

const PaymentContext = createContext<{
  payments: PaymentRecord[];
  setPayments: (payments: PaymentRecord[] | []) => void;
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
  const { selectedOrganization, isEmpty: orgIsEmpty, isLoading: orgIsLoading } = useOrganization();
  const orgId = selectedOrganization?.id;

  const { data: payments = [], isLoading, isError, error, isFetched } = usePaymentsQuery(orgId);
  const recordMutation = useRecordPaymentMutation(orgId || "");
  const updateMutation = useUpdatePaymentMutation(orgId || "");
  const deleteMutation = useDeletePaymentMutation(orgId || "");

  const recordPayment = async (
    paymentData: Partial<Omit<PaymentRecord, "id">>,
  ) => {
    if (!userId) throw new Error("User not logged in!");
    if (!orgId) throw new Error("Organization not found");
    const result = await recordMutation.mutateAsync({ data: paymentData, userId });
    return result;
  };

  const updatePayment = async (id: string, updates: Partial<PaymentRecord>) => {
    if (!userId) throw new Error("User not logged in!");
    const result = await updateMutation.mutateAsync({ id, updates, userId });
    return result;
  };

  const deletePayment = async (id: string) => {
    if (!userId) throw new Error("User not logged in!");
    await deleteMutation.mutateAsync({ id, userId });
  };

  const setPayments = () => {};

  const contextValue = useMemo(() => {
    const isEmptyState = !orgIsLoading && !orgIsEmpty && orgId
      ? isFetched && !isLoading && payments.length === 0
      : !orgIsLoading && (orgIsEmpty || !orgId);

    return {
      payments,
      setPayments,
      isLoading: orgId ? isLoading : false,
      isEmpty: isEmptyState,
      isError,
      errorMessage: error?.message || null,
      isReady: isFetched && !isLoading && payments.length > 0,
      recordPayment,
      updatePayment,
      deletePayment,
    };
  }, [payments, isLoading, isError, error, isFetched, orgId, orgIsLoading, orgIsEmpty]);

  return (
    <PaymentContext.Provider value={contextValue}>
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
