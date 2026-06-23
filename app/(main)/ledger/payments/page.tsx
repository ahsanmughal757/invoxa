"use client";

import { LedgerView } from "@/components/payments/ledger-view";
import { FEATURES } from "@/hooks/use-subscription-access";
import { SubscriptionGuard } from "@/components/subscription/subscription-guard";
import { BackButton } from "@/components/ui/back-button";
import { useInvoices } from "@/hooks/use-invoices";
import { CreditCard } from "lucide-react";
import { usePayments } from "@/hooks/use-payments";
import { useOrganization } from "@/hooks/use-organization";
import {
  LoadingState,
  EmptyState,
  ErrorState,
  ReadyState,
} from "@/components/ui/state-components";

export default function PaymentsLedgerPage() {
  const { selectedOrganization: organization } = useOrganization();
  const { invoices } = useInvoices();
  const { payments, isLoading, isEmpty, isError, errorMessage, isReady } =
    usePayments();

  // Loading State
  if (isLoading) {
    return <LoadingState message="Loading payment ledger..." size="large" />;
  }

  // Error State
  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Payment Ledger"
        description={
          errorMessage ||
          "There was an issue retrieving your payment ledger. Please try again later."
        }
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Empty State
  if (isEmpty) {
    return (
      <SubscriptionGuard feature={FEATURES.PAYMENT_TRACKING}>
        <div className="space-y-6">
          {/*<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CreditCard className="h-8 w-8 mr-3 text-green-600" />
                Money-In Ledger
              </h1>
              <p className="text-gray-600 mt-1">
                Financial ledger view of all payments received (money coming into{" "}
                {organization?.name || "your organization"})
              </p>
            </div>
          </div>*/}

          <LedgerView
            payments={[]}
            invoices={invoices}
            onPaymentClick={(payment) => {
              console.log("Payment clicked:", payment);
            }}
          />
        </div>
      </SubscriptionGuard>
    );
  }

  // Ready State
  if (isReady) {
    return (
      <SubscriptionGuard feature={FEATURES.PAYMENT_TRACKING}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CreditCard className="h-8 w-8 mr-3 text-green-600" />
                Money-In Ledger
              </h1>
              <p className="text-gray-600 mt-1">
                Financial ledger view of all payments received (money coming
                into {organization?.name || "your organization"})
              </p>
            </div>
            <BackButton href="/payments">Back to Payments</BackButton>
          </div>

          <LedgerView
            payments={payments}
            invoices={invoices}
            onPaymentClick={(payment) => {
              console.log("Payment clicked:", payment);
            }}
          />
        </div>
      </SubscriptionGuard>
    );
  }

  // Fallback
  return <LoadingState message="Preparing ledger..." size="large" />;
}
