"use client"

import { useDashboardData } from '@/hooks/use-dashboard-data';
import { ReportsAnalytics } from '@/components/reports/reports-analytics';
import { SubscriptionGuard } from '@/components/subscription/subscription-guard';
import { FEATURES } from '@/hooks/use-subscription-access';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/state-components';
import { NoOrganizationState } from '@/components/empty-states/no-organization-state';
import { useOrganization } from '@/hooks/use-organization';
import { usePayments } from '@/hooks/use-payments';
import { useExpenses } from '@/hooks/use-expenses';
import { useClients } from '@/hooks/use-clients';

export default function ReportsPage() {
  const { invoiceSummary, isLoading: dashLoading, isEmpty, isError, errorMessage, isReady } = useDashboardData();
  const { isEmpty: orgIsEmpty } = useOrganization();
  const { payments, isLoading: paymentsLoading } = usePayments();
  const { expenses, isLoading: expensesLoading } = useExpenses();
  const { clients, isLoading: clientsLoading } = useClients();

  const isLoading = dashLoading || paymentsLoading || expensesLoading || clientsLoading;

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

  // Ready State
  if (isReady || (!isLoading && !isError)) {
    // Convert invoiceSummary to the format expected by ReportsAnalytics
    const invoices = invoiceSummary.map(inv => {
      const invoiceItems = 'invoice_items' in inv ? inv.invoice_items : [];

      return {
        ...inv,
        status: inv.computed_status || inv.status,
        paid_amount: inv.paid_amount || 0,
        invoice_items: invoiceItems
      };
    });

    return (
      <SubscriptionGuard feature={FEATURES.REPORTS_ANALYTICS}>
        <ReportsAnalytics
          invoices={invoices}
          payments={payments}
          expenses={expenses}
          clients={clients}
          loading={false}
        />
      </SubscriptionGuard>
    );
  }

  // Empty State (no invoice data)
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
