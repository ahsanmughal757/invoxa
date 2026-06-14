-- ============================================================================
-- InvoicePro - Complete Database Schema
-- ============================================================================
-- This is a consolidated migration combining all previous migrations.
-- Source: 46 individual migrations from 20250816 to 20260213
-- ============================================================================

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

-- User roles in organizations
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member');

-- Invoice status values
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'void', 'cancelled', 'partially_paid');

-- Recurring invoice frequencies
CREATE TYPE recurring_frequency AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');

-- Payment methods
CREATE TYPE payment_method AS ENUM ('cash', 'check', 'bank_transfer', 'credit_card', 'paypal', 'other');

-- Organization invite statuses
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired', 'revoked', 'rejected');

-- ============================================================================
-- 2. CORE TABLES (Auth & Organizations)
-- ============================================================================

-- User profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES profiles(id),
    owner_clerk_id TEXT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    branding JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization members table
CREATE TABLE org_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    "role" org_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, user_id)
);

-- Enable RLS for core tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
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

-- RLS Policies for org_members
CREATE POLICY "Users can view members of their own organizations"
ON org_members FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = org_members.org_id
    AND p.clerk_user_id = auth.uid()::text
  )
);

CREATE POLICY "Owners and admins can manage organization members"
ON org_members FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = org_members.org_id
    AND p.clerk_user_id = auth.uid()::text
    AND (om.role = 'owner' OR om.role = 'admin')
  )
);

-- ============================================================================
-- 3. CLIENTS TABLE
-- ============================================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    clerk_user_id TEXT,
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
    additional_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, email)
);

-- Indexes for clients
CREATE INDEX idx_clients_name ON clients(name);

-- RLS for clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- 4. INVOICES & INVOICE ITEMS TABLES
-- ============================================================================

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
    created_by_profile_id UUID REFERENCES profiles(id),
    template_id TEXT,
    additional_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, "number")
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    qty INTEGER NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    line_total DECIMAL(12, 2) GENERATED ALWAYS AS (qty * unit_price) STORED
);

-- Indexes for invoices
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- RLS for invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- 5. PAYMENTS TABLE
-- ============================================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    client_id TEXT,
    user_id UUID REFERENCES profiles(id),
    amount DECIMAL(12, 2) NOT NULL,
    received_on DATE NOT NULL,
    method payment_method NOT NULL,
    reference TEXT,
    notes TEXT,
    additional_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for payments
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);

-- RLS for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage payments in their own organizations or personal payments"
ON payments FOR ALL
USING (
  (
    EXISTS (
      SELECT 1
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN org_members om ON i.org_id = om.org_id
      JOIN profiles pr ON om.user_id = pr.id
      WHERE p.id = payments.id
      AND pr.clerk_user_id = auth.uid()::text
    )
  )
  OR
  (
    payments.user_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = auth.uid()::text
    )
  )
);

-- ============================================================================
-- 6. EXPENSES TABLE
-- ============================================================================

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID,
    clerk_user_id TEXT,
    user_id TEXT,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    "date" DATE NOT NULL,
    category TEXT,
    tax_deductible BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    vendor TEXT,
    client_id TEXT,
    invoice_id TEXT,
    additional_info JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for expenses
CREATE INDEX idx_expenses_org_id ON expenses(org_id);
CREATE INDEX idx_expenses_category ON expenses(category);

-- RLS for expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- 7. ACTIVITY LOG TABLE
-- ============================================================================

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

-- Indexes for activity_log
CREATE INDEX idx_activity_log_org_id ON activity_log(org_id);
CREATE INDEX idx_activity_log_entity_type_id ON activity_log(entity_type, entity_id);

-- RLS for activity_log
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Restrict inserts to service role only"
ON activity_log FOR INSERT
WITH CHECK (false);

-- ============================================================================
-- 8. NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_clerk_user_id TEXT,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'invoice',
    related_entity_id UUID,
    related_entity_type TEXT DEFAULT 'invoice',
    is_read BOOLEAN DEFAULT FALSE,
    cleared BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    associated_clerk_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_recipient_user_id ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX idx_notifications_type ON notifications(type);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for user's own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = recipient_user_id);

