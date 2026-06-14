"use client";

import { useState } from 'react';
import { PaymentRecord, Invoice } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, CreditCard, Calendar, DollarSign, User } from 'lucide-react';

interface LedgerViewProps {
  payments: PaymentRecord[];
  invoices: Invoice[];
  onPaymentClick?: (payment: PaymentRecord) => void;
}

export function LedgerView({ payments, invoices, onPaymentClick }: LedgerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentRecord['method']>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  // Get client information for each payment
  const getPaymentClient = (payment: PaymentRecord) => {
    const invoice = invoices.find(inv => inv.id === payment.invoice_id);
    if (!invoice) return 'Unknown Client';
    
    // Find client by ID in the invoice
    return invoice.client_id || 'Unknown Client';
  };

  // Get applied invoices summary for each payment
  const getAppliedInvoicesSummary = (payment: PaymentRecord) => {
    const invoice = invoices.find(inv => inv.id === payment.invoice_id);
    if (!invoice) return 'N/A';
    
    return `${invoice.number} - ${formatCurrency(payment.amount)}`;
  };

  const filteredPayments = payments
    .filter(payment => {
      const client = getPaymentClient(payment);
      const invoiceSummary = getAppliedInvoicesSummary(payment);
      
      const matchesSearch =
        client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoiceSummary.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;

      return matchesSearch && matchesMethod;
    })
    .sort((a, b) => new Date(b.received_on).getTime() - new Date(a.received_on).getTime());

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'other', label: 'Other' }
  ];

  const getMethodBadge = (method: PaymentRecord['method']) => {
    const colors = {
      cash: 'bg-green-100 text-green-800',
      check: 'bg-blue-100 text-blue-800',
      bank_transfer: 'bg-purple-100 text-purple-800',
      credit_card: 'bg-orange-100 text-orange-800',
      paypal: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={colors[method]}>
        {paymentMethods.find(pm => pm.value === method)?.label || method}
      </Badge>
    );
  };

  const handlePaymentClick = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    if (onPaymentClick) {
      onPaymentClick(payment);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <CreditCard className="h-6 w-6 mr-2 text-green-600" />
            Money-In Ledger
          </h1>
          <p className="text-gray-600 mt-1">
            Financial ledger view of all payments received (money coming into your organization)
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Search by client, invoice, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full p-2 border rounded-md"
              />
            </div>
            <select 
              value={methodFilter} 
              onChange={(e) => setMethodFilter(e.target.value as 'all' | PaymentRecord['method'])}
              className="w-full sm:w-48 p-2 border rounded-md"
            >
              <option value="all">All Methods</option>
              {paymentMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Ledger Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[15%]">Client</TableHead>
                  <TableHead className="w-[15%]">Date</TableHead>
                  <TableHead className="w-[15%]">Amount</TableHead>
                  <TableHead className="w-[15%]">Method</TableHead>
                  <TableHead className="w-[30%]">Applied Invoices</TableHead>
                  <TableHead className="w-[10%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No payments found in the ledger. Payments will appear here once recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => {
                    const client = getPaymentClient(payment);
                    const invoiceSummary = getAppliedInvoicesSummary(payment);
                    const invoice = invoices.find(inv => inv.id === payment.invoice_id);

                    return (
                      <TableRow
                        key={payment.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handlePaymentClick(payment)}
                      >
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-gray-500" />
                            {client}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            {formatDate(new Date(payment.received_on))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-2 text-gray-500" />
                            <span className="font-medium text-green-600">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getMethodBadge(payment.method)}
                        </TableCell>
                        <TableCell>
                          {invoice ? (
                            <div className="space-y-1">
                              <div className="font-medium">{invoice.number}</div>
                              <div className="text-sm text-gray-600">{invoice.client_id}</div>
                              <div className="text-xs text-gray-500">Applied: {formatCurrency(payment.amount)} of {formatCurrency(invoice.total)}</div>
                            </div>
                          ) : (
                            <div>N/A</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePaymentClick(payment);
                            }}
                          >
                            Details
                          </Button>
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

      {/* Payment Detail Dialog */}
      <Dialog
        open={!!selectedPayment}
        onOpenChange={(open) => !open && setSelectedPayment(null)}
      >
        {selectedPayment && (
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Payment Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {(() => {
                const invoice = invoices.find(inv => inv.id === selectedPayment.invoice_id);
                return (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Payment Information</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Amount:</span>
                            <span className="font-medium text-green-600">{formatCurrency(selectedPayment.amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Date:</span>
                            <span>{formatDate(new Date(selectedPayment.received_on))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Method:</span>
                            <span>{paymentMethods.find(pm => pm.value === selectedPayment.method)?.label}</span>
                          </div>
                          {selectedPayment.reference && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Reference:</span>
                              <span>{selectedPayment.reference}</span>
                            </div>
                          )}
                          {selectedPayment.notes && (
                            <div>
                              <div className="text-gray-500">Notes:</div>
                              <div className="mt-1 p-2 bg-gray-50 rounded">{selectedPayment.notes}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {invoice && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold border-b pb-2">Applied Invoice</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Invoice Number:</span>
                              <span className="font-medium">{invoice.number}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Client:</span>
                              <span>{invoice.client_id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Invoice Total:</span>
                              <span>{formatCurrency(invoice.total)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Amount Applied:</span>
                              <span className="text-green-600">{formatCurrency(selectedPayment.amount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Remaining Balance:</span>
                              <span>{formatCurrency(invoice.total - (invoice.paid_amount || 0))}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {!invoice && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-yellow-800">Warning: The invoice associated with this payment could not be found.</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
