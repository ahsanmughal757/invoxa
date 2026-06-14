-- Create an enum type for invoice status
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'void', 'cancelled');

-- Create an enum type for recurring frequency
CREATE TYPE recurring_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');

-- Create the invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    "number" TEXT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status invoice_status NOT NULL DEFAULT 'draft',
    subtotal DECIMAL(12, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) GENERATED ALWAYS AS (subtotal * tax_rate / 100) STORED,
    discount_total DECIMAL(12, 2) DEFAULT 0.00,
    total DECIMAL(12, 2) GENERATED ALWAYS AS (subtotal + (subtotal * tax_rate / 100) - discount_total) STORED,
    paid_amount DECIMAL(12, 2) DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'USD',
    notes TEXT,
    pdf_url TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency recurring_frequency,
    next_invoice_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, "number")
);

-- Create the invoice_items table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    qty INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    line_total DECIMAL(12, 2) GENERATED ALWAYS AS (qty * unit_price) STORED
);

-- Add indexes for performance
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Enable Row-Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy for invoices: Users can manage invoices in their own organizations.
CREATE POLICY "Users can manage invoices in their own organizations"
ON invoices FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = invoices.org_id
    AND p.clerk_user_id = auth.uid()::text
  )
);

-- RLS Policy for invoice_items: Users can manage items for invoices in their own organizations.
CREATE POLICY "Users can manage invoice items in their own organizations"
ON invoice_items FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM invoices i
    JOIN org_members om ON i.org_id = om.org_id
    JOIN profiles p ON om.user_id = p.id
    WHERE i.id = invoice_items.invoice_id
    AND p.clerk_user_id = auth.uid()::text
  )
);