-- ============================================================================
-- 9. ORGANIZATION INVITES TABLE
-- ============================================================================

CREATE TABLE organization_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    email TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    status invite_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    accepted_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes for organization_invites
CREATE INDEX idx_organization_invites_token ON organization_invites(token);
CREATE INDEX idx_organization_invites_organization_id ON organization_invites(organization_id);

-- RLS for organization_invites
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    clerk_user_id TEXT,
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- 11. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is org owner
CREATE OR REPLACE FUNCTION public.is_org_owner(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = org_id
    AND owner_user_id = (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text)
  );
$$;

-- Function to check if user is org member
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members om
    JOIN public.profiles p ON om.user_id = p.id
    WHERE om.org_id = target_org_id
    AND p.clerk_user_id = auth.uid()::text
  ) OR EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = target_org_id
    AND owner_user_id = (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text)
  );
$$;

-- Function to update invoice paid_amount from payments
CREATE OR REPLACE FUNCTION fn_update_invoice_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
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

-- Function to recompute invoice status
CREATE OR REPLACE FUNCTION fn_recompute_invoice_status()
RETURNS TRIGGER AS $$
DECLARE
    current_status invoice_status;
BEGIN
    IF NEW.status IN ('draft', 'sent', 'overdue') THEN
        IF NEW.paid_amount >= NEW.total THEN
            NEW.status := 'paid';
        ELSIF NEW.due_date < current_date THEN
            NEW.status := 'overdue';
        ELSIF NEW.status = 'draft' AND NEW.paid_amount > 0 THEN
            NEW.status := 'sent';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create invoice notification
CREATE OR REPLACE FUNCTION public.create_invoice_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    client_clerk_id TEXT;
    sender_profile_id UUID;
    sender_name TEXT;
