import React from 'react';
import { Invoice, Client, Organization } from '@/types/invoice';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface FinancialDetailedTemplateProps {
  invoice: Invoice;
  client: Client;
  organization: Organization | null;
}

export const FinancialDetailedTemplate: React.FC<FinancialDetailedTemplateProps> = ({
  invoice,
  client,
  organization,
}) => {
  // Calculate additional financial metrics
  const paidAmount = invoice.paid_amount || 0;
  const remainingBalance = invoice.total - paidAmount;
  const taxRate = invoice.tax_rate || 0;
  const taxAmount = invoice.tax_amount || 0;
  const discountTotal = invoice.discount_total || 0;

  return (
    <div className="bg-white w-full p-4 print:p-0 print:m-0 print:bg-white font-sans text-xs">
      {/* Dense header with all essential info */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 mb-4 pb-4 border-b">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold text-gray-900">INVOICE</h1>
            <Badge
              className={`text-xs capitalize ${
                invoice.status === 'paid' ? 'bg-green-500' :
                invoice.status === 'overdue' ? 'bg-red-500' :
                invoice.status === 'sent' ? 'bg-blue-500' :
                invoice.status === 'draft' ? 'bg-yellow-500' :
                invoice.status === 'partially_paid' ? 'bg-orange-500' :
                'bg-gray-500'
              }`}
            >
              {invoice.status.replace('_', ' ')}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <p className="font-semibold text-gray-700">Inv #:</p>
              <p className="text-gray-900">{invoice.number}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Issue:</p>
              <p className="text-gray-900">{formatDate(new Date(invoice.issue_date))}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Due:</p>
              <p className="text-gray-900">{formatDate(new Date(invoice.due_date))}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Cur:</p>
              <p className="text-gray-900">{invoice.currency}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-right">
              {organization?.logo_url && (
                <div className="mb-2">
                  <img
                    src={organization.logo_url}
                    alt="Company Logo"
                    className="max-h-12 max-w-24 object-contain ml-auto"
                  />
                </div>
              )}
              <div className="text-sm font-bold text-gray-900">
                {organization?.name || 'COMPANY NAME'}
              </div>
              <div className="text-xs text-gray-600">
                {organization?.id && <div>Org ID: {organization.id}</div>}
              </div>
            </div>
            
            <div className="border-l pl-2">
              <div className="text-right">
                <div className="font-semibold text-gray-700">Total:</div>
                <div className="text-lg font-bold text-gray-900">{formatCurrency(invoice.total, invoice.currency)}</div>
              </div>
              <div className="text-right mt-1">
                <div className="text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid:</span>
                    <span className="text-green-600">{formatCurrency(paidAmount, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance:</span>
                    <span className={`${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'} font-bold`}>
                      {formatCurrency(remainingBalance, invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dense client and organization details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        <div className="border rounded p-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-2 border-b pb-1">BILL TO</h2>
          <div className="space-y-1">
            <div className="flex">
              <span className="font-semibold text-gray-700 w-20">Name:</span>
              <span className="text-gray-900">{client.name}</span>
            </div>
            {client.company && (
              <div className="flex">
                <span className="font-semibold text-gray-700 w-20">Company:</span>
                <span className="text-gray-900">{client.company}</span>
              </div>
            )}
            {client.billing_address && (
              <div className="flex flex-wrap">
                <span className="font-semibold text-gray-700 w-20">Addr:</span>
                <span className="text-gray-900">
                  {client.billing_address.street && `${client.billing_address.street}, `}
                  {client.billing_address.city && `${client.billing_address.city}, `}
                  {client.billing_address.state && `${client.billing_address.state} `}
                  {client.billing_address.postal_code && client.billing_address.postal_code}
                  {client.billing_address.country && `, ${client.billing_address.country}`}
                </span>
              </div>
            )}
            <div className="flex">
              <span className="font-semibold text-gray-700 w-20">Email:</span>
              <span className="text-gray-900">{client.email}</span>
            </div>
            {client.phone && (
              <div className="flex">
                <span className="font-semibold text-gray-700 w-20">Phone:</span>
                <span className="text-gray-900">{client.phone}</span>
              </div>
            )}
            {client.tax_id && (
              <div className="flex">
                <span className="font-semibold text-gray-700 w-20">Tax ID:</span>
                <span className="text-gray-900">{client.tax_id}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border rounded p-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-2 border-b pb-1">FINANCIAL SUMMARY</h2>
          <div className="grid grid-cols-2 gap-1 text-sm">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Subtotal:</span>
              <span className="text-gray-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Discount:</span>
                <span className="text-gray-900">-{formatCurrency(discountTotal, invoice.currency)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Tax ({taxRate}%):</span>
                <span className="text-gray-900">{formatCurrency(taxAmount, invoice.currency)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-gray-300 font-bold col-span-2">
              <span className="font-semibold text-gray-700">TOTAL AMOUNT:</span>
              <span className="text-gray-900">{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Paid:</span>
              <span className="text-green-600">{formatCurrency(paidAmount, invoice.currency)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-300 font-bold col-span-2">
              <span className="font-semibold text-gray-700">REMAINING BALANCE:</span>
              <span className={`${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'} font-bold`}>
                {formatCurrency(remainingBalance, invoice.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dense items table with comprehensive breakdowns */}
      <div className="mb-4 border rounded overflow-hidden">
        <div className="bg-gray-100 px-2 py-2 border-b">
          <h3 className="text-sm font-semibold text-gray-900">INVOICE ITEMS</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-200 text-xs">
              <tr>
                <th className="py-2 px-2 text-left font-semibold text-gray-700 border-r">Description</th>
                <th className="py-2 px-2 text-center font-semibold text-gray-700 border-r w-16">Qty</th>
                <th className="py-2 px-2 text-right font-semibold text-gray-700 border-r w-20">Unit Price</th>
                <th className="py-2 px-2 text-right font-semibold text-gray-700 border-r w-20">Line Total</th>
                <th className="py-2 px-2 text-right font-semibold text-gray-700 w-20">Tax</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {invoice.invoice_items.map((item, index) => (
                <tr key={item.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 px-2 text-gray-800 border-r max-w-xs truncate">{item.description}</td>
                  <td className="py-2 px-2 text-center text-gray-800 border-r">{item.qty}</td>
                  <td className="py-2 px-2 text-right text-gray-800 border-r">{formatCurrency(item.unit_price, invoice.currency)}</td>
                  <td className="py-2 px-2 text-right text-gray-800 font-medium border-r">{formatCurrency(item.line_total, invoice.currency)}</td>
                  <td className="py-2 px-2 text-right text-gray-800">
                    {taxRate > 0 ? formatCurrency(item.line_total * (taxRate / 100), invoice.currency) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive financial breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
        <div className="border rounded p-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 border-b pb-1">PAYMENT TERMS</h3>
          <div className="text-xs space-y-1">
            <div>Due: {formatDate(new Date(invoice.due_date))}</div>
            {client.payment_terms && (
              <div>Net {client.payment_terms} days</div>
            )}
            {invoice.is_recurring && (
              <div>Recurring: {invoice.recurring_frequency}</div>
            )}
          </div>
        </div>

        <div className="border rounded p-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 border-b pb-1">DISCOUNTS & FEES</h3>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Discount:</span>
              <span className="text-right">{formatCurrency(discountTotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Late Fee:</span>
              <span className="text-right">{formatCurrency(0, invoice.currency)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-1 border-t">
              <span>Adjustments:</span>
              <span className="text-right">{formatCurrency(0, invoice.currency)}</span>
            </div>
          </div>
        </div>

        <div className="border rounded p-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 border-b pb-1">TAX BREAKDOWN</h3>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Tax Rate:</span>
              <span className="text-right">{taxRate}%</span>
            </div>
            <div className="flex justify-between">
              <span>Tax Amount:</span>
              <span className="text-right">{formatCurrency(taxAmount, invoice.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxable Amt:</span>
              <span className="text-right">{formatCurrency(invoice.subtotal - discountTotal, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional financial details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
        <div className="border rounded p-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 border-b pb-1">PAYMENT HISTORY</h3>
          <div className="text-xs">
            {paidAmount > 0 ? (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="text-green-600">{formatCurrency(paidAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="capitalize">
                    {invoice.status === 'partially_paid' ? 'Partially Paid' : 
                     invoice.status === 'paid' ? 'Fully Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            ) : (
              <div>No payments recorded</div>
            )}
          </div>
        </div>

        <div className="border rounded p-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 border-b pb-1">CURRENCY & CONVERSION</h3>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Currency:</span>
              <span>{invoice.currency}</span>
            </div>
            <div className="flex justify-between">
              <span>Exchange Rate:</span>
              <span>N/A</span>
            </div>
            <div className="flex justify-between">
              <span>Base Currency:</span>
              <span>{invoice.currency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes section */}
      {invoice.notes && (
        <div className="border rounded p-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 border-b pb-1">NOTES</h3>
          <div className="text-xs text-gray-700 whitespace-pre-line">
            {invoice.notes}
          </div>
        </div>
      )}
    </div>
  );
};