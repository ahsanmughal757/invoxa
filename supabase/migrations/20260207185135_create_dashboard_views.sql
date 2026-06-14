-- Create view for dashboard statistics
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

-- Create view for invoice summary with computed status
CREATE OR REPLACE VIEW v_invoice_summary AS
SELECT
    i.id,
    i.org_id,
    i.client_id,
    i.number,
    i.issue_date,
    i.due_date,
    i.status,  -- Using the DB-computed status instead of calculating on client side
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
        ELSE i.status  -- Use the DB-computed status as fallback
    END AS computed_status,
    (i.total - i.paid_amount) AS remaining_amount,
    c.name AS client_name
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id;

-- Create view for revenue summary by period
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

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;