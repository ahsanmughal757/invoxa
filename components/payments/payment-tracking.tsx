"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PaymentRecord, Invoice, Client } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stats-card";
import {
  formatCurrency,
  formatDate,
  cn,
} from "@/lib/utils";
import {
  Plus,
  CreditCard,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { getComputedInvoiceState } from "@/lib/invoice-state";
import toast from "react-hot-toast";

// Zod schema for payment form
const paymentSchema = z.object({
  invoice_id: z.string().min(1, { message: "Invoice is required" }),
  amount: z.number().min(0.01, { message: "Amount must be positive" }),
  date: z.date(),
  method: z.enum([
    "cash",
    "check",
    "bank_transfer",
    "credit_card",
    "paypal",
    "other",
  ]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentTrackingProps {
  payments: PaymentRecord[];
  invoices: Invoice[];
  clients?: Client[];
  onRecordPayment: (
    payment: Partial<PaymentRecord>,
  ) => Promise<void> | void;
}

const paymentMethods: { value: PaymentRecord["method"]; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
];

const methodTones: Record<PaymentRecord["method"], string> = {
  cash: "bg-emerald-50 text-emerald-700",
  check: "bg-blue-50 text-blue-700",
  bank_transfer: "bg-violet-50 text-violet-700",
  credit_card: "bg-orange-50 text-orange-700",
  paypal: "bg-indigo-50 text-indigo-700",
  other: "bg-muted text-muted-foreground",
};

export function PaymentTracking({
  payments,
  invoices,
  clients = [],
  onRecordPayment,
}: PaymentTrackingProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<
    "all" | PaymentRecord["method"]
  >("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filteredPayments = payments
    .filter((payment) => {
      const invoice = invoices.find((inv) => inv.id === payment.invoice_id);
      const matchesSearch =
        (invoice?.number
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ??
          false) ||
        (payment.reference
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ??
          false);

      const matchesMethod =
        methodFilter === "all" || payment.method === methodFilter;

      return matchesSearch && matchesMethod;
    })
    .sort(
      (a, b) =>
        new Date(b.received_on).getTime() -
        new Date(a.received_on).getTime(),
    );

  const totalPayments = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const thisMonthPayments = payments
    .filter((payment) => {
      const paymentDate = new Date(payment.received_on);
      const now = new Date();
      return (
        paymentDate.getMonth() === now.getMonth() &&
        paymentDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, payment) => sum + payment.amount, 0);

  const handleSavePayment = async (payment: Partial<PaymentRecord>) => {
    setIsSaving(true);
    try {
      await onRecordPayment(payment);
      setIsDialogOpen(false);
      toast.success("Payment recorded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to record payment. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Money received from clients — payments are recorded as events against invoices"
        actions={[
          <Dialog
            key="record-payment"
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
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
                isSaving={isSaving}
                onSave={handleSavePayment}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>,
        ]}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Total Money In"
          value={formatCurrency(totalPayments)}
          sublabel="Total payments received"
          tone="success"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          label="This Month Inflow"
          value={formatCurrency(thisMonthPayments)}
          sublabel="Payments received this month"
          tone="success"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          label="Total Transactions"
          value={payments.length}
          sublabel="Payment records"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={methodFilter}
              onValueChange={(value) =>
                setMethodFilter(value as "all" | PaymentRecord["method"])
              }
            >
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payments Table */}
          <div className="rounded-lg border">
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
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No payments found. Record your first payment to get
                      started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => {
                    const invoice = invoices.find(
                      (inv) => inv.id === payment.invoice_id,
                    );
                    const client = clients.find(
                      (c) => c.id === invoice?.client_id,
                    );
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {formatDate(new Date(payment.received_on))}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {invoice?.number ?? "—"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(
                                invoice?.total || 0,
                                invoice?.currency,
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{client?.name ?? invoice?.client_id ?? "—"}</TableCell>
                        <TableCell>
                          <span className="font-medium text-success">
                            {formatCurrency(
                              payment.amount,
                              invoice?.currency,
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "border-transparent",
                              methodTones[payment.method],
                            )}
                          >
                            {paymentMethods.find(
                              (pm) => pm.value === payment.method,
                            )?.label || payment.method}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.reference || "-"}</TableCell>
                        <TableCell>
                          <div
                            className="max-w-32 truncate"
                            title={payment.notes}
                          >
                            {payment.notes || "-"}
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
  );
}

interface PaymentFormProps {
  invoices: Invoice[];
  isSaving?: boolean;
  onSave: (payment: Partial<PaymentRecord>) => Promise<void> | void;
  onCancel: () => void;
}

function PaymentForm({
  invoices,
  isSaving = false,
  onSave,
  onCancel,
}: PaymentFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoice_id: "",
      amount: 0,
      date: new Date(),
      method: "bank_transfer",
      reference: "",
      notes: "",
    },
  });

  const unpaidInvoices = invoices.filter((invoice) => {
    const state = getComputedInvoiceState(invoice);
    return (
      state !== "paid" &&
      invoice.status !== "cancelled" &&
      invoice.status !== "void"
    );
  });

  const watchedInvoiceId = watch("invoice_id");
  const selectedInvoice = invoices.find(
    (inv) => inv.id === watchedInvoiceId,
  );

  // Calculate max amount that can be applied to this invoice
  const maxAmount = selectedInvoice
    ? selectedInvoice.total - (selectedInvoice.paid_amount ?? 0)
    : 0;

  useEffect(() => {
    if (selectedInvoice) {
      const paid = selectedInvoice.paid_amount ?? 0;
      // Set the default amount to the outstanding balance, but cap it at the max amount
      const defaultAmount = Math.min(selectedInvoice.total - paid, maxAmount);
      setValue("amount", defaultAmount);
    }
  }, [selectedInvoice, setValue, maxAmount]);

  // Watch the amount field to validate against max amount
  const watchedAmount = watch("amount");

  const onFormSubmit = async (data: PaymentFormData) => {
    await onSave({
      invoice_id: data.invoice_id,
      amount: data.amount,
      received_on: data.date.toISOString().split("T")[0],
      method: data.method,
      reference: data.reference,
      notes: data.notes,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start">
          <AlertCircle className="mt-0.5 mr-2 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <h3 className="font-medium text-emerald-800">
              Payment Recording Process
            </h3>
            <p className="mt-1 text-sm text-emerald-700">
              This form records payments that have already been received (money
              coming IN). Payments are money received from clients for invoices
              issued. Ensure the money has been physically received before
              recording the payment.
            </p>
            <p className="mt-2 text-sm text-emerald-600">
              <strong>Tip:</strong> Payments differ from expenses. Expenses are
              money going OUT (business costs).
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
                {unpaidInvoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.number} - {invoice.client_id} (
                    {formatCurrency(
                      invoice.total - (invoice.paid_amount ?? 0),
                      invoice.currency,
                    )}
                    )
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.invoice_id && (
          <p className="mt-1 text-xs text-destructive">
            {errors.invoice_id.message}
          </p>
        )}
      </div>

      {selectedInvoice && (
        <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          <div>
            Invoice Total:{" "}
            {formatCurrency(selectedInvoice.total, selectedInvoice.currency)}
          </div>
          <div>
            Already Paid:{" "}
            {formatCurrency(
              selectedInvoice.paid_amount ?? 0,
              selectedInvoice.currency,
            )}
          </div>
          <div className="font-medium text-foreground">
            Outstanding:{" "}
            {formatCurrency(
              selectedInvoice.total - (selectedInvoice.paid_amount ?? 0),
              selectedInvoice.currency,
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="amount">Payment Amount *</Label>
          <Input
            id="amount"
            type="number"
            {...register("amount", {
              valueAsNumber: true,
              validate: (value) => {
                if (selectedInvoice && value > maxAmount) {
                  return `Amount cannot exceed outstanding balance of ${formatCurrency(
                    maxAmount,
                    selectedInvoice.currency,
                  )}`;
                }
                return true;
              },
            })}
            min="0.01"
            step="0.01"
            className={errors.amount ? "border-destructive" : ""}
          />
          {errors.amount && (
            <p className="mt-1 text-xs text-destructive">
              {errors.amount.message}
            </p>
          )}

          {selectedInvoice && watchedAmount > maxAmount && (
            <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              <AlertCircle className="mr-1 inline h-4 w-4" />
              Payment amount exceeds the outstanding balance of{" "}
              {formatCurrency(maxAmount, selectedInvoice.currency)}
            </div>
          )}

          {selectedInvoice &&
            watchedAmount <= maxAmount &&
            watchedAmount > 0 && (
              <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-2 text-sm text-emerald-700">
                <CheckCircle className="mr-1 inline h-4 w-4" />
                Valid payment amount. Outstanding balance after payment:{" "}
                {formatCurrency(
                  maxAmount - watchedAmount,
                  selectedInvoice.currency,
                )}
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
                value={new Date(field.value).toISOString().split("T")[0]}
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
            )}
          />
          {errors.date && (
            <p className="mt-1 text-xs text-destructive">
              {errors.date.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <Input
            id="reference"
            {...register("reference")}
            placeholder="Transaction reference"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          placeholder="Additional notes about this payment"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !!errors.amount || !watchedInvoiceId}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? "Recording..." : "Record Payment"}
        </Button>
      </div>
    </form>
  );
}