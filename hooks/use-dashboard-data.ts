"use client";

import { useState, useEffect } from "react";
import {
  DashboardStats,
  InvoiceSummary,
  getDashboardStats,
  getInvoiceSummary,
} from "@/lib/services/invoice.service.func";
import { Client, Organization } from "@/types/invoice";
import { useAuth } from "@clerk/nextjs";
import { getSupabaseUser } from "@/lib/auth";
import { getOrganizationByOwnerId } from "@/lib/repositories/organizations.repository.func";
import { getClientsByOrgId } from "@/lib/repositories/clients.repository.func";
import { useInvoices } from "./use-invoices";
import { useOrganization } from "./use-organization";

const defaultState = {
  dashboardStats: {
    org_id: "",
    revenue_ytd: 0,
    outstanding_total: 0,
    overdue_count: 0,
    total_invoices: 0,
    total_invoiced: 0,
    total_collected: 0,
    total_outstanding: 0,
  },
  invoiceSummary: [],
  clients: [],
  isLoading: true,
  isEmpty: false,
  isError: false,
  errorMessage: null,
  isReady: false,
  generalMessage: null,
  isMember: false,
  orgName: null,
};

interface DashboardData {
  dashboardStats: Partial<DashboardStats>;
  invoiceSummary: InvoiceSummary[];
  clients: Client[];
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
  const [data, setData] = useState<DashboardData>(defaultState);
  const { memberOrganizations } = useInvoices();
  const { selectedOrganization } = useOrganization();

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) {
        setData((prev) => ({
          ...prev,
          isError: true,
          isLoading: false,
          errorMessage: "Not authorized. Please Login",
        }));
        return;
      }

      // setData((prev) => ({
      //   ...prev,
      //   isLoading: true,
      //   isEmpty: false,
      //   isError: false,
      //   errorMessage: null,
      //   isReady: false,
      // }));

      try {
        // Get user profile to get organization ID
        const userProfile = await getSupabaseUser();
        if (!userProfile) {
          setData((prev) => ({
            ...prev,
            isError: true,
            errorMessage: "User profile not found. Please Login!",
            isReady: true,
            isLoading: false,
          }));
          return;
        }

        const ownerClerkId = userProfile.clerk_user_id;

        // Get organization ID from user profile
        // const userOrganization = await getOrganizationByOwnerId(ownerClerkId);

        if (!selectedOrganization) {
          setData((prev) => ({
            ...prev,
            isLoading: false,
            isEmpty: true,
            isError: false,
            errorMessage: null,
            isReady: !prev.isEmpty,
            generalMessage:
              "No Organization Selected!. Please select the organization from selector.",
            orgName: "",
          }));
          return;
        }

        const userOrganization = await getOrganizationByOwnerId(
          selectedOrganization.owner_clerk_id,
        );

        if (userOrganization) {
          const orgId = userOrganization.id;

          // Fetch all required data in parallel
          // const [dashboardStats, invoiceSummary, clients] = await Promise.all([
          //   getDashboardStats(orgId),
          //   getInvoiceSummary(orgId),
          //   getClientsByOrgId(orgId)
          // ]);

          if (!orgId) {
            setData((prev) => ({
              ...prev,
              isLoading: false,
              generalMessage:
                "No Organization Selected. Please Select an organization!",
            }));
            return;
          }

          debugger;

          const dashboardStats = await getDashboardStats(orgId);
          const invoiceSummary = await getInvoiceSummary(orgId);
          const clients = await getClientsByOrgId(orgId);

          // Determine if data is empty - check all relevant fields
          const isEmpty =
            (dashboardStats.total_invoices || 0) === 0 &&
            invoiceSummary.length === 0 &&
            clients.length === 0;

          setData({
            dashboardStats: {
              org_id: dashboardStats.org_id || orgId,
              revenue_ytd: dashboardStats.revenue_ytd || 0,
              outstanding_total: dashboardStats.outstanding_total || 0,
              overdue_count: dashboardStats.overdue_count || 0,
              total_invoices: dashboardStats.total_invoices || 0,
              total_invoiced: dashboardStats.total_invoiced || 0,
              total_collected: dashboardStats.total_collected || 0,
              total_outstanding: dashboardStats.total_outstanding || 0,
            },
            invoiceSummary,
            clients,
            isLoading: false,
            isEmpty,
            isError: false,
            errorMessage: null,
            isReady: !isEmpty,
            generalMessage: "Welcome back! Here's your dashboard data.",
            orgName: userOrganization.name,
          });
        } else if (!userOrganization && memberOrganizations.length > 0) {
          // CHECK IF USER IS A MEMBER OF ANY ORGANIZATION

          const orgId = memberOrganizations[0].org_id;
          const dashboardStats = await getDashboardStats(orgId);
          const invoiceSummary = await getInvoiceSummary(orgId);
          const clients = await getClientsByOrgId(orgId);

          setData({
            dashboardStats: {
              org_id: dashboardStats.org_id || orgId,
              revenue_ytd: dashboardStats.revenue_ytd || 0,
              outstanding_total: dashboardStats.outstanding_total || 0,
              overdue_count: dashboardStats.overdue_count || 0,
              total_invoices: dashboardStats.total_invoices || 0,
              total_invoiced: dashboardStats.total_invoiced || 0,
              total_collected: dashboardStats.total_collected || 0,
              total_outstanding: dashboardStats.total_outstanding || 0,
            },
            invoiceSummary,
            clients,
            isLoading: false,
            isEmpty: false,
            isError: false,
            errorMessage: null,
            isReady: true,
            generalMessage:
              "You are a member of an organization but not the owner. Some features may be limited. Please contact your organization owner for more access.",
            isMember: true,
            orgName: memberOrganizations[0].organization.name,
          });

          // if (typeof memberOrganizations !== "object") {
          //   const orgId = memberOrganizations[0].org_id;
          //   const dashboardStats = await getDashboardStats(orgId);
          //   const invoiceSummary = await getInvoiceSummary(orgId);
          //   const clients = await getClientsByOrgId(orgId);

          //   setData({
          //     dashboardStats,
          //     invoiceSummary,
          //     clients,
          //     isLoading: false,
          //     isEmpty: false,
          //     isError: false,
          //     errorMessage: null,
          //     isReady: true,
          //     generalMessage:
          //       "You are a member of an organization but not the owner. Some features may be limited. Please contact your organization owner for more access.",
          //   });
          // } else if (typeof memberOrganizations === "object") {
          //   const orgId = memberOrganizations.org_id;
          //   const dashboardStats = await getDashboardStats(orgId);
          //   const invoiceSummary = await getInvoiceSummary(orgId);
          //   const clients = await getClientsByOrgId(orgId);

          //   setData({
          //     dashboardStats,
          //     invoiceSummary,
          //     clients,
          //     isLoading: false,
          //     isEmpty: false,
          //     isError: false,
          //     errorMessage: null,
          //     isReady: true,
          //     generalMessage:
          //       "You are a member of an organization but not the owner. Some features may be limited. Please contact your organization owner for more access.",
          //   });
          // }
        } else {
          setData((prev) => ({
            ...prev,
            isLoading: false,
            isEmpty: true,
            isError: false,
            errorMessage: null,
            isReady: false,
            generalMessage:
              "You dont have an organization yet. Please create or join an organization to see your dashboard data.",
          }));
        }
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        setData({
          dashboardStats: {
            org_id: "",
            revenue_ytd: 0,
            outstanding_total: 0,
            overdue_count: 0,
            total_invoices: 0,
            total_invoiced: 0,
            total_collected: 0,
            total_outstanding: 0,
          },
          invoiceSummary: [],
          clients: [],
          isLoading: false,
          isEmpty: false,
          isError: true,
          errorMessage: error.message || "Failed to load dashboard data",
          isReady: false,
        });
      }
    };

    fetchData();
  }, [userId, memberOrganizations]);

  return data;
}
