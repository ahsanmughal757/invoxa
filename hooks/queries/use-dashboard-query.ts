"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getInvoiceSummary } from "@/lib/services/invoice.service.func";

export function useDashboardStatsQuery(orgId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard", "stats", orgId],
    queryFn: () => getDashboardStats(orgId!),
    enabled: !!orgId,
    staleTime: 15_000,
  });
}

export function useInvoiceSummaryQuery(orgId: string | undefined) {
  return useQuery({
    queryKey: ["dashboard", "summary", orgId],
    queryFn: () => getInvoiceSummary(orgId!),
    enabled: !!orgId,
    staleTime: 15_000,
  });
}
