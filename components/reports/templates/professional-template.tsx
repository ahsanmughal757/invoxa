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

interface ProfessionalTemplateProps {
  reportData: ReportData;
}

export const ProfessionalTemplate: React.FC<ProfessionalTemplateProps> = ({ reportData }) => {
  const { metrics, monthlyRevenue, invoiceStatus, topClients, expenseCategories } = reportData;

  return (
    <div className="report-template professional bg-white p-8 font-sans text-gray-900">
      {/* Header */}
      <div className="border-b-4 border-blue-600 pb-6 mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Financial Report</h1>
        <p className="text-gray-600">
          Period: {reportData.dateRange.toUpperCase()} | Generated: {formatDate(new Date(reportData.generatedAt))}
        </p>
      </div>

      {/* Executive Summary */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-600 mb-4">Executive Summary</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-blue-50 p-5 rounded-lg border-l-4 border-blue-600">
            <p className="text-sm text-gray-600 uppercase tracking-wide">Total Revenue</p>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(metrics.totalRevenue)}</p>
          </div>
          <div className="bg-green-50 p-5 rounded-lg border-l-4 border-green-600">
            <p className="text-sm text-gray-600 uppercase tracking-wide">Net Profit</p>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(metrics.netProfit)}</p>
          </div>
          <div className="bg-orange-50 p-5 rounded-lg border-l-4 border-orange-600">
            <p className="text-sm text-gray-600 uppercase tracking-wide">Outstanding</p>
            <p className="text-3xl font-bold text-orange-600">{formatCurrency(metrics.outstandingAmount)}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Table */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-600 mb-4">Key Metrics</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Metric</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-3">Total Invoiced</td>
              <td className="border border-gray-300 px-4 py-3 text-right">{formatCurrency(metrics.totalInvoiced)}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 px-4 py-3">Total Revenue</td>
              <td className="border border-gray-300 px-4 py-3 text-right">{formatCurrency(metrics.totalRevenue)}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-3">Total Expenses</td>
              <td className="border border-gray-300 px-4 py-3 text-right">{formatCurrency(metrics.totalExpenses)}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 px-4 py-3">Net Profit</td>
              <td className="border border-gray-300 px-4 py-3 text-right">{formatCurrency(metrics.netProfit)}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-3">Average Invoice Value</td>
              <td className="border border-gray-300 px-4 py-3 text-right">{formatCurrency(metrics.averageInvoiceValue)}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 px-4 py-3">Collection Rate</td>
              <td className="border border-gray-300 px-4 py-3 text-right">{metrics.collectionRate.toFixed(1)}%</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-4 py-3">Outstanding Amount</td>
              <td className="border border-gray-300 px-4 py-3 text-right">{formatCurrency(metrics.outstandingAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Monthly Revenue */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-600 mb-4">Monthly Revenue</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Month</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {monthlyRevenue.map((item, index) => (
              <tr key={item.month} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                <td className="border border-gray-300 px-4 py-3">{item.month}</td>
                <td className="border border-gray-300 px-4 py-3 text-right">{formatCurrency(item.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoice Status Distribution */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-600 mb-4">Invoice Status Distribution</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Status</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Count</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Percentage</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const total = invoiceStatus.reduce((sum, item) => sum + item.value, 0);
              return invoiceStatus.map((item, index) => (
                <tr key={item.name} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="border border-gray-300 px-4 py-3">{item.name}</td>
                  <td className="border border-gray-300 px-4 py-3 text-right">{item.value}</td>
                  <td className="border border-gray-300 px-4 py-3 text-right">{total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%</td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {/* Top Clients */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-blue-600 mb-4">Top Clients by Revenue</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Client</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topClients.map((item, index) => (
              <tr key={item.name} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                <td className="border border-gray-300 px-4 py-3">{item.name}</td>
                <td className="border border-gray-300 px-4 py-3 text-right">{formatCurrency(item.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expense Categories */}
      <div>
        <h2 className="text-2xl font-semibold text-blue-600 mb-4">Expenses by Category</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Category</th>
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenseCategories.map((item, index) => (
              <tr key={item.category} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                <td className="border border-gray-300 px-4 py-3">{item.category}</td>
                <td className="border border-gray-300 px-4 py-3 text-right">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-gray-500 text-sm">
        <p>Report generated by InvoicePro | {formatDate(new Date(reportData.generatedAt))}</p>
      </div>
    </div>
  );
};
