"use client";

import { useInvoices } from "@/hooks/use-invoices";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { useUser } from "@clerk/nextjs";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Invoice, Client } from "@/types/invoice";
import { RequiredDataGuard } from "@/components/guards/RequiredDataGuard";
import { ClientGuard } from "@/components/guards/client-guard";
import { useClients } from "@/hooks/use-clients";
import { useOrganization } from "@/hooks/use-organization";
import { LoadingState, EmptyState, ErrorState, ReadyState } from "@/components/ui/state-components";

export default function CreateInvoicePage() {
  const { user, isLoaded } = useUser();

  const { createInvoice } = useInvoices();
  const { createClient, clients } = useClients();
  const { selectedOrganization: organization, isLoading: orgLoading, isReady: orgReady } = useOrganization();

  const router = useRouter();
  const [previewInvoice, setPreviewInvoice] = useState<Partial<Invoice> | null>(
    null,
  );
  const [previewTemporaryClient, setPreviewTemporaryClient] =
    useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleSaveInvoice = async (
    invoiceData: Partial<Invoice>,
    temporaryClient?: any,
  ) => {
    try {
      let finalInvoiceData = { ...invoiceData, status: "draft" as const };

      // If temporary client data is provided, create the client first
      if (temporaryClient) {
        const newClient = await createClient({
          name: temporaryClient.name,
          email: temporaryClient.email || "",
          phone: temporaryClient.phone || "",
          billing_address: temporaryClient.billing_address || {},
          notes: "Temporary client created for invoice",
        });
        finalInvoiceData = {
          ...finalInvoiceData,
          client_id: newClient && newClient.id,
        };
      }

      // Ensure we have a client_id
      if (!finalInvoiceData.client_id) {
        throw new Error("Client ID is required");
      }

      await createInvoice(finalInvoiceData);
      router.push("/invoices");
    } catch (error) {
      console.error("Failed to save invoice:", error);
      // Show user-friendly error message
      // addNotification({
      //   type: 'system',
      //   title: 'Save Failed',
      //   message: 'Unable to save invoice. Please check your data and try again.',
      // });
    }
  };

  const handlePreviewInvoice = (
    invoiceData: Partial<Invoice>,
    temporaryClient?: any,
  ) => {
    setPreviewInvoice(invoiceData);
    setPreviewTemporaryClient(temporaryClient);
    setIsPreviewOpen(true);
  };

  const getClientForPreview = (): Client | undefined => {
    if (!previewInvoice) return undefined;

    // If we have a regular client_id, find the client
    if (previewInvoice.client_id && previewInvoice.client_id !== "temporary") {
      return clients.find((c) => c.id === previewInvoice.client_id);
    }

    // If we have temporary client data, create a temporary client object for preview
    if (previewTemporaryClient) {
      return {
        id: "temp",
        org_id: user?.id || "",
        name: previewTemporaryClient.name,
        email: previewTemporaryClient.email || "",
        phone: previewTemporaryClient.phone || "",
        billing_address: previewTemporaryClient.billing_address || {},
        company: "",
        tax_id: "",
        payment_terms: 30,
        currency: "USD",
        total_invoiced: 0,
        total_paid: 0,
        outstanding_balance: 0,
        notes: "",
        last_invoice_date: "",
        created_at: new Date().toISOString(),
      };
    }
    return undefined;
  };

  // Loading State while organization is loading
  if (orgLoading) {
    return (
      <LoadingState message="Loading your organization information..." size="large" />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
        <Button variant="outline" onClick={() => router.push("/invoices")}>
          Back to Invoices
        </Button>
      </div>
      <RequiredDataGuard
        // check={() => !!organization?.name}
        check={() => orgReady && !!organization}
        message={
          orgLoading
            ? "Loading your organization..."
            : "Please set up your company information before creating an invoice."
        }
        actionText="Go to Company Settings"
        actionHref="/settings/company"
      >
        <ClientGuard>
          <InvoiceForm
            organization={organization}
            clients={clients}
            onSave={handleSaveInvoice}
            onPreview={handlePreviewInvoice}
          />
        </ClientGuard>
      </RequiredDataGuard>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          {previewInvoice && getClientForPreview() && (
            <InvoicePreview
              invoice={previewInvoice}
              client={getClientForPreview()!}
              organization={organization}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
