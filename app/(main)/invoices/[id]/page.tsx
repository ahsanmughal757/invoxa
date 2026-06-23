"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/back-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Invoice, PaymentRecord, Client } from '@/types/invoice';
import { useInvoiceContext } from '@/context/InvoiceContext';
import { useOrganization } from '@/hooks/use-organization';
import { useClients } from '@/hooks/use-clients';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { getPaymentsByInvoiceIds } from '@/lib/queries/payments';
import { Clock, DollarSign, Calendar, User, FileText, Mail, Phone, MapPin, Eye } from 'lucide-react';
import { InvoicePreview } from '@/components/invoice/invoice-preview';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TemplateId } from '@/components/invoice/templates/template-registry';
import { LoadingState, EmptyState, ErrorState, ReadyState } from '@/components/ui/state-components';

export default function InvoiceDetailPage() {
  const { invoices } = useInvoiceContext();
  const { selectedOrganization: organization } = useOrganization();
  const { clients } = useClients();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);
  const [client, setClient] = useState<Client | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Find the invoice in context
        const foundInvoice = invoices.find(inv => inv.id === invoiceId);
        if (foundInvoice) {
          setInvoice(foundInvoice);
          // Find the associated client
          const foundClient = clients.find(c => c.id === foundInvoice.client_id);
          setClient(foundClient || null);

          // Fetch related payments
          try {
            const paymentsData = await getPaymentsByInvoiceIds([foundInvoice.id]);
            setPayments(paymentsData);
          } catch (error) {
            console.error('Error fetching payments:', error);
            setPayments([]);
          }
        } else {
          // Handle case where invoice is not found - still set loading to false
          console.log('Invoice not found:', invoiceId);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setLoading(false);
      }
    };

    console.log('Invoices: ', invoices);
    console.log('Clients: ', clients);
    // Always attempt to fetch data when invoiceId is present, regardless of invoices length
    if (invoiceId) {
      fetchData();
    } else {
      // If there's no invoiceId, stop loading
      setLoading(false);
    }
  }, [invoiceId, invoices, clients, router]);

  if (loading) {
    return (
      <LoadingState message="Loading invoice details..." size="large" />
    );
  }

  if (!invoice) {
    return (
      <EmptyState
        title="Invoice not found"
        description="The invoice you are looking for could not be found."
        action={{
          text: "Back to Invoices",
          onClick: () => router.push('/invoices'),
        }}
      />
    );
  }

  // Calculate remaining balance
  const paidAmount = invoice.paid_amount || 0;
  const remainingBalance = invoice.total - paidAmount;

  // Payment methods display
  const getPaymentMethodDisplay = (method: PaymentRecord['method']) => {
    const methodMap: Record<PaymentRecord['method'], string> = {
      cash: 'Cash',
      check: 'Check',
      bank_transfer: 'Bank Transfer',
      credit_card: 'Credit Card',
      paypal: 'PayPal',
      other: 'Other'
    };
    return methodMap[method];
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice #{invoice.number}</h1>
          <div className="flex items-center mt-2 space-x-4">
            <Badge
              className={`${
                invoice.status === 'paid' ? 'bg-green-500' :
                invoice.status === 'overdue' ? 'bg-red-500' :
                invoice.status === 'sent' ? 'bg-blue-500' :
                'bg-yellow-500'
              }`}
            >
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
            <span className="text-gray-600">
              Issue Date: {formatDate(new Date(invoice.issue_date))}
            </span>
            <span className="text-gray-600">
              Due Date: {formatDate(new Date(invoice.due_date))}
            </span>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Template
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/invoices/${invoice.id}/edit`)}
          >
            Edit Invoice
          </Button>
          <BackButton href="/invoices">Back to Invoices</BackButton>
        </div>
      </div>

      {/* Financial Intent vs Financial Events Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Invoice Claim Data Section (Financial Intent) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
            <h2 className="text-xl font-semibold flex items-center">
              <FileText className="h-5 w-5 mr-2 text-blue-600" />
              Financial Intent (Invoice Claim)
            </h2>
            <p className="text-sm text-gray-600 mt-1">This represents the monetary obligation claimed from the client</p>
          </div>

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(invoice.additional_info?.temp_client || client) ? (
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">
                    {invoice.additional_info?.temp_client?.name || client?.name}
                  </h3>
                  {(invoice.additional_info?.temp_client?.email || client?.email) && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {invoice.additional_info?.temp_client?.email || client?.email}
                    </div>
                  )}
                  {(invoice.additional_info?.temp_client?.phone || client?.phone) && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {invoice.additional_info?.temp_client?.phone || client?.phone}
                    </div>
                  )}
                  {(() => {
                    const addr = invoice.additional_info?.temp_client?.billing_address || client?.billing_address;
                    if (addr && (addr.street || addr.city || addr.state || addr.country)) {
                      return (
                        <div className="flex items-start text-gray-600 mt-2">
                          <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                          <div>
                            {addr.street && <div>{addr.street}</div>}
                            <div>
                              {addr.city && `${addr.city}, `}
                              {addr.state && `${addr.state} `}
                              {addr.postal_code && addr.postal_code}
                            </div>
                            {addr.country && <div>{addr.country}</div>}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <p className="text-gray-500">Client information not available</p>
              )}
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.invoice_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.qty}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price, invoice.currency)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.line_total, invoice.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 space-y-2 max-w-sm ml-auto">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {invoice.tax_amount && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Financial Events (Payments) Section */}
        <div className="space-y-6">
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r">
            <h2 className="text-xl font-semibold flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Financial Events (Payment Records)
            </h2>
            <p className="text-sm text-gray-600 mt-1">These represent actual money received events</p>
          </div>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Invoice Amount:</span>
                  <span className="font-medium">{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-medium text-green-600">{formatCurrency(paidAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining Balance:</span>
                  <span className={`font-medium ${remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(remainingBalance, invoice.currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Events Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Payment Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length > 0 ? (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border-l-4 border-green-500 pl-4 py-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{formatCurrency(payment.amount, invoice.currency)}</span>
                        <span className="text-sm text-gray-500">{formatDate(new Date(payment.received_on))}</span>
                      </div>
                      <div className="text-sm text-gray-600">{getPaymentMethodDisplay(payment.method)}</div>
                      {payment.reference && (
                        <div className="text-xs text-gray-500">Ref: {payment.reference}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No payments recorded for this invoice</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Recording CTA */}
          {remainingBalance > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Record Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Record a payment received for this invoice
                </p>
                <Button
                  className="w-full"
                  onClick={() => router.push('/payments')} // Navigate to payment recording page
                >
                  Record Payment
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto [&>.close-btn]:print:hidden">
          <DialogHeader>
            <DialogTitle className='print:hidden'>Invoice Preview</DialogTitle>
          </DialogHeader>
          {invoice && (
            <InvoicePreview
              invoice={invoice}
              client={(() => {
                if (invoice.additional_info?.temp_client) {
                  const tc = invoice.additional_info.temp_client;
                  return {
                    ...(client || {}),
                    id: client?.id || "",
                    org_id: client?.org_id || "",
                    name: tc.name,
                    email: tc.email || client?.email || "",
                    phone: tc.phone || client?.phone || "",
                    billing_address: tc.billing_address || client?.billing_address,
                    created_at: client?.created_at || new Date().toISOString(),
                  } as Client;
                }
                return client as Client;
              })()}
              organization={organization}
              templateId={invoice.template_id as TemplateId || 'classic_business'}
              onSend={() => {
                setIsPreviewOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}