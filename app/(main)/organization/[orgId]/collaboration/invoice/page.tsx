"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { InvoiceList } from "@/components/invoice/invoice-list";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { useInvoices } from "@/hooks/use-invoices";
import { useClients } from "@/hooks/use-clients";
import { useOrganization } from "@/hooks/use-organization";
import { Invoice } from "@/types/invoice";
import toast from "react-hot-toast";

export default function InvoiceCollaborationPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const { userId } = useAuth();
  const { invoices, isLoading, createInvoice, updateInvoice, deleteInvoice } =
    useInvoices();
  const { clients } = useClients();
  const { selectedOrganization: organization } = useOrganization();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter invoices by organization if needed
  const orgInvoices = invoices.filter(
    (invoice: Invoice) => invoice.org_id === orgId,
  );

  // Filter invoices based on search term
  const filteredInvoices = orgInvoices.filter(
    (invoice: Invoice) =>
      invoice.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clients.some(
        (client) =>
          client.id === invoice.client_id &&
          (client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
  );

  const handleCreateInvoice = async (invoiceData: Partial<Invoice>) => {
    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }

      await createInvoice(invoiceData);
      toast.success("Invoice created successfully");
      setIsCreating(false);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast.error(error.message || "Failed to create invoice");
    }
  };

  const handleUpdateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
      await updateInvoice(id, updates);
      toast.success("Invoice updated successfully");
      setSelectedInvoice(null);
    } catch (error: any) {
      console.error("Error updating invoice:", error);
      toast.error(error.message || "Failed to update invoice");
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) {
      return;
    }

    try {
      await deleteInvoice(id);
      toast.success("Invoice deleted successfully");
      if (selectedInvoice?.id === id) {
        setSelectedInvoice(null);
      }
    } catch (error: any) {
      console.error("Error deleting invoice:", error);
      toast.error(error.message || "Failed to delete invoice");
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleCancel = () => {
    setSelectedInvoice(null);
    setIsCreating(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Invoice Collaboration
          </h1>
          <p className="text-gray-600 mt-1">
            Manage invoices for your organization
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search invoices..."
            className="pl-8 w-full p-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs
        defaultValue="list"
        className="space-y-4"
        onValueChange={(value) => {
          if (value === "create") {
            setIsCreating(true);
          }
        }}
      >
        <TabsList>
          <TabsTrigger value="list">Invoice List</TabsTrigger>
          <TabsTrigger value="create">Create Invoice</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <InvoiceList
            invoices={filteredInvoices}
            clients={clients}
            isLoading={isLoading}
            isEmpty={false} // Since we're filtering the invoices, we handle empty state differently
            isError={false}
            errorMessage={null}
            isReady={!isLoading}
            onCreateNew={() => setIsCreating(true)}
            onView={handleViewInvoice}
            onEdit={handleEditInvoice}
            onDelete={handleDeleteInvoice}
            onRetry={() => window.location.reload()}
          />
        </TabsContent>
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceForm
                clients={clients}
                onSave={handleCreateInvoice}
                onPreview={() => {}} // Placeholder function since it's required
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedInvoice && !isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Invoice Preview</h2>
              <Button
                variant="outline"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
            </div>
            <div className="p-4">
              <InvoicePreview
                invoice={selectedInvoice}
                client={
                  clients.find((c) => c.id === selectedInvoice.client_id)!
                }
                organization={organization}
                onPrint={() => window.print()}
                onDownload={() => {
                  // Implement download functionality
                  alert("Download functionality would be implemented here");
                }}
                onSend={() => {
                  // Implement send functionality
                  alert("Send functionality would be implemented here");
                }}
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedInvoice(null)}
              >
                Close
              </Button>
              <Button onClick={() => setSelectedInvoice(selectedInvoice)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteInvoice(selectedInvoice.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {isCreating && !selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Create Invoice</h2>
              <Button variant="outline" onClick={handleCancel}>
                Close
              </Button>
            </div>
            <div className="p-4">
              <InvoiceForm
                clients={clients}
                onSave={handleCreateInvoice}
                onPreview={() => {}} // Placeholder function since it's required
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
