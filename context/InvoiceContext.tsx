"use client"

import React, { createContext, useContext } from 'react';
import { useInvoices } from '@/hooks/use-invoices';
import {
  Invoice, InvoiceTemplate, Organization, Client, PaymentRecord, Expense, Notification, UserSettings,
  SystemSettings, LicenseInfo, SupportContact, ClientSubscription, TrialSettings
} from '@/types/invoice';

interface InvoiceContextType {
  invoices: Invoice[];
  templates: InvoiceTemplate[];
  // organization: Organization | null;
  // organizations: Organization[];
  // members: any[];
  // clients: Client[];
  // payments: PaymentRecord[];
  // expenses: Expense[];
  settings: UserSettings;
  memberOrganizations: any[];
  isLoading: boolean;
  isEmpty: boolean;
  isError: boolean;
  errorMessage: string | null;
  isReady: boolean;
  createInvoice: (invoiceData: Partial<Omit<Invoice, "id" | "created_at" | "updated_at" | "org_id">>, orgId: string) => Promise<any>;
  updateInvoice: (id: string, updates: Partial<Omit<Invoice, "invoice_items">>) => Promise<Invoice | null>;
  deleteInvoice: (id: string) => Promise<void>;
  createTemplate: (templateData: Partial<InvoiceTemplate>) => InvoiceTemplate;
  updateTemplate: (id: string, updates: Partial<InvoiceTemplate>) => void;
  deleteTemplate: (id: string) => void;
  // updateOrganization: (orgData: Partial<Organization>) => Promise<Organization | null>;
  // createOrganization: (orgData: Partial<Omit<Organization, 'id'>>) => Promise<any>;
  // createClient: (clientData: Partial<Client>) => Promise<Client>;
  // updateClient: (id: string, updates: Partial<Client>) => Promise<Client>;
  // deleteClient: (id: string) => Promise<void>;
  // recordPayment: (paymentData: Partial<PaymentRecord>) => Promise<PaymentRecord>;
  // createExpense: (expenseData: Partial<Expense>) => Promise<Expense>;
  // updateExpense: (id: string, updates: Partial<Expense>) => Promise<Expense>;
  // deleteExpense: (id: string) => Promise<void>;
  updateSettings: (newSettings: UserSettings) => void;

  // Organization operations
  // getOrganizations: () => Promise<Organization[]>;
  // switchOrganization: (orgId: string | null) => Promise<any>;

  // Member operations
  // getMembers: (orgId: string) => Promise<any[]>;
  // addMember: (orgId: string, targetUserId: string, role?: "owner" | "admin" | "member") => Promise<any>;
  // removeMember: (orgId: string, targetUserId: string) => Promise<any>;
  // updateMemberRole: (orgId: string, targetUserId: string, newRole: "owner" | "admin" | "member") => Promise<any>;
  // leaveOrganization: (orgId: string) => Promise<any>;
  // transferOwnership: (orgId: string, newOwnerId: string) => Promise<any>;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const allInvoiceData = useInvoices();
  return (
    <InvoiceContext.Provider value={allInvoiceData}>
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoiceContext = () => {
  const context = useContext(InvoiceContext);
  if (context === undefined) {
    throw new Error('useInvoiceContext must be used within an InvoiceProvider');
  }
  return context;
};
