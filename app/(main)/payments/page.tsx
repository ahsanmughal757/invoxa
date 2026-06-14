"use client";

import { PaymentTracking } from "@/components/payments/payment-tracking";
import { FEATURES } from "@/hooks/use-subscription-access";
import { SubscriptionGuard } from "@/components/subscription/subscription-guard";
import { useInvoices } from "@/hooks/use-invoices";
import { CreditCard } from "lucide-react";
import { usePayments } from "@/hooks/use-payments";
import { useOrganization } from "@/hooks/use-organization";
import { OrganizationGuard } from "@/components/guards/organization-guard";
import {
  LoadingState,
  EmptyState,
  ErrorState,
  ReadyState,
} from "@/components/ui/state-components";

export default function PaymentsPage() {
  const { invoices } = useInvoices();
  const {
    payments,
    recordPayment,
    isLoading,
    isEmpty,
    isError,
    errorMessage,
    isReady,
  } = usePayments();
  // const { selectedOrganization: organization } = useSelectedOrganization();
  const { selectedOrganization: organization, organizations } =
    useOrganization();

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

  // Empty State
  if (isEmpty) {
    return (
      <SubscriptionGuard feature={FEATURES.PAYMENT_TRACKING}>
        <OrganizationGuard>
          <div className="space-y-6">
            {/*<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <CreditCard className="h-8 w-8 mr-3 text-green-600" />
                  Organization Payments
                </h1>
                <p className="text-gray-600 mt-1">
                  All payments belonging to{" "}
                  {organization?.name || "your organization"}
                </p>
              </div>
            </div>*/}

            <PaymentTracking
              payments={[]}
              invoices={invoices}
              onRecordPayment={recordPayment}
            />
          </div>
        </OrganizationGuard>
      </SubscriptionGuard>
    );
  }

  // Ready State
  if (isReady) {
    return (
      <SubscriptionGuard feature={FEATURES.PAYMENT_TRACKING}>
        <OrganizationGuard>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <CreditCard className="h-8 w-8 mr-3 text-green-600" />
                  Organization Payments
                </h1>
                <p className="text-gray-600 mt-1">
                  All payments belonging to{" "}
                  {organization?.name || "your organization"}
                </p>
              </div>
            </div>

            <PaymentTracking
              payments={payments}
              invoices={invoices}
              onRecordPayment={recordPayment}
            />
          </div>
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
