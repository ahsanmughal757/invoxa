"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react";
import { Invoice, PaymentRecord } from "@/types/invoice";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useInvoices } from "@/hooks/use-invoices";
import { usePayments } from "@/hooks/use-payments";
import toast from "react-hot-toast";

export default function PaymentsCollaborationPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { payments, recordPayment, updatePayment, deletePayment } =
    usePayments();
  const isLoading = invoicesLoading;

  const [isCreating, setIsCreating] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(
    null,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    amount: 0,
    method: "bank_transfer" as
      | "cash"
      | "check"
      | "bank_transfer"
      | "credit_card"
      | "paypal"
      | "other",
    received_on: new Date().toISOString().split("T")[0],
    invoice_id: "",
    reference: "",
    notes: "",
  });

  // Filter payments by organization through associated invoices
  const orgPayments = payments.filter((payment) => {
    const invoice = invoices.find(
      (inv: Invoice) => inv.id === payment.invoice_id,
    );
    return invoice && invoice.org_id === orgId;
  });

  // Filter based on search term
  const filteredPayments = orgPayments.filter(
    (payment) =>
      payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoices.some(
        (inv: Invoice) =>
          inv.id === payment.invoice_id &&
          (inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.client_id.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "amount"
            ? parseFloat(value) || 0
            : name === "invoice_id"
              ? value
              : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPayment) {
        // Update existing payment
        await updatePayment(editingPayment.id, formData);
        toast.success("Payment updated successfully");
      } else {
        // Create new payment
        await recordPayment(formData);
        toast.success("Payment created successfully");
      }

      // Reset form and state
      setFormData({
        amount: 0,
        method: "bank_transfer",
        received_on: new Date().toISOString().split("T")[0],
        invoice_id: "",
        reference: "",
        notes: "",
      });
      setIsCreating(false);
      setEditingPayment(null);
    } catch (error: any) {
      console.error("Error saving payment:", error);
      toast.error(error.message || "Failed to save payment");
    }
  };

  const handleEdit = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setFormData({
      amount: payment.amount,
      method: payment.method,
      received_on: payment.received_on.split("T")[0], // Convert to YYYY-MM-DD format
      invoice_id: payment.invoice_id,
      reference: payment.reference || "",
      notes: payment.notes || "",
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) {
      return;
    }

    try {
      await deletePayment(id);
      toast.success("Payment deleted successfully");
    } catch (error: any) {
      console.error("Error deleting payment:", error);
      toast.error(error.message || "Failed to delete payment");
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingPayment(null);
    setFormData({
      amount: 0,
      method: "bank_transfer",
      received_on: new Date().toISOString().split("T")[0],
      invoice_id: "",
      reference: "",
      notes: "",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading payments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Payments Collaboration
          </h1>
          <p className="text-gray-600 mt-1">
            Manage payments for your organization
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPayment(null);
            setIsCreating(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search payments..."
            className="pl-8 w-full p-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isCreating ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPayment ? "Edit Payment" : "Add New Payment"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="pl-8 w-full p-2 border rounded-md"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="method">Payment Method *</Label>
                  <select
                    id="method"
                    name="method"
                    value={formData.method}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="received_on">Received On *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="received_on"
                      name="received_on"
                      type="date"
                      value={formData.received_on}
                      onChange={handleInputChange}
                      className="pl-8 w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="invoice_id">Invoice *</Label>
                  <select
                    id="invoice_id"
                    name="invoice_id"
                    value={formData.invoice_id}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Select an invoice</option>
                    {invoices
                      .filter((inv: Invoice) => inv.org_id === orgId) // Only show invoices for this organization
                      .map((invoice: Invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.number} - {formatCurrency(invoice.total)}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="reference">Reference</Label>
                  <Input
                    id="reference"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPayment ? "Update Payment" : "Create Payment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No payments found</p>
                <p className="text-sm mt-1">
                  Add your first payment using the button above
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Received On</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => {
                      const invoice = invoices.find(
                        (inv: Invoice) => inv.id === payment.invoice_id,
                      );
                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {invoice ? invoice.number : "N/A"}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">
                              {payment.method.replace("_", " ")}
                            </span>
                          </TableCell>
                          <TableCell>
                            {formatDate(payment.received_on)}
                          </TableCell>
                          <TableCell>{payment.reference || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(payment)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(payment.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
