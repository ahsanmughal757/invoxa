

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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



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


CREATE OR REPLACE FUNCTION "public"."fn_ensure_owner_is_member"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- When an organization is created, automatically add the owner as a member with 'owner' role
    INSERT INTO org_members (org_id, user_id, role)
    VALUES (NEW.id, NEW.owner_user_id, 'owner')
    ON CONFLICT (org_id, user_id) DO UPDATE SET role = 'owner';
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_ensure_owner_is_member"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_ensure_owner_is_member"() IS 'Ensures organization owners are automatically added as members';



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


COMMENT ON FUNCTION "public"."fn_recompute_invoice_status"() IS 'Automatically updates invoice status based on payment state and due date';



CREATE OR REPLACE FUNCTION "public"."fn_update_client_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    client_id_to_update UUID;
BEGIN
    -- Determine which client to update
    client_id_to_update := COALESCE(NEW.client_id, OLD.client_id);
    
    -- Update client totals
    UPDATE clients
    SET 
        total_invoiced = (
            SELECT COALESCE(SUM(total), 0)
            FROM invoices
            WHERE client_id = client_id_to_update AND status != 'void'
        ),
        total_paid = (
            SELECT COALESCE(SUM(paid_amount), 0)
            FROM invoices
            WHERE client_id = client_id_to_update AND status != 'void'
        ),
        last_invoice_date = (
            SELECT MAX(issue_date)
            FROM invoices
            WHERE client_id = client_id_to_update AND status != 'void'
        )
    WHERE id = client_id_to_update;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."fn_update_client_totals"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."fn_update_client_totals"() IS 'Updates client summary totals when invoices change';



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


COMMENT ON FUNCTION "public"."fn_update_invoice_paid_amount"() IS 'Automatically updates invoice paid_amount when payments are modified';



CREATE OR REPLACE FUNCTION "public"."fn_update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fn_validate_payment_amount"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    invoice_balance DECIMAL(12, 2);
BEGIN
    -- Get current balance for the invoice
    SELECT (total - paid_amount) INTO invoice_balance
    FROM invoices
    WHERE id = NEW.invoice_id;
    
    -- Check if payment exceeds balance (with small tolerance for rounding)
    IF NEW.amount > (invoice_balance + 0.01) THEN
        RAISE EXCEPTION 'Payment amount (%) exceeds invoice balance (%)', NEW.amount, invoice_balance;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fn_validate_payment_amount"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_organizations"() RETURNS TABLE("org_id" "uuid", "role" "public"."org_role")
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT om.org_id, om.role
  FROM org_members om
  JOIN profiles p ON om.user_id = p.id
  WHERE p.clerk_user_id = auth.uid()::text;
$$;


ALTER FUNCTION "public"."get_user_organizations"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_organizations"() IS 'Helper function to get organizations and roles for current user - used in RLS policies';


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


COMMENT ON TABLE "public"."activity_log" IS 'Audit trail for all system actions';



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
    "user_id" "uuid",
    CONSTRAINT "clients_payment_terms_check" CHECK (("payment_terms" > 0)),
    CONSTRAINT "clients_total_invoiced_check" CHECK (("total_invoiced" >= (0)::numeric)),
    CONSTRAINT "clients_total_paid_check" CHECK (("total_paid" >= (0)::numeric))
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


COMMENT ON TABLE "public"."clients" IS 'Customers/clients of organizations';



CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "org_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "date" "date" NOT NULL,
    "category" "text",
    "tax_deductible" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "expenses_amount_check" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


COMMENT ON TABLE "public"."expenses" IS 'Business expense tracking';



CREATE TABLE IF NOT EXISTS "public"."invoice_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "qty" integer NOT NULL,
    "unit_price" numeric(12,2) NOT NULL,
    "line_total" numeric(12,2) GENERATED ALWAYS AS ((("qty")::numeric * "unit_price")) STORED,
    CONSTRAINT "invoice_items_qty_check" CHECK (("qty" > 0)),
    CONSTRAINT "invoice_items_unit_price_check" CHECK (("unit_price" >= (0)::numeric))
);


ALTER TABLE "public"."invoice_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."invoice_items" IS 'Individual line items on invoices';



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
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_paid_amount_not_exceed_total" CHECK (("paid_amount" <= "total")),
    CONSTRAINT "chk_recurring_frequency" CHECK ((("is_recurring" = false) OR (("is_recurring" = true) AND ("recurring_frequency" IS NOT NULL) AND ("next_invoice_date" IS NOT NULL)))),
    CONSTRAINT "invoices_check" CHECK (("due_date" >= "issue_date")),
    CONSTRAINT "invoices_check1" CHECK (("discount_total" <= "subtotal")),
    CONSTRAINT "invoices_discount_total_check" CHECK (("discount_total" >= (0)::numeric)),
    CONSTRAINT "invoices_paid_amount_check" CHECK (("paid_amount" >= (0)::numeric)),
    CONSTRAINT "invoices_subtotal_check" CHECK (("subtotal" >= (0)::numeric)),
    CONSTRAINT "invoices_tax_rate_check" CHECK ((("tax_rate" >= (0)::numeric) AND ("tax_rate" <= (100)::numeric)))
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


