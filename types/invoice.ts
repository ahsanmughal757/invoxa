export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
}

export interface Invoice {
  id: string;
  org_id: string;
  client_id: string;
  number: string;
  issue_date: string; // ISO 8601 date string
  due_date: string; // ISO 8601 date string
  status:
    | "draft"
    | "sent"
    | "paid"
    | "overdue"
    | "void"
    | "cancelled"
    | "partially_paid";
  subtotal: number;
  tax_rate?: number;
  tax_amount?: number;
  discount_total?: number;
  total: number;
  paid_amount?: number;
  currency: string;
  notes?: string;
  pdf_url?: string;
  is_recurring?: boolean;
  recurring_frequency?: "weekly" | "monthly" | "quarterly" | "yearly";
  next_invoice_date?: string; // ISO 8601 date string
  created_at: string; // ISO 8601 datetime string
  updated_at: string; // ISO 8601 datetime string
  invoice_items: InvoiceItem[];
  template_id?: string; // Added for template selection
}

export interface InvoiceStructure extends Invoice {
  invoice_items: InvoiceItem[];
}

// Extended invoice interface for data from DB views that includes computed fields
export interface InvoiceWithComputedFields extends Invoice {
  computed_status?: "draft" | "sent" | "partially_paid" | "paid" | "overdue";
  remaining_amount?: number;
  client_name?: string;
}

// The types below are not yet represented in the database schema
// and will need migrations if they are to be persisted.

/**
 * @dbRelation foreign key (company_id) references Company(id)
 * @dbTableStyle pgcrypto
 */
export interface InvoiceTemplate {
  id: string;
  name: string;
  isDefault: boolean;

  // Template styling
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoPosition: "left" | "center" | "right";

  // Field visibility
  showLogo: boolean;
  showCompanyDetails: boolean;
  showClientDetails: boolean;
  showInvoiceNumber: boolean;
  showDates: boolean;
  showNotes: boolean;
  showTerms: boolean;
  showPaymentInstructions: boolean;

  // Custom fields
  customFields: {
    id: string;
    label: string;
    type: "text" | "number" | "date" | "select";
    options?: string[];
    required: boolean;
    visible: boolean;
  }[];

  // Layout options
  itemsTableStyle: "simple" | "detailed" | "minimal";
  headerStyle: "classic" | "modern" | "minimal";
  footerStyle: "standard" | "compact" | "detailed";
}

export interface Organization {
  id?: string;
  owner_user_id?: string;
  owner_clerk_id?: string;
  name: string;
  email?: string;
  logo_url?: string;
  branding?: any; // JSONB
  created_at: string; // ISO 8601 datetime string
}

export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface Client {
  id?: string;
  org_id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  billing_address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  tax_id?: string;
  payment_terms?: number;
  currency?: string;
  total_invoiced?: number;
  total_paid?: number;
  outstanding_balance?: number;
  notes?: string;
  last_invoice_date?: string; // ISO 8601 date string
  created_at?: string; // ISO 8601 datetime string
}

export interface PaymentRecord {
  id: string;
  invoice_id: string;
  amount: number;
  received_on: string; // ISO 8601 date string
  method:
    | "cash"
    | "check"
    | "bank_transfer"
    | "credit_card"
    | "paypal"
    | "other";
  reference?: string;
  notes?: string;
  created_at: string; // ISO 8601 datetime string
}

export interface Expense {
  id: string;
  org_id: string;
  user_id?: string;
  client_id?: string;
  invoice_id?: string;
  clerk_user_id?: string;
  description: string;
  amount: number;
  date: string; // ISO 8601 date string
  category?: string;
  vendor?: string;
  tax_deductible: boolean;
  notes?: string;
  created_at: string; // ISO 8601 datetime string
  additional_info?: any;
}

export interface Report {
  id: string;
  type: "revenue" | "expenses" | "profit_loss" | "tax" | "client_summary";
  dateRange: {
    start: Date;
    end: Date;
  };
  data: any;
  generatedAt: Date;
}

export interface Notification {
  id: string;
  type: "invoice_overdue" | "payment_received" | "recurring_invoice" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface UserSettings {
  defaultCurrency: string;
  defaultPaymentTerms: number;
  defaultTaxRate: number;
  autoSendReminders: boolean;
  reminderDays: number[];
  timeZone: string;
  dateFormat: string;
  numberFormat: string;
  emailSignature?: string;
  autoBackup: boolean;
  isSuperUser?: boolean;
}

export interface LicenseInfo {
  id: string;
  companyName: string;
  licensedTo: string;
  licenseKey: string;
  expiryDate: Date;
  maxUsers: number;
  features: string[];
  supportLevel: "basic" | "premium" | "enterprise";
  isActive: boolean;
}

export interface SupportContact {
  id: string;
  type: "general" | "technical" | "billing" | "emergency";
  name: string;
  email: string;
  phone?: string;
  department: string;
  isActive: boolean;
}

export interface ClientSubscription {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  plan:
    | "3min-trial"
    | "14day-trial"
    | "lifetime"
    | "free"
    | "starter"
    | "professional"
    | "enterprise";
  status: "active" | "cancelled" | "trial" | "expired" | "past_due";
  startDate: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  isTrialActive: boolean;
  trialType?: "3min" | "14day" | null;
  isLifetime?: boolean;
  invoiceLimit: number;
  clientLimit: number;
  features: string[];
  autoRenew: boolean;
  paymentMethod?: string;
  lastPaymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrialSettings {
  defaultTrialDays: number;
  maxTrialsPerClient: number;
  trialFeatures: string[];
  autoConvertToFree: boolean;
}

export interface SubscriptionPlan {
  id:
    | "3min-trial"
    | "14day-trial"
    | "lifetime"
    | "free"
    | "starter"
    | "professional"
    | "enterprise";
  name: string;
  price: number;
  currency: string;
  billingCycle?: "one-time" | "monthly";
  invoiceLimit: number;
  clientLimit: number;
  features: string[];
  isPopular?: boolean;
  description?: string;
}

/**
 * @dbRelation one-to-many:subscriptions (id)
 * @dbView system_settings_view
 */
export interface SystemSettings {
  id: string;
  appName: string;
  appVersion: string;
  companyName: string;
  companyWebsite: string;
  supportContacts: SupportContact[];
  licenseInfo: LicenseInfo;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  maxInvoicesPerUser: number;
  backupFrequency: "daily" | "weekly" | "monthly";
  subscriptions: ClientSubscription[];
  trialSettings: TrialSettings;
  updatedAt: Date;
}

/**
 * Company settings interface for form data
 */
export interface Company {
  id?: string;
  name: string;
  owner_user_id?: string;
  email: string;
  phone?: string;
  address: string;
  website?: string;
  taxId?: string;
  logo?: string;
  paymentInstructions?: string;
  branding?: any; // JSON for additional branding details
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    iban?: string;
    swift?: string;
  };
}
