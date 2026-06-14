-- Create an enum type for payment methods
CREATE TYPE payment_method AS ENUM ('cash', 'check', 'bank_transfer', 'credit_card', 'paypal', 'other');

-- Create the payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    received_on DATE NOT NULL,
    method payment_method NOT NULL,
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add an index for the invoice_id for faster lookups
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);

-- Enable Row-Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policy for payments: Users can manage payments for invoices in their own organizations.
CREATE POLICY "Users can manage payments in their own organizations"
ON payments FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM invoices i
    JOIN org_members om ON i.org_id = om.org_id
    JOIN profiles p ON om.user_id = p.id
    WHERE i.id = payments.invoice_id
    AND p.clerk_user_id = auth.uid()::text
  )
);