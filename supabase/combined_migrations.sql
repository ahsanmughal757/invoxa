--------------------------------------------------------------------------------
-- MIGRATION: 20250816200000_create_initial_auth_tables.sql
--------------------------------------------------------------------------------

-- Create the profiles table to store user information
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES profiles(id),
    name TEXT NOT NULL,
    logo_url TEXT,
    branding JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a type for user roles
DROP TYPE IF EXISTS org_role;
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member');

-- Create the org_members table to link users and organizations
CREATE TABLE org_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    "role" org_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, user_id)
);

-- Add indexes for performance
CREATE INDEX idx_organizations_owner_user_id ON organizations(owner_user_id);
CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);

-- Enable Row-Level Security for the tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy for profiles: Users can only access their own profile
CREATE POLICY "Users can view and update their own profile"
ON profiles FOR ALL
USING (clerk_user_id = auth.uid()::text)
WITH CHECK (clerk_user_id = auth.uid()::text);

-- RLS Policy for organizations: Users can only see organizations they are a member of.
CREATE POLICY "Users can view their own organizations"
ON organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = organizations.id
    AND p.clerk_user_id = auth.uid()::text
  )
);

CREATE POLICY "Owners can update their own organizations"
ON organizations FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = organizations.id
    AND p.clerk_user_id = auth.uid()::text
    AND om.role = 'owner'
  )
);

CREATE POLICY "Users can create organizations"
ON organizations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = owner_user_id
    AND p.clerk_user_id = auth.uid()::text
  )
);

-- Helper function to get the organizations and roles of the current user
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS TABLE(org_id UUID, role org_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT om.org_id, om.role
  FROM org_members om
  JOIN profiles p ON om.user_id = p.id
  WHERE p.clerk_user_id = auth.uid()::text;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION get_user_organizations() TO authenticated;

-- RLS Policy for org_members: Users can see other members of organizations they belong to.
CREATE POLICY "Users can view members of their own organizations"
ON org_members FOR SELECT
USING (
  org_id IN (SELECT org_id FROM get_user_organizations())
);

CREATE POLICY "Owners and admins can manage organization members"
ON org_members FOR ALL
USING (
  org_id IN (
    SELECT org_id
    FROM get_user_organizations()
    WHERE role IN ('owner', 'admin')
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id
    FROM get_user_organizations()
    WHERE role IN ('owner', 'admin')
  )
);


--------------------------------------------------------------------------------
-- MIGRATION: 20250816200001_create_clients_table.sql
--------------------------------------------------------------------------------

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
    payment_terms INTEGER DEFAULT 30 CHECK (payment_terms > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    total_invoiced DECIMAL(12, 2) DEFAULT 0.00 CHECK (total_invoiced >= 0),
    total_paid DECIMAL(12, 2) DEFAULT 0.00 CHECK (total_paid >= 0),
    outstanding_balance DECIMAL(12, 2) GENERATED ALWAYS AS (total_invoiced - total_paid) STORED,
    notes TEXT,
    last_invoice_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, email)
);

-- Add indexes for faster searching
CREATE INDEX idx_clients_org_id ON clients(org_id);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_email ON clients(email);

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


--------------------------------------------------------------------------------
-- MIGRATION: 20250816200002_create_invoices_tables.sql
--------------------------------------------------------------------------------

-- Create an enum type for invoice status
DROP TYPE IF EXISTS invoice_status;
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'void', 'cancelled');

-- Create an enum type for recurring frequency
DROP TYPE IF EXISTS recurring_frequency;
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
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    tax_rate DECIMAL(5, 2) DEFAULT 0.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
    tax_amount DECIMAL(12, 2) GENERATED ALWAYS AS (subtotal * tax_rate / 100) STORED,
    discount_total DECIMAL(12, 2) DEFAULT 0.00 CHECK (discount_total >= 0),
    total DECIMAL(12, 2) GENERATED ALWAYS AS (subtotal + (subtotal * tax_rate / 100) - discount_total) STORED,
    paid_amount DECIMAL(12, 2) DEFAULT 0.00 CHECK (paid_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    notes TEXT,
    pdf_url TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency recurring_frequency,
    next_invoice_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, "number"),
    CHECK (due_date >= issue_date),
    CHECK (discount_total <= subtotal)
);

