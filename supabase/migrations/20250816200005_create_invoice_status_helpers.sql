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
        ELSIF NEW.due_date < current_date THEN
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
WHEN (OLD.paid_amount IS DISTINCT FROM NEW.paid_amount OR OLD.due_date IS DISTINCT FROM NEW.due_date)
EXECUTE FUNCTION fn_recompute_invoice_status();