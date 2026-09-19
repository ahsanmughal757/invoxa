"use client";

import { PaymentTracking } from "@/components/payments/payment-tracking";
import { FEATURES } from "@/hooks/use-subscription-access";
import { SubscriptionGuard } from "@/components/subscription/subscription-guard";
import { useInvoices } from "@/hooks/use-invoices";
import { useClients } from "@/hooks/use-clients";
import { usePayments } from "@/hooks/use-payments";
import { OrganizationGuard } from "@/components/guards/organization-guard";
import {
  LoadingState,
  EmptyState,
  ErrorState,
} from "@/components/ui/state-components";

export default function PaymentsPage() {
  const { invoices } = useInvoices();
  const { clients } = useClients();
  const {
    payments,
    recordPayment,
    isLoading,
    isEmpty,
    isError,
    errorMessage,
    isReady,
  } = usePayments();

  // Loading State
  if (isLoading) {
    return (
      <OrganizationGuard>
        <LoadingState message="Loading your payments..." size="large" />
      </OrganizationGuard>
    );
  }

  // Error State
  if (isError) {
    return (
      <OrganizationGuard>
        <ErrorState
          title="Failed to Load Payments"
          description={
            errorMessage ||
            "There was an issue retrieving your payments. Please try again later."
          }
          onRetry={() => window.location.reload()}
        />
      </OrganizationGuard>
    );
  }

  const renderPayments = (paymentList: typeof payments) => (
    <PaymentTracking
      payments={paymentList}
      invoices={invoices}
      clients={clients}
      onRecordPayment={recordPayment}
    />
  );

  // Empty State
  if (isEmpty) {
    return (
      <SubscriptionGuard feature={FEATURES.PAYMENT_TRACKING}>
        <OrganizationGuard>
          <div className="space-y-6">{renderPayments([])}</div>
        </OrganizationGuard>
      </SubscriptionGuard>
    );
  }

  // Ready State
  if (isReady) {
    return (
      <SubscriptionGuard feature={FEATURES.PAYMENT_TRACKING}>
        <OrganizationGuard>
          <div className="space-y-6">{renderPayments(payments)}</div>
        </OrganizationGuard>
      </SubscriptionGuard>
    );
  }

  // Fallback
  return (
    <OrganizationGuard>
      <LoadingState message="Preparing payments..." size="large" />
    </OrganizationGuard>
  );
}