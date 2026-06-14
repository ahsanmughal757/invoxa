import React from 'react';
import { Invoice, Client, Organization } from '@/types/invoice';
import { ClassicBusinessTemplate } from './classic-business-template';
import { ModernCleanTemplate } from './modern-clean-template';
import { MinimalMonochromeTemplate } from './minimal-monochrome-template';
import { BoldCreativeTemplate } from './bold-creative-template';
import { FinancialDetailedTemplate } from './financial-detailed-template';

// Define the template ID type
export type TemplateId = 
  | 'classic_business'
  | 'modern_clean'
  | 'minimal_monochrome'
  | 'bold_creative'
  | 'financial_detailed'
  | 'default';

// Define the template component props
interface TemplateProps {
  invoice: Invoice;
  client: Client;
  organization: Organization | null;
}

// Define the template component type
type TemplateComponent = React.FC<TemplateProps>;

// Template registry mapping template IDs to their respective components
const TEMPLATE_REGISTRY: Record<TemplateId, TemplateComponent> = {
  classic_business: ClassicBusinessTemplate,
  modern_clean: ModernCleanTemplate,
  minimal_monochrome: MinimalMonochromeTemplate,
  bold_creative: BoldCreativeTemplate,
  financial_detailed: FinancialDetailedTemplate,
  default: ClassicBusinessTemplate, // Default fallback
};

// Template metadata for UI selection
export const TEMPLATE_METADATA = {
  classic_business: {
    id: 'classic_business' as TemplateId,
    name: 'Classic Business',
    description: 'Traditional corporate layout with clear tables and conservative styling',
    category: 'business',
  },
  modern_clean: {
    id: 'modern_clean' as TemplateId,
    name: 'Modern Clean',
    description: 'Sleek card-based design with ample whitespace',
    category: 'modern',
  },
  minimal_monochrome: {
    id: 'minimal_monochrome' as TemplateId,
    name: 'Minimal Monochrome',
    description: 'Typography-focused layout with black and gray tones',
    category: 'minimal',
  },
  bold_creative: {
    id: 'bold_creative' as TemplateId,
    name: 'Bold Creative',
    description: 'Professional design with accent colors and strong visual hierarchy',
    category: 'creative',
  },
  financial_detailed: {
    id: 'financial_detailed' as TemplateId,
    name: 'Financial Detailed',
    description: 'Information-dense layout with comprehensive breakdowns',
    category: 'financial',
  },
  default: {
    id: 'default' as TemplateId,
    name: 'Default',
    description: 'Standard layout',
    category: 'default',
  },
};

// Validation helper to check if required invoice data is present
const validateInvoiceData = (invoice: Invoice): boolean => {
  // Check if the invoice has the minimum required fields
  return !!(
    invoice.id &&
    invoice.number &&
    invoice.client_id &&
    invoice.issue_date &&
    invoice.due_date &&
    invoice.status &&
    invoice.total !== undefined &&
    invoice.currency &&
    Array.isArray(invoice.invoice_items) &&
    invoice.invoice_items.length > 0
  );
};

// Validation helper to check if required client data is present
const validateClientData = (client: Client): boolean => {
  // Check if the client has the minimum required fields
  return !!(
    client.id &&
    client.name
  );
};

// Fallback invoice data for graceful degradation
const getFallbackInvoice = (): Invoice => ({
  id: 'fallback',
  org_id: 'fallback',
  client_id: 'fallback',
  number: 'N/A',
  issue_date: new Date().toISOString(),
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'draft',
  subtotal: 0,
  total: 0,
  currency: 'USD',
  invoice_items: [{
    id: 'fallback-item',
    invoice_id: 'fallback',
    description: 'No items available',
    qty: 0,
    unit_price: 0,
    line_total: 0,
  }],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Fallback client data for graceful degradation
const getFallbackClient = (): Client => ({
  id: 'fallback',
  org_id: 'fallback',
  name: 'Unknown Client',
  email: 'unknown@example.com',
  billing_address: {
    street: 'N/A',
    city: 'N/A',
    state: 'N/A',
    postal_code: 'N/A',
    country: 'N/A',
  },
  created_at: new Date().toISOString(),
});

// Main template renderer component with validation and fallbacks
interface TemplateRendererProps {
  templateId?: TemplateId;
  invoice: Invoice;
  client: Client;
  organization: Organization | null;
}

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  templateId = 'default',
  invoice,
  client,
  organization,
}) => {
  // Validate required data and use fallbacks if needed
  const validInvoice = validateInvoiceData(invoice) ? invoice : getFallbackInvoice();
  const validClient = validateClientData(client) ? client : getFallbackClient();

  // Get the template component from the registry
  const TemplateComponent = TEMPLATE_REGISTRY[templateId] || TEMPLATE_REGISTRY.default;

  // Render the selected template with validated/fallback data
  return (
    <TemplateComponent
      invoice={validInvoice}
      client={validClient}
      organization={organization}
    />
  );
};

// Utility function to get all available templates
export const getAllTemplates = () => {
  return Object.values(TEMPLATE_METADATA).filter(
    template => template.id !== 'default' // Exclude the default fallback
  );
};

// Utility function to validate if a template ID exists
export const isValidTemplateId = (id: string): id is TemplateId => {
  return id in TEMPLATE_REGISTRY;
};

// Export validation utilities for external use
export { validateInvoiceData, validateClientData, getFallbackInvoice, getFallbackClient };