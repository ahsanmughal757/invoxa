'use client';

import { InvoiceProvider } from '@/context/InvoiceContext';
import ClientProfileClient from '@/components/clients/client-profile-client';
import { Client, Invoice, PaymentRecord } from '@/types/invoice';

interface ClientProfileWrapperProps {
  initialClient: Client;
  initialInvoices: Invoice[];
  initialPayments: PaymentRecord[];
}

export default function ClientProfileWrapper({ 
  initialClient, 
  initialInvoices, 
  initialPayments 
}: ClientProfileWrapperProps) {
  return (
    <InvoiceProvider>
      <ClientProfileClient 
        initialClient={initialClient} 
        initialInvoices={initialInvoices} 
        initialPayments={initialPayments} 
      />
    </InvoiceProvider>
  );
}