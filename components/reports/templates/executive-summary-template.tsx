import React from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ReportData {
  dateRange: string;
  generatedAt: string;
  metrics: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    totalInvoiced: number;
    outstandingAmount: number;
    averageInvoiceValue: number;
    collectionRate: number;
  };
  monthlyRevenue: { month: string; revenue: number }[];
  invoiceStatus: { name: string; value: number }[];
  topClients: { name: string; revenue: number }[];
  expenseCategories: { category: string; amount: number }[];
}

interface ExecutiveSummaryTemplateProps {
  reportData: ReportData;
}

export const ExecutiveSummaryTemplate: React.FC<ExecutiveSummaryTemplateProps> = ({ reportData }) => {
  const { metrics, monthlyRevenue, invoiceStatus, topClients } = reportData;
  const totalInvoices = invoiceStatus.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="report-template executive bg-white p-10 font-sans text-gray-900">
      {/* Title Page Style Header */}
      <div className="text-center mb-12 pb-8 border-b-2 border-gray-800">
        <h1 className="text-5xl font-light text-gray-900 mb-4 tracking-tight">Financial Report</h1>
        <p className="text-xl text-gray-500 font-light">Executive Summary</p>
        <div className="mt-6 text-gray-600">
          <p>Reporting Period: <span className="font-medium">{reportData.dateRange.toUpperCase()}</span></p>
          <p>Generated: <span className="font-medium">{formatDate(new Date(reportData.generatedAt))}</span></p>
        </div>
      </div>

      {/* Financial Highlights */}
      <div className="mb-12">
        <h2 className="text-2xl font-light text-gray-800 mb-6 uppercase tracking-wider">Financial Highlights</h2>
        <div className="grid grid-cols-2 gap-8">
          <div className="p-6 bg-gray-50">
            <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">Total Revenue</p>
            <p className="text-4xl font-light text-gray-900">{formatCurrency(metrics.totalRevenue)}</p>
          </div>
          <div className="p-6 bg-gray-50">
            <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">Net Profit</p>
            <p className="text-4xl font-light text-green-600">{formatCurrency(metrics.netProfit)}</p>
          </div>
          <div className="p-6 bg-gray-50">
            <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">Total Expenses</p>
            <p className="text-4xl font-light text-red-600">{formatCurrency(metrics.totalExpenses)}</p>
          </div>
          <div className="p-6 bg-gray-50">
            <p className="text-gray-500 text-sm uppercase tracking-wide mb-2">Outstanding</p>
            <p className="text-4xl font-light text-orange-600">{formatCurrency(metrics.outstandingAmount)}</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="mb-12">
        <h2 className="text-2xl font-light text-gray-800 mb-6 uppercase tracking-wider">Performance Metrics</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-4 border-b border-gray-200">
            <span className="text-gray-600">Total Invoiced</span>
            <span className="text-xl font-medium">{formatCurrency(metrics.totalInvoiced)}</span>
          </div>
          <div className="flex justify-between items-center py-4 border-b border-gray-200">
            <span className="text-gray-600">Average Invoice Value</span>
            <span className="text-xl font-medium">{formatCurrency(metrics.averageInvoiceValue)}</span>
          </div>
          <div className="flex justify-between items-center py-4 border-b border-gray-200">
            <span className="text-gray-600">Collection Rate</span>
            <span className="text-xl font-medium">{metrics.collectionRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center py-4 border-b border-gray-200">
            <span className="text-gray-600">Profit Margin</span>
            <span className="text-xl font-medium">
              {metrics.totalRevenue > 0 ? ((metrics.netProfit / metrics.totalRevenue) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Invoice Overview */}
      <div className="mb-12">
        <h2 className="text-2xl font-light text-gray-800 mb-6 uppercase tracking-wider">Invoice Overview</h2>
        <div className="bg-gray-50 p-6">
          <p className="text-gray-600 mb-4">Total Invoices: <span className="font-medium text-gray-900">{totalInvoices}</span></p>
          <div className="space-y-3">
            {invoiceStatus.map((item) => (
              <div key={item.name} className="flex justify-between items-center">
                <span className="text-gray-700">{item.name}</span>
                <div className="flex items-center gap-4">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-800 h-2 rounded-full"
                      style={{ width: `${totalInvoices > 0 ? (item.value / totalInvoices) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-gray-900 font-medium w-16 text-right">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="mb-12">
        <h2 className="text-2xl font-light text-gray-800 mb-6 uppercase tracking-wider">Top Clients</h2>
        <div className="space-y-3">
          {topClients.map((item, index) => (
            <div key={item.name} className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <span className="text-gray-400 font-light w-6">{index + 1}.</span>
                <span className="text-gray-900">{item.name}</span>
              </div>
              <span className="text-lg font-medium text-gray-900">{formatCurrency(item.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Trend */}
      <div>
        <h2 className="text-2xl font-light text-gray-800 mb-6 uppercase tracking-wider">Revenue Trend</h2>
        <div className="space-y-3">
          {monthlyRevenue.slice(-6).map((item) => (
            <div key={item.month} className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-700">{item.month}</span>
              <span className="text-lg font-medium text-gray-900">{formatCurrency(item.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-gray-300 text-center text-gray-400 text-xs">
        <p>InvoicePro Financial Report | Confidential</p>
      </div>
    </div>
  );
};
