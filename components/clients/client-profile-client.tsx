"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Phone,
  MapPin,
  DollarSign,
  FileText,
  Calendar,
  CreditCard,
  Building,
  AlertCircle,
  Edit,
  Loader2,
} from "lucide-react";
import { Client, Invoice, PaymentRecord } from "@/types/invoice";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Zod schema for client form, aligned with the Client type
const clientSchema = z.object({
  name: z.string().min(1, { message: "Client name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().optional(),
  billing_address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  company: z.string().optional(),
  tax_id: z.string().optional(),
  payment_terms: z.number().min(1).max(365),
  currency: z.string(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientProfileClientProps {
  initialClient: Client;
  initialInvoices: Invoice[];
  initialPayments: PaymentRecord[];
}

import { useClients } from "@/hooks/use-clients";
import { useOrganization } from "@/hooks/use-organization";

export default function ClientProfileClient({
  initialClient,
  initialInvoices,
  initialPayments,
}: ClientProfileClientProps) {
  const [client, setClient] = useState<Client>(initialClient);
  const [clientInvoices] = useState<Invoice[]>(initialInvoices);
  const [clientPayments] = useState<PaymentRecord[]>(initialPayments);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { selectedOrganization } = useOrganization();
  const { updateClient: contextUpdateClient } = useClients();

  const handleUpdateClient = async (clientData: Partial<Client>) => {
    try {
      if (client.id && selectedOrganization && selectedOrganization.id) {
        setIsUpdating(true);

        const cleanedClient: Partial<Client> = {
          ...clientData,
          org_id: selectedOrganization.id,
        };

        // Use the context function which handles the user ID internally
        await contextUpdateClient(
          client.id,
          selectedOrganization.id,
          cleanedClient,
        );

        // Update local state
        setClient((prev) => ({ ...prev, ...clientData }));

        toast.success("Client updated successfully");

        setIsEditDialogOpen(false);
      } else {
        toast.error("No Client selected!");
      }
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client");
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculate financial summary
  const totalInvoiced = clientInvoices.reduce(
    (sum, inv) => sum + (inv.total || 0),
    0,
  );
  const totalPaid = clientPayments.reduce((sum, pmt) => sum + pmt.amount, 0);
  const outstandingBalance = totalInvoiced - totalPaid;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-gray-600 mt-1">Client Profile & Financial Hub</p>
        </div>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
            </DialogHeader>
            <ClientEditForm
              client={client}
              onSave={handleUpdateClient}
              onCancel={() => setIsEditDialogOpen(false)}
              isSubmitting={isUpdating}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Outstanding Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(outstandingBalance, client.currency || "USD")}
            </div>
            <p className="text-xs text-muted-foreground">
              Amount due from client
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invoiced
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalInvoiced, client.currency || "USD")}
            </div>
            <p className="text-xs text-muted-foreground">
              Total amount invoiced
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(totalPaid, client.currency || "USD")}
            </div>
            <p className="text-xs text-muted-foreground">Payments received</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-base">{client.email}</p>
                </div>
              </div>

              {client.company && (
                <div className="flex items-start">
                  <Building className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Company</p>
                    <p className="text-base">{client.company}</p>
                  </div>
                </div>
              )}

              {client.phone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="text-base">{client.phone}</p>
                  </div>
                </div>
              )}

              {client.billing_address && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-base">
                      {client.billing_address.street &&
                        `${client.billing_address.street}, `}
                      {client.billing_address.city &&
                        `${client.billing_address.city}, `}
                      {client.billing_address.state &&
                        `${client.billing_address.state}, `}
                      {client.billing_address.postal_code &&
                        `${client.billing_address.postal_code}, `}
                      {client.billing_address.country &&
                        client.billing_address.country}
                    </p>
                  </div>
                </div>
              )}

              {client.payment_terms && (
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Payment Terms
                    </p>
                    <p className="text-base">{client.payment_terms} days</p>
                  </div>
                </div>
              )}

              {client.currency && (
                <div className="flex items-start">
                  <DollarSign className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Currency
                    </p>
                    <p className="text-base">{client.currency}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invoice History Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Invoice History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clientInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientInvoices.map((invoice) => {
                      const balance =
                        (invoice.total || 0) - (invoice.paid_amount || 0);
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.number}
                          </TableCell>
                          <TableCell>
                            {new Date(invoice.issue_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(
                              invoice.total || 0,
                              invoice.currency,
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                invoice.status === "paid"
                                  ? "default"
                                  : invoice.status === "overdue"
                                    ? "destructive"
                                    : invoice.status === "draft"
                                      ? "secondary"
                                      : "outline"
                              }
                            >
                              {invoice.status.charAt(0).toUpperCase() +
                                invoice.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatCurrency(balance, invoice.currency)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No invoices found for this client</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment History Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientPayments.map((payment) => {
                    const invoice = clientInvoices.find(
                      (inv) => inv.id === payment.invoice_id,
                    );
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.received_on).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{invoice?.number || "N/A"}</TableCell>
                        <TableCell>
                          {formatCurrency(
                            payment.amount,
                            client.currency || "USD",
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payment.method.charAt(0).toUpperCase() +
                              payment.method.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.reference || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p>No payments found for this client</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface ClientEditFormProps {
  client: Client;
  onSave: (client: Partial<Client>) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

function ClientEditForm({
  client,
  onSave,
  onCancel,
  isSubmitting,
}: ClientEditFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      billing_address: client.billing_address || {
        street: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
      },
      company: client.company || "",
      tax_id: client.tax_id || "",
      payment_terms: client.payment_terms || 30,
      currency: client.currency || "USD",
      notes: client.notes || "",
    },
  });

  const watchedCurrency = watch("currency");

  const handleFormSubmit = async (data: ClientFormData) => {
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input id="email" {...register("email")} />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div>
          <Label htmlFor="company">Company</Label>
          <Input id="company" {...register("company")} />
        </div>
        <div>
          <Label htmlFor="billing_address.street">Street</Label>
          <Input
            id="billing_address.street"
            {...register("billing_address.street")}
          />
        </div>
        <div>
          <Label htmlFor="billing_address.city">City</Label>
          <Input
            id="billing_address.city"
            {...register("billing_address.city")}
          />
        </div>
        <div>
          <Label htmlFor="billing_address.state">State</Label>
          <Input
            id="billing_address.state"
            {...register("billing_address.state")}
          />
        </div>
        <div>
          <Label htmlFor="billing_address.postal_code">Postal Code</Label>
          <Input
            id="billing_address.postal_code"
            {...register("billing_address.postal_code")}
          />
        </div>
        <div>
          <Label htmlFor="billing_address.country">Country</Label>
          <Input
            id="billing_address.country"
            {...register("billing_address.country")}
          />
        </div>
        <div>
          <Label htmlFor="payment_terms">Payment Terms (days)</Label>
          <Input
            id="payment_terms"
            type="number"
            min="1"
            max="365"
            {...register("payment_terms", { valueAsNumber: true })}
          />
          {errors.payment_terms && (
            <p className="text-red-500 text-sm mt-1">
              {errors.payment_terms.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="tax_id">Tax ID</Label>
          <Input id="tax_id" {...register("tax_id")} />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register("notes")} />
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Client
        </Button>
      </div>
    </form>
  );
}