BEGIN
    SELECT clerk_user_id
    INTO client_clerk_id
    FROM public.clients
    WHERE id = NEW.client_id;

    sender_profile_id := NEW.created_by_profile_id;

    IF client_clerk_id IS NOT NULL THEN
        SELECT name
        INTO sender_name
        FROM public.profiles
        WHERE id = sender_profile_id;

        IF sender_name IS NULL THEN
            sender_name := 'Someone';
        END IF;

        INSERT INTO public.notifications (
            recipient_clerk_user_id,
            invoice_id,
            org_id,
            message
        )
        VALUES (
            client_clerk_id,
            NEW.id,
            NEW.org_id,
            sender_name || ' sent you an invoice.'
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Function to create invite notification
CREATE OR REPLACE FUNCTION public.create_invite_notification()
RETURNS TRIGGER AS $$
DECLARE
    inviter_user_id UUID;
    recipient_email TEXT;
    organization_name TEXT;
    message_text TEXT;
BEGIN
    SELECT name INTO organization_name
    FROM public.organizations
    WHERE id = NEW.organization_id;

    SELECT email INTO recipient_email
    FROM public.profiles
    WHERE id = NEW.inviter_id;

    IF NEW.status = 'accepted' THEN
        SELECT email INTO recipient_email
        FROM public.profiles
        WHERE id = NEW.accepted_by_user_id;

        message_text := COALESCE(recipient_email, 'A user') || ' has accepted your invitation to join ' || COALESCE(organization_name, 'the organization') || '.';

        INSERT INTO public.notifications (
            recipient_user_id,
            organization_id,
            message,
            type,
            related_entity_id,
            related_entity_type
        )
        SELECT
            p.id,
            NEW.organization_id,
            message_text,
            'invite_accepted',
            NEW.id,
            'organization_invite'
        FROM public.profiles p
        WHERE p.id = NEW.inviter_id;

    ELSIF NEW.status = 'rejected' THEN
        recipient_email := NEW.email;

        message_text := COALESCE(recipient_email, 'A user') || ' has rejected your invitation to join ' || COALESCE(organization_name, 'the organization') || '.';

        INSERT INTO public.notifications (
            recipient_user_id,
            organization_id,
            message,
            type,
            related_entity_id,
            related_entity_type
        )
        SELECT
            p.id,
            NEW.organization_id,
            message_text,
            'invite_rejected',
            NEW.id,
            'organization_invite'
        FROM public.profiles p
        WHERE p.id = NEW.inviter_id;

    ELSIF NEW.status = 'pending' AND NEW.email IS NOT NULL THEN
        INSERT INTO public.notifications (
            recipient_user_id,
            organization_id,
            message,
            type,
            related_entity_id,
            related_entity_type
        )
        SELECT
            p.id,
            NEW.organization_id,
            'You have been invited to join ' || COALESCE(organization_name, 'an organization') || '.',
            'invite_received',
            NEW.id,
            'organization_invite'
        FROM public.profiles p
        WHERE p.email = NEW.email;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate invite acceptance
CREATE OR REPLACE FUNCTION public.validate_invite_acceptance(
    invite_token TEXT,
    user_profile_id UUID
)
RETURNS TABLE(
    valid BOOLEAN,
    message TEXT,
    invite_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invite_record RECORD;
    user_email TEXT;
BEGIN
    SELECT * INTO invite_record
    FROM public.organization_invites
    WHERE token = invite_token;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Invalid invitation token', NULL::JSONB;
        RETURN;
    END IF;

    IF invite_record.expires_at < NOW() THEN
        UPDATE public.organization_invites
        SET status = 'expired'
        WHERE id = invite_record.id;

        RETURN QUERY SELECT FALSE, 'Invitation has expired', NULL::JSONB;
        RETURN;
    END IF;

    IF invite_record.status IN ('accepted', 'rejected', 'revoked') THEN
        RETURN QUERY SELECT FALSE, 'Invitation has already been ' || invite_record.status, NULL::JSONB;
        RETURN;
    END IF;

    SELECT email INTO user_email
    FROM public.profiles
    WHERE id = user_profile_id;

    IF LOWER(user_email) != LOWER(invite_record.email) THEN
        RETURN QUERY SELECT FALSE, 'You are not authorized to accept this invitation', NULL::JSONB;
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, 'Valid invitation',
        jsonb_build_object(
            'id', invite_record.id,
            'organization_id', invite_record.organization_id,
            'inviter_id', invite_record.inviter_id,
            'email', invite_record.email
        );
END
$$;

-- Function to validate invite rejection
CREATE OR REPLACE FUNCTION public.validate_invite_rejection(
    invite_token TEXT,
    user_profile_id UUID
)
RETURNS TABLE(
    valid BOOLEAN,
    message TEXT,
    invite_details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invite_record RECORD;
    user_email TEXT;
BEGIN
    SELECT * INTO invite_record
    FROM public.organization_invites
    WHERE token = invite_token;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Invalid invitation token', NULL::JSONB;
        RETURN;
    END IF;

    IF invite_record.expires_at < NOW() THEN
        UPDATE public.organization_invites
        SET status = 'expired'
        WHERE id = invite_record.id;

        RETURN QUERY SELECT FALSE, 'Invitation has expired', NULL::JSONB;
        RETURN;
    END IF;

    IF invite_record.status IN ('accepted', 'rejected', 'revoked') THEN
        RETURN QUERY SELECT FALSE, 'Invitation has already been ' || invite_record.status, NULL::JSONB;
        RETURN;
    END IF;

    SELECT email INTO user_email
    FROM public.profiles
    WHERE id = user_profile_id;

    IF LOWER(user_email) != LOWER(invite_record.email) THEN
        RETURN QUERY SELECT FALSE, 'You are not authorized to reject this invitation', NULL::JSONB;
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, 'Valid invitation',
        jsonb_build_object(
            'id', invite_record.id,
            'organization_id', invite_record.organization_id,
            'inviter_id', invite_record.inviter_id,
            'email', invite_record.email
        );
END
$$;

-- Function to create invoice with items
CREATE OR REPLACE FUNCTION create_invoice_with_items(
    p_org_id UUID,
    p_client_id UUID,
    p_number TEXT,
    p_issue_date DATE,
    p_due_date DATE,
    p_subtotal DECIMAL,
    p_items JSONB,
    p_status TEXT DEFAULT 'draft',
    p_tax_rate DECIMAL DEFAULT 0.00,
    p_discount_total DECIMAL DEFAULT 0.00,
    p_currency TEXT DEFAULT 'USD',
    p_notes TEXT DEFAULT NULL,
    p_pdf_url TEXT DEFAULT NULL,
    p_is_recurring BOOLEAN DEFAULT FALSE,
    p_recurring_frequency recurring_frequency DEFAULT NULL,
    p_next_invoice_date DATE DEFAULT NULL,
    p_clerk_user_id TEXT DEFAULT NULL,
    p_template_id UUID DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    org_id UUID,
    client_id UUID,
    number TEXT,
    issue_date DATE,
    due_date DATE,
    status invoice_status,
    subtotal DECIMAL,
    tax_rate DECIMAL,
    tax_amount DECIMAL,
    discount_total DECIMAL,
    total DECIMAL,
    paid_amount DECIMAL,
    currency TEXT,
    notes TEXT,
    pdf_url TEXT,
    is_recurring BOOLEAN,
    recurring_frequency recurring_frequency,
    next_invoice_date DATE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    created_by_profile_id UUID,
    template_id UUID
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_invoice_id UUID;
    item_record JSONB;
BEGIN
    IF p_subtotal <= 0 THEN
        RAISE EXCEPTION 'Subtotal must be greater than 0';
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Invoice must contain at least one item';
    END IF;

    INSERT INTO invoices (
        org_id,
        client_id,
        number,
        issue_date,
        due_date,
        status,
        subtotal,
        tax_rate,
        discount_total,
        currency,
        notes,
        pdf_url,
        is_recurring,
        recurring_frequency,
        next_invoice_date,
        created_by_profile_id,
        template_id
    )
    VALUES (
        p_org_id,
        p_client_id,
        p_number,
        p_issue_date,
        p_due_date,
        p_status::invoice_status,
        p_subtotal,
        p_tax_rate,
        p_discount_total,
        p_currency,
        p_notes,
        p_pdf_url,
        p_is_recurring,
        p_recurring_frequency,
        p_next_invoice_date,
        CASE
            WHEN p_clerk_user_id IS NOT NULL THEN (
                SELECT id
                FROM profiles
                WHERE clerk_user_id = p_clerk_user_id
                LIMIT 1
            )
            ELSE NULL
        END,
        p_template_id
    )
    RETURNING invoices.id INTO v_invoice_id;

    FOR item_record IN
        SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO invoice_items (
            invoice_id,
            description,
            qty,
            unit_price,
            line_total
        )
        VALUES (
            v_invoice_id,
            item_record->>'description',
            (item_record->>'qty')::INTEGER,
            (item_record->>'unit_price')::DECIMAL,
            (item_record->>'line_total')::DECIMAL
        );
    END LOOP;

    RETURN QUERY
    SELECT
        i.id,
        i.org_id,
        i.client_id,
        i.number,
        i.issue_date,
        i.due_date,
        i.status,
        i.subtotal,
        i.tax_rate,
        i.tax_amount,
        i.discount_total,
        i.total,
        i.paid_amount,
        i.currency,
        i.notes,
        i.pdf_url,
        i.is_recurring,
        i.recurring_frequency,
        i.next_invoice_date,
        i.created_at,
        i.updated_at,
        i.created_by_profile_id,
        i.template_id
    FROM invoices i
    WHERE i.id = v_invoice_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_invoice_with_items TO service_role;

-- Function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to trigger dashboard stats refresh
CREATE OR REPLACE FUNCTION trigger_refresh_dashboard_stats()
RETURNS TRIGGER AS $$
BEGIN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. TRIGGERS
-- ============================================================================

-- Trigger to update invoice paid_amount after payment changes
CREATE TRIGGER trg_update_invoice_paid_amount
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION fn_update_invoice_paid_amount();

-- Trigger to recompute invoice status before update
CREATE TRIGGER trg_recompute_invoice_status
BEFORE UPDATE ON invoices
FOR EACH ROW
WHEN (OLD.paid_amount IS DISTINCT FROM NEW.paid_amount OR OLD.due_date IS DISTINCT FROM NEW.due_date)
EXECUTE FUNCTION fn_recompute_invoice_status();

-- Trigger to create notification on invoice insert
CREATE TRIGGER on_invoice_insert
AFTER INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION public.create_invoice_notification();

-- Trigger to create notification on invite status change
CREATE TRIGGER on_invite_status_change
    AFTER UPDATE OF status ON public.organization_invites
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.create_invite_notification();

-- ============================================================================
-- 13. VIEWS
-- ============================================================================

-- Dashboard statistics view
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
    i.org_id,
    COUNT(*) AS total_invoices,
    SUM(i.total) AS total_invoiced,
    SUM(i.paid_amount) AS total_collected,
    SUM(i.total - i.paid_amount) AS outstanding_amount,
    COUNT(CASE WHEN i.status = 'paid' THEN 1 END) AS paid_invoices,
    COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) AS overdue_invoices,
    COUNT(CASE WHEN i.status = 'sent' THEN 1 END) AS sent_invoices,
    COUNT(CASE WHEN i.status = 'draft' THEN 1 END) AS draft_invoices,
    COUNT(CASE WHEN i.status = 'cancelled' THEN 1 END) AS cancelled_invoices,
    COUNT(CASE WHEN i.status = 'void' THEN 1 END) AS void_invoices,
    COUNT(CASE WHEN i.status = 'partially_paid' THEN 1 END) AS partially_paid_invoices
FROM invoices i
GROUP BY i.org_id;

-- Invoice summary view with computed status
CREATE OR REPLACE VIEW v_invoice_summary AS
SELECT
    i.id,
    i.org_id,
    i.client_id,
    i.number,
    i.issue_date,
    i.due_date,
    i.status,
    i.subtotal,
    i.tax_amount,
    i.discount_total,
    i.total,
    i.paid_amount,
    i.currency,
    i.notes,
    i.pdf_url,
    i.is_recurring,
    i.recurring_frequency,
    i.next_invoice_date,
    i.created_at,
    i.updated_at,
    i.created_by_profile_id,
    CASE
        WHEN i.paid_amount >= i.total THEN 'paid'
        WHEN i.status = 'draft' THEN 'draft'
        WHEN i.due_date < CURRENT_DATE AND i.paid_amount < i.total THEN 'overdue'
        WHEN i.paid_amount > 0 AND i.paid_amount < i.total THEN 'partially_paid'
        ELSE i.status
    END AS computed_status,
    (i.total - i.paid_amount) AS remaining_amount,
    c.name AS client_name
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id;

-- Revenue summary view
CREATE OR REPLACE VIEW v_revenue_summary AS
SELECT
    i.org_id,
    DATE_TRUNC('month', i.issue_date) AS month,
    SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END) AS revenue_current_month,
    SUM(i.total) AS invoiced_current_month,
    SUM(CASE WHEN i.status = 'paid' THEN p.amount ELSE 0 END) AS collected_current_month,
    SUM(i.total - i.paid_amount) AS outstanding_current_month
FROM invoices i
LEFT JOIN payments p ON i.id = p.invoice_id
GROUP BY i.org_id, DATE_TRUNC('month', i.issue_date);

-- Monthly revenue view
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

-- Materialized view for dashboard stats
CREATE MATERIALIZED VIEW mv_dashboard_stats AS
SELECT
    i.org_id,
    SUM(CASE WHEN p.received_on >= DATE_TRUNC('year', CURRENT_DATE) THEN p.amount ELSE 0 END) AS revenue_ytd,
    SUM(CASE WHEN i.status IN ('sent', 'overdue') THEN (i.total - i.paid_amount) ELSE 0 END) AS outstanding_total,
    COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) AS overdue_count,
    COUNT(*) AS total_invoices,
    SUM(i.total) AS total_invoiced,
    SUM(i.paid_amount) AS total_collected,
    SUM(i.total - i.paid_amount) AS total_outstanding
FROM invoices i
LEFT JOIN payments p ON i.id = p.invoice_id
GROUP BY i.org_id;

-- Unique index for materialized view
CREATE UNIQUE INDEX idx_mv_dashboard_stats_org_id ON mv_dashboard_stats (org_id);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
