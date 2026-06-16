"use client";

import { useAuth } from "@clerk/nextjs";
import { getClientsByOrgId } from "@/lib/repositories/clients.repository.func";
import { useOrganization } from "./use-organization";
import {
  useDashboardStatsQuery,
  useInvoiceSummaryQuery,
} from "@/hooks/queries/use-dashboard-query";

interface DashboardData {
  dashboardStats: {
    org_id: string;
    revenue_ytd: number;
    outstanding_total: number;
    overdue_count: number;
    total_invoices: number;
    total_invoiced: number;
    total_collected: number;
    total_outstanding: number;
  };
  invoiceSummary: any[];
  clients: any[];
  isLoading: boolean;
  isEmpty: boolean;
  isError: boolean;
  errorMessage: string | null;
  isReady: boolean;
  generalMessage?: string | null;
  isMember?: boolean;
  orgName?: string | null;
}

export function useDashboardData(): DashboardData {
  const { userId } = useAuth();
  const { selectedOrganization, isLoading: orgLoading, isEmpty: orgIsEmpty } = useOrganization();
  const orgId = selectedOrganization?.id;

  const { data: dashboardStats, isLoading: statsLoading, isError: statsError, error: statsErrorObj } = useDashboardStatsQuery(orgId);
  const { data: invoiceSummary = [], isLoading: summaryLoading } = useInvoiceSummaryQuery(orgId);

  const isLoading = orgLoading || statsLoading || summaryLoading;
  const isError = statsError;
  const errorMessage = statsErrorObj?.message || null;

  const isEmpty = !isLoading && !isError && (
    (dashboardStats?.total_invoices || 0) === 0 &&
    invoiceSummary.length === 0
  );
  const isReady = !isLoading && !isError && !isEmpty;

  const defaultStats = {
    org_id: orgId || "",
    revenue_ytd: 0,
    outstanding_total: 0,
    overdue_count: 0,
    total_invoices: 0,
    total_invoiced: 0,
    total_collected: 0,
    total_outstanding: 0,
  };

  if (orgIsEmpty) {
    return {
      dashboardStats: defaultStats,
      invoiceSummary: [],
      clients: [],
      isLoading: false,
      isEmpty: true,
      isError: false,
      errorMessage: null,
      isReady: false,
      generalMessage: "No Organization Selected.",
      orgName: null,
    };
  }

  return {
    dashboardStats: dashboardStats || defaultStats,
    invoiceSummary,
    clients: [],
    isLoading,
    isEmpty,
    isError,
    errorMessage,
    isReady,
    generalMessage: isReady ? "Welcome back! Here's your dashboard data." : null,
    orgName: selectedOrganization?.name || null,
  };
}
