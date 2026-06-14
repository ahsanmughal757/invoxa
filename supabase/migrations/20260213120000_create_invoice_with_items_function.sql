-- Create a function to insert invoice and invoice items in a single transaction
CREATE OR REPLACE FUNCTION create_invoice_with_items(
    -- =========================
    -- REQUIRED PARAMETERS
    -- =========================
    p_org_id UUID,
    p_client_id UUID,
    p_number TEXT,
    p_issue_date DATE,
    p_due_date DATE,
    p_subtotal DECIMAL,
    p_items JSONB,

    -- =========================
    -- OPTIONAL PARAMETERS
    -- =========================
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
    -- =========================
    -- VALIDATION (Defensive DB)
    -- =========================
    IF p_subtotal <= 0 THEN
        RAISE EXCEPTION 'Subtotal must be greater than 0';
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Invoice must contain at least one item';
    END IF;

    -- =========================
    -- INSERT INVOICE
    -- =========================
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

    -- =========================
    -- INSERT INVOICE ITEMS
    -- =========================
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

    -- =========================
    -- RETURN CREATED INVOICE
    -- =========================
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
