-- Create the clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    billing_address JSONB,
    tax_id TEXT,
    payment_terms INTEGER DEFAULT 30,
    currency TEXT NOT NULL DEFAULT 'USD',
    total_invoiced DECIMAL(12, 2) DEFAULT 0.00,
    total_paid DECIMAL(12, 2) DEFAULT 0.00,
    outstanding_balance DECIMAL(12, 2) GENERATED ALWAYS AS (total_invoiced - total_paid) STORED,
    notes TEXT,
    last_invoice_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, email)
);

-- Add an index on the name for faster searching
CREATE INDEX idx_clients_name ON clients(name);

-- Enable Row-Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- RLS Policy for clients: Users can manage clients in organizations they are a member of.
CREATE POLICY "Users can manage clients in their own organizations"
ON clients FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = clients.org_id
    AND p.clerk_user_id = auth.uid()::text
  )
);