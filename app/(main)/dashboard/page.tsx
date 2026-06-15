"use client";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  PiggyBank,
  Wallet,
  CreditCard,
  Receipt,
  Building,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  LoadingState,
  EmptyState,
  ErrorState,
  ReadyState,
} from "@/components/ui/state-components";
import { NoOrganizationState } from "@/components/empty-states/no-organization-state";
import { useOrganization } from "@/hooks/use-organization";

export default function DashboardPage() {
  const {
    dashboardStats,
    invoiceSummary,
    clients,
    isLoading,
    isEmpty,
    isError,
    errorMessage,
    isReady,
    isMember,
    orgName,
  } = useDashboardData();
  const { isEmpty: orgIsEmpty } = useOrganization();
  const router = useRouter();

  // Loading State
  if (isLoading) {
    return (
      <LoadingState
        message="Loading your financial dashboard..."
        size="large"
      />
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
        title="Failed to Load Dashboard"
        description={
          errorMessage ||
          "There was an issue retrieving your dashboard data. Please try again later."
        }
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Empty State
  if (isEmpty) {
    return (
      <EmptyState
        title="No Dashboard Data Available"
        description="Your organization doesn't have any financial data yet. Create your first invoice to start tracking your finances."
        action={{
          text: "Create Invoice",
          onClick: () => router.push("/invoices/create"),
        }}
      />
    );
  }

  // Ready State - Render the actual dashboard content
  if (isReady) {
    // Calculate invoice breakdown from the pre-computed data
    const invoiceBreakdown = {
      paid: invoiceSummary.filter((inv) => inv.computed_status === "paid")
        .length,
      sent: invoiceSummary.filter((inv) => inv.computed_status === "sent")
        .length,
      overdue: invoiceSummary.filter((inv) => inv.computed_status === "overdue")
        .length,
      draft: invoiceSummary.filter((inv) => inv.computed_status === "draft")
        .length,
      partially_paid: invoiceSummary.filter(
        (inv) => inv.computed_status === "partially_paid",
      ).length,
    };

    // Top Debtors (Clients with highest outstanding balances) - using pre-computed data
    const topDebtors = invoiceSummary
      .filter(
        (inv) =>
          inv.computed_status !== "paid" &&
          inv.computed_status !== "cancelled" &&
          inv.computed_status !== "void",
      )
      .sort((a, b) => b.remaining_amount - a.remaining_amount)
      .slice(0, 5)
      .map((inv) => ({
        clientName: inv.client_name,
        outstanding: inv.remaining_amount,
      }));

    // Recent Payment Activity - this might need to be fetched separately if not in invoiceSummary
    // For now, we'll use the invoice summary data to show recent invoices
    const recentInvoices = [...invoiceSummary]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 5);

    return (
      <ReadyState>
        <div className="space-y-6">
          {isMember && (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold text-blue-800">
                    Working in: {orgName}
                  </h2>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  You are <span className="font-bold text-blue-700">THE MEMBER</span> of this organization not the owner. Some
                  features may be limited. Please contact your organization
                  owner for more access.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Financial Command Center
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time view of your organization's financial obligations and
                cash flow
              </p>
            </div>
            <Button
              onClick={() => router.push("/invoices/create")}
              className="flex items-center self-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>

          {/* Financial Reality Metrics - Using pre-computed data from DB */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Outstanding Obligations - What customers owe us */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                  Outstanding Receivables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {formatCurrency(dashboardStats.outstanding_total || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Amount owed by clients
                </p>
              </CardContent>
            </Card>

            {/* Revenue YTD - Using pre-computed data from DB */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <Wallet className="h-4 w-4 mr-2 text-green-500" />
                  Revenue (YTD)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(dashboardStats.revenue_ytd || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Year-to-date revenue
                </p>
              </CardContent>
            </Card>

            {/* Total Invoiced - Using pre-computed data from DB */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  Total Invoiced
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(dashboardStats.total_invoiced || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total amount invoiced
                </p>
              </CardContent>
            </Card>

            {/* Total Collected - Using pre-computed data from DB */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-purple-500" />
                  Total Collected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {formatCurrency(dashboardStats.total_collected || 0)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total amount collected
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Claims Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Invoice Claims Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Paid
                    </span>
                    <span className="font-medium text-green-600">
                      {invoiceBreakdown.paid}
                    </span>
                  </div>
                  <Progress
                    value={
                      (invoiceBreakdown.paid /
                        Math.max(invoiceSummary.length, 1)) *
                      100
                    }
                    className="h-2"
                  />

                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-blue-500" />
                      Sent
                    </span>
                    <span className="font-medium text-blue-600">
                      {invoiceBreakdown.sent}
                    </span>
                  </div>
                  <Progress
                    value={
                      (invoiceBreakdown.sent /
                        Math.max(invoiceSummary.length, 1)) *
                      100
                    }
                    className="h-2"
                  />

                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                      Overdue
                    </span>
                    <span className="font-medium text-red-600">
                      {invoiceBreakdown.overdue}
                    </span>
                  </div>
                  <Progress
                    value={
                      (invoiceBreakdown.overdue /
                        Math.max(invoiceSummary.length, 1)) *
                      100
                    }
                    className="h-2"
                  />

                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                      Partially Paid
                    </span>
                    <span className="font-medium text-yellow-600">
                      {invoiceBreakdown.partially_paid}
                    </span>
                  </div>
                  <Progress
                    value={
                      (invoiceBreakdown.partially_paid /
                        Math.max(invoiceSummary.length, 1)) *
                      100
                    }
                    className="h-2"
                  />
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between font-semibold">
                    <span>Total Claims</span>
                    <span>{invoiceSummary.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Debtors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                  Top Debtors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topDebtors.length > 0 ? (
                  <div className="space-y-4">
                    {topDebtors.map((debtor, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium">{debtor.clientName}</div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(debtor.outstanding)} outstanding
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-orange-50 text-orange-700"
                        >
                          {formatCurrency(debtor.outstanding)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No outstanding invoices
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity and Aging Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Invoice Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-500" />
                  Recent Invoice Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentInvoices.length > 0 ? (
                  <div className="space-y-4">
                    {recentInvoices.map((invoice) => {
                      const client = clients.find(
                        (c) => c.id === invoice.client_id,
                      );
                      return (
                        <div
                          key={invoice.id}
                          className="flex justify-between items-center py-2 border-b last:border-b-0"
                        >
                          <div>
                            <div className="font-medium">{invoice.number}</div>
                            <div className="text-sm text-gray-600">
                              {client?.name || invoice.client_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(invoice.created_at)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(invoice.total)}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {invoice.computed_status.replace("_", " ")}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No recent invoices
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Aging Analysis - Using pre-computed data from DB */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-red-500" />
                  Invoice Aging Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium text-red-700">
                        Overdue Invoices
                      </div>
                      <div className="text-sm text-red-600">
                        Immediate attention required
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-red-700">
                        {dashboardStats.overdue_count}
                      </div>
                      <div className="text-sm text-red-600">
                        {formatCurrency(dashboardStats.outstanding_total || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h3 className="font-medium mb-2">Collection Priority</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span>High Priority (Overdue)</span>
                        <span className="font-medium">
                          {dashboardStats.overdue_count}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Outstanding Amount</span>
                        <span className="font-medium">
                          {formatCurrency(dashboardStats.outstanding_total || 0)}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Total Invoices</span>
                        <span className="font-medium">
                          {dashboardStats.total_invoices}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ReadyState>
    );
  }

  // Fallback for any other state
  return (
    <EmptyState
      title="Dashboard Unavailable"
      description="No data could be loaded for your dashboard."
    />
  );
}