COMMENT ON TABLE "public"."invoices" IS 'Invoice documents with line items and payment tracking';



CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "received_on" "date" NOT NULL,
    "method" "public"."payment_method" NOT NULL,
    "reference" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "payments_amount_check" CHECK (("amount" > (0)::numeric))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


COMMENT ON TABLE "public"."payments" IS 'Payment records against invoices';



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
    "invoice_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
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


COMMENT ON TABLE "public"."org_members" IS 'Many-to-many relationship between users and organizations with roles';



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


COMMENT ON TABLE "public"."organizations" IS 'Business organizations/companies';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clerk_user_id" "text" NOT NULL,
    "name" "text",
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profiles linked to authentication system';



CREATE OR REPLACE VIEW "public"."v_dashboard_stats" AS
 SELECT "i"."org_id",
    COALESCE("sum"("p"."amount") FILTER (WHERE ("date_part"('year'::"text", "p"."received_on") = "date_part"('year'::"text", CURRENT_DATE))), (0)::numeric) AS "revenue_ytd",
    COALESCE("sum"(("i"."total" - "i"."paid_amount")) FILTER (WHERE ("i"."status" = ANY (ARRAY['sent'::"public"."invoice_status", 'overdue'::"public"."invoice_status"]))), (0)::numeric) AS "outstanding_total",
    COALESCE("count"(*) FILTER (WHERE ("i"."status" = 'overdue'::"public"."invoice_status")), (0)::bigint) AS "overdue_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."clients" "c"
          WHERE ("c"."org_id" = "i"."org_id")) AS "total_clients",
    COALESCE("sum"("p"."amount") FILTER (WHERE ("date_trunc"('month'::"text", ("p"."received_on")::timestamp with time zone) = "date_trunc"('month'::"text", (CURRENT_DATE)::timestamp with time zone))), (0)::numeric) AS "revenue_this_month"
   FROM ("public"."invoices" "i"
     LEFT JOIN "public"."payments" "p" ON (("i"."id" = "p"."invoice_id")))
  GROUP BY "i"."org_id";


ALTER VIEW "public"."v_dashboard_stats" OWNER TO "postgres";


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



CREATE INDEX "idx_activity_log_actor_user_id" ON "public"."activity_log" USING "btree" ("actor_user_id");



CREATE INDEX "idx_activity_log_created_at" ON "public"."activity_log" USING "btree" ("created_at");



CREATE INDEX "idx_activity_log_entity_type_id" ON "public"."activity_log" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_activity_log_org_id" ON "public"."activity_log" USING "btree" ("org_id");



CREATE INDEX "idx_clients_email" ON "public"."clients" USING "btree" ("email");



CREATE INDEX "idx_clients_name" ON "public"."clients" USING "btree" ("name");



CREATE INDEX "idx_clients_org_id" ON "public"."clients" USING "btree" ("org_id");



CREATE INDEX "idx_clients_user_id" ON "public"."clients" USING "btree" ("user_id");



CREATE INDEX "idx_expenses_category" ON "public"."expenses" USING "btree" ("category");



CREATE INDEX "idx_expenses_date" ON "public"."expenses" USING "btree" ("date");



CREATE INDEX "idx_expenses_org_id" ON "public"."expenses" USING "btree" ("org_id");



CREATE INDEX "idx_invoice_items_invoice_id" ON "public"."invoice_items" USING "btree" ("invoice_id");



CREATE INDEX "idx_invoices_client_id" ON "public"."invoices" USING "btree" ("client_id");



CREATE INDEX "idx_invoices_due_date" ON "public"."invoices" USING "btree" ("due_date");



CREATE INDEX "idx_invoices_issue_date" ON "public"."invoices" USING "btree" ("issue_date");



CREATE INDEX "idx_invoices_org_id" ON "public"."invoices" USING "btree" ("org_id");



CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_mv_dashboard_stats_org_id" ON "public"."mv_dashboard_stats" USING "btree" ("org_id");



CREATE INDEX "idx_notifications_organization_id" ON "public"."notifications" USING "btree" ("organization_id");



CREATE INDEX "idx_notifications_recipient_user_id" ON "public"."notifications" USING "btree" ("recipient_user_id");



CREATE INDEX "idx_org_members_composite" ON "public"."org_members" USING "btree" ("org_id", "user_id", "role");



CREATE INDEX "idx_org_members_org_id" ON "public"."org_members" USING "btree" ("org_id");



CREATE INDEX "idx_org_members_user_id" ON "public"."org_members" USING "btree" ("user_id");



CREATE INDEX "idx_organizations_owner_user_id" ON "public"."organizations" USING "btree" ("owner_user_id");



