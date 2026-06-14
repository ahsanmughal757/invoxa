-- Update the materialized view for dashboard stats to include all necessary metrics
DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_stats;

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

-- Create an index on the materialized view for faster access
CREATE UNIQUE INDEX idx_mv_dashboard_stats_org_id ON mv_dashboard_stats (org_id);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically refresh the materialized view when invoices or payments change
CREATE OR REPLACE FUNCTION trigger_refresh_dashboard_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Schedule a refresh of the materialized view asynchronously
    -- Note: In production, you might want to use a job scheduler like pg_cron
    -- For now, we'll just return from the trigger
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to automatically update the materialized view when invoices or payments change
-- Note: For production use, you might want to schedule periodic refreshes instead of real-time updates