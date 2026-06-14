CREATE OR REPLACE FUNCTION public.create_invoice_notification()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    client_clerk_id TEXT;
    sender_profile_id UUID;
    sender_name TEXT;
BEGIN
    -- Get client's Clerk user ID
    SELECT clerk_user_id
    INTO client_clerk_id
    FROM public.clients
    WHERE id = NEW.client_id;

    -- Get sender profile ID
    sender_profile_id := NEW.created_by_profile_id;

    -- Only notify if client is a registered user
    IF client_clerk_id IS NOT NULL THEN

        -- Get sender name
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
