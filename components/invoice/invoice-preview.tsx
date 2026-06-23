"use client"

import { useMemo } from 'react'
import { Invoice, Client, Organization } from '@/types/invoice'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Printer, Download, Mail } from 'lucide-react'
import { InvoiceStateBadge } from './invoice-state-badge'
import { getComputedInvoiceState } from '@/lib/invoice-state'
import { TemplateRenderer, TemplateId, validateInvoiceData, validateClientData } from './templates/template-registry'

interface InvoicePreviewProps {
  invoice: Invoice | Partial<Invoice> // Allow partial for preview
  client: Client
  organization: Organization | null
  onPrint?: () => void
  onDownload?: () => void
  onSend?: () => void
  templateId?: TemplateId
}

export function InvoicePreview({ 
  invoice, 
  client, 
  organization, 
  onPrint, 
  onDownload, 
  onSend, 
  templateId = 'classic_business' 
}: InvoicePreviewProps) {
  const handlePrint = () => {
    window.print()
    onPrint?.()
  }

  const resolvedClient = useMemo(() => {
    const tc = (invoice as Invoice).additional_info?.temp_client
    if (!tc) return client
    return {
      ...client,
      name: tc.name,
      email: tc.email || client.email,
      phone: tc.phone || client.phone,
      billing_address: tc.billing_address || client.billing_address,
    }
  }, [invoice, client])

  // Validate data before rendering
  const isValidInvoice = validateInvoiceData(invoice as Invoice);
  const isValidClient = validateClientData(resolvedClient);

  if (!isValidInvoice || !isValidClient) {
    return (
      <div className="mx-auto w-full print:m-0 print:p-0">
        <div className="flex justify-end gap-2 mb-6 print:hidden">
          <Button onClick={handlePrint} variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Print</Button>
          {onDownload && <Button onClick={onDownload} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Download PDF</Button>}
          {onSend && <Button onClick={onSend} size="sm"><Mail className="h-4 w-4 mr-2" />Send Invoice</Button>}
        </div>
        <div className="bg-white w-full p-8 shadow-lg print:shadow-none print:p-0 print:m-0 print:bg-white">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Render Invoice</h2>
            <p className="text-gray-600 mb-6">
              {(!isValidInvoice && !isValidClient) 
                ? "Required invoice and client data is missing." 
                : !isValidInvoice 
                  ? "Required invoice data is missing." 
                  : "Required client data is missing."}
            </p>
            <p className="text-gray-500 text-sm">
              Please ensure all required fields are filled in the invoice form.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full print:m-0 print:p-0">
      {/* Action Buttons - Hidden in print */}
      <div className="flex justify-end gap-2 mb-6 print:hidden">
        <Button onClick={handlePrint} variant="outline" size="sm"><Printer className="h-4 w-4 mr-2" />Print</Button>
        {onDownload && <Button onClick={onDownload} variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Download PDF</Button>}
        {onSend && <Button onClick={onSend} size="sm"><Mail className="h-4 w-4 mr-2" />Send Invoice</Button>}
      </div>

      {/* Invoice Content - Using Template Renderer */}
      <TemplateRenderer
        templateId={templateId}
        invoice={invoice as Invoice}
        client={resolvedClient}
        organization={organization}
      />
    </div>
  )
}