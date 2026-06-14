import React from 'react';
import { Invoice, Client, Organization } from '@/types/invoice';
import { formatCurrency, formatDate } from '@/lib/utils';
import { InvoiceStateBadge } from '../invoice-state-badge';
import { Card, CardContent } from '@/components/ui/card';

interface ModernCleanTemplateProps {
  invoice: Invoice;
  client: Client;
  organization: Organization | null;
}

export const ModernCleanTemplate: React.FC<ModernCleanTemplateProps> = ({
  invoice,
  client,
  organization,
}) => {
  return (
    <div className="bg-white w-full p-8 print:p-0 print:m-0 print:bg-white font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-10 pb-6 border-b border-gray-100">
        <div className="mb-6 md:mb-0">
          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">INVOICE</h1>
            <InvoiceStateBadge invoice={invoice} />
          </div>
          <div className="space-y-2 text-gray-600">
            <p className="text-sm">Invoice #: {invoice.number}</p>
            <p className="text-sm">Issue Date: {formatDate(new Date(invoice.issue_date))}</p>
            <p className="text-sm">Due Date: {formatDate(new Date(invoice.due_date))}</p>
          </div>
        </div>

        <div className="text-right">
          {organization?.logo_url && (
            <div className="mb-4">
              <img
                src={organization.logo_url}
                alt="Company Logo"
                className="max-h-16 max-w-40 object-contain ml-auto"
              />
            </div>
          )}
          <div className="text-lg font-semibold text-gray-900">
            {organization?.name || 'Company Name'}
          </div>
        </div>
      </div>

      {/* Client Info Card */}
      <Card className="mb-10 shadow-sm border border-gray-100 rounded-lg">
        <CardContent className="pt-8 px-8 pb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Bill To</h2>
          <div className="space-y-3">
            <p className="font-medium text-gray-900">{client.name}</p>
            {client.billing_address && (
              <p className="text-gray-700">
                {client.billing_address.street && `${client.billing_address.street}, `}
                {client.billing_address.city && `${client.billing_address.city}, `}
                {client.billing_address.state && `${client.billing_address.state} `}
                {client.billing_address.postal_code && client.billing_address.postal_code}
              </p>
            )}
            <p className="text-gray-700">{client.email}</p>
            {client.phone && <p className="text-gray-700">{client.phone}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Items Card */}
      <Card className="mb-10 shadow-sm border border-gray-100 rounded-lg">
        <CardContent className="pt-8 px-8 pb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-4 px-4 font-medium text-gray-600 text-sm uppercase tracking-wider">Description</th>
                  <th className="text-center py-4 px-4 font-medium text-gray-600 text-sm uppercase tracking-wider w-20">Qty</th>
                  <th className="text-right py-4 px-4 font-medium text-gray-600 text-sm uppercase tracking-wider w-24">Rate</th>
                  <th className="text-right py-4 px-4 font-medium text-gray-600 text-sm uppercase tracking-wider w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.invoice_items.map((item, index) => (
                  <tr key={item.id || index} className="border-b border-gray-50 last:border-b-0">
                    <td className="py-5 px-4 text-gray-800 text-sm">{item.description}</td>
                    <td className="py-5 px-4 text-center text-gray-700 text-sm">{item.qty}</td>
                    <td className="py-5 px-4 text-right text-gray-700 text-sm">{formatCurrency(item.unit_price, invoice.currency)}</td>
                    <td className="py-5 px-4 text-right text-gray-700 text-sm">{formatCurrency(item.line_total, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Totals Card */}
      <Card className="mb-10 shadow-sm border border-gray-100 rounded-lg">
        <CardContent className="pt-8 px-8 pb-8">
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between py-3 border-b border-gray-50">
                <span className="text-gray-600 text-sm">Subtotal:</span>
                <span className="text-gray-900 font-medium text-sm">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.tax_amount && (
                <div className="flex justify-between py-3 border-b border-gray-50">
                  <span className="text-gray-600 text-sm">Tax ({invoice.tax_rate || 0}%):</span>
                  <span className="text-gray-900 font-medium text-sm">{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-4 font-bold text-lg mt-3">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Card */}
      {invoice.notes && (
        <Card className="shadow-sm border border-gray-100 rounded-lg">
          <CardContent className="pt-8 px-8 pb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
            <p className="text-gray-700 whitespace-pre-line text-sm">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};