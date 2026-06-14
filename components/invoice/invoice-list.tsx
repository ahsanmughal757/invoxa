"use client"

import { useState } from 'react'
import { Invoice, Client } from '@/types/invoice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Plus, Eye, Edit, Trash2, Filter, FileText } from 'lucide-react'
import { InvoiceStateBadge } from './invoice-state-badge'
import { LoadingState, EmptyState, ErrorState, ReadyState } from '@/components/ui/state-components'

interface InvoiceListProps {
  invoices: (Invoice | any)[] // Accept both regular Invoice and extended InvoiceWithComputedFields
  clients: Client[]
  isLoading: boolean;
  isEmpty: boolean;
  isError: boolean;
  errorMessage: string | null;
  isReady: boolean;
  onCreateNew: () => void
  onView: (invoice: Invoice) => void
  onEdit: (invoice: Invoice) => void
  onDelete: (id: string) => void
  onDetails?: (invoice: Invoice) => void;
  onRetry?: () => void;
}

export function InvoiceList({ 
  invoices, 
  clients, 
  isLoading, 
  isEmpty, 
  isError, 
  errorMessage, 
  isReady, 
  onCreateNew, 
  onView, 
  onEdit, 
  onDelete, 
  onDetails,
  onRetry
}: InvoiceListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'client' | 'number' | 'issue_date' | 'total' | 'balance_due'>('issue_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc') // Default to descending for dates and amounts

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <span>Total Invoiced</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">...</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <span>Paid</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">...</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <span>Pending</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">...</div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Organization Invoices</CardTitle>
              <Button onClick={onCreateNew} className="flex items-center" disabled>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by client or invoice #..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter} disabled>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: any) => {
                setSortBy(value);
                // Reset to default sort order when changing sort field via dropdown
                if (['issue_date', 'total', 'balance_due'].includes(value)) {
                  setSortOrder('desc');
                } else {
                  setSortOrder('asc');
                }
              }} disabled>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Sort by Client</SelectItem>
                  <SelectItem value="number">Sort by Invoice #</SelectItem>
                  <SelectItem value="issue_date">Sort by Issue Date</SelectItem>
                  <SelectItem value="total">Sort by Total</SelectItem>
                  <SelectItem value="balance_due">Sort by Balance Due</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Balance Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <ErrorState 
        title="Failed to Load Invoices" 
        description={errorMessage || "There was an issue retrieving your invoices. Please try again later."}
        onRetry={onRetry}
      />
    );
  }

  // Empty State
  if (isEmpty) {
    return (
      <EmptyState 
        title="No Invoices Found" 
        description="Your organization doesn't have any invoices yet. Create your first invoice to get started."
        action={{
          text: "Create Invoice",
          onClick: onCreateNew
        }}
      />
    );
  }

  // Ready State - Process and display invoices
  if (isReady) {
    const getClientName = (clientId: string) => {
      return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
    }

    // Helper function to get invoice status (prefer DB-computed if available)
    const getInvoiceStatus = (invoice: any) => {
      // Use DB-computed status if available, otherwise fall back to client-side calculation
      return invoice.computed_status || invoice.status;
    }

    const filteredInvoices = invoices
      .filter(invoice => {
        const clientName = getClientName(invoice.client_id).toLowerCase();
        const matchesSearch =
          clientName.includes(searchTerm.toLowerCase()) ||
          invoice.number.toLowerCase().includes(searchTerm.toLowerCase())

        const invoiceState = getInvoiceStatus(invoice);
        const matchesStatus = statusFilter === 'all' || invoiceState === statusFilter

        return matchesSearch && matchesStatus
      })
      .map(invoice => ({
        ...invoice,
        balanceDue: invoice.total - (invoice.paid_amount || 0)
      }))
      .sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'client':
            const clientA = getClientName(a.client_id).toLowerCase();
            const clientB = getClientName(b.client_id).toLowerCase();
            comparison = clientA.localeCompare(clientB);
            break;
          case 'number':
            comparison = a.number.localeCompare(b.number);
            break;
          case 'issue_date':
            comparison = new Date(a.issue_date).getTime() - new Date(b.issue_date).getTime();
            break;
          case 'total':
            comparison = a.total - b.total;
            break;
          case 'balance_due':
            comparison = a.balanceDue - b.balanceDue;
            break;
          default:
            return 0;
        }

        // Apply sort order (ascending or descending)
        return sortOrder === 'asc' ? comparison : -comparison;
      })


    const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0)
    const paidAmount = filteredInvoices
      .filter(invoice => {
        const state = getInvoiceStatus(invoice);
        return state === 'paid';
      })
      .reduce((sum, invoice) => sum + (invoice.paid_amount || invoice.total), 0) // Use total if paid_amount is not available for paid invoices
    const pendingAmount = totalAmount - paidAmount

    return (
      <ReadyState>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <span>Total Invoiced</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <span>Paid</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                  <span>Pending</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(pendingAmount)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Organization Invoices</CardTitle>
                <Button onClick={onCreateNew} className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by client or invoice #..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value: any) => {
                  setSortBy(value);
                  // Reset to default sort order when changing sort field via dropdown
                  if (['issue_date', 'total', 'balance_due'].includes(value)) {
                    setSortOrder('desc');
                  } else {
                    setSortOrder('asc');
                  }
                }}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Sort by Client</SelectItem>
                    <SelectItem value="number">Sort by Invoice #</SelectItem>
                    <SelectItem value="issue_date">Sort by Issue Date</SelectItem>
                    <SelectItem value="total">Sort by Total</SelectItem>
                    <SelectItem value="balance_due">Sort by Balance Due</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invoices Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          if (sortBy === 'client') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('client');
                            setSortOrder('asc'); // Default to ascending for client names
                          }
                        }}
                      >
                        Client {sortBy === 'client' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          if (sortBy === 'number') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('number');
                            setSortOrder('asc'); // Default to ascending for invoice numbers
                          }
                        }}
                      >
                        Invoice # {sortBy === 'number' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          if (sortBy === 'issue_date') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('issue_date');
                            setSortOrder('desc'); // Default to descending for dates
                          }
                        }}
                      >
                        Issue Date {sortBy === 'issue_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          if (sortBy === 'total') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('total');
                            setSortOrder('desc'); // Default to descending for amounts
                          }
                        }}
                      >
                        Total {sortBy === 'total' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          if (sortBy === 'balance_due') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortBy('balance_due');
                            setSortOrder('desc'); // Default to descending for amounts
                          }
                        }}
                      >
                        Balance Due {sortBy === 'balance_due' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <FileText className="h-12 w-12 text-gray-400" />
                            <div className="text-center">
                              <h3 className="text-lg font-medium text-gray-900">No invoices</h3>
                              <p className="text-gray-500 mt-1">
                                Get started by creating your first invoice.
                              </p>
                            </div>
                            <Button onClick={onCreateNew} className="mt-2">
                              <Plus className="h-4 w-4 mr-2" />
                              Create Invoice
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => {
                        const paidAmount = invoice.paid_amount || 0;
                        const balanceDue = invoice.total - paidAmount;

                        return (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{getClientName(invoice.client_id)}</TableCell>
                            <TableCell>{invoice.number}</TableCell>
                            <TableCell>{formatDate(new Date(invoice.issue_date))}</TableCell>
                            <TableCell>{formatCurrency(invoice.total, invoice.currency)}</TableCell>
                            <TableCell>{formatCurrency(invoice.balanceDue, invoice.currency)}</TableCell>
                            <TableCell><InvoiceStateBadge invoice={invoice} /></TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {onDetails && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDetails(invoice)}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onView(invoice)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(invoice)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDelete(invoice.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </ReadyState>
    );
  }

  // Fallback for any other state
  return <EmptyState title="Invoices Unavailable" description="No invoices could be loaded." />;
}