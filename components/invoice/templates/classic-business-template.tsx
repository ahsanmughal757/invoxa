import React from 'react';
import { Invoice, Client, Organization } from '@/types/invoice';
import { formatCurrency, formatDate } from '@/lib/utils';
import { InvoiceStateBadge } from '../invoice-state-badge';

interface ClassicBusinessTemplateProps {
  invoice: Invoice;
  client: Client;
  organization: Organization | null;
}

export const ClassicBusinessTemplate: React.FC<ClassicBusinessTemplateProps> = ({
  invoice,
  client,
  organization,
}) => {
  return (
    <div className="bg-white w-full p-8 shadow-lg print:shadow-none print:p-0 print:m-0 print:bg-white font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b-2 border-gray-800 pb-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">INVOICE</h1>
            <InvoiceStateBadge invoice={invoice} />
          </div>
          <div className="text-sm text-gray-700 border-l-2 border-gray-300 pl-3 py-1">
            <p><span className="font-medium">Invoice #:</span> {invoice.number}</p>
            <p><span className="font-medium">Issue Date:</span> {formatDate(new Date(invoice.issue_date))}</p>
            <p><span className="font-medium">Due Date:</span> {formatDate(new Date(invoice.due_date))}</p>
          </div>
        </div>
        <div className="text-right">
          {organization?.logo_url && (
            <div className="mb-4">
              <img
                src={organization.logo_url}
                alt="Company Logo"
                className="max-h-16 max-w-48 object-contain ml-auto border border-gray-200 p-1"
              />
            </div>
          )}
          <div className="text-xl font-bold text-gray-900 mb-1 border-b border-gray-200 pb-1">
            {organization?.name || 'COMPANY NAME'}
          </div>
          <div className="text-sm text-gray-600 mt-2">
            {organization?.owner_user_id && <div><span className="font-medium">Org ID:</span> {organization.id}</div>}
          </div>
        </div>
      </div>

      {/* Company and Client Information */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* From/Bill From Section */}
        <div className="border border-gray-300 p-4">
          <h2 className="text-base font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">FROM</h2>
          <div className="text-sm text-gray-700">
            <p className="font-medium">{organization?.name || 'COMPANY NAME'}</p>
            {organization && (
              <>
                <p>Attn: {organization.owner_user_id ? 'Accounting Department' : 'Billing Department'}</p>
                <p>Phone: N/A</p>
                <p>Email: info@company.com</p>
              </>
            )}
          </div>
        </div>

        {/* Bill To Section */}
        <div className="border border-gray-300 p-4">
          <h2 className="text-base font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">BILL TO</h2>
          <div className="text-sm text-gray-700">
            <p className="font-medium">{client.name}</p>
            {client.billing_address && (
              <p className="whitespace-pre-line mt-1">
                {client.billing_address.street && `${client.billing_address.street}\n`}
                {client.billing_address.city && `${client.billing_address.city}, `}
                {client.billing_address.state && `${client.billing_address.state} `}
                {client.billing_address.postal_code && client.billing_address.postal_code}
              </p>
            )}
            <p className="mt-1">{client.email}</p>
            {client.phone && <p>{client.phone}</p>}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8 overflow-hidden border border-gray-400">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 py-3 px-4 text-left font-bold text-gray-900 text-sm uppercase tracking-wider">Description</th>
              <th className="border border-gray-400 py-3 px-4 text-center font-bold text-gray-900 text-sm uppercase tracking-wider w-16">Qty</th>
              <th className="border border-gray-400 py-3 px-4 text-right font-bold text-gray-900 text-sm uppercase tracking-wider w-24">Rate</th>
              <th className="border border-gray-400 py-3 px-4 text-right font-bold text-gray-900 text-sm uppercase tracking-wider w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.invoice_items.map((item, index) => (
              <tr key={item.id || index}>
                <td className="border border-gray-400 py-3 px-4 text-gray-800 text-sm">{item.description}</td>
                <td className="border border-gray-400 py-3 px-4 text-center text-gray-800 text-sm">{item.qty}</td>
                <td className="border border-gray-400 py-3 px-4 text-right text-gray-800 text-sm">{formatCurrency(item.unit_price, invoice.currency)}</td>
                <td className="border border-gray-400 py-3 px-4 text-right text-gray-800 text-sm">{formatCurrency(item.line_total, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-8">
        <div className="w-64 border border-gray-400 rounded-sm overflow-hidden">
          <div className="flex justify-between py-2 px-4 bg-gray-100 border-b border-gray-400">
            <span className="text-gray-700 font-medium text-sm">Subtotal:</span>
            <span className="text-gray-900 font-medium text-sm">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          {invoice.tax_amount && (
            <div className="flex justify-between py-2 px-4 bg-gray-100 border-b border-gray-400">
              <span className="text-gray-700 font-medium text-sm">Tax ({invoice.tax_rate || 0}%):</span>
              <span className="text-gray-900 font-medium text-sm">{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
            </div>
          )}
          <div className="flex justify-between py-3 px-4 bg-gray-200 font-bold text-base">
            <span className="text-gray-900">TOTAL DUE:</span>
            <span className="text-gray-900">{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {/* Terms and Notes */}
      <div className="grid grid-cols-2 gap-8">
        <div className="border border-gray-300 p-4">
          <h3 className="font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">PAYMENT TERMS</h3>
          <p className="text-sm text-gray-700">
            Payment is due within {client.payment_terms || 30} days from the invoice date. Late payments may be subject to fees.
          </p>
        </div>
        
        {invoice.notes && (
          <div className="border border-gray-300 p-4">
            <h3 className="font-bold text-gray-900 mb-2 border-b border-gray-300 pb-1">NOTES:</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500 print:text-gray-400">
        Thank you for your business. Please remit payment by the due date.
      </div>
    </div>
  );
};