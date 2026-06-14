"use client"

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { PaymentRecord, Invoice } from '@/types/invoice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, CreditCard, Search, Filter, DollarSign, TrendingUp, Calendar, AlertCircle, CheckCircle } from 'lucide-react'
import { getComputedInvoiceState } from '@/lib/invoice-state';

// Zod schema for payment form
const paymentSchema = z.object({
  invoice_id: z.string().min(1, { message: "Invoice is required" }),
  amount: z.number().min(0.01, { message: "Amount must be positive" }),
  date: z.date(),
  method: z.enum(['cash', 'check', 'bank_transfer', 'credit_card', 'paypal', 'other']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentTrackingProps {
  payments: PaymentRecord[]
  invoices: Invoice[]
  onRecordPayment: (payment: Partial<PaymentRecord>) => void
}

export function PaymentTracking({ payments, invoices, onRecordPayment }: PaymentTrackingProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentRecord['method']>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredPayments = payments
    .filter(payment => {
      const invoice = invoices.find(inv => inv.id === payment.invoice_id)
      const matchesSearch =
        (invoice?.number?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        (payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

      const matchesMethod = methodFilter === 'all' || payment.method === methodFilter

      return matchesSearch && matchesMethod
    })
    .sort((a, b) => new Date(b.received_on).getTime() - new Date(a.received_on).getTime())

  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const thisMonthPayments = payments
    .filter(payment => {
      const paymentDate = new Date(payment.received_on)
      const now = new Date()
      return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
    })
    .reduce((sum, payment) => sum + payment.amount, 0)

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'check', label: 'Check' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'other', label: 'Other' }
  ]

  const getMethodBadge = (method: PaymentRecord['method']) => {
    const colors = {
      cash: 'bg-green-100 text-green-800',
      check: 'bg-blue-100 text-blue-800',
      bank_transfer: 'bg-purple-100 text-purple-800',
      credit_card: 'bg-orange-100 text-orange-800',
      paypal: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800'
    }

    return (
      <Badge className={colors[method]}>
        {paymentMethods.find(pm => pm.value === method)?.label || method}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CreditCard className="h-8 w-8 mr-3 text-green-600" />
            Payment Tracking
          </h1>
          <p className="text-gray-600 mt-1">
            Record payments received from clients - money coming into your organization
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record New Payment</DialogTitle>
            </DialogHeader>
            <PaymentForm
              invoices={invoices}
              onSave={(payment) => {
                onRecordPayment(payment)
                setIsDialogOpen(false)
              }}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-500" />
              Total Money In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPayments)}</div>
            <p className="text-xs text-gray-500 mt-1">Total payments received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-green-500" />
              This Month Inflow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(thisMonthPayments)}</div>
            <p className="text-xs text-gray-500 mt-1">Payments received this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-gray-500 mt-1">Payment records</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={methodFilter} onValueChange={(value) => setMethodFilter(value as 'all' | PaymentRecord['method'])}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {paymentMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payments Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No payments found. Record your first payment to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => {
                    const invoice = invoices.find(inv => inv.id === payment.invoice_id)
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(new Date(payment.received_on))}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{invoice?.number}</div>
                            <div className="text-sm text-gray-600">{formatCurrency(invoice?.total || 0)}</div>
                          </div>
                        </TableCell>
                        <TableCell>{invoice?.client_id}</TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {formatCurrency(payment.amount)}
                          </span>
                        </TableCell>
                        <TableCell>{getMethodBadge(payment.method)}</TableCell>
                        <TableCell>{payment.reference || '-'}</TableCell>
                        <TableCell>
                          <div className="max-w-32 truncate" title={payment.notes}>
                            {payment.notes || '-'}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface PaymentFormProps {
  invoices: Invoice[]
  onSave: (payment: Partial<PaymentRecord>) => void
  onCancel: () => void
}

function PaymentForm({ invoices, onSave, onCancel }: PaymentFormProps) {
  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoice_id: '',
      amount: 0,
      date: new Date(),
      method: 'bank_transfer',
      reference: '',
      notes: ''
    }
  });

  const unpaidInvoices = invoices.filter(invoice => {
    const state = getComputedInvoiceState(invoice);
    return state !== 'paid' && invoice.status !== 'cancelled' && invoice.status !== 'void';
  })

  const watchedInvoiceId = watch("invoice_id");
  const selectedInvoice = invoices.find(inv => inv.id === watchedInvoiceId);

  // Calculate max amount that can be applied to this invoice
  const maxAmount = selectedInvoice ? selectedInvoice.total - (selectedInvoice.paid_amount ?? 0) : 0;

  useEffect(() => {
    if (selectedInvoice) {
      const paid = selectedInvoice.paid_amount ?? 0
      // Set the default amount to the outstanding balance, but cap it at the max amount
      const defaultAmount = Math.min(selectedInvoice.total - paid, maxAmount);
      setValue("amount", defaultAmount);
    }
  }, [selectedInvoice, setValue, maxAmount]);

  // Watch the amount field to validate against max amount
  const watchedAmount = watch("amount");

  return (
    <form onSubmit={handleSubmit((data) => onSave({
      invoice_id: data.invoice_id,
      amount: data.amount,
      received_on: data.date.toISOString().split('T')[0],
      method: data.method,
      reference: data.reference,
      notes: data.notes,
    }))} className="space-y-4">
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-green-800">Payment Recording Process</h3>
            <p className="text-sm text-green-700 mt-1">
              This form records payments that have already been received (money coming IN).
              Payments are money received from clients for invoices issued.
              Ensure the money has been physically received before recording the payment.
            </p>
            <p className="text-sm text-green-600 mt-2">
              <strong>Tip:</strong> Payments differ from expenses. Expenses are money going OUT (business costs).
            </p>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="invoice_id">Invoice *</Label>
        <Controller
          name="invoice_id"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select an invoice" />
              </SelectTrigger>
              <SelectContent>
                {unpaidInvoices.map(invoice => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.number} - {invoice.client_id} ({formatCurrency(invoice.total - (invoice.paid_amount ?? 0))})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.invoice_id && <p className="text-red-500 text-xs mt-1">{errors.invoice_id.message}</p>}
      </div>

      {selectedInvoice && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <div>Invoice Total: {formatCurrency(selectedInvoice.total)}</div>
            <div>Already Paid: {formatCurrency(selectedInvoice.paid_amount ?? 0)}</div>
            <div className="font-medium">Outstanding: {formatCurrency(selectedInvoice.total - (selectedInvoice.paid_amount ?? 0))}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Payment Amount *</Label>
          <Input
            id="amount"
            type="number"
            {...register("amount", {
              valueAsNumber: true,
              validate: (value) => {
                if (selectedInvoice && value > maxAmount) {
                  return `Amount cannot exceed outstanding balance of ${formatCurrency(maxAmount)}`;
                }
                return true;
              }
            })}
            min="0.01"
            step="0.01"
            className={errors.amount ? "border-red-500" : ""}
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}

          {selectedInvoice && watchedAmount > maxAmount && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Payment amount exceeds the outstanding balance of {formatCurrency(maxAmount)}
            </div>
          )}

          {selectedInvoice && watchedAmount <= maxAmount && watchedAmount > 0 && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              Valid payment amount. Outstanding balance after payment: {formatCurrency(maxAmount - watchedAmount)}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="date">Payment Date *</Label>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <Input
                type="date"
                value={new Date(field.value).toISOString().split('T')[0]}
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
            )}
          />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="method">Payment Method *</Label>
          <Controller
            name="method"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="reference">Reference Number</Label>
          <Input id="reference" {...register("reference")} placeholder="Transaction reference" />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register("notes")} placeholder="Additional notes about this payment" rows={3} />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!!errors.amount || !watchedInvoiceId}>
          Record Payment
        </Button>
      </div>
    </form>
  )
}
