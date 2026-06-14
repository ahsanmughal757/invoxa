"use client";

import { InsightsDashboard } from "@/components/insights/insights-dashboard";
import { useInvoices } from "@/hooks/use-invoices";
import { EmptyState, ErrorState, LoadingState, ReadyState } from "@/components/ui/state-components";
import { useRouter } from "next/navigation";
import { OrganizationGuard } from "@/components/guards/organization-guard";
import { usePayments } from "@/hooks/use-payments";
import { useExpenses } from "@/hooks/use-expenses";
import { useClients } from "@/hooks/use-clients";

export default function InsightsPage() {
  const { clients, isLoading: clientsLoading, isError: clientsError, errorMessage: clientsErrorMessage } = useClients();
  const { invoices, isLoading: invoicesLoading, isError: invoicesError, errorMessage: invoicesErrorMessage } = useInvoices();
  const { expenses, isLoading: expensesLoading, isError: expensesError, errorMessage: expensesErrorMessage } = useExpenses();
  const { payments, isLoading: paymentsLoading, isError: paymentsError, errorMessage: paymentsErrorMessage } = usePayments();
  const router = useRouter();

  const isLoading = clientsLoading || invoicesLoading || expensesLoading || paymentsLoading;
  const isError = clientsError || invoicesError || expensesError || paymentsError;
  const errorMessage = clientsErrorMessage || invoicesErrorMessage || expensesErrorMessage || paymentsErrorMessage;

  // Loading State
  if (isLoading) {
    return (
      <LoadingState message="Loading insights..." size="large" />
    );
  }

  // Error State
  if (isError) {
    return (
      <OrganizationGuard>
        <ErrorState
          title="Failed to Load Insights"
          description={errorMessage || "There was an issue retrieving insights. Please try again later."}
          onRetry={() => window.location.reload()}
        />
      </OrganizationGuard>
    );
  }

  // Empty State
  if (invoices.length === 0 && expenses.length === 0 && payments.length === 0 && clients.length === 0) {
    return (
      <OrganizationGuard>
        <EmptyState
          title="No Insights Data Available"
          description="Your organization doesn't have any financial data yet. Create invoices and track expenses to see insights."
          action={{
            text: "Create Invoice",
            onClick: () => router.push("/invoices/create"),
          }}
        />
      </OrganizationGuard>
    );
  }

  // Ready State
  return (
    <OrganizationGuard>
      <InsightsDashboard
        invoices={invoices}
        payments={payments}
        expenses={expenses}
        clients={clients}
      />
    </OrganizationGuard>
  );
}
