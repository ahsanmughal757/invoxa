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

interface DetailedAnalyticsTemplateProps {
  reportData: ReportData;
}

export const DetailedAnalyticsTemplate: React.FC<DetailedAnalyticsTemplateProps> = ({ reportData }) => {
  const { metrics, monthlyRevenue, invoiceStatus, topClients, expenseCategories } = reportData;
  const totalInvoices = invoiceStatus.reduce((sum, item) => sum + item.value, 0);
  const totalExpenses = expenseCategories.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="report-template detailed bg-white p-6 font-sans text-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 mb-6 -mx-6 -mt-6">
        <h1 className="text-3xl font-bold mb-2">Analytics Report</h1>
        <p className="text-emerald-100">
          {reportData.dateRange.toUpperCase()} | {formatDate(new Date(reportData.generatedAt))}
        </p>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Revenue</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(metrics.totalRevenue)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded border border-green-200">
          <p className="text-xs text-green-600 uppercase font-semibold mb-1">Net Profit</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(metrics.netProfit)}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded border border-purple-200">
          <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Invoiced</p>
          <p className="text-2xl font-bold text-purple-700">{formatCurrency(metrics.totalInvoiced)}</p>
        </div>
        <div className="bg-amber-50 p-4 rounded border border-amber-200">
          <p className="text-xs text-amber-600 uppercase font-semibold mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-amber-700">{formatCurrency(metrics.outstandingAmount)}</p>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-emerald-700 mb-3 flex items-center">
          <span className="w-2 h-6 bg-emerald-600 mr-2"></span>
          Performance Metrics
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left">Metric</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Value</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Total Revenue</td>
              <td className="border border-gray-300 px-3 py-2 text-right font-medium">{formatCurrency(metrics.totalRevenue)}</td>
              <td className="border border-gray-300 px-3 py-2 text-right">✓</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 px-3 py-2">Total Expenses</td>
              <td className="border border-gray-300 px-3 py-2 text-right font-medium">{formatCurrency(metrics.totalExpenses)}</td>
              <td className="border border-gray-300 px-3 py-2 text-right">{metrics.totalExpenses <= metrics.totalRevenue ? '✓' : '⚠'}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Net Profit</td>
              <td className="border border-gray-300 px-3 py-2 text-right font-medium">{formatCurrency(metrics.netProfit)}</td>
              <td className="border border-gray-300 px-3 py-2 text-right">{metrics.netProfit >= 0 ? '✓' : '✗'}</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="border border-gray-300 px-3 py-2">Collection Rate</td>
              <td className="border border-gray-300 px-3 py-2 text-right font-medium">{metrics.collectionRate.toFixed(1)}%</td>
              <td className="border border-gray-300 px-3 py-2 text-right">{metrics.collectionRate >= 80 ? '✓' : '⚠'}</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2">Average Invoice</td>
              <td className="border border-gray-300 px-3 py-2 text-right font-medium">{formatCurrency(metrics.averageInvoiceValue)}</td>
              <td className="border border-gray-300 px-3 py-2 text-right">✓</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Monthly Revenue Breakdown */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-emerald-700 mb-3 flex items-center">
          <span className="w-2 h-6 bg-emerald-600 mr-2"></span>
          Monthly Revenue Breakdown
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left">Month</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Revenue</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Trend</th>
            </tr>
          </thead>
          <tbody>
            {monthlyRevenue.map((item, index, arr) => {
              const prev = arr[index - 1];
              const change = prev ? ((item.revenue - prev.revenue) / prev.revenue) * 100 : 0;
              return (
                <tr key={item.month} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="border border-gray-300 px-3 py-2">{item.month}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-medium">{formatCurrency(item.revenue)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    {prev && (
                      <span className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Invoice Status Analysis */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-emerald-700 mb-3 flex items-center">
          <span className="w-2 h-6 bg-emerald-600 mr-2"></span>
          Invoice Status Analysis
        </h2>
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <p className="text-sm text-gray-600 mb-3">Total Invoices: <span className="font-bold">{totalInvoices}</span></p>
          {invoiceStatus.map((item) => {
            const percentage = totalInvoices > 0 ? (item.value / totalInvoices) * 100 : 0;
            return (
              <div key={item.name} className="mb-3 last:mb-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.name}</span>
                  <span>{item.value} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      item.name.toLowerCase().includes('paid') ? 'bg-green-500' :
                      item.name.toLowerCase().includes('pending') ? 'bg-amber-500' :
                      item.name.toLowerCase().includes('overdue') ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Clients Analysis */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-emerald-700 mb-3 flex items-center">
          <span className="w-2 h-6 bg-emerald-600 mr-2"></span>
          Top Clients by Revenue
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left">Rank</th>
              <th className="border border-gray-300 px-3 py-2 text-left">Client</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Revenue</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const totalClientRevenue = topClients.reduce((sum, c) => sum + c.revenue, 0);
              return topClients.map((item, index) => (
                <tr key={item.name} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="border border-gray-300 px-3 py-2">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-amber-600 text-amber-100' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 font-medium">{item.name}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(item.revenue)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    {totalClientRevenue > 0 ? ((item.revenue / totalClientRevenue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ));
            })()}
          </tbody>
        </table>
      </div>

      {/* Expense Analysis */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-emerald-700 mb-3 flex items-center">
          <span className="w-2 h-6 bg-emerald-600 mr-2"></span>
          Expense Analysis by Category
        </h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left">Category</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Amount</th>
              <th className="border border-gray-300 px-3 py-2 text-right">% of Total</th>
              <th className="border border-gray-300 px-3 py-2 text-right">Visual</th>
            </tr>
          </thead>
          <tbody>
            {expenseCategories.map((item, index) => {
              const percentage = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;
              return (
                <tr key={item.category} className={index % 2 === 1 ? 'bg-gray-50' : ''}>
                  <td className="border border-gray-300 px-3 py-2 font-medium">{item.category}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{formatCurrency(item.amount)}</td>
                  <td className="border border-gray-300 px-3 py-2 text-right">{percentage.toFixed(1)}%</td>
                  <td className="border border-gray-300 px-3 py-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2 ml-auto">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded p-4 mt-6">
        <h3 className="font-bold text-emerald-800 mb-2">Report Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-emerald-600">Profit Margin</p>
            <p className="font-bold text-emerald-900">
              {metrics.totalRevenue > 0 ? ((metrics.netProfit / metrics.totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div>
            <p className="text-emerald-600">Collection Efficiency</p>
            <p className="font-bold text-emerald-900">{metrics.collectionRate.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-emerald-600">Expense Ratio</p>
            <p className="font-bold text-emerald-900">
              {metrics.totalRevenue > 0 ? ((metrics.totalExpenses / metrics.totalRevenue) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t-2 border-emerald-300 text-center text-gray-500 text-xs">
        <p>Generated by InvoicePro Analytics | {formatDate(new Date(reportData.generatedAt))}</p>
      </div>
    </div>
  );
};
