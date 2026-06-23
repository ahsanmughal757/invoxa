"use client"

import { useState, useMemo, useRef } from 'react'
import { Invoice, PaymentRecord, Expense, Client } from '@/types/invoice'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, DollarSign, Users, FileText, Download, Calendar, Target, Loader2, FileCheck } from 'lucide-react'
import html2pdf from 'html2pdf.js'
import { ReportTemplateRenderer, ReportTemplateId, ReportData } from './templates/template-registry'
import { ReportTemplateSelector } from './templates/template-selector'

interface ReportsAnalyticsProps {
  invoices: (Invoice | any)[]
  payments: PaymentRecord[]
  expenses: Expense[]
  clients: Client[]
  loading?: boolean
}

export function ReportsAnalytics({ invoices, payments, expenses, clients, loading = false }: ReportsAnalyticsProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d')
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplateId>('professional')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const pdfContentRef = useRef<HTMLDivElement>(null)

  const getDateRangeFilter = (range: string) => {
    const now = new Date()
    switch (range) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      default:
        return new Date(0)
    }
  }

  const filteredData = useMemo(() => {
    const startDate = getDateRangeFilter(dateRange)
    
    return {
      invoices: invoices.filter(inv => new Date(inv.issue_date) >= startDate),
      payments: payments.filter(pay => new Date(pay.received_on) >= startDate),
      expenses: expenses.filter(exp => new Date(exp.date) >= startDate)
    }
  }, [invoices, payments, expenses, dateRange])

  // Key Metrics - Using DB-computed values
  const metrics = useMemo(() => {
    const totalRevenue = filteredData.payments.reduce((sum, payment) => sum + payment.amount, 0)
    const totalExpenses = filteredData.expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalInvoiced = filteredData.invoices.reduce((sum, invoice) => sum + invoice.total, 0)
    // Use DB-computed remaining_amount instead of calculating on client side
    const outstandingAmount = filteredData.invoices
      .filter(inv => {
        // Use the computed status from DB instead of client-side calculation
        const computedStatus = inv.computed_status || inv.status;
        return computedStatus !== 'paid' && computedStatus !== 'cancelled' && computedStatus !== 'void';
      })
      .reduce((sum, invoice) => sum + (invoice.remaining_amount || (invoice.total - (invoice.paid_amount || 0))), 0)

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      totalInvoiced,
      outstandingAmount,
      averageInvoiceValue: filteredData.invoices.length > 0 ? totalInvoiced / filteredData.invoices.length : 0,
      collectionRate: totalInvoiced > 0 ? (totalRevenue / totalInvoiced) * 100 : 0
    }
  }, [filteredData])

  // Monthly Revenue Chart Data
  const monthlyRevenueData = useMemo(() => {
    const monthlyData: { [key: string]: number } = {}
    
    filteredData.payments.forEach(payment => {
      const month = new Date(payment.received_on).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      monthlyData[month] = (monthlyData[month] || 0) + payment.amount
    })

    return Object.entries(monthlyData).map(([month, amount]) => ({
      month,
      revenue: amount
    })).slice(-12);
  }, [filteredData.payments])

  // Invoice Status Distribution - Using DB-computed status
  const invoiceStatusData = useMemo(() => {
    const statusCounts: { [key: string]: number } = filteredData.invoices.reduce((acc, invoice) => {
      // Use the computed status from DB instead of client-side calculation
      const computedStatus = invoice.computed_status || invoice.status;
      acc[computedStatus] = (acc[computedStatus] || 0) + 1
      return acc
    }, {} as { [key: string]: number });

    const invoiceStatusData: { name: string; value: number }[] = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count
    }));
    return invoiceStatusData;
  }, [filteredData.invoices])

  // Top Clients by Revenue - Using DB-computed status
  const topClients = useMemo(() => {
    const clientRevenue: { [key: string]: number } = {}

    filteredData.invoices.forEach(invoice => {
      // Use the computed status from DB instead of client-side calculation
      const computedStatus = invoice.computed_status || invoice.status;
      if (computedStatus === 'paid') {
        const clientName = invoice.additional_info?.temp_client?.name ||
          clients.find(client => client.id === invoice.client_id)?.name;
        if (clientName) {
          clientRevenue[clientName] = (clientRevenue[clientName] || 0) + invoice.total;
        }
      }
    })

    return Object.entries(clientRevenue)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredData.invoices, clients])

  // Expense Categories
  const expenseCategories = useMemo(() => {
    const categoryTotals: { [key: string]: number } = filteredData.expenses.reduce((acc, expense) => {
      acc[expense.category || 'uncategorized'] = (acc[expense.category || 'uncategorized'] || 0) + expense.amount
      return acc
    }, {} as { [key: string]: number });

    const expenseCategories: { category: string; amount: number }[] = Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount
    }));
    return expenseCategories;
  }, [filteredData.expenses])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  const exportReportToPdf = async () => {
    setIsGeneratingPdf(true)
    
    const reportData: ReportData = {
      dateRange,
      generatedAt: new Date().toISOString(),
      metrics,
      monthlyRevenue: monthlyRevenueData,
      invoiceStatus: invoiceStatusData,
      topClients,
      expenseCategories
    }

    try {
      // Create a temporary container for the PDF content
      const element = document.createElement('div')
      element.style.width = '100%'
      element.style.padding = '20px'
      element.style.backgroundColor = 'white'
      
      // Render the template into the container
      const templateContent = document.createElement('div')
      templateContent.innerHTML = `
        <div id="pdf-template-container">
          ${getReportHTML(reportData)}
        </div>
      `
      element.appendChild(templateContent)
      document.body.appendChild(element)

      // Configure PDF options
      const opt = {
        margin: 0,
        filename: `financial-report-${dateRange}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      }

      // Generate PDF
      await html2pdf().set(opt).from(element).save()
      
      // Clean up
      document.body.removeChild(element)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Helper function to generate HTML for PDF based on selected template
  const getReportHTML = (data: ReportData) => {
    const templateId = selectedTemplate
    
    // Common styles
    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; color: #1f2937; }
        .report-container { padding: 20px; background: white; }
        .header { border-bottom: 3px solid #3b82f6; padding-bottom: 15px; margin-bottom: 25px; }
        .header h1 { font-size: 28px; color: #1f2937; margin-bottom: 8px; }
        .header p { color: #6b7280; font-size: 14px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 18px; color: #3b82f6; margin-bottom: 12px; font-weight: 600; }
        .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
        .metric-card { padding: 15px; border-radius: 8px; border-left: 4px solid; }
        .metric-card.blue { background: #eff6ff; border-color: #3b82f6; }
        .metric-card.green { background: #f0fdf4; border-color: #10b981; }
        .metric-card.orange { background: #fff7ed; border-color: #f59e0b; }
        .metric-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .metric-value.blue { color: #3b82f6; }
        .metric-value.green { color: #10b981; }
        .metric-value.orange { color: #f59e0b; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
        th { background: #f3f4f6; font-weight: 600; }
        .text-right { text-align: right; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
      </style>
    `

    // Generate template-specific HTML
    let templateHTML = ''
    
    if (templateId === 'executive_summary') {
      const totalInvoices = data.invoiceStatus.reduce((sum, item) => sum + item.value, 0)
      templateHTML = `
        <div class="report-container">
          <div class="header" style="text-align: center; border-bottom: 2px solid #1f2937;">
            <h1 style="font-size: 36px; font-weight: 300;">Financial Report</h1>
            <p style="font-size: 16px; color: #6b7280;">Executive Summary</p>
            <p style="margin-top: 15px;">Period: ${data.dateRange.toUpperCase()} | Generated: ${formatDate(new Date(data.generatedAt))}</p>
          </div>
          
          <div class="section">
            <h2 class="section-title" style="color: #1f2937; text-transform: uppercase; font-size: 14px; letter-spacing: 2px;">Financial Highlights</h2>
            <div class="metrics-grid" style="grid-template-columns: repeat(2, 1fr);">
              <div class="metric-card" style="background: #f9fafb;">
                <div class="metric-label">Total Revenue</div>
                <div class="metric-value" style="color: #1f2937;">${formatCurrency(data.metrics.totalRevenue)}</div>
              </div>
              <div class="metric-card" style="background: #f9fafb;">
                <div class="metric-label">Net Profit</div>
                <div class="metric-value" style="color: #10b981;">${formatCurrency(data.metrics.netProfit)}</div>
              </div>
              <div class="metric-card" style="background: #f9fafb;">
                <div class="metric-label">Total Expenses</div>
                <div class="metric-value" style="color: #ef4444;">${formatCurrency(data.metrics.totalExpenses)}</div>
              </div>
              <div class="metric-card" style="background: #f9fafb;">
                <div class="metric-label">Outstanding</div>
                <div class="metric-value" style="color: #f59e0b;">${formatCurrency(data.metrics.outstandingAmount)}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title" style="color: #1f2937; text-transform: uppercase; font-size: 14px; letter-spacing: 2px;">Performance Metrics</h2>
            <table>
              <tr><td>Total Invoiced</td><td class="text-right"><strong>${formatCurrency(data.metrics.totalInvoiced)}</strong></td></tr>
              <tr><td>Average Invoice Value</td><td class="text-right"><strong>${formatCurrency(data.metrics.averageInvoiceValue)}</strong></td></tr>
              <tr><td>Collection Rate</td><td class="text-right"><strong>${data.metrics.collectionRate.toFixed(1)}%</strong></td></tr>
              <tr><td>Profit Margin</td><td class="text-right"><strong>${data.metrics.totalRevenue > 0 ? ((data.metrics.netProfit / data.metrics.totalRevenue) * 100).toFixed(1) : 0}%</strong></td></tr>
            </table>
          </div>
          
          <div class="section">
            <h2 class="section-title" style="color: #1f2937; text-transform: uppercase; font-size: 14px; letter-spacing: 2px;">Invoice Overview</h2>
            <p style="margin-bottom: 10px;">Total Invoices: <strong>${totalInvoices}</strong></p>
            <table>
              ${data.invoiceStatus.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td class="text-right">${item.value}</td>
                </tr>
              `).join('')}
            </table>
          </div>
          
          <div class="section">
            <h2 class="section-title" style="color: #1f2937; text-transform: uppercase; font-size: 14px; letter-spacing: 2px;">Top Clients</h2>
            <table>
              ${data.topClients.map((item, index) => `
                <tr>
                  <td>${index + 1}. ${item.name}</td>
                  <td class="text-right"><strong>${formatCurrency(item.revenue)}</strong></td>
                </tr>
              `).join('')}
            </table>
          </div>
          
          <div class="footer">
            <p>InvoicePro Financial Report | Confidential</p>
          </div>
        </div>
      `
    } else if (templateId === 'detailed_analytics') {
      const totalInvoices = data.invoiceStatus.reduce((sum, item) => sum + item.value, 0)
      const totalExpenses = data.expenseCategories.reduce((sum, item) => sum + item.amount, 0)
      
      templateHTML = `
        <div class="report-container" style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); color: white; margin: -20px -20px 20px -20px; padding: 20px;">
          <h1 style="font-size: 28px; margin-bottom: 5px;">Analytics Report</h1>
          <p style="opacity: 0.9;">${data.dateRange.toUpperCase()} | ${formatDate(new Date(data.generatedAt))}</p>
        </div>
        
        <div class="metrics-grid" style="grid-template-columns: repeat(4, 1fr); gap: 10px;">
          <div class="metric-card blue">
            <div class="metric-label">Revenue</div>
            <div class="metric-value blue">${formatCurrency(data.metrics.totalRevenue)}</div>
          </div>
          <div class="metric-card green">
            <div class="metric-label">Net Profit</div>
            <div class="metric-value green">${formatCurrency(data.metrics.netProfit)}</div>
          </div>
          <div class="metric-card" style="background: #f5f3ff; border-color: #8b5cf6;">
            <div class="metric-label" style="color: #7c3aed;">Invoiced</div>
            <div class="metric-value" style="color: #7c3aed;">${formatCurrency(data.metrics.totalInvoiced)}</div>
          </div>
          <div class="metric-card orange">
            <div class="metric-label">Outstanding</div>
            <div class="metric-value orange">${formatCurrency(data.metrics.outstandingAmount)}</div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title" style="display: flex; align-items: center;">
            <span style="width: 8px; height: 24px; background: #10b981; margin-right: 8px;"></span>
            Performance Metrics
          </h2>
          <table>
            <thead><tr><th>Metric</th><th class="text-right">Value</th><th class="text-right">Status</th></tr></thead>
            <tbody>
              <tr><td>Total Revenue</td><td class="text-right"><strong>${formatCurrency(data.metrics.totalRevenue)}</strong></td><td class="text-right">✓</td></tr>
              <tr><td>Total Expenses</td><td class="text-right"><strong>${formatCurrency(data.metrics.totalExpenses)}</strong></td><td class="text-right">${data.metrics.totalExpenses <= data.metrics.totalRevenue ? '✓' : '⚠'}</td></tr>
              <tr><td>Net Profit</td><td class="text-right"><strong>${formatCurrency(data.metrics.netProfit)}</strong></td><td class="text-right">${data.metrics.netProfit >= 0 ? '✓' : '✗'}</td></tr>
              <tr><td>Collection Rate</td><td class="text-right"><strong>${data.metrics.collectionRate.toFixed(1)}%</strong></td><td class="text-right">${data.metrics.collectionRate >= 80 ? '✓' : '⚠'}</td></tr>
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2 class="section-title" style="display: flex; align-items: center;">
            <span style="width: 8px; height: 24px; background: #10b981; margin-right: 8px;"></span>
            Invoice Status Analysis
          </h2>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
            <p style="margin-bottom: 10px; color: #6b7280;">Total Invoices: <strong>${totalInvoices}</strong></p>
            ${data.invoiceStatus.map(item => {
              const percentage = totalInvoices > 0 ? (item.value / totalInvoices) * 100 : 0
              const barColor = item.name.toLowerCase().includes('paid') ? '#10b981' : 
                               item.name.toLowerCase().includes('pending') ? '#f59e0b' : 
                               item.name.toLowerCase().includes('overdue') ? '#ef4444' : '#3b82f6'
              return `
                <div style="margin-bottom: 10px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-weight: 600;">${item.name}</span>
                    <span>${item.value} (${percentage.toFixed(1)}%)</span>
                  </div>
                  <div style="background: #e5e7eb; height: 12px; border-radius: 6px; overflow: hidden;">
                    <div style="background: ${barColor}; height: 100%; width: ${percentage}%;"></div>
                  </div>
                </div>
              `
            }).join('')}
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title" style="display: flex; align-items: center;">
            <span style="width: 8px; height: 24px; background: #10b981; margin-right: 8px;"></span>
            Top Clients by Revenue
          </h2>
          <table>
            <thead><tr><th>Rank</th><th>Client</th><th class="text-right">Revenue</th></tr></thead>
            <tbody>
              ${data.topClients.map((item, index) => `
                <tr>
                  <td><span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: ${index === 0 ? '#fbbf24' : index === 1 ? '#d1d5db' : index === 2 ? '#d97706' : '#e5e7eb'}; font-size: 11px; font-weight: bold;">${index + 1}</span></td>
                  <td><strong>${item.name}</strong></td>
                  <td class="text-right"><strong>${formatCurrency(item.revenue)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer" style="border-color: #10b981;">
          <p>Generated by InvoicePro Analytics | ${formatDate(new Date(data.generatedAt))}</p>
        </div>
      `
    } else {
      // Professional template (default)
      templateHTML = `
        <div class="report-container">
          <div class="header">
            <h1>Financial Report</h1>
            <p>Period: ${data.dateRange.toUpperCase()} | Generated: ${formatDate(new Date(data.generatedAt))}</p>
          </div>
          
          <div class="section">
            <h2 class="section-title">Executive Summary</h2>
            <div class="metrics-grid">
              <div class="metric-card blue">
                <div class="metric-label">Total Revenue</div>
                <div class="metric-value blue">${formatCurrency(data.metrics.totalRevenue)}</div>
              </div>
              <div class="metric-card green">
                <div class="metric-label">Net Profit</div>
                <div class="metric-value green">${formatCurrency(data.metrics.netProfit)}</div>
              </div>
              <div class="metric-card orange">
                <div class="metric-label">Outstanding</div>
                <div class="metric-value orange">${formatCurrency(data.metrics.outstandingAmount)}</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">Key Metrics</h2>
            <table>
              <thead><tr><th>Metric</th><th class="text-right">Value</th></tr></thead>
              <tbody>
                <tr><td>Total Invoiced</td><td class="text-right">${formatCurrency(data.metrics.totalInvoiced)}</td></tr>
                <tr><td>Total Revenue</td><td class="text-right">${formatCurrency(data.metrics.totalRevenue)}</td></tr>
                <tr><td>Total Expenses</td><td class="text-right">${formatCurrency(data.metrics.totalExpenses)}</td></tr>
                <tr><td>Net Profit</td><td class="text-right">${formatCurrency(data.metrics.netProfit)}</td></tr>
                <tr><td>Average Invoice Value</td><td class="text-right">${formatCurrency(data.metrics.averageInvoiceValue)}</td></tr>
                <tr><td>Collection Rate</td><td class="text-right">${data.metrics.collectionRate.toFixed(1)}%</td></tr>
                <tr><td>Outstanding Amount</td><td class="text-right">${formatCurrency(data.metrics.outstandingAmount)}</td></tr>
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <h2 class="section-title">Monthly Revenue</h2>
            <table>
              <thead><tr><th>Month</th><th class="text-right">Revenue</th></tr></thead>
              <tbody>
                ${data.monthlyRevenue.map(item => `
                  <tr><td>${item.month}</td><td class="text-right">${formatCurrency(item.revenue)}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <h2 class="section-title">Invoice Status Distribution</h2>
            <table>
              <thead><tr><th>Status</th><th class="text-right">Count</th><th class="text-right">Percentage</th></tr></thead>
              <tbody>
                ${(() => {
                  const total = data.invoiceStatus.reduce((sum, item) => sum + item.value, 0)
                  return data.invoiceStatus.map(item => `
                    <tr><td>${item.name}</td><td class="text-right">${item.value}</td><td class="text-right">${total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%</td></tr>
                  `).join('')
                })()}
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <h2 class="section-title">Top Clients by Revenue</h2>
            <table>
              <thead><tr><th>Client</th><th class="text-right">Revenue</th></tr></thead>
              <tbody>
                ${data.topClients.map(item => `
                  <tr><td>${item.name}</td><td class="text-right">${formatCurrency(item.revenue)}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <h2 class="section-title">Expenses by Category</h2>
            <table>
              <thead><tr><th>Category</th><th class="text-right">Amount</th></tr></thead>
              <tbody>
                ${data.expenseCategories.map(item => `
                  <tr><td>${item.category}</td><td class="text-right">${formatCurrency(item.amount)}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="footer">
            <p>Report generated by InvoicePro | ${formatDate(new Date(data.generatedAt))}</p>
          </div>
        </div>
      `
    }

    return styles + templateHTML
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="h-8 w-8 mr-3 text-blue-600" />
          Reports & Analytics
        </h1>
        <div className="flex items-center gap-4 flex-wrap">
          <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <ReportTemplateSelector
            selectedTemplate={selectedTemplate}
            onTemplateChange={setSelectedTemplate}
          />
          <Button 
            onClick={exportReportToPdf} 
            variant="outline" 
            className="flex items-center"
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalRevenue)}</div>
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
            <div className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.netProfit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.outstandingAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Collection Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.collectionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {invoiceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Top Clients by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topClients} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={expenseCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="amount" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Invoiced:</span>
              <span className="font-medium">{formatCurrency(metrics.totalInvoiced)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Revenue:</span>
              <span className="font-medium text-green-600">{formatCurrency(metrics.totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Expenses:</span>
              <span className="font-medium text-red-600">{formatCurrency(metrics.totalExpenses)}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-600">Net Profit:</span>
              <span className={`font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(metrics.netProfit)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Invoices:</span>
              <span className="font-medium">{filteredData.invoices.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Average Value:</span>
              <span className="font-medium">{formatCurrency(metrics.averageInvoiceValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Collection Rate:</span>
              <span className="font-medium">{metrics.collectionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Outstanding:</span>
              <span className="font-medium text-orange-600">{formatCurrency(metrics.outstandingAmount)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Clients:</span>
              <span className="font-medium">{clients.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Clients:</span>
              <span className="font-medium">
                {clients.filter(client => (client.outstanding_balance || 0) > 0 || client.last_invoice_date).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg. Client Value:</span>
              <span className="font-medium">
                {formatCurrency(clients.length > 0 ? clients.reduce((sum, client) => sum + (client.total_paid || 0), 0) / clients.length : 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}