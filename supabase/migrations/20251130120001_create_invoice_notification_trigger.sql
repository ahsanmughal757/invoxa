-- 1. Create the trigger function to be executed on new invoice insertion
CREATE OR REPLACE FUNCTION public.create_invoice_notification()
RETURNS TRIGGER AS $$
DECLARE
    client_user_id UUID;
    sender_user_id UUID;
    sender_name TEXT;
BEGIN
    -- Get the user_id associated with the client on the new invoice
    SELECT user_id INTO client_user_id
    FROM public.clients
    WHERE id = NEW.client_id;

    -- Get the sender's user_id from the new invoice
    sender_user_id := NEW.user_id;

    -- Proceed only if the client is a registered user and is not the same as the sender
    IF client_user_id IS NOT NULL AND client_user_id <> sender_user_id THEN
        -- Get the sender's name for a more descriptive notification message
        SELECT raw_user_meta_data->>'full_name' INTO sender_name FROM auth.users WHERE id = sender_user_id;

        IF sender_name IS NULL THEN
            sender_name := 'Another user';
        END IF;

        -- Insert a record into the notifications table
        INSERT INTO public.notifications (recipient_user_id, invoice_id, organization_id, message)
        VALUES (client_user_id, NEW.id, NEW.organization_id, sender_name || ' from your organization sent you an invoice.');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger to fire AFTER a new invoice is inserted
-- Drop existing trigger if it exists to ensure a clean setup
DROP TRIGGER IF EXISTS on_invoice_insert ON public.invoices;

CREATE TRIGGER on_invoice_insert
AFTER INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.create_invoice_notification();
