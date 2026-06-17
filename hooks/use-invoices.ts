"use client";

import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  Invoice,
  InvoiceItem,
  InvoiceStructure,
  InvoiceTemplate,
  UserSettings,
} from "@/types/invoice";
import { useAuth } from "@clerk/nextjs";
import {
  handleAsyncOperation,
  isError,
  isEmptyState,
} from "@/lib/utils/error-handler";
import { useOrganization } from "./use-organization";
import {
  useInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
} from "@/hooks/queries/use-invoices-query";

const defaultTemplate: InvoiceTemplate = {
  id: "default",
  name: "Default Template",
  isDefault: true,
  primaryColor: "#000000",
  secondaryColor: "#666666",
  fontFamily: "Inter",
  logoPosition: "right",
  showLogo: true,
  showCompanyDetails: true,
  showClientDetails: true,
  showInvoiceNumber: true,
  showDates: true,
  showNotes: true,
  showTerms: true,
  showPaymentInstructions: true,
  customFields: [],
  itemsTableStyle: "detailed",
  headerStyle: "modern",
  footerStyle: "standard",
};

const defaultSettings: UserSettings = {
  defaultCurrency: "USD",
  defaultPaymentTerms: 30,
  defaultTaxRate: 10,
  autoSendReminders: true,
  reminderDays: [7, 3, 1],
  timeZone: "UTC",
  dateFormat: "MM/DD/YYYY",
  numberFormat: "en-US",
  emailSignature: "",
  autoBackup: true,
  isSuperUser: false,
};

export function useInvoices() {
  const { userId } = useAuth();
  const pathname = usePathname();
  const { selectedOrganization } = useOrganization();
  const orgId = selectedOrganization?.id;

  const {
    data: invoices = [],
    isLoading,
    isError: queryIsError,
    error: queryError,
    isFetched,
  } = useInvoicesQuery(orgId);
  const createMutation = useCreateInvoiceMutation(orgId || "");
  const updateMutation = useUpdateInvoiceMutation(orgId || "");
  const deleteMutation = useDeleteInvoiceMutation(orgId || "");

  const [templates, setTemplates] = useState<InvoiceTemplate[]>([
    defaultTemplate,
  ]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [memberOrganizations, setMemberOrganizations] = useState<any[]>([]);

  const invoicesArray = Array.isArray(invoices)
    ? invoices
    : (invoices as any)?.invoices || [];
  const invoicesEmpty = !orgId
    ? true
    : isFetched && !isLoading && invoicesArray.length === 0;
  const invoicesReady = isFetched && !isLoading && invoicesArray.length > 0;

  const createInvoice = async (
    invoiceData: Partial<
      Omit<Invoice, "id" | "created_at" | "updated_at" | "org_id">
    >,
    orgId: string,
  ) => {
    if (!userId) throw new Error("User not authorized to create an invoice.");
    if (!invoiceData.client_id)
      throw new Error("Client ID is required to create an invoice.");
    const result = await createMutation.mutateAsync(invoiceData as any);
    if (!result.success || !result.data)
      throw new Error(result.error || "Failed to create invoice");
    return result.data;
  };

  const updateInvoice = async (
    id: string,
    updates: Partial<Omit<Invoice, "invoice_items">>,
  ) => {
    const result = await updateMutation.mutateAsync({
      id,
      updates: updates as InvoiceStructure,
    });
    if (!result.success)
      throw new Error(result.error || "Failed to update invoice");
    return result.data || null;
  };

  const deleteInvoice = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const createTemplate = useCallback(
    (templateData: Partial<InvoiceTemplate>) => {
      const newTemplate: InvoiceTemplate = {
        id: Date.now().toString(),
        name: "New Template",
        isDefault: false,
        primaryColor: "#000000",
        secondaryColor: "#666666",
        fontFamily: "Inter",
        logoPosition: "right",
        showLogo: true,
        showCompanyDetails: true,
        showClientDetails: true,
        showInvoiceNumber: true,
        showDates: true,
        showNotes: true,
        showTerms: true,
        showPaymentInstructions: true,
        customFields: [],
        itemsTableStyle: "detailed",
        headerStyle: "modern",
        footerStyle: "standard",
        ...templateData,
      };
      setTemplates((prev) => [...prev, newTemplate]);
      return newTemplate;
    },
    [],
  );

  const updateTemplate = useCallback(
    (id: string, updates: Partial<InvoiceTemplate>) => {
      setTemplates((prev) =>
        prev.map((template) =>
          template.id === id ? { ...template, ...updates } : template,
        ),
      );
    },
    [],
  );

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((template) => template.id !== id));
  }, []);

  const getOrganizationInvites = async (organizationId: string) => {
    if (!userId || !organizationId) {
      throw new Error("User and organization ID are required");
    }
    const result = await handleAsyncOperation(() =>
      import("@/lib/actions/invite.actions").then((actions) =>
        actions.getOrganizationInvitesAction(organizationId),
      ),
    );
    if (isError(result)) {
      throw new Error(result.error || "Failed to fetch organization invites");
    }
    if (isEmptyState(result) || !result.data) {
      return { invites: [], joinedUsersFromInvites: [] };
    }
    return result.data;
  };

  const revokeInvite = async (inviteId: string) => {
    if (!userId || !inviteId) {
      throw new Error("User and invite ID are required");
    }
    const result = await handleAsyncOperation(() =>
      import("@/lib/actions/invite.actions").then((actions) =>
        actions.revokeInviteAction(inviteId),
      ),
    );
    if (isError(result)) {
      throw new Error(result.error || "Failed to revoke invite");
    }
    if (isEmptyState(result) || !result.data) {
      return null;
    }
    return result.data;
  };

  return {
    invoices: invoicesArray,
    setInvoices: () => {},
    memberOrganizations,
    isLoading,
    isEmpty: invoicesEmpty,
    isError: queryIsError,
    errorMessage: queryError?.message || null,
    isReady: invoicesReady,
    templates,
    settings,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getOrganizationInvites,
    revokeInvite,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    updateSettings: setSettings,
  };
}
