

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."invite_status" AS ENUM (
    'pending',
    'accepted',
    'expired',
    'revoked',
    'rejected'
);


ALTER TYPE "public"."invite_status" OWNER TO "postgres";


CREATE TYPE "public"."invoice_status" AS ENUM (
    'draft',
    'sent',
    'paid',
    'overdue',
    'void',
    'cancelled'
);


ALTER TYPE "public"."invoice_status" OWNER TO "postgres";


CREATE TYPE "public"."org_role" AS ENUM (
    'owner',
    'admin',
    'member'
);


ALTER TYPE "public"."org_role" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'cash',
    'check',
    'bank_transfer',
    'credit_card',
    'paypal',
    'other'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."recurring_frequency" AS ENUM (
    'weekly',
    'monthly',
    'quarterly',
    'yearly'
);


ALTER TYPE "public"."recurring_frequency" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_invite_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."create_invite_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_invoice_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."create_invoice_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_recompute_invoice_status"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."fn_recompute_invoice_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_update_invoice_paid_amount"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."fn_update_invoice_paid_amount"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_member"("target_org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.org_members om
    JOIN public.profiles p ON om.user_id = p.id
    WHERE om.org_id = target_org_id
    AND p.clerk_user_id = auth.uid()::text
  ) OR EXISTS (
    -- Also include owner as a "member" effectively
    SELECT 1 
    FROM public.organizations
    WHERE id = target_org_id
    AND owner_user_id = (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text)
  );
$$;


ALTER FUNCTION "public"."is_org_member"("target_org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_org_owner"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from organizations org
    join profiles p on p.id = org.owner_user_id
    where p.clerk_user_id = auth.jwt() ->> 'sub'
  );
$$;


ALTER FUNCTION "public"."is_org_owner"() OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."is_org_owner"("org_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$SELECT EXISTS (
    SELECT 1 
    FROM public.organizations
    WHERE id = org_id 
    AND owner_user_id = (SELECT id FROM public.profiles WHERE clerk_user_id = auth.jwt() ->> 'sub'::text)
  );$$;


ALTER FUNCTION "public"."is_org_owner"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_sql"("query" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  result json;
begin
  execute format('select json_agg(t) from (%s) t', query)
  into result;

  return result;
end;
$$;


ALTER FUNCTION "public"."run_sql"("query" "text") OWNER TO "supabase_admin";


