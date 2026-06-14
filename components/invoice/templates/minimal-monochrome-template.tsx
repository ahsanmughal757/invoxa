import React from 'react';
import { Invoice, Client, Organization } from '@/types/invoice';
import { formatCurrency, formatDate } from '@/lib/utils';

interface MinimalMonochromeTemplateProps {
  invoice: Invoice;
  client: Client;
  organization: Organization | null;
}

export const MinimalMonochromeTemplate: React.FC<MinimalMonochromeTemplateProps> = ({
  invoice,
  client,
  organization,
}) => {
  return (
    <div className="bg-white w-full p-12 print:p-0 print:m-0 print:bg-white font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start mb-16">
        <div>
          <h1 className="text-5xl font-thin text-gray-900 mb-8 tracking-tight">INVOICE</h1>
          <div className="text-gray-800 space-y-3">
            <p className="text-lg">#{invoice.number}</p>
            <p>Issue Date: <span className="font-light">{formatDate(new Date(invoice.issue_date))}</span></p>
            <p>Due Date: <span className="font-light">{formatDate(new Date(invoice.due_date))}</span></p>
            <p className="pt-4 capitalize font-normal text-lg">
              Status: <span className="lowercase font-medium">{invoice.status.replace('_', ' ')}</span>
            </p>
          </div>
        </div>

        <div className="mt-10 sm:mt-0 text-right">
          {organization?.name && (
            <div className="text-2xl font-extralight text-gray-900 mb-6 tracking-wide">
              {organization.name}
            </div>
          )}
          {organization?.logo_url && (
            <div className="mb-4">
              <img
                src={organization.logo_url}
                alt="Company Logo"
                className="max-h-16 max-w-40 object-contain opacity-90 grayscale"
              />
            </div>
          )}
        </div>
      </div>

      {/* Client Info */}
      <div className="mb-16 pb-8 border-b border-gray-300 border-dotted">
        <h2 className="text-xl font-light text-gray-900 mb-6 uppercase tracking-widest">Bill To</h2>
        <div className="text-gray-800 space-y-3">
          <p className="text-lg font-medium">{client.name}</p>
          {client.billing_address && (
            <p className="font-light">
              {client.billing_address.street && `${client.billing_address.street}, `}
              {client.billing_address.city && `${client.billing_address.city}, `}
              {client.billing_address.state && `${client.billing_address.state} `}
              {client.billing_address.postal_code && client.billing_address.postal_code}
            </p>
          )}
          <p className="font-light">{client.email}</p>
          {client.phone && <p className="font-light">{client.phone}</p>}
        </div>
      </div>

      {/* Items */}
      <div className="mb-16">
        <div className="space-y-6">
          {invoice.invoice_items.map((item, index) => (
            <div key={item.id || index} className="flex justify-between py-4 border-b border-gray-200 border-dotted">
              <div className="w-2/5">
                <p className="text-gray-900 text-lg">{item.description}</p>
              </div>
              <div className="w-1/5 text-right text-gray-700 font-light">{item.qty}</div>
              <div className="w-1/5 text-right text-gray-700 font-light">{formatCurrency(item.unit_price, invoice.currency)}</div>
              <div className="w-1/5 text-right font-normal text-gray-900">{formatCurrency(item.line_total, invoice.currency)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="ml-auto w-full max-w-xs space-y-4 mb-16">
        <div className="flex justify-between pb-3 border-b border-gray-300 border-dotted">
          <span className="text-gray-700 font-light">Subtotal:</span>
          <span className="text-gray-900 font-light">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
        </div>
        {invoice.tax_amount && (
          <div className="flex justify-between pb-3 border-b border-gray-300 border-dotted">
            <span className="text-gray-700 font-light">Tax ({invoice.tax_rate || 0}%):</span>
            <span className="text-gray-900 font-light">{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
          </div>
        )}
        <div className="flex justify-between pt-4 border-t-2 border-gray-900 text-xl font-normal">
          <span className="text-gray-900">Total:</span>
          <span className="text-gray-900">{formatCurrency(invoice.total, invoice.currency)}</span>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="border-t border-gray-300 border-dotted pt-8">
          <h3 className="text-xl font-light text-gray-900 mb-4 uppercase tracking-widest">Notes</h3>
          <p className="text-gray-800 font-light whitespace-pre-line leading-relaxed">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
};