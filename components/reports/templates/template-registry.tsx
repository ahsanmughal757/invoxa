import React from 'react';
import { ProfessionalTemplate } from './professional-template';
import { ExecutiveSummaryTemplate } from './executive-summary-template';
import { DetailedAnalyticsTemplate } from './detailed-analytics-template';

// Define the template ID type
export type ReportTemplateId =
  | 'professional'
  | 'executive_summary'
  | 'detailed_analytics'
  | 'default';

// Define the report data interface
export interface ReportData {
  dateRange: string;
  generatedAt: string;
  metrics: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    totalInvoiced: number;
    outstandingAmount: number;
    averageInvoiceValue: number;
    collectionRate: number;
  };
  monthlyRevenue: { month: string; revenue: number }[];
  invoiceStatus: { name: string; value: number }[];
  topClients: { name: string; revenue: number }[];
  expenseCategories: { category: string; amount: number }[];
}

// Define the template component props
interface ReportTemplateProps {
  reportData: ReportData;
}

// Define the template component type
type ReportTemplateComponent = React.FC<ReportTemplateProps>;

// Template registry mapping template IDs to their respective components
const REPORT_TEMPLATE_REGISTRY: Record<ReportTemplateId, ReportTemplateComponent> = {
  professional: ProfessionalTemplate,
  executive_summary: ExecutiveSummaryTemplate,
  detailed_analytics: DetailedAnalyticsTemplate,
  default: ProfessionalTemplate,
};

// Template metadata for UI selection
export const REPORT_TEMPLATE_METADATA = {
  professional: {
    id: 'professional' as ReportTemplateId,
    name: 'Professional',
    description: 'Clean corporate layout with comprehensive tables',
    category: 'business',
    icon: '📊',
  },
  executive_summary: {
    id: 'executive_summary' as ReportTemplateId,
    name: 'Executive Summary',
    description: 'High-level overview with focus on key metrics',
    category: 'executive',
    icon: '📈',
  },
  detailed_analytics: {
    id: 'detailed_analytics' as ReportTemplateId,
    name: 'Detailed Analytics',
    description: 'Full data breakdown with visual indicators',
    category: 'analytics',
    icon: '📉',
  },
  default: {
    id: 'default' as ReportTemplateId,
    name: 'Default',
    description: 'Professional template (default)',
    category: 'default',
    icon: '📊',
  },
};

// Main template renderer component
interface ReportTemplateRendererProps {
  templateId?: ReportTemplateId;
  reportData: ReportData;
}

export const ReportTemplateRenderer: React.FC<ReportTemplateRendererProps> = ({
  templateId = 'default',
  reportData,
}) => {
  const TemplateComponent = REPORT_TEMPLATE_REGISTRY[templateId] || REPORT_TEMPLATE_REGISTRY.default;
  return <TemplateComponent reportData={reportData} />;
};

// Utility function to get all available templates
export const getAllReportTemplates = () => {
  return Object.values(REPORT_TEMPLATE_METADATA).filter(
    template => template.id !== 'default'
  );
};

// Utility function to validate if a template ID exists
export const isValidReportTemplateId = (id: string): id is ReportTemplateId => {
  return id in REPORT_TEMPLATE_REGISTRY;
};

// Export all templates for external use
export {
  ProfessionalTemplate,
  ExecutiveSummaryTemplate,
  DetailedAnalyticsTemplate,
};