CREATE OR REPLACE FUNCTION "public"."validate_invite_acceptance"("invite_token" "text", "user_profile_id" "uuid") RETURNS TABLE("valid" boolean, "message" "text", "invite_details" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."validate_invite_acceptance"("invite_token" "text", "user_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_invite_rejection"("invite_token" "text", "user_profile_id" "uuid") RETURNS TABLE("valid" boolean, "message" "text", "invite_details" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."validate_invite_rejection"("invite_token" "text", "user_profile_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "actor_user_id" "uuid" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "action" "text" NOT NULL,
    "meta" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "company" "text",
    "phone" "text",
    "billing_address" "jsonb",
    "tax_id" "text",
    "payment_terms" integer DEFAULT 30,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "total_invoiced" numeric(12,2) DEFAULT 0.00,
    "total_paid" numeric(12,2) DEFAULT 0.00,
    "outstanding_balance" numeric(12,2) GENERATED ALWAYS AS (("total_invoiced" - "total_paid")) STORED,
    "notes" "text",
    "last_invoice_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid"
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."debug_jwt" AS
 SELECT "auth"."jwt"() AS "jwt";


ALTER VIEW "public"."debug_jwt" OWNER TO "supabase_admin";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "date" "date" NOT NULL,
    "category" "text",
    "tax_deductible" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "qty" integer NOT NULL,
    "unit_price" numeric(12,2) NOT NULL,
    "line_total" numeric(12,2) GENERATED ALWAYS AS ((("qty")::numeric * "unit_price")) STORED
);


ALTER TABLE "public"."invoice_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "number" "text" NOT NULL,
    "issue_date" "date" NOT NULL,
    "due_date" "date" NOT NULL,
    "status" "public"."invoice_status" DEFAULT 'draft'::"public"."invoice_status" NOT NULL,
    "subtotal" numeric(12,2) NOT NULL,
    "tax_rate" numeric(5,2) DEFAULT 0.00,
    "tax_amount" numeric(12,2) GENERATED ALWAYS AS ((("subtotal" * "tax_rate") / (100)::numeric)) STORED,
    "discount_total" numeric(12,2) DEFAULT 0.00,
    "total" numeric(12,2) GENERATED ALWAYS AS ((("subtotal" + (("subtotal" * "tax_rate") / (100)::numeric)) - "discount_total")) STORED,
    "paid_amount" numeric(12,2) DEFAULT 0.00,
    "currency" "text" DEFAULT 'USD'::"text" NOT NULL,
    "notes" "text",
    "pdf_url" "text",
    "is_recurring" boolean DEFAULT false,
    "recurring_frequency" "public"."recurring_frequency",
    "next_invoice_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "received_on" "date" NOT NULL,
    "method" "public"."payment_method" NOT NULL,
    "reference" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."mv_dashboard_stats" AS
 SELECT "i"."org_id",
    COALESCE("sum"("p"."amount") FILTER (WHERE ("date_part"('year'::"text", "p"."received_on") = "date_part"('year'::"text", CURRENT_DATE))), (0)::numeric) AS "revenue_ytd",
    COALESCE("sum"(("i"."total" - "i"."paid_amount")) FILTER (WHERE ("i"."status" = ANY (ARRAY['sent'::"public"."invoice_status", 'overdue'::"public"."invoice_status"]))), (0)::numeric) AS "outstanding_total",
    COALESCE("count"(*) FILTER (WHERE ("i"."status" = 'overdue'::"public"."invoice_status")), (0)::bigint) AS "overdue_count"
   FROM ("public"."invoices" "i"
     LEFT JOIN "public"."payments" "p" ON (("i"."id" = "p"."invoice_id")))
  GROUP BY "i"."org_id"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."mv_dashboard_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_user_id" "uuid" NOT NULL,
    "invoice_id" "uuid",
    "organization_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "type" "text" DEFAULT 'invoice'::"text",
    "related_entity_id" "uuid",
    "related_entity_type" "text" DEFAULT 'invoice'::"text",
    "associated_clerk_id" "text",
    "link" "text"
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."org_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."org_role" DEFAULT 'member'::"public"."org_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."org_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "inviter_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "email" "text",
    "expires_at" timestamp with time zone NOT NULL,
    "status" "public"."invite_status" DEFAULT 'pending'::"public"."invite_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "accepted_at" timestamp with time zone,
    "accepted_by_user_id" "uuid"
);


ALTER TABLE "public"."organization_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text",
    "branding" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "owner_clerk_id" "text"
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clerk_user_id" "text" NOT NULL,
    "name" "text",
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_monthly_revenue" AS
 SELECT "i"."org_id",
    ("date_trunc"('month'::"text", ("p"."received_on")::timestamp with time zone))::"date" AS "month",
    "sum"("p"."amount") AS "total"
   FROM ("public"."payments" "p"
     JOIN "public"."invoices" "i" ON (("p"."invoice_id" = "i"."id")))
  GROUP BY "i"."org_id", (("date_trunc"('month'::"text", ("p"."received_on")::timestamp with time zone))::"date")
  ORDER BY "i"."org_id", (("date_trunc"('month'::"text", ("p"."received_on")::timestamp with time zone))::"date");


ALTER VIEW "public"."v_monthly_revenue" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_org_id_email_key" UNIQUE ("org_id", "email");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_org_id_number_key" UNIQUE ("org_id", "number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_org_id_user_id_key" UNIQUE ("org_id", "user_id");



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_invites"
    ADD CONSTRAINT "organization_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_invites"
    ADD CONSTRAINT "organization_invites_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_clerk_user_id_key" UNIQUE ("clerk_user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activity_log_entity_type_id" ON "public"."activity_log" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_activity_log_org_id" ON "public"."activity_log" USING "btree" ("org_id");



CREATE INDEX "idx_clients_name" ON "public"."clients" USING "btree" ("name");



CREATE INDEX "idx_clients_user_id" ON "public"."clients" USING "btree" ("user_id");



CREATE INDEX "idx_expenses_category" ON "public"."expenses" USING "btree" ("category");



CREATE INDEX "idx_expenses_org_id" ON "public"."expenses" USING "btree" ("org_id");



CREATE INDEX "idx_invoice_items_invoice_id" ON "public"."invoice_items" USING "btree" ("invoice_id");



CREATE INDEX "idx_invoices_client_id" ON "public"."invoices" USING "btree" ("client_id");



CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_mv_dashboard_stats_org_id" ON "public"."mv_dashboard_stats" USING "btree" ("org_id");



CREATE INDEX "idx_notifications_organization_id" ON "public"."notifications" USING "btree" ("organization_id");



CREATE INDEX "idx_notifications_recipient_user_id" ON "public"."notifications" USING "btree" ("recipient_user_id");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_organization_invites_organization_id" ON "public"."organization_invites" USING "btree" ("organization_id");



CREATE INDEX "idx_organization_invites_token" ON "public"."organization_invites" USING "btree" ("token");



CREATE INDEX "idx_payments_invoice_id" ON "public"."payments" USING "btree" ("invoice_id");



CREATE OR REPLACE TRIGGER "on_invite_status_change" AFTER UPDATE OF "status" ON "public"."organization_invites" FOR EACH ROW WHEN (("old"."status" IS DISTINCT FROM "new"."status")) EXECUTE FUNCTION "public"."create_invite_notification"();



CREATE OR REPLACE TRIGGER "on_invoice_insert" AFTER INSERT ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."create_invoice_notification"();



CREATE OR REPLACE TRIGGER "trg_recompute_invoice_status" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW WHEN ((("old"."paid_amount" IS DISTINCT FROM "new"."paid_amount") OR ("old"."due_date" IS DISTINCT FROM "new"."due_date"))) EXECUTE FUNCTION "public"."fn_recompute_invoice_status"();



CREATE OR REPLACE TRIGGER "trg_update_invoice_paid_amount" AFTER INSERT OR DELETE OR UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."fn_update_invoice_paid_amount"();



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."activity_log"
    ADD CONSTRAINT "activity_log_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_items"
    ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_invites"
    ADD CONSTRAINT "organization_invites_accepted_by_user_id_fkey" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."organization_invites"
    ADD CONSTRAINT "organization_invites_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_invites"
    ADD CONSTRAINT "organization_invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



CREATE POLICY "Authenticated User can create their own organization" ON "public"."organizations" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'sub'::"text") IS NOT NULL));



CREATE POLICY "Authenticated Users can view their own records" ON "public"."profiles" FOR SELECT USING ((("auth"."jwt"() ->> 'sub'::"text") = "clerk_user_id"));



CREATE POLICY "Enable insert for organization owners" ON "public"."organization_invites" FOR INSERT WITH CHECK ("public"."is_org_owner"("organization_id"));



CREATE POLICY "Enable read access for organization members" ON "public"."organization_invites" FOR SELECT USING ("public"."is_org_member"("organization_id"));



CREATE POLICY "Enable read access for user's own notifications" ON "public"."notifications" FOR SELECT USING ((("auth"."jwt"() ->> 'sub'::"text") = "associated_clerk_id"));



CREATE POLICY "Owners and admins can manage organization members" ON "public"."org_members" USING ((EXISTS ( SELECT 1
   FROM ("public"."org_members" "om"
     JOIN "public"."profiles" "p" ON (("om"."user_id" = "p"."id")))
  WHERE (("om"."org_id" = "org_members"."org_id") AND ("p"."clerk_user_id" = ("auth"."uid"())::"text") AND (("om"."role" = 'owner'::"public"."org_role") OR ("om"."role" = 'admin'::"public"."org_role"))))));



CREATE POLICY "Restrict inserts to service role only" ON "public"."activity_log" FOR INSERT WITH CHECK (false);



CREATE POLICY "Users can manage clients in their own organizations" ON "public"."clients" USING ((EXISTS ( SELECT 1
   FROM ("public"."org_members" "om"
     JOIN "public"."profiles" "p" ON (("om"."user_id" = "p"."id")))
  WHERE (("om"."org_id" = "clients"."org_id") AND ("p"."clerk_user_id" = ("auth"."uid"())::"text")))));



CREATE POLICY "Users can manage expenses in their own organizations" ON "public"."expenses" USING ((EXISTS ( SELECT 1
   FROM ("public"."org_members" "om"
     JOIN "public"."profiles" "p" ON (("om"."user_id" = "p"."id")))
  WHERE (("om"."org_id" = "expenses"."org_id") AND ("p"."clerk_user_id" = ("auth"."uid"())::"text")))));



CREATE POLICY "Users can manage invoice items in their own organizations" ON "public"."invoice_items" USING ((EXISTS ( SELECT 1
   FROM (("public"."invoices" "i"
     JOIN "public"."org_members" "om" ON (("i"."org_id" = "om"."org_id")))
     JOIN "public"."profiles" "p" ON (("om"."user_id" = "p"."id")))
  WHERE (("i"."id" = "invoice_items"."invoice_id") AND ("p"."clerk_user_id" = ("auth"."uid"())::"text")))));



CREATE POLICY "Users can manage invoices in their own organizations" ON "public"."invoices" USING ((EXISTS ( SELECT 1
   FROM ("public"."org_members" "om"
     JOIN "public"."profiles" "p" ON (("om"."user_id" = "p"."id")))
  WHERE (("om"."org_id" = "invoices"."org_id") AND ("p"."clerk_user_id" = ("auth"."uid"())::"text")))));



CREATE POLICY "Users can manage payments in their own organizations" ON "public"."payments" USING ((EXISTS ( SELECT 1
   FROM (("public"."invoices" "i"
     JOIN "public"."org_members" "om" ON (("i"."org_id" = "om"."org_id")))
     JOIN "public"."profiles" "p" ON (("om"."user_id" = "p"."id")))
  WHERE (("i"."id" = "payments"."invoice_id") AND ("p"."clerk_user_id" = ("auth"."uid"())::"text")))));



CREATE POLICY "Users can view activity logs for their own organizations" ON "public"."activity_log" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."org_members" "om"
     JOIN "public"."profiles" "p" ON (("om"."user_id" = "p"."id")))
  WHERE (("om"."org_id" = "activity_log"."org_id") AND ("p"."clerk_user_id" = ("auth"."uid"())::"text")))));



