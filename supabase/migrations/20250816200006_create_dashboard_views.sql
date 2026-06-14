-- Create a materialized view for efficient dashboard KPI loading
CREATE MATERIALIZED VIEW mv_dashboard_stats AS
SELECT
    org_id,
    -- Revenue Year-to-Date: Sum of all payments received in the current year.
    COALESCE(SUM(p.amount) FILTER (WHERE date_part('year', p.received_on) = date_part('year', current_date)), 0) AS revenue_ytd,
    -- Outstanding Total: Sum of balances on all invoices that are not drafts or fully paid.
    COALESCE(SUM(i.total - i.paid_amount) FILTER (WHERE i.status IN ('sent', 'overdue')), 0) AS outstanding_total,
    -- Overdue Count: Total number of invoices currently marked as overdue.
    COALESCE(COUNT(*) FILTER (WHERE i.status = 'overdue'), 0) AS overdue_count
FROM
    invoices i
LEFT JOIN
    payments p ON i.id = p.invoice_id
GROUP BY
    i.org_id;

-- Create an index on the materialized view for fast lookups by organization
CREATE UNIQUE INDEX idx_mv_dashboard_stats_org_id ON mv_dashboard_stats(org_id);

-- Create a regular view for monthly revenue breakdown
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

-- Note: To keep the materialized view up-to-date, it should be refreshed periodically.
-- For example, create a cron job to run: REFRESH MATERIALIZED VIEW mv_dashboard_stats;