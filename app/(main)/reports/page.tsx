"use client"

import { useDashboardData } from '@/hooks/use-dashboard-data';
import { ReportsAnalytics } from '@/components/reports/reports-analytics';
import { SubscriptionGuard } from '@/components/subscription/subscription-guard';
import { FEATURES } from '@/hooks/use-subscription-access';
import { LoadingState, EmptyState, ErrorState, ReadyState } from '@/components/ui/state-components';
import { NoOrganizationState } from '@/components/empty-states/no-organization-state';
import { useOrganization } from '@/hooks/use-organization';

export default function ReportsPage() {
  const { invoiceSummary, clients, isLoading, isEmpty, isError, errorMessage, isReady } = useDashboardData();
  const { isEmpty: orgIsEmpty } = useOrganization();

  // Loading State
  if (isLoading) {
    return (
      <LoadingState message="Loading reports..." size="large" />
    );
  }

  // No Organization State
  if (orgIsEmpty) {
    return <NoOrganizationState />;
  }

  // Error State
  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Reports"
        description={errorMessage || "There was an issue retrieving your reports. Please try again later."}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Empty State
  if (isEmpty) {
    return (
      <SubscriptionGuard feature={FEATURES.REPORTS_ANALYTICS}>
        <EmptyState
          title="No Report Data Available"
          description="Your organization doesn't have any financial data yet. Create invoices to start tracking your finances."
          action={{
            text: "Create Invoice",
            onClick: () => window.location.href = "/invoices/create",
          }}
        />
      </SubscriptionGuard>
    );
  }

  // Ready State
  if (isReady) {
    // Convert invoiceSummary to the format expected by ReportsAnalytics
    // This maintains compatibility with the existing component
    const invoices = invoiceSummary.map(inv => {
      // Ensure invoice_items exists (even if empty) to satisfy Invoice interface
      const invoiceItems = 'invoice_items' in inv ? inv.invoice_items : [];

      return {
        ...inv,
        // Map computed_status to status for compatibility
        status: inv.computed_status || inv.status,
        // Use remaining_amount instead of calculating outstanding
        paid_amount: inv.paid_amount || 0,
        invoice_items: invoiceItems
      };
    });

    return (
      <SubscriptionGuard feature={FEATURES.REPORTS_ANALYTICS}>
        <ReportsAnalytics
          invoices={invoices}
          payments={[]} // Payments will be fetched separately in the component if needed
          expenses={[]} // Expenses will be fetched separately in the component if needed
          clients={clients}
          loading={false}
        />
      </SubscriptionGuard>
    );
  }

  // Fallback
  return (
    <LoadingState message="Preparing reports..." size="large" />
  );
}