CREATE POLICY "Users can view members of their own organizations" ON "public"."org_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."org_members" "om"
     JOIN "public"."profiles" "p" ON (("om"."user_id" = "p"."id")))
  WHERE (("om"."org_id" = "org_members"."org_id") AND ("p"."clerk_user_id" = ("auth"."uid"())::"text")))));



CREATE POLICY "Users can view their own organizations" ON "public"."organizations" FOR SELECT USING (true);



ALTER TABLE "public"."activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";









GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."create_invite_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_invite_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_invite_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_invoice_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_invoice_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_invoice_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_recompute_invoice_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_recompute_invoice_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_recompute_invoice_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_update_invoice_paid_amount"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_update_invoice_paid_amount"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_update_invoice_paid_amount"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_member"("target_org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_member"("target_org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_member"("target_org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_owner"() TO "postgres";
GRANT ALL ON FUNCTION "public"."is_org_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_owner"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_org_owner"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_org_owner"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_org_owner"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."run_sql"("query" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."run_sql"("query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."run_sql"("query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_sql"("query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_invite_acceptance"("invite_token" "text", "user_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_invite_acceptance"("invite_token" "text", "user_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_invite_acceptance"("invite_token" "text", "user_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_invite_rejection"("invite_token" "text", "user_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_invite_rejection"("invite_token" "text", "user_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_invite_rejection"("invite_token" "text", "user_profile_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."activity_log" TO "anon";
GRANT ALL ON TABLE "public"."activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."debug_jwt" TO "postgres";
GRANT ALL ON TABLE "public"."debug_jwt" TO "anon";
GRANT ALL ON TABLE "public"."debug_jwt" TO "authenticated";
GRANT ALL ON TABLE "public"."debug_jwt" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_items" TO "anon";
GRANT ALL ON TABLE "public"."invoice_items" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_items" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."mv_dashboard_stats" TO "anon";
GRANT ALL ON TABLE "public"."mv_dashboard_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."mv_dashboard_stats" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."org_members" TO "anon";
GRANT ALL ON TABLE "public"."org_members" TO "authenticated";
GRANT ALL ON TABLE "public"."org_members" TO "service_role";



GRANT ALL ON TABLE "public"."organization_invites" TO "anon";
GRANT ALL ON TABLE "public"."organization_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_invites" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."v_monthly_revenue" TO "anon";
GRANT ALL ON TABLE "public"."v_monthly_revenue" TO "authenticated";
GRANT ALL ON TABLE "public"."v_monthly_revenue" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