-- Create the invoice_items table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    qty INTEGER NOT NULL CHECK (qty > 0),
    unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0),
    line_total DECIMAL(12, 2) GENERATED ALWAYS AS (qty * unit_price) STORED
);

-- Add indexes for performance
CREATE INDEX idx_invoices_org_id ON invoices(org_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION fn_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trg_update_invoices_updated_at
BEFORE UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION fn_update_updated_at();

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


--------------------------------------------------------------------------------
-- MIGRATION: 20250816200003_create_payments_table.sql
--------------------------------------------------------------------------------

-- Create an enum type for payment methods
DROP TYPE IF EXISTS payment_method;
CREATE TYPE payment_method AS ENUM ('cash', 'check', 'bank_transfer', 'credit_card', 'paypal', 'other');

-- Create the payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    received_on DATE NOT NULL,
    method payment_method NOT NULL,
    reference TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for the invoice_id for faster lookups
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_received_on ON payments(received_on);

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


--------------------------------------------------------------------------------
-- MIGRATION: 20250816200004_create_activity_log_table.sql
--------------------------------------------------------------------------------

-- Create the activity_log table for auditing
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_user_id UUID NOT NULL REFERENCES profiles(id),
    entity_type TEXT NOT NULL,
    entity_id UUID,
    action TEXT NOT NULL,
    meta JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for querying the log
CREATE INDEX idx_activity_log_org_id ON activity_log(org_id);
CREATE INDEX idx_activity_log_entity_type_id ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX idx_activity_log_actor_user_id ON activity_log(actor_user_id);

-- Enable Row-Level Security
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy for activity_log: Users can view activity logs for their own organizations.
CREATE POLICY "Users can view activity logs for their own organizations"
ON activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = activity_log.org_id
    AND p.clerk_user_id = auth.uid()::text
  )
);

-- RLS Policy for inserts: For now, we assume inserts are handled by the backend with a service role.
-- We will add a restrictive policy to prevent direct client-side inserts.
CREATE POLICY "Restrict inserts to service role only"
ON activity_log FOR INSERT
WITH CHECK (false);


--------------------------------------------------------------------------------
-- MIGRATION: 20250816200005_create_invoice_status_helpers.sql
--------------------------------------------------------------------------------

-- Function to update the invoice's paid_amount field based on its payments
CREATE OR REPLACE FUNCTION fn_update_invoice_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
    -- When a payment is inserted, updated, or deleted, recalculate the paid_amount on the invoice
    UPDATE invoices
    SET paid_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM payments
        WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    )
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update the invoice's paid_amount after a payment is modified
CREATE TRIGGER trg_update_invoice_paid_amount
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION fn_update_invoice_paid_amount();

-- Function to recompute the status of an invoice based on its financial state
CREATE OR REPLACE FUNCTION fn_recompute_invoice_status()
RETURNS TRIGGER AS $$
DECLARE
    current_status invoice_status;
BEGIN
    -- We only want to update from certain states, e.g., don't update a 'void' or 'cancelled' invoice
    IF NEW.status IN ('draft', 'sent', 'overdue') THEN
        -- Check if the invoice is fully paid
        IF NEW.paid_amount >= NEW.total THEN
            NEW.status := 'paid';
        -- Check if the invoice is overdue
        ELSIF NEW.due_date < current_date AND NEW.status != 'paid' THEN
            NEW.status := 'overdue';
        -- If it was a draft and now has a payment, move it to sent
        ELSIF NEW.status = 'draft' AND NEW.paid_amount > 0 THEN
            NEW.status := 'sent';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to recompute the invoice status before an invoice is updated
