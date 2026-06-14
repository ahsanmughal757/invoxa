"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Receipt,
  DollarSign,
  Users,
  Activity,
  Plus,
  BarChart3,
  TrendingUp,
  FileText as FileTextIcon,
  Receipt as ReceiptIcon,
  DollarSign as DollarSignIcon,
  Users as UsersIcon,
  TriangleAlert,
} from "lucide-react";
import { useInvoices } from "@/hooks/use-invoices";
import { useAuth } from "@clerk/nextjs";
import {
  Organization,
  Invoice,
  Expense,
  PaymentRecord,
  Client,
} from "@/types/invoice";
import { formatCurrency } from "@/lib/utils";
import { useOrganization } from "@/hooks/use-organization";
import { useExpenses } from "@/hooks/use-expenses";
import { usePayments } from "@/hooks/use-payments";
import { useClients } from "@/hooks/use-clients";

export default function OrganizationCollaborationDashboard() {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();

  const { invoices, isLoading } = useInvoices();
  const { expenses } = useExpenses();
  const { payments } = usePayments();
  const { clients } = useClients();

  const [orgStats, setOrgStats] = useState({
    totalInvoices: 0,
    totalExpenses: 0,
    totalPayments: 0,
    totalClients: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
  });

  // Calculate organization statistics
  useEffect(() => {
    if (!isLoading) {
      const orgInvoices = invoices.filter((inv) => inv.org_id === orgId);
      const orgExpenses = expenses.filter((exp) => exp.org_id === orgId);
      const orgPayments = payments.filter((pay) => {
        const invoice = invoices.find((inv) => inv.id === pay.invoice_id);
        return invoice && invoice.org_id === orgId;
      });
      const orgClients = clients.filter((client) => client.org_id === orgId);

      const totalRevenue = orgPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );
      const pendingInvoices = orgInvoices.filter(
        (inv) => inv.status === "sent",
      ).length;
      const overdueInvoices = orgInvoices.filter(
        (inv) =>
          inv.status === "overdue" && new Date(inv.due_date) < new Date(),
      ).length;

      setOrgStats({
        totalInvoices: orgInvoices.length,
        totalExpenses: orgExpenses.length,
        totalPayments: orgPayments.length,
        totalClients: orgClients.length,
        totalRevenue,
        pendingInvoices,
        overdueInvoices,
      });
    }
  }, [invoices, expenses, payments, clients, isLoading, orgId]);

  const navigateToSection = (section: string) => {
    // Map section names to the correct route paths
    let routePath = "";
    switch (section) {
      case "invoices":
        routePath = `/organization/${orgId}/collaboration/invoice`;
        break;
      case "expenses":
        routePath = `/organization/${orgId}/collaboration/expenses`;
        break;
      case "payments":
        routePath = `/organization/${orgId}/collaboration/payments`;
        break;
      case "clients":
        routePath = `/organization/${orgId}/collaboration/clients`;
        break;
      case "reports":
        routePath = `/reports`;
        break;
      default:
        routePath = `/organization/${orgId}/collaboration/${section}`;
    }

    router.push(routePath);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading collaboration dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Development Warning Alert */}
      <div className="mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <TriangleAlert className="h-5 w-5 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-red-800">
              Warning Under Development - (Experimental)
            </h2>
          </div>
          <p className="text-sm text-red-600 mt-1">
            This page is under development and things may break if not careful.
            It is for under development features.
          </p>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Organization Collaboration
        </h1>
        <p className="text-gray-600 mt-1">
          Manage all aspects of your organization in one place
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <FileTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold">{orgStats.totalInvoices}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <ReceiptIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold">{orgStats.totalExpenses}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg mr-4">
              <DollarSignIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold">
                {formatCurrency(orgStats.totalRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg mr-4">
              <UsersIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold">{orgStats.totalClients}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
              Invoice Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Pending</span>
                <Badge variant="secondary">{orgStats.pendingInvoices}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Overdue</span>
                <Badge variant="destructive">{orgStats.overdueInvoices}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Payments Received</span>
                <span className="font-medium">{orgStats.totalPayments}</span>
              </div>
              <div className="flex justify-between">
                <span>Expenses Recorded</span>
                <span className="font-medium">{orgStats.totalExpenses}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collaboration Modules */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Collaboration Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Invoices Card */}
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigateToSection("invoices")}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileTextIcon className="h-6 w-6 mr-2 text-blue-500" />
                  <span>Invoices</span>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                Create, manage, and track invoices
              </p>
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="font-medium">{orgStats.totalInvoices}</span>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Card */}
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigateToSection("expenses")}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <ReceiptIcon className="h-6 w-6 mr-2 text-green-500" />
                  <span>Expenses</span>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                Track and manage business expenses
              </p>
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="font-medium">{orgStats.totalExpenses}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payments Card */}
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigateToSection("payments")}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSignIcon className="h-6 w-6 mr-2 text-purple-500" />
                  <span>Payments</span>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                Record and track payments
              </p>
              <div className="flex justify-between text-sm">
                <span>Received</span>
                <span className="font-medium">{orgStats.totalPayments}</span>
              </div>
            </CardContent>
          </Card>

          {/* Clients Card */}
          <Card
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigateToSection("clients")}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <UsersIcon className="h-6 w-6 mr-2 text-orange-500" />
                  <span>Clients</span>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                Manage client information
              </p>
              <div className="flex justify-between text-sm">
                <span>Total</span>
                <span className="font-medium">{orgStats.totalClients}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigateToSection("invoices")}>
            <FileTextIcon className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
          <Button
            variant="outline"
            onClick={() => navigateToSection("expenses")}
          >
            <ReceiptIcon className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
          <Button
            variant="outline"
            onClick={() => navigateToSection("clients")}
          >
            <UsersIcon className="h-4 w-4 mr-2" />
            Add Client
          </Button>
          <Button
            variant="outline"
            onClick={() => navigateToSection("reports")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </div>
      </div>
    </div>
  );
}
