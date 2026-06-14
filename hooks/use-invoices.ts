"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  Invoice,
  InvoiceItem,
  InvoiceTemplate,
  Organization,
  Client,
  PaymentRecord,
  Expense,
  Notification,
  UserSettings,
  SystemSettings,
  ClientSubscription,
} from "@/types/invoice";
import { generateInvoiceNumber } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import {
  createPersonalExpense,
  updatePersonalExpense,
  deletePersonalExpense,
} from "@/lib/queries/personal/expenses";
import { updateClient as editClient } from "@/lib/queries/personal/clients";
import { recordPayment as savePayment } from "@/lib/queries/payments";
import { getMemberAssociatedOrganization } from "@/lib/queries/organizations";
import {
  getAllInvoicesAction,
  createInvoiceAction,
  getInvoiceByIdAction,
} from "@/lib/actions/invoice.actions";
import {
  createClientAction,
  updateClientAction,
  deleteClientAction,
  getAllClientsAction,
  createClientForMemberOrganizationAction,
} from "@/lib/actions/client.actions";
import {
  createOrganizationAction,
  updateOrganizationAction,
  getOrganizationAction,
  getOrganizationsForUserAction,
  switchActiveOrganizationAction,
  OrganizationData,
} from "@/lib/actions/organization.actions";
import {
  getMembersForOrganizationAction,
  addMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
  leaveOrganizationAction,
  transferOwnershipAction,
} from "@/lib/actions/members.actions";
import {
  handleAsyncOperation,
  isError,
  isEmptyState,
} from "@/lib/utils/error-handler";
import { useExpenses } from "./use-expenses";
import { getInvoicesByOrgId } from "@/lib/queries/invoices";
import { useSelectedOrganization } from "./use-selected-org";
import { useOrganization } from "./use-organization";
// NOTE: Default data is for local-only features that are not yet migrated to the database.

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

  // State management
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([
    defaultTemplate,
  ]);
  // const [organization, setOrganization] = useState<Organization | null>(null);
  // const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrganizationId, setActiveOrganizationId] = useState<
    string | null
  >(null);
  // const [members, setMembers] = useState<any[]>([]);
  // const [clients, setClients] = useState<Client[]>([]);
  // const [payments, setPayments] = useState<PaymentRecord[]>([]);
  // const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  const [memberOrganizations, setMemberOrganizations] = useState<
    Partial<Organization>[] | any
  >([]);

  // Explicit state flags
  const [isLoading, setIsLoading] = useState(true);
  const [isEmpty, setIsEmpty] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Load data from server actions on mount
  useEffect(() => {
    (async () => {
      if (!userId) {
        setIsLoading(false);
        setIsEmpty(true);
        setIsReady(false);
        return;
      }

      setIsLoading(true);
      setIsEmpty(false);
      setHasError(false);
      setErrorMessage(null);
      setIsReady(false);

      try {
        if (!selectedOrganization?.id) {
          setIsLoading(false);
          setIsEmpty(true);
          setHasError(false);
          setErrorMessage(null);
          setIsReady(false);
          return;
        }

        // Use server action instead of API route with improved error handling
        const result = await handleAsyncOperation(() =>
          getInvoicesByOrgId(selectedOrganization.id || ""),
        );

        if (isError(result)) {
          console.error("Error loading data from server actions:", result);
          setIsLoading(false);
          setIsEmpty(false);
          setHasError(true);
          setErrorMessage(result.error || "Failed to load data");
          setIsReady(false);
        } else if (isEmptyState(result)) {
          // For empty state, initialize with empty arrays but don't show error UI
          // setOrganization(null);
          // setClients([]);
          setInvoices([]);
          // setExpenses([]);
          // setPayments([]);

          setIsLoading(false);
          setIsEmpty(true);
          setHasError(false);
          setErrorMessage(null);
          setIsReady(false);
        } else {
          // Success case - update state with data

          if (result.data) {
            const invoicesData = result.data;

            // const orgData = resultData.organization ? resultData.organization : null;

            // if (orgData) setOrganization(orgData);
            // if (clientsData) setClients(clientsData);
            setInvoices(result.data);
            // if (expensesData) setExpenses(expensesData);
            // if (paymentsData) setPayments(paymentsData);

            // Determine if data is empty
            const hasData = invoicesData && invoicesData.length > 0;
            // orgData ||
            // (clientsData && clientsData.length > 0) ||
            // (expensesData && expensesData.length > 0) ||
            // (paymentsData && paymentsData.length > 0);

            setIsLoading(false);
            setIsEmpty(!hasData);
            setHasError(false);
            setErrorMessage(null);
            setIsReady(hasData);
          }

          // Clean Code
          // const userMemberOrganizationData =
          //   await getMemberAssociatedOrganization(userId);

          // if (userMemberOrganizationData)
          //   setMemberOrganizations(userMemberOrganizationData);

          // // Load all user organizations
          // const orgsResult = await handleAsyncOperation(() =>
          //   getOrganizationsForUserAction(),
          // );
          // if (!isError(orgsResult) && orgsResult.data) {
          //   // setOrganizations(orgsResult.data || []);
          // }

          // Additional data loading based on path
          const hasCollaborationPath = pathname.includes("/collaboration");

          // Load member organizations for users who are members but not owners
          // const userMemberOrganizationData =
          //   await getMemberAssociatedOrganization(userId);

          // if (userMemberOrganizationData)
          //   setMemberOrganizations(userMemberOrganizationData);

          // if (hasCollaborationPath && userId) {
          //   // Load expenses for organization
          //   const expensesResult = await getOrgExpenses(userId);

          //   console.log("Expenses result: ", expensesResult);

          //   setExpenses(expensesResult);
          // }
        }
      } catch (error: any) {
        console.error("Error loading data from server actions:", error);
        setIsLoading(false);
        setIsEmpty(false);
        setHasError(true);
        setErrorMessage(error.message || "An unexpected error occurred");
        setIsReady(false);
      }
    })();
  }, [userId, selectedOrganization]);

  // Invoice operations
  const createInvoice = async (
    invoiceData: Partial<
      Omit<Invoice, "id" | "created_at" | "updated_at" | "org_id">
    >,
  ) => {
    if (!userId) throw new Error("User not authorized to create an invoice.");
    if (!invoiceData.client_id)
      throw new Error("Client ID is required to create an invoice.");

    const result = await handleAsyncOperation(() =>
      createInvoiceAction(invoiceData as any),
    );

    if (isError(result)) {
      throw new Error(result.error || "Failed to create invoice");
    }

    // For empty state, return appropriately
    if (isEmptyState(result)) {
      return null; // Or handle empty state as needed
    }

    setInvoices((prev) => [...prev, result.data]);
    return result.data;
  };

  const updateInvoice = async (
    id: string,
    updates: Partial<Omit<Invoice, "invoice_items">>,
  ) => {
    const result = await handleAsyncOperation(() =>
      import("@/lib/actions/invoice.actions").then((actions) =>
        actions.updateInvoiceAction(id, updates as Partial<Invoice>),
      ),
    );

    if (isError(result)) {
      throw new Error(result.error || "Failed to update invoice");
    }

    // Handle the case where the invoice was not found (empty state)
    if (isEmptyState(result) || !result.data) {
      // Remove the invoice from the local state since it doesn't exist
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      return null; // Return null to indicate the invoice was not found
    }

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? result.data! : inv)),
    );
    return result.data!;
  };

  const deleteInvoice = async (id: string) => {
    // For now, we'll reload all invoices after deletion
    // In a real implementation, we'd have a deleteInvoiceAction
    const result = await getAllInvoicesAction();

    if (!result.success) {
      throw new Error(result.error || "Failed to delete invoice");
    }

    if (result.data) {
      const { invoices: updatedInvoices } = result.data;
      setInvoices(updatedInvoices);
    }
    // Return void to match the expected type
    return;
  };

  // Template operations
  const createTemplate = (templateData: Partial<InvoiceTemplate>) => {
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
  };

  const updateTemplate = (id: string, updates: Partial<InvoiceTemplate>) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === id ? { ...template, ...updates } : template,
      ),
    );
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((template) => template.id !== id));
  };

  // Invite operations
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
      return { invites: [], joinedUsersFromInvites: [] }; // Return empty data for empty state
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
      return null; // Return null for empty state (invite not found)
    }

    return result.data;
  };

  const updateSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
  };

  return {
    // Data
    invoices,
    setInvoices,
    // organization,
    // organizations,
    memberOrganizations,
    // members,
    // clients,
    // expenses,
    // Explicit state flags
    isLoading,
    isEmpty,
    isError: hasError,
    errorMessage,
    isReady,
    // Local Data
    templates,
    settings,

    // DB Operations
    createInvoice,
    updateInvoice,
    deleteInvoice,

    // createExpense,
    // updateExpense,
    // deleteExpense,

    // // Organization Operations
    // getOrganizations,
    // switchOrganization,

    // // Member Operations
    // getMembers,
    // addMember,
    // removeMember,
    // updateMemberRole,
    // leaveOrganization,
    // transferOwnership,

    // Invite Operations
    getOrganizationInvites,
    revokeInvite,

    // Local Operations
    createTemplate,
    updateTemplate,
    deleteTemplate,
    updateSettings,
  };
}