CREATE TRIGGER trg_recompute_invoice_status
BEFORE UPDATE ON invoices
FOR EACH ROW
WHEN (OLD.paid_amount IS DISTINCT FROM NEW.paid_amount OR OLD.due_date IS DISTINCT FROM NEW.due_date OR OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION fn_recompute_invoice_status();


--------------------------------------------------------------------------------
-- MIGRATION: 20250816200006_create_dashboard_views.sql
--------------------------------------------------------------------------------

-- Create a view for efficient dashboard KPI loading (using regular view for real-time data)
CREATE VIEW v_dashboard_stats AS
SELECT
    org_id,
    -- Revenue Year-to-Date: Sum of all payments received in the current year.
    COALESCE(SUM(p.amount) FILTER (WHERE date_part('year', p.received_on) = date_part('year', current_date)), 0) AS revenue_ytd,
    -- Outstanding Total: Sum of balances on all invoices that are not drafts or fully paid.
    COALESCE(SUM(i.total - i.paid_amount) FILTER (WHERE i.status IN ('sent', 'overdue')), 0) AS outstanding_total,
    -- Overdue Count: Total number of invoices currently marked as overdue.
    COALESCE(COUNT(*) FILTER (WHERE i.status = 'overdue'), 0) AS overdue_count,
    -- Total clients count
    (SELECT COUNT(*) FROM clients c WHERE c.org_id = i.org_id) AS total_clients,
    -- This month's revenue
    COALESCE(SUM(p.amount) FILTER (WHERE date_trunc('month', p.received_on) = date_trunc('month', current_date)), 0) AS revenue_this_month
FROM
    invoices i
LEFT JOIN
    payments p ON i.id = p.invoice_id
GROUP BY
    i.org_id;

-- Create a view for monthly revenue breakdown
CREATE VIEW v_monthly_revenue AS
SELECT
    org_id,
    date_trunc('month', received_on)::date AS month,
    SUM(amount) as total
FROM
    payments p
JOIN
    invoices i ON p.invoice_id = i.id
GROUP BY
    org_id, month
ORDER BY
    org_id, month;

-- Enable RLS on views
ALTER VIEW v_dashboard_stats ENABLE ROW LEVEL SECURITY;
ALTER VIEW v_monthly_revenue ENABLE ROW LEVEL SECURITY;

-- RLS policies for views
CREATE POLICY "Users can view dashboard stats for their own organizations"
ON v_dashboard_stats FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = v_dashboard_stats.org_id
    AND p.clerk_user_id = auth.uid()::text
  )
);

CREATE POLICY "Users can view monthly revenue for their own organizations"
ON v_monthly_revenue FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = v_monthly_revenue.org_id
    AND p.clerk_user_id = auth.uid()::text
  )
);

--------------------------------------------------------------------------------
-- MIGRATION: 20250816200007_create_expenses_table.sql
--------------------------------------------------------------------------------

-- Create the expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    "date" DATE NOT NULL,
    category TEXT,
    tax_deductible BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_expenses_org_id ON expenses(org_id);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses("date");

-- Enable Row-Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policy for expenses: Users can manage expenses in their own organizations.
CREATE POLICY "Users can manage expenses in their own organizations"
ON expenses FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = expenses.org_id
    AND p.clerk_user_id = auth.uid()::text
  )
);

--------------------------------------------------------------------------------
-- MIGRATION: 20250816200008_create_additional_constraints_and_functions.sql
--------------------------------------------------------------------------------

-- Function to ensure organization owner is also a member
CREATE OR REPLACE FUNCTION fn_ensure_owner_is_member()
RETURNS TRIGGER AS $$
BEGIN
    -- When an organization is created, automatically add the owner as a member with 'owner' role
    INSERT INTO org_members (org_id, user_id, role)
    VALUES (NEW.id, NEW.owner_user_id, 'owner')
    ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'owner';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add organization owner as member
CREATE TRIGGER trg_ensure_owner_is_member
AFTER INSERT ON organizations
FOR EACH ROW EXECUTE FUNCTION fn_ensure_owner_is_member();