CREATE INDEX "idx_payments_invoice_id" ON "public"."payments" USING "btree" ("invoice_id");



CREATE INDEX "idx_payments_received_on" ON "public"."payments" USING "btree" ("received_on");



CREATE INDEX "idx_profiles_clerk_user_id" ON "public"."profiles" USING "btree" ("clerk_user_id");



CREATE OR REPLACE TRIGGER "on_invoice_insert" AFTER INSERT ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."create_invoice_notification"();



CREATE OR REPLACE TRIGGER "trg_ensure_owner_is_member" AFTER INSERT ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."fn_ensure_owner_is_member"();



CREATE OR REPLACE TRIGGER "trg_recompute_invoice_status" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW WHEN ((("old"."paid_amount" IS DISTINCT FROM "new"."paid_amount") OR ("old"."due_date" IS DISTINCT FROM "new"."due_date"))) EXECUTE FUNCTION "public"."fn_recompute_invoice_status"();



CREATE OR REPLACE TRIGGER "trg_update_client_totals" AFTER INSERT OR DELETE OR UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."fn_update_client_totals"();



CREATE OR REPLACE TRIGGER "trg_update_invoice_paid_amount" AFTER INSERT OR DELETE OR UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."fn_update_invoice_paid_amount"();



CREATE OR REPLACE TRIGGER "trg_update_invoices_updated_at" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."fn_update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_validate_payment_amount" BEFORE INSERT OR UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."fn_validate_payment_amount"();



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
    ADD CONSTRAINT "notifications_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."org_members"
    ADD CONSTRAINT "org_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



CREATE POLICY "Enable read access for user's own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "recipient_user_id"));



CREATE POLICY "Owners and admins can manage organization members" ON "public"."org_members" USING (("org_id" IN ( SELECT "get_user_organizations"."org_id"
   FROM "public"."get_user_organizations"() "get_user_organizations"("org_id", "role")
  WHERE ("get_user_organizations"."role" = ANY (ARRAY['owner'::"public"."org_role", 'admin'::"public"."org_role"]))))) WITH CHECK (("org_id" IN ( SELECT "get_user_organizations"."org_id"
   FROM "public"."get_user_organizations"() "get_user_organizations"("org_id", "role")
  WHERE ("get_user_organizations"."role" = ANY (ARRAY['owner'::"public"."org_role", 'admin'::"public"."org_role"])))));



CREATE POLICY "Owners can update their own organizations" ON "public"."organizations" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."org_members" "om"
     JOIN "public"."profiles" "p" ON (("om"."user_id" = "p"."id")))
  WHERE (("om"."org_id" = "organizations"."id") AND ("p"."clerk_user_id" = ("auth"."uid"())::"text") AND ("om"."role" = 'owner'::"public"."org_role")))));



CREATE POLICY "Restrict inserts to service role only" ON "public"."activity_log" FOR INSERT WITH CHECK (false);



CREATE POLICY "Users can create organizations" ON "public"."organizations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "organizations"."owner_user_id") AND ("p"."clerk_user_id" = ("auth"."uid"())::"text")))));



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



CREATE POLICY "Users can view and update their own profile" ON "public"."profiles" USING (("clerk_user_id" = ("auth"."uid"())::"text")) WITH CHECK (("clerk_user_id" = ("auth"."uid"())::"text"));



CREATE POLICY "Users can view members of their own organizations" ON "public"."org_members" FOR SELECT USING (("org_id" IN ( SELECT "get_user_organizations"."org_id"
   FROM "public"."get_user_organizations"() "get_user_organizations"("org_id", "role"))));



CREATE POLICY "Users can view their own organizations" ON "public"."organizations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."org_members" "om"
     JOIN "public"."profiles" "p" ON (("om"."user_id" = "p"."id")))
  WHERE (("om"."org_id" = "organizations"."id") AND ("p"."clerk_user_id" = ("auth"."uid"())::"text")))));



ALTER TABLE "public"."activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."org_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_invoice_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_invoice_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_invoice_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_ensure_owner_is_member"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_ensure_owner_is_member"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_ensure_owner_is_member"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_recompute_invoice_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_recompute_invoice_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_recompute_invoice_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_update_client_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_update_client_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_update_client_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_update_invoice_paid_amount"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_update_invoice_paid_amount"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_update_invoice_paid_amount"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."fn_validate_payment_amount"() TO "anon";
GRANT ALL ON FUNCTION "public"."fn_validate_payment_amount"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fn_validate_payment_amount"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_organizations"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_organizations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_organizations"() TO "service_role";



GRANT ALL ON TABLE "public"."activity_log" TO "anon";
GRANT ALL ON TABLE "public"."activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



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



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."v_dashboard_stats" TO "anon";
GRANT ALL ON TABLE "public"."v_dashboard_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."v_dashboard_stats" TO "service_role";



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






