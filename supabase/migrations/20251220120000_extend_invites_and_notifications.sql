-- 1. Update the notifications table to support different notification types including invites
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'invoice';

-- 2. Add indexes for the new type column to optimize queries
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- 3. Add 'rejected' status to organization_invites if needed
-- Since the status is currently TEXT with check constraint, we just need to make sure 'rejected' is allowed
-- Let's create a proper enum for better consistency
DO $$ 
BEGIN
    -- Check if the enum type exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_status') THEN
        CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired', 'revoked', 'rejected');
    END IF;
END
$$;

-- 4. If the table doesn't already use the enum, convert the column
-- First, we remove the default value to allow the type conversion
ALTER TABLE public.organization_invites ALTER COLUMN status DROP DEFAULT;

-- Then we can change the column type to use the enum
ALTER TABLE public.organization_invites
ALTER COLUMN status TYPE invite_status
USING CASE
    WHEN status = 'pending' THEN 'pending'::invite_status
    WHEN status = 'accepted' THEN 'accepted'::invite_status
    WHEN status = 'expired' THEN 'expired'::invite_status
    WHEN status = 'revoked' THEN 'revoked'::invite_status
    ELSE 'rejected'::invite_status  -- Default for any unknown statuses
END;

-- Finally, we add the default value back with the enum type
ALTER TABLE public.organization_invites ALTER COLUMN status SET DEFAULT 'pending'::invite_status;

-- 5. Add a new column to distinguish between different notification types
-- For invite-specific notifications, we'll use this column
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS related_entity_id UUID,
ADD COLUMN IF NOT EXISTS related_entity_type TEXT DEFAULT 'invoice';

-- 6. Update the table to have nullable invoice_id since not all notifications will be invoice-related
ALTER TABLE public.notifications ALTER COLUMN invoice_id DROP NOT NULL;

-- 7. Create a trigger function to handle invite acceptance notifications
CREATE OR REPLACE FUNCTION public.create_invite_notification()
RETURNS TRIGGER AS $$
DECLARE
    inviter_user_id UUID;
    recipient_email TEXT;
    organization_name TEXT;
    message_text TEXT;
BEGIN
    -- Get the organization name
    SELECT name INTO organization_name
    FROM public.organizations
    WHERE id = NEW.organization_id;

    -- Get the inviter profile
    SELECT email INTO recipient_email
    FROM public.profiles
    WHERE id = NEW.inviter_id;

    -- Create notification for inviter when invite is accepted
    IF NEW.status = 'accepted' THEN
        -- Get the user who accepted the invite (the new member) 
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

    -- Create notification for inviter when invite is rejected
    ELSIF NEW.status = 'rejected' THEN
        -- Get the email from the invite record
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
    
    -- Create notification for user when they receive an invite
    ELSIF NEW.status = 'pending' AND NEW.email IS NOT NULL THEN
        -- Find the user with the matching email
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

-- 8. Create trigger to fire when an invite status changes
DROP TRIGGER IF EXISTS on_invite_status_change ON public.organization_invites;
CREATE TRIGGER on_invite_status_change
    AFTER UPDATE OF status ON public.organization_invites
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.create_invite_notification();

-- 9. Create SECURITY DEFINER function to validate invite acceptance
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
    -- Get the invite record
    SELECT * INTO invite_record
    FROM public.organization_invites
    WHERE token = invite_token;

    -- Check if invite exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Invalid invitation token', NULL::JSONB;
        RETURN;
    END IF;

    -- Check if invite is expired
    IF invite_record.expires_at < NOW() THEN
        -- Update status to expired
        UPDATE public.organization_invites
        SET status = 'expired'
        WHERE id = invite_record.id;

        RETURN QUERY SELECT FALSE, 'Invitation has expired', NULL::JSONB;
        RETURN;
    END IF;

    -- Check if invite is already accepted or rejected
    IF invite_record.status IN ('accepted', 'rejected', 'revoked') THEN
        RETURN QUERY SELECT FALSE, 'Invitation has already been ' || invite_record.status, NULL::JSONB;
        RETURN;
    END IF;

    -- Get user's email to validate against invite
    SELECT email INTO user_email
    FROM public.profiles
    WHERE id = user_profile_id;

    -- Check if the user's email matches the invite email (case-insensitive)
    IF LOWER(user_email) != LOWER(invite_record.email) THEN
        RETURN QUERY SELECT FALSE, 'You are not authorized to accept this invitation', NULL::JSONB;
        RETURN;
    END IF;

    -- If all validations pass
    RETURN QUERY SELECT TRUE, 'Valid invitation',
        jsonb_build_object(
            'id', invite_record.id,
            'organization_id', invite_record.organization_id,
            'inviter_id', invite_record.inviter_id,
            'email', invite_record.email
        );
END
$$;

-- 10. Create SECURITY DEFINER function to validate invite rejection
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
    -- Get the invite record
    SELECT * INTO invite_record
    FROM public.organization_invites
    WHERE token = invite_token;

    -- Check if invite exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Invalid invitation token', NULL::JSONB;
        RETURN;
    END IF;

    -- Check if invite is expired
    IF invite_record.expires_at < NOW() THEN
        -- Update status to expired
        UPDATE public.organization_invites
        SET status = 'expired'
        WHERE id = invite_record.id;

        RETURN QUERY SELECT FALSE, 'Invitation has expired', NULL::JSONB;
        RETURN;
    END IF;

    -- Check if invite is already accepted or rejected
    IF invite_record.status IN ('accepted', 'rejected', 'revoked') THEN
        RETURN QUERY SELECT FALSE, 'Invitation has already been ' || invite_record.status, NULL::JSONB;
        RETURN;
    END IF;

    -- Get user's email to validate against invite
    SELECT email INTO user_email
    FROM public.profiles
    WHERE id = user_profile_id;

    -- Check if the user's email matches the invite email (case-insensitive)
    IF LOWER(user_email) != LOWER(invite_record.email) THEN
        RETURN QUERY SELECT FALSE, 'You are not authorized to reject this invitation', NULL::JSONB;
        RETURN;
    END IF;

    -- If all validations pass
    RETURN QUERY SELECT TRUE, 'Valid invitation',
        jsonb_build_object(
            'id', invite_record.id,
            'organization_id', invite_record.organization_id,
            'inviter_id', invite_record.inviter_id,
            'email', invite_record.email
        );
END
$$;