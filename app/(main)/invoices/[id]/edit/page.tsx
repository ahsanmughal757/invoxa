"use client";

import { useInvoiceContext } from "@/context/InvoiceContext";
import { useOrganization } from "@/hooks/use-organization";
import { useClients } from "@/hooks/use-clients";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Invoice, Client, InvoiceStructure } from "@/types/invoice";
import { useParams } from "next/navigation";
import {
  LoadingState,
  EmptyState,
  ErrorState,
  ReadyState,
} from "@/components/ui/state-components";
import toast from "react-hot-toast";

export default function EditInvoicePage() {
  const { invoices, updateInvoice } = useInvoiceContext();
  const { selectedOrganization: organization } = useOrganization();
  const { clients } = useClients();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>(
    undefined,
  );
  const [previewInvoice, setPreviewInvoice] = useState<Partial<Invoice> | null>(
    null,
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const findInvoice = () => {
      if (invoiceId) {
        const foundInvoice = invoices.find((inv) => inv.id === invoiceId);
        if (foundInvoice) {
          setSelectedInvoice(foundInvoice);
        } else {
          // Handle case where invoice is not found, e.g., redirect to 404 or invoice list
          router.push("/invoices");
        }
      }
      // Always set loading to false after attempting to find the invoice
      setLoading(false);
    };

    // Wait for invoices to be loaded before attempting to find the invoice
    if (invoices.length > 0) {
      findInvoice();
    } else if (invoiceId) {
      // If invoices are empty but we have an invoiceId, still set loading to false
      // after a short delay to allow for data to potentially load
      const timer = setTimeout(() => {
        const foundInvoice = invoices.find((inv) => inv.id === invoiceId);
        if (foundInvoice) {
          setSelectedInvoice(foundInvoice);
        } else {
          router.push("/invoices");
        }
        setLoading(false);
      }, 100); // Small delay to allow for data to potentially load

      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [invoiceId, invoices, router]);

  const handleSaveInvoice = async (
    invoiceData: InvoiceStructure,
    temporaryClient?: any,
  ) => {
    try {
      if (selectedInvoice) {
        let updates: Partial<InvoiceStructure> = { ...invoiceData };

        if (temporaryClient) {
          if (!organization?.id) throw new Error("Organization ID is required");

          const { getOrCreatePlaceholderClientAction } = await import(
            "@/lib/actions/client.actions"
          );
          const result = await getOrCreatePlaceholderClientAction(
            organization.id,
          );
          if (!result.success || !result.data) {
            throw new Error(result.error || "Failed to get placeholder client");
          }

          updates.client_id = result.data.id;
          updates.additional_info = {
            temp_client: {
              name: temporaryClient.name,
              email: temporaryClient.email || "",
              phone: temporaryClient.phone || "",
              billing_address: temporaryClient.billing_address || {},
            },
          };
        }

        await updateInvoice(selectedInvoice.id, updates);
        toast.success("Invoice Updated");
        router.push("/invoices");
      }
    } catch (error) {
      toast.error("Error Updating Invoice");
    }
  };

  const handlePreviewInvoice = (invoiceData: Partial<Invoice>) => {
    setPreviewInvoice(invoiceData);
    setIsPreviewOpen(true);
  };

  if (loading) {
    return <LoadingState message="Loading invoice..." size="large" />;
  }

  if (!selectedInvoice) {
    return (
      <EmptyState
        title="Invoice not found"
        description="The invoice you are trying to edit could not be found."
        action={{
          text: "Back to Invoices",
          onClick: () => router.push("/invoices"),
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Edit Invoice</h1>
        <BackButton href="/invoices">Back to Invoices</BackButton>
      </div>
      <InvoiceForm
        invoice={selectedInvoice}
        editing={true}
        organization={organization}
        clients={clients}
        onSave={handleSaveInvoice}
        onPreview={handlePreviewInvoice}
      />

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          {previewInvoice &&
            selectedInvoice &&
            (() => {
              const mergedInvoice = {
                ...selectedInvoice,
                ...previewInvoice,
              } as Invoice;
              const base = clients.find(
                (c) =>
                  c.id ===
                  (previewInvoice.client_id || selectedInvoice.client_id),
              );
              let displayClient: Client | null = base || null;

              if (mergedInvoice.additional_info?.temp_client) {
                const tc = mergedInvoice.additional_info.temp_client;
                displayClient = {
                  id: base?.id || "",
                  org_id: base?.org_id || "",
                  name: tc.name,
                  email: tc.email || base?.email || "",
                  phone: tc.phone || base?.phone || "",
                  billing_address: tc.billing_address || base?.billing_address,
                  created_at: base?.created_at || new Date().toISOString(),
                } as Client;
              }

              return displayClient ? (
                <InvoicePreview
                  invoice={mergedInvoice}
                  client={displayClient}
                  organization={organization}
                  onSend={() => {
                    setIsPreviewOpen(false);
                  }}
                />
              ) : null;
            })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
