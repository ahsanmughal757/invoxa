import React from 'react';
import { Invoice, Client, Organization } from '@/types/invoice';
import { formatCurrency, formatDate } from '@/lib/utils';

interface BoldCreativeTemplateProps {
  invoice: Invoice;
  client: Client;
  organization: Organization | null;
}

export const BoldCreativeTemplate: React.FC<BoldCreativeTemplateProps> = ({
  invoice,
  client,
  organization,
}) => {
  // Using the primary color from the template settings if available, otherwise default to a vibrant color
  const primaryColor = organization?.branding?.primaryColor || '#ec4899'; // Default to pink-500 for bold creative look
  const secondaryColor = organization?.branding?.secondaryColor || '#8b5cf6'; // Default to violet-500

  return (
    <div className="bg-white w-full p-8 print:p-0 print:m-0 print:bg-white" style={{ fontFamily: organization?.branding?.fontFamily || 'Inter, sans-serif' }}>
      {/* Header with bold accent color and strong visual hierarchy */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-12 border-b-4 border-transparent" style={{ borderBottomColor: primaryColor }}>
        <div>
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <h1
                className="text-5xl font-black tracking-tighter"
                style={{ 
                  color: primaryColor,
                  textShadow: `2px 2px 0px ${secondaryColor}40` // subtle shadow for depth
                }}
              >
                INVOICE
              </h1>
              <div 
                className="absolute -bottom-2 left-0 h-1 w-full"
                style={{ backgroundColor: secondaryColor }}
              ></div>
            </div>
            <div
              className="inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-extrabold uppercase tracking-widest shadow-md"
              style={{
                backgroundColor: primaryColor,
                color: 'white',
                boxShadow: `0 4px 6px ${primaryColor}40`
              }}
            >
              {invoice.status.replace('_', ' ')}
            </div>
          </div>
          <div className="space-y-2 text-gray-800 bg-gray-50 p-4 rounded-lg border-l-4" style={{ borderLeftColor: primaryColor }}>
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: primaryColor }}>#</span>
              <p className="font-semibold tracking-wide">{invoice.number}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: primaryColor }}>📅</span>
              <p>Issue Date: <span className="font-medium">{formatDate(new Date(invoice.issue_date))}</span></p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: primaryColor }}>⏱️</span>
              <p>Due Date: <span className="font-medium">{formatDate(new Date(invoice.due_date))}</span></p>
            </div>
          </div>
        </div>

        <div className="mt-8 md:mt-0 text-right">
          {organization?.logo_url && (
            <div className="mb-6 transform rotate-3 shadow-xl p-2 inline-block print:rotate-0" style={{ borderColor: primaryColor, borderWidth: '3px' }}>
              <img
                src={organization.logo_url}
                alt="Company Logo"
                className="max-h-24 max-w-56 object-contain"
              />
            </div>
          )}
          <div
            className="text-2xl font-black mt-2 tracking-wide"
            style={{ 
              color: secondaryColor,
              textTransform: 'uppercase'
            }}
          >
            {organization?.name || 'COMPANY NAME'}
          </div>
          <div className="h-1 w-24 bg-gradient-to-r mt-2 mx-auto md:mx-0" style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}></div>
        </div>
      </div>

      {/* Creative divider */}
      <div className="my-10 flex items-center">
        <div className="flex-grow h-0.5" style={{ backgroundColor: `${primaryColor}40` }}></div>
        <div className="mx-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
            <span className="text-white font-bold text-lg">$</span>
          </div>
        </div>
        <div className="flex-grow h-0.5" style={{ backgroundColor: `${secondaryColor}40` }}></div>
      </div>

      {/* Client Info Section with creative styling */}
      <div
        className="mb-12 p-8 rounded-2xl shadow-lg transform -skew-y-1 print:transform-none"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`,
          border: `2px dashed ${primaryColor}`,
          transform: 'skewY(-1deg)'
        }}
      >
        <div className="transform skew-y-1 print:transform-none">
          <h2
            className="text-2xl font-black mb-6 uppercase tracking-widest flex items-center gap-3"
            style={{ 
              color: primaryColor,
              textShadow: `1px 1px 0px white`
            }}
          >
            <span style={{ color: secondaryColor }}>→</span> BILL TO
            <span style={{ color: secondaryColor, fontSize: '1rem' }}>CLIENT DETAILS</span>
          </h2>
          <div className="text-gray-800 space-y-3 pl-2">
            <p className="font-black text-xl tracking-wide" style={{ color: secondaryColor }}>{client.name}</p>
            {client.billing_address && (
              <div className="bg-white p-4 rounded-lg border-2" style={{ borderColor: primaryColor }}>
                <p className="font-medium">
                  {client.billing_address.street && `${client.billing_address.street}, `}
                  {client.billing_address.city && `${client.billing_address.city}, `}
                  {client.billing_address.state && `${client.billing_address.state} `}
                  {client.billing_address.postal_code && client.billing_address.postal_code}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="font-black" style={{ color: primaryColor }}>✉️</span>
                <p className="font-medium">{client.email}</p>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2">
                  <span className="font-black" style={{ color: primaryColor }}>📱</span>
                  <p className="font-medium">{client.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table with creative header */}
      <div className="mb-12 overflow-hidden rounded-2xl shadow-xl border-0">
        <div 
          className="py-5 px-6 text-white font-black text-lg uppercase tracking-widest"
          style={{ 
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
            letterSpacing: '2px'
          }}
        >
          Invoice Details
        </div>
        <table className="w-full bg-white">
          <thead>
            <tr
              className="text-gray-800"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <th className="py-5 px-6 text-left font-black uppercase tracking-wider text-sm" style={{ color: secondaryColor }}>Description</th>
              <th className="py-5 px-6 text-center font-black uppercase tracking-wider text-sm w-20" style={{ color: secondaryColor }}>Qty</th>
              <th className="py-5 px-6 text-right font-black uppercase tracking-wider text-sm w-24" style={{ color: secondaryColor }}>Rate</th>
              <th className="py-5 px-6 text-right font-black uppercase tracking-wider text-sm w-24" style={{ color: secondaryColor }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.invoice_items.map((item, index) => (
              <tr
                key={item.id || index}
                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}
                style={{ 
                  boxShadow: index % 2 === 0 ? 'none' : `inset 0 0 0 1000px ${primaryColor}05`
                }}
              >
                <td className="py-5 px-6 text-gray-800 font-medium">{item.description}</td>
                <td className="py-5 px-6 text-center text-gray-800 font-medium">{item.qty}</td>
                <td className="py-5 px-6 text-right text-gray-800 font-medium">{formatCurrency(item.unit_price, invoice.currency)}</td>
                <td className="py-5 px-6 text-right font-black text-gray-900" style={{ color: primaryColor }}>{formatCurrency(item.line_total, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Creative Totals Section */}
      <div className="mb-12">
        <div className="ml-auto w-full max-w-md">
          <div className="bg-gradient-to-r from-white to-gray-50 p-1 rounded-2xl border" style={{ borderColor: primaryColor }}>
            <div className="bg-white p-6 rounded-xl">
              <div className="flex justify-between py-4 border-b-2 border-dashed" style={{ borderColor: `${primaryColor}40` }}>
                <span className="text-gray-700 font-black text-lg">Subtotal:</span>
                <span className="text-gray-900 font-bold text-lg">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.tax_amount && (
                <div className="flex justify-between py-4 border-b-2 border-dashed" style={{ borderColor: `${secondaryColor}40` }}>
                  <span className="text-gray-700 font-black text-lg">Tax ({invoice.tax_rate || 0}%):</span>
                  <span className="text-gray-900 font-bold text-lg">{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                </div>
              )}
              <div
                className="flex justify-between py-5 mt-4 font-black text-2xl border-t-4"
                style={{ 
                  color: primaryColor,
                  borderColor: secondaryColor
                }}
              >
                <span>TOTAL DUE:</span>
                <span className="text-right">{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>
          
          {/* Payment CTA - hidden during printing */}
          <div className="mt-6 text-center print:hidden">
            <button
              className="px-8 py-4 font-black text-base uppercase tracking-wider rounded-full shadow-lg transform transition-transform hover:scale-105"
              style={{
                background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
                color: 'white',
                boxShadow: `0 6px 8px ${primaryColor}40`
              }}
            >
              Process Payment
            </button>
          </div>
        </div>
      </div>

      {/* Notes Section with creative styling */}
      {invoice.notes && (
        <div
          className="p-8 rounded-2xl border-4 border-dotted relative overflow-hidden"
          style={{
            borderColor: secondaryColor,
            background: `repeating-linear-gradient(
              45deg,
              ${primaryColor}05,
              ${primaryColor}05 10px,
              ${secondaryColor}05 10px,
              ${secondaryColor}05 20px
            )`
          }}
        >
          {/* Decorative corner elements */}
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2" style={{ borderColor: primaryColor }}></div>
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2" style={{ borderColor: secondaryColor }}></div>
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2" style={{ borderColor: secondaryColor }}></div>
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2" style={{ borderColor: primaryColor }}></div>
          
          <div className="relative z-10">
            <h3
              className="text-2xl font-black mb-5 uppercase tracking-widest flex items-center gap-2"
              style={{ color: primaryColor }}
            >
              <span style={{ color: secondaryColor }}>✎</span> ADDITIONAL NOTES
            </h3>
            <div style={{ color: secondaryColor }}>
              <p className="text-gray-700 whitespace-pre-line text-lg font-medium relative pl-6"
                style={{ 
                  color: secondaryColor
                }}>
                <span className="absolute left-0 top-1 w-4 h-4 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                {invoice.notes}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};