-- Function to update client totals when invoices change
CREATE OR REPLACE FUNCTION fn_update_client_totals()
RETURNS TRIGGER AS $$
DECLARE
    client_id_to_update UUID;
BEGIN
    -- Determine which client to update
    client_id_to_update := COALESCE(NEW.client_id, OLD.client_id);
    
    -- Update client totals
    UPDATE clients
    SET 
        total_invoiced = (
            SELECT COALESCE(SUM(total), 0)
            FROM invoices
            WHERE client_id = client_id_to_update AND status != 'void'
        ),
        total_paid = (
            SELECT COALESCE(SUM(paid_amount), 0)
            FROM invoices
            WHERE client_id = client_id_to_update AND status != 'void'
        ),
        last_invoice_date = (
            SELECT MAX(issue_date)
            FROM invoices
            WHERE client_id = client_id_to_update AND status != 'void'
        )
    WHERE id = client_id_to_update;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update client totals when invoices change
CREATE TRIGGER trg_update_client_totals
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION fn_update_client_totals();

-- Add constraint to prevent overpayment
ALTER TABLE invoices ADD CONSTRAINT chk_paid_amount_not_exceed_total 
CHECK (paid_amount <= total);

-- Add constraint to ensure recurring invoices have frequency set
ALTER TABLE invoices ADD CONSTRAINT chk_recurring_frequency 
CHECK (
    (is_recurring = false) OR 
    (is_recurring = true AND recurring_frequency IS NOT NULL AND next_invoice_date IS NOT NULL)
);

-- Create function to validate payment doesn't exceed invoice balance
CREATE OR REPLACE FUNCTION fn_validate_payment_amount()
RETURNS TRIGGER AS $$
DECLARE
    invoice_balance DECIMAL(12, 2);
BEGIN
    -- Get current balance for the invoice
    SELECT (total - paid_amount) INTO invoice_balance
    FROM invoices
    WHERE id = NEW.invoice_id;
    
    -- Check if payment exceeds balance (with small tolerance for rounding)
    IF NEW.amount > (invoice_balance + 0.01) THEN
        RAISE EXCEPTION 'Payment amount (%) exceeds invoice balance (%)', NEW.amount, invoice_balance;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate payment amounts
CREATE TRIGGER trg_validate_payment_amount
BEFORE INSERT OR UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION fn_validate_payment_amount();

-- Create indexes for better RLS policy performance
CREATE INDEX idx_profiles_clerk_user_id ON profiles(clerk_user_id);
CREATE INDEX idx_org_members_composite ON org_members(org_id, user_id, role);

-- Add comments for documentation
COMMENT ON TABLE profiles IS 'User profiles linked to authentication system';
COMMENT ON TABLE organizations IS 'Business organizations/companies';
COMMENT ON TABLE org_members IS 'Many-to-many relationship between users and organizations with roles';
COMMENT ON TABLE clients IS 'Customers/clients of organizations';
COMMENT ON TABLE invoices IS 'Invoice documents with line items and payment tracking';
COMMENT ON TABLE invoice_items IS 'Individual line items on invoices';
COMMENT ON TABLE payments IS 'Payment records against invoices';
COMMENT ON TABLE expenses IS 'Business expense tracking';
COMMENT ON TABLE activity_log IS 'Audit trail for all system actions';

COMMENT ON FUNCTION get_user_organizations() IS 'Helper function to get organizations and roles for current user - used in RLS policies';
COMMENT ON FUNCTION fn_update_invoice_paid_amount() IS 'Automatically updates invoice paid_amount when payments are modified';
COMMENT ON FUNCTION fn_recompute_invoice_status() IS 'Automatically updates invoice status based on payment state and due date';
COMMENT ON FUNCTION fn_ensure_owner_is_member() IS 'Ensures organization owners are automatically added as members';
COMMENT ON FUNCTION fn_update_client_totals() IS 'Updates client summary totals when invoices change';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;