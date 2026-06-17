"use client";

import { useInvoiceContext } from "@/context/InvoiceContext";
import { InvoiceList } from "@/components/invoice/invoice-list";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Invoice, Company, Client, Organization } from "@/types/invoice";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrganizationGuard } from "@/components/guards/organization-guard";
import {
  LoadingState,
  EmptyState,
  ErrorState,
  ReadyState,
} from "@/components/ui/state-components";
import { useClients } from "@/hooks/use-clients";
import { useInvoices } from "@/hooks/use-invoices";
import { useOrganization } from "@/hooks/use-organization";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function InvoicesPage() {
  const {
    invoices,
    deleteInvoice,
    isLoading,
    isEmpty,
    isError,
    errorMessage,
    isReady,
  } = useInvoices();
  const { selectedOrganization: organization } = useOrganization();
  const { clients } = useClients();

  const router = useRouter();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inDeletion, setInDeletion] = useState(false);
  const [invToDelete, setInvToDelete] = useState<string | null>(null);

  const handleCreateInvoice = () => {
    router.push("/invoices/create");
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    router.push(`/invoices/${invoice.id}/edit`);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setPreviewInvoice(invoice);
    setIsPreviewOpen(true);
  };

  const handleViewDetails = (invoice: Invoice) => {
    router.push(`/invoices/${invoice.id}`);
  };

  const handleDeleteInvoice = (id: string) => {
    setDeleteDialogOpen(true);
    setInvToDelete(id);
  };

  const handleConfirmDelete = async () => {
    try {
      const id = invToDelete;
      setInDeletion(true);
      if (id) await deleteInvoice(id);
      toast.success("Invoice Deleted");
      setInDeletion(false);
      setDeleteDialogOpen(false);
      setInvToDelete(null);
    } catch (error) {
      toast.error("Error Deleting Invoice");
      setInDeletion(false);
      setDeleteDialogOpen(false);
      setInvToDelete(null);
    }
  };

  const handlePreviewInvoice = (invoiceData: Partial<Invoice>) => {
    // This function is likely used in other places, but for the preview dialog,
    // we'll need to pass a full invoice object
    setIsPreviewOpen(true);
  };

  const handleRetry = () => {
    // Refresh the page to retry loading data
    window.location.reload();
  };

  // Loading State
  if (isLoading) {
    return (
      <OrganizationGuard>
        <LoadingState message="Loading your invoices..." size="large" />
      </OrganizationGuard>
    );
  }

  // Error State
  if (isError) {
    return (
      <OrganizationGuard>
        <ErrorState
          title="Failed to Load Invoices"
          description={
            errorMessage ||
            "There was an issue retrieving your invoices. Please try again later."
          }
          onRetry={handleRetry}
        />
      </OrganizationGuard>
    );
  }

  // Empty State
  if (isEmpty) {
    return (
      <OrganizationGuard>
        <EmptyState
          title="No Invoices Found"
          description="Your organization doesn't have any invoices yet. Create your first invoice to get started."
          action={{
            text: "Create Invoice",
            onClick: handleCreateInvoice,
          }}
        />
      </OrganizationGuard>
    );
  }

  // Ready State - Render the actual invoices list
  if (isReady) {
    return (
      <OrganizationGuard>
        <ReadyState>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Organization Invoices
                </h1>
                <p className="text-gray-600 mt-1">
                  All invoices belonging to{" "}
                  {organization?.name || "your organization"}
                </p>
              </div>
            </div>

            <InvoiceList
              invoices={invoices}
              clients={clients}
              isLoading={isLoading}
              isEmpty={isEmpty}
              isError={isError}
              errorMessage={errorMessage}
              isReady={isReady}
              onCreateNew={handleCreateInvoice}
              onView={handleViewInvoice}
              onEdit={handleEditInvoice}
              onDelete={handleDeleteInvoice}
              onDetails={handleViewDetails}
              onRetry={handleRetry}
            />
          </div>

          {/* Preview Dialog */}
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto [&>.close-btn]:print:hidden">
              <DialogHeader>
                <DialogTitle className="print:hidden">
                  Invoice Preview
                </DialogTitle>
              </DialogHeader>
              {previewInvoice && (
                <InvoicePreview
                  invoice={previewInvoice}
                  client={
                    clients.find((c) => c.id === previewInvoice.client_id) ||
                    (clients.length > 0
                      ? clients[0]
                      : ({ id: "", name: "Unknown Client" } as Client))
                  }
                  organization={organization}
                  templateId={
                    (previewInvoice.template_id as any) || "classic_business"
                  } // Use the invoice's template or default
                  onSend={() => {
                    // This is now handled by the trigger and real-time system
                    setIsPreviewOpen(false);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Delete Invoice</DialogTitle>
              </DialogHeader>
              <div className="text-base font-normal">
                Are you sure you want to delete this invoice? This action cant
                be reversed!
              </div>
              <div className="flex justify-end">
                <Button
                  variant={"destructive"}
                  className="mr-4"
                  onClick={handleConfirmDelete}
                  disabled={inDeletion ? true : false}
                >
                  {inDeletion ? "Deleting..." : "Confirm"}
                </Button>
                <Button
                  variant={"outline"}
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </ReadyState>
      </OrganizationGuard>
    );
  }

  // Fallback for any other state
  return (
    <OrganizationGuard>
      <EmptyState
        title="Invoices Unavailable"
        description="No invoices could be loaded."
      />
    </OrganizationGuard>
  );
}
