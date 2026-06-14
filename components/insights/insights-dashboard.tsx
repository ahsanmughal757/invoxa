"use client";

import { useState, useMemo } from "react";
import { Invoice, PaymentRecord, Expense, Client } from "@/types/invoice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  DollarSign,
  Users,
  FileText,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
} from "lucide-react";
import { getComputedInvoiceState } from "@/lib/invoice-state";

interface InsightsDashboardProps {
  invoices: Invoice[];
  payments: PaymentRecord[];
  expenses: Expense[];
  clients: Client[];
}

export function InsightsDashboard({
  invoices,
  payments,
  expenses,
  clients,
}: InsightsDashboardProps) {
  const [dateRange, setDateRange] = useState<
    "7d" | "30d" | "90d" | "6m" | "1y" | "all"
  >("90d");
  const [chartType, setChartType] = useState<
    "revenue" | "clients" | "performance" | "trends"
  >("revenue");

  const getDateRangeFilter = (range: string) => {
    const now = new Date();
    switch (range) {
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "90d":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case "6m":
        return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      case "1y":
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0);
    }
  };

  const filteredData = useMemo(() => {
    const startDate = getDateRangeFilter(dateRange);
    return {
      invoices: invoices.filter((inv) => new Date(inv.issue_date) >= startDate),
      payments: payments.filter(
        (pay) => new Date(pay.received_on) >= startDate,
      ),
      expenses: expenses.filter((exp) => new Date(exp.date) >= startDate),
    };
  }, [invoices, payments, expenses, dateRange]);

  // Key Performance Indicators
  const kpis = useMemo(() => {
    const totalRevenue = filteredData.payments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
    const totalInvoiced = filteredData.invoices.reduce(
      (sum, invoice) => sum + invoice.total,
      0,
    );
    const totalExpenses = filteredData.expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    const outstandingAmount = filteredData.invoices
      .filter((inv) => {
        const state = getComputedInvoiceState(inv);
        return (
          state !== "paid" &&
          inv.status !== "cancelled" &&
          inv.status !== "void"
        );
      })
      .reduce(
        (sum, invoice) => sum + (invoice.total - (invoice.paid_amount || 0)),
        0,
      );

    const paidInvoices = filteredData.invoices.filter((inv) => {
      const state = getComputedInvoiceState(inv);
      return state === "paid";
    }).length;
    const overdueInvoices = filteredData.invoices.filter((inv) => {
      const state = getComputedInvoiceState(inv);
      return state === "overdue";
    }).length;
    const averageInvoiceValue =
      filteredData.invoices.length > 0
        ? totalInvoiced / filteredData.invoices.length
        : 0;
    const collectionRate =
      totalInvoiced > 0 ? (totalRevenue / totalInvoiced) * 100 : 0;

    // Calculate average payment time
    const paidInvoicesWithDates = filteredData.invoices.filter((inv) => {
      const state = getComputedInvoiceState(inv);
      return state === "paid" && inv.paid_amount;
    });
    const avgPaymentTime =
      paidInvoicesWithDates.length > 0
        ? paidInvoicesWithDates.reduce((sum, inv) => {
            const daysDiff = Math.ceil(
              (new Date(inv.paid_amount!).getTime() -
                new Date(inv.issue_date).getTime()) /
                (1000 * 60 * 60 * 24),
            );
            return sum + daysDiff;
          }, 0) / paidInvoicesWithDates.length
        : 0;

    return {
      totalRevenue,
      totalInvoiced,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      outstandingAmount,
      averageInvoiceValue,
      collectionRate,
      avgPaymentTime,
      totalInvoices: filteredData.invoices.length,
      paidInvoices,
      overdueInvoices,
      activeClients: clients.filter(
        (client) =>
          (client.outstanding_balance || 0) > 0 || client.last_invoice_date,
      ).length,
    };
  }, [filteredData, clients]);

  // Monthly Revenue Trend
  const monthlyRevenueData = useMemo(() => {
    const monthlyData: {
      [key: string]: { revenue: number; invoiced: number; expenses: number };
    } = {};

    // Initialize months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      monthlyData[monthKey] = { revenue: 0, invoiced: 0, expenses: 0 };
    }

    filteredData.payments.forEach((payment) => {
      const month = new Date(payment.received_on).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      if (monthlyData[month]) {
        monthlyData[month].revenue += payment.amount;
      }
    });

    filteredData.invoices.forEach((invoice) => {
      const month = new Date(invoice.issue_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      if (monthlyData[month]) {
        monthlyData[month].invoiced += invoice.total;
      }
    });

    filteredData.expenses.forEach((expense) => {
      const month = new Date(expense.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      if (monthlyData[month]) {
        monthlyData[month].expenses += expense.amount;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
      profit: data.revenue - data.expenses,
    }));
  }, [filteredData]);

  // Invoice Status Distribution
  const invoiceStatusData = useMemo(() => {
    const statusCounts = filteredData.invoices.reduce(
      (acc, invoice) => {
        const state = getComputedInvoiceState(invoice);
        acc[state] = (acc[state] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number },
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      percentage: (count / filteredData.invoices.length) * 100,
    }));
  }, [filteredData.invoices]);

  // Top Clients Analysis
  const topClientsData = useMemo(() => {
    const clientMetrics: {
      [key: string]: {
        revenue: number;
        invoiceCount: number;
        avgInvoiceValue: number;
        outstandingAmount: number;
        avgPaymentTime: number;
      };
    } = {};

    // Create a map of client ID to client name for quick lookup
    const clientMap =
      clients.length &&
      clients.reduce(
        (acc, client) => {
          if (client && client.id) acc[client.id] = client.name;
          return acc;
        },
        {} as { [key: string]: string },
      );

    filteredData.invoices.forEach((invoice) => {
      const clientName =
        (clientMap && clientMap[invoice.client_id]) || "Unknown Client";

      if (!clientMetrics[clientName]) {
        clientMetrics[clientName] = {
          revenue: 0,
          invoiceCount: 0,
          avgInvoiceValue: 0,
          outstandingAmount: 0,
          avgPaymentTime: 0,
        };
      }

      clientMetrics[clientName].invoiceCount++;
      clientMetrics[clientName].avgInvoiceValue += invoice.total;

      if (invoice.status === "paid") {
        clientMetrics[clientName].revenue += invoice.total;
        if (invoice.paid_amount) {
          const paymentDays = Math.ceil(
            (new Date(invoice.paid_amount).getTime() -
              new Date(invoice.issue_date).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          clientMetrics[clientName].avgPaymentTime += paymentDays;
        }
      } else if (invoice.status !== "cancelled") {
        clientMetrics[clientName].outstandingAmount +=
          invoice.total - (invoice.paid_amount || 0);
      }
    });

    return Object.entries(clientMetrics)
      .map(([name, metrics]) => ({
        name,
        revenue: metrics.revenue,
        invoiceCount: metrics.invoiceCount,
        avgInvoiceValue:
          metrics.invoiceCount > 0
            ? metrics.avgInvoiceValue / metrics.invoiceCount
            : 0,
        outstandingAmount: metrics.outstandingAmount,
        avgPaymentTime:
          metrics.invoiceCount > 0
            ? metrics.avgPaymentTime / metrics.invoiceCount
            : 0,
        profitability:
          metrics.avgInvoiceValue > 0
            ? (metrics.revenue / metrics.avgInvoiceValue) * 100
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredData.invoices, clients]);

  // Payment Method Analysis
  const paymentMethodData = useMemo(() => {
    const methodCounts = filteredData.payments.reduce(
      (acc, payment) => {
        const method = payment.method
          .replace("_", " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        acc[method] = (acc[method] || 0) + payment.amount;
        return acc;
      },
      {} as { [key: string]: number },
    );

    return Object.entries(methodCounts).map(([method, amount]) => ({
      method,
      amount,
      percentage: (amount / kpis.totalRevenue) * 100,
    }));
  }, [filteredData.payments, kpis.totalRevenue]);

  // Invoice Value Distribution
  const invoiceValueDistribution = useMemo(() => {
    const ranges = [
      { min: 0, max: 500, label: "$0-$500" },
      { min: 500, max: 1000, label: "$500-$1K" },
      { min: 1000, max: 2500, label: "$1K-$2.5K" },
      { min: 2500, max: 5000, label: "$2.5K-$5K" },
      { min: 5000, max: 10000, label: "$5K-$10K" },
      { min: 10000, max: Infinity, label: "$10K+" },
    ];

    return ranges
      .map((range) => {
        const count = filteredData.invoices.filter(
          (inv) => inv.total >= range.min && inv.total < range.max,
        ).length;

        return {
          range: range.label,
          count,
          percentage: (count / filteredData.invoices.length) * 100,
        };
      })
      .filter((item) => item.count > 0);
  }, [filteredData.invoices]);

  // Seasonal Trends
  const seasonalData = useMemo(() => {
    const quarters = ["Q1", "Q2", "Q3", "Q4"];
    const currentYear = new Date().getFullYear();

    return quarters.map((quarter, index) => {
      const startMonth = index * 3;
      const endMonth = startMonth + 2;

      const quarterInvoices = filteredData.invoices.filter((inv) => {
        const invoiceDate = new Date(inv.issue_date);
        return (
          invoiceDate.getFullYear() === currentYear &&
          invoiceDate.getMonth() >= startMonth &&
          invoiceDate.getMonth() <= endMonth
        );
      });

      const quarterPayments = filteredData.payments.filter((pay) => {
        const paymentDate = new Date(pay.received_on);
        return (
          paymentDate.getFullYear() === currentYear &&
          paymentDate.getMonth() >= startMonth &&
          paymentDate.getMonth() <= endMonth
        );
      });

      return {
        quarter,
        invoiced: quarterInvoices.reduce((sum, inv) => sum + inv.total, 0),
        revenue: quarterPayments.reduce((sum, pay) => sum + pay.amount, 0),
        invoiceCount: quarterInvoices.length,
      };
    });
  }, [filteredData]);

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
  ];

  const exportData = () => {
    const exportData = {
      dateRange,
      generatedAt: new Date().toISOString(),
      kpis,
      monthlyRevenue: monthlyRevenueData,
      topClients: topClientsData,
      invoiceStatus: invoiceStatusData,
      paymentMethods: paymentMethodData,
      invoiceValueDistribution,
      seasonalTrends: seasonalData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `business-insights-${dateRange}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
          Business Insights
        </h1>
        <div className="flex items-center gap-4">
          <Select
            value={dateRange}
            onValueChange={(value: any) => setDateRange(value)}
          >
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="6m">Last 6 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={chartType}
            onValueChange={(value: any) => setChartType(value)}
          >
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Revenue Focus</SelectItem>
              <SelectItem value="clients">Client Analysis</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="trends">Trends</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={exportData}
            variant="outline"
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(kpis.totalRevenue)}
            </div>
            <div className="text-xs text-gray-500">
              Collection Rate: {kpis.collectionRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${kpis.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {formatCurrency(kpis.netProfit)}
            </div>
            <div className="text-xs text-gray-500">
              Margin:{" "}
              {kpis.totalRevenue > 0
                ? ((kpis.netProfit / kpis.totalRevenue) * 100).toFixed(1)
                : 0}
              %
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Avg Invoice Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(kpis.averageInvoiceValue)}
            </div>
            <div className="text-xs text-gray-500">
              {kpis.totalInvoices} total invoices
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Avg Payment Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(kpis.avgPaymentTime)} days
            </div>
            <div className="text-xs text-gray-500">
              {kpis.paidInvoices} paid invoices
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Grid */}
      {chartType === "revenue" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Revenue Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue vs Expenses Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stackId="2"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                    name="Expenses"
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Net Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Invoice Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={invoiceStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) =>
                      `${name} ${percentage.toFixed(1)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {invoiceStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentMethodData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="method" type="category" width={100} />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {chartType === "clients" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Clients by Revenue */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Top Clients Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topClientsData.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => {
                      if (
                        name === "revenue" ||
                        name === "avgInvoiceValue" ||
                        name === "outstandingAmount"
                      ) {
                        return formatCurrency(value as number);
                      }
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  <Bar
                    dataKey="outstandingAmount"
                    fill="#f59e0b"
                    name="Outstanding"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Client Profitability Scatter */}
          <Card>
            <CardHeader>
              <CardTitle>Client Value vs Payment Speed</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart data={topClientsData}>
                  <CartesianGrid />
                  <XAxis dataKey="avgPaymentTime" name="Avg Payment Days" />
                  <YAxis dataKey="avgInvoiceValue" name="Avg Invoice Value" />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "Avg Invoice Value")
                        return formatCurrency(value as number);
                      return `${value} days`;
                    }}
                  />
                  <Scatter dataKey="avgInvoiceValue" fill="#8b5cf6" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Invoice Value Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Value Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={invoiceValueDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {chartType === "performance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Collection Rate Gauge */}
          <Card>
            <CardHeader>
              <CardTitle>Collection Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="90%"
                  data={[
                    {
                      name: "Collection Rate",
                      value: kpis.collectionRate,
                      fill:
                        kpis.collectionRate > 80
                          ? "#10b981"
                          : kpis.collectionRate > 60
                            ? "#f59e0b"
                            : "#ef4444",
                    },
                  ]}
                >
                  <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-2xl font-bold"
                  >
                    {kpis.collectionRate.toFixed(1)}%
                  </text>
                </RadialBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Seasonal Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={seasonalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Legend />
                  <Bar dataKey="invoiced" fill="#3b82f6" name="Invoiced" />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {kpis.paidInvoices}
                  </div>
                  <div className="text-sm text-gray-600">Paid Invoices</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">
                    {kpis.overdueInvoices}
                  </div>
                  <div className="text-sm text-gray-600">Overdue Invoices</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {kpis.activeClients}
                  </div>
                  <div className="text-sm text-gray-600">Active Clients</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <DollarSign className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(kpis.outstandingAmount)}
                  </div>
                  <div className="text-sm text-gray-600">Outstanding</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {chartType === "trends" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Growth Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Revenue Growth Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="invoiced"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Invoiced"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Invoice Count */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Invoice Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={monthlyRevenueData.map((item) => ({
                    month: item.month,
                    count: filteredData.invoices.filter(
                      (inv) =>
                        new Date(inv.issue_date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                        }) === item.month,
                    ).length,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Growth Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>Growth Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyRevenueData.slice(-2).length === 2 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Revenue Growth
                      </span>
                      <Badge
                        className={
                          monthlyRevenueData[monthlyRevenueData.length - 1]
                            .revenue >
                          monthlyRevenueData[monthlyRevenueData.length - 2]
                            .revenue
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {monthlyRevenueData[monthlyRevenueData.length - 2]
                          .revenue > 0
                          ? (
                              ((monthlyRevenueData[
                                monthlyRevenueData.length - 1
                              ].revenue -
                                monthlyRevenueData[
                                  monthlyRevenueData.length - 2
                                ].revenue) /
                                monthlyRevenueData[
                                  monthlyRevenueData.length - 2
                                ].revenue) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Client Growth
                      </span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {clients.length} total
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Avg Deal Size
                      </span>
                      <Badge className="bg-purple-100 text-purple-800">
                        {formatCurrency(kpis.averageInvoiceValue)}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topClientsData.slice(0, 5).map((client, index) => (
                <div
                  key={client.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-gray-600">
                      {client.invoiceCount} invoices •{" "}
                      {Math.round(client.avgPaymentTime)} days avg
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">
                      {formatCurrency(client.revenue)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(client.avgInvoiceValue)} avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Business Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Collection Rate</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, kpis.collectionRate)}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {kpis.collectionRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Payment Speed</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className={`h-2 rounded-full ${kpis.avgPaymentTime <= 30 ? "bg-green-500" : kpis.avgPaymentTime <= 45 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{
                        width: `${Math.max(10, Math.min(100, 100 - (kpis.avgPaymentTime / 60) * 100))}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {Math.round(kpis.avgPaymentTime)} days
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm">Client Retention</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (kpis.activeClients / Math.max(1, clients.length)) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">
                    {(
                      (kpis.activeClients / Math.max(1, clients.length)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
