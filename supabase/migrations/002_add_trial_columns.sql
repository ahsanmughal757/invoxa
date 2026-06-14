-- ============================================================================
-- InvoicePro - Three-Tier Subscription System Migration
-- ============================================================================

-- ============================================================================
-- 0. ENSURE SUBSCRIPTIONS TABLE EXISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  clerk_user_id TEXT NOT NULL,
  plan TEXT,
  status TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 1. ADD NEW COLUMNS TO SUBSCRIPTIONS
-- ============================================================================

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lifetime_price DECIMAL(10,2);

-- ============================================================================
-- 2. ADD TRIAL TRACKING TO PROFILES (SAFE)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema='public'
    AND table_name='profiles'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_end
ON subscriptions(trial_end_date)
WHERE is_trial = true;

CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_type
ON subscriptions(trial_type)
WHERE is_trial = true;

CREATE INDEX IF NOT EXISTS idx_subscriptions_lifetime
ON subscriptions(is_lifetime)
WHERE is_lifetime = true;

-- ============================================================================
-- 4. TRIAL CHECK FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_is_trial_active(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
SELECT EXISTS (
  SELECT 1
  FROM subscriptions
  WHERE user_id = p_user_id
  AND is_trial = true
  AND status='trial'
  AND trial_end_date > NOW()
);
$$;

CREATE OR REPLACE FUNCTION fn_get_trial_days_remaining(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
SELECT COALESCE(
(
SELECT CEIL(EXTRACT(EPOCH FROM (trial_end_date - NOW())) / 86400)
FROM subscriptions
WHERE user_id = p_user_id
AND trial_type='14day'
AND status='trial'
AND trial_end_date > NOW()
LIMIT 1
),
0
);
$$;

CREATE OR REPLACE FUNCTION fn_get_trial_time_remaining_seconds(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
SELECT COALESCE(
(
SELECT EXTRACT(EPOCH FROM (trial_end_date - NOW()))::INTEGER
FROM subscriptions
WHERE user_id = p_user_id
AND trial_type='3min'
AND status='trial'
AND trial_end_date > NOW()
LIMIT 1
),
0
);
$$;

CREATE OR REPLACE FUNCTION fn_is_lifetime_access(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
SELECT EXISTS(
SELECT 1 FROM subscriptions
WHERE user_id = p_user_id
AND is_lifetime=true
AND status='active'
);
$$;

-- ============================================================================
-- ADDITIONAL TRIAL FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_is_subscription_expired(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
SELECT EXISTS (
  SELECT 1
  FROM subscriptions
  WHERE user_id = p_user_id
  AND status IN ('trial', 'active')
  AND end_date < NOW()
  AND is_lifetime = false
);
$$;

CREATE OR REPLACE FUNCTION fn_get_trial_type(p_user_id UUID)
RETURNS VARCHAR
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
SELECT COALESCE(
  (
    SELECT trial_type
    FROM subscriptions
    WHERE user_id = p_user_id
    AND is_trial = true
    AND status = 'trial'
    AND trial_end_date > NOW()
    ORDER BY trial_end_date DESC
    LIMIT 1
  ),
  NULL
);
$$;

-- ============================================================================
-- 5. AUTO CREATE 3 MINUTE TRIAL
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_auto_create_trial_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

IF EXISTS(
SELECT 1 FROM subscriptions
WHERE user_id = NEW.id
) THEN
RETURN NEW;
END IF;

INSERT INTO subscriptions(
user_id,
clerk_user_id,
plan,
status,
start_date,
end_date,
trial_start_date,
trial_end_date,
is_trial,
trial_type
)
VALUES(
NEW.id,
NEW.clerk_user_id,
'3min-trial',
'trial',
NOW(),
NOW() + INTERVAL '3 minutes',
NOW(),
NOW() + INTERVAL '3 minutes',
true,
'3min'
);

UPDATE profiles
SET has_used_trial=true
WHERE id = NEW.id;

RETURN NEW;

END;
$$;

-- ============================================================================
-- 6. TRIGGER (SAFE CREATE)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name='profiles'
  ) THEN

    DROP TRIGGER IF EXISTS trg_auto_create_trial ON profiles;

    CREATE TRIGGER trg_auto_create_trial
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION fn_auto_create_trial_subscription();

  END IF;
END $$;

-- ============================================================================
-- 7. CREATE 14 DAY TRIAL
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_create_14day_trial(
p_user_id UUID,
p_clerk_user_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN

INSERT INTO subscriptions(
user_id,
clerk_user_id,
plan,
status,
start_date,
end_date,
trial_start_date,
trial_end_date,
is_trial,
trial_type
)
VALUES(
p_user_id,
p_clerk_user_id,
'14day-trial',
'trial',
NOW(),
NOW() + INTERVAL '14 days',
NOW(),
NOW() + INTERVAL '14 days',
true,
'14day'
)
RETURNING id INTO v_id;

RETURN v_id;

END;
$$;

-- ============================================================================
-- 8. CREATE LIFETIME SUBSCRIPTION
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_create_lifetime_subscription(
p_user_id UUID,
p_clerk_user_id TEXT,
p_price DECIMAL DEFAULT 287
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id UUID;
BEGIN

UPDATE subscriptions
SET status='cancelled'
WHERE user_id=p_user_id
AND status='trial';

INSERT INTO subscriptions(
user_id,
clerk_user_id,
plan,
status,
start_date,
end_date,
is_lifetime,
lifetime_price
)
VALUES(
p_user_id,
p_clerk_user_id,
'lifetime',
'active',
NOW(),
'2099-12-31',
true,
p_price
)
RETURNING id INTO v_id;

RETURN v_id;

END;
$$;

-- ============================================================================
-- 9. EXPIRE TRIALS
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_update_expired_subscriptions()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN

UPDATE subscriptions
SET status='expired',
updated_at=NOW()
WHERE is_trial=true
AND status='trial'
AND trial_end_date < NOW();

END;
$$;

-- ============================================================================
-- 10. GET USER SUBSCRIPTION
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_get_user_subscription(p_clerk_user_id TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  clerk_user_id TEXT,
  plan VARCHAR,
  status VARCHAR,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  is_trial BOOLEAN,
  trial_type VARCHAR,
  is_lifetime BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  invoice_limit INTEGER,
  client_limit INTEGER,
  features JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.user_id,
    s.clerk_user_id,
    s.plan::VARCHAR,
    s.status::VARCHAR,
    s.start_date,
    s.end_date,
    s.trial_start_date,
    s.trial_end_date,
    s.is_trial,
    s.trial_type::VARCHAR,
    s.is_lifetime,
    s.created_at,
    s.updated_at,
    -1::INTEGER as invoice_limit,  -- All plans unlimited
    -1::INTEGER as client_limit,   -- All plans unlimited
    '["basic_invoicing","client_management","payment_tracking","expense_tracking","custom_templates","reports_analytics","multi_currency","automated_reminders","recurring_invoices","pdf_customization","bulk_operations","advanced_reporting","team_collaboration","api_access","white_label","priority_support","backup_restore"]'::jsonb as features
  FROM subscriptions s
  WHERE s.clerk_user_id = p_clerk_user_id
  AND s.status IN ('active', 'trial')
  AND (s.is_lifetime = true OR (s.is_trial = true AND s.trial_end_date > NOW()))
  ORDER BY 
    CASE WHEN s.is_lifetime = true THEN 0 ELSE 1 END,
    s.created_at DESC
  LIMIT 1;
END;
$$;

-- ============================================================================
-- 11. ENABLE RLS
-- ============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;

CREATE POLICY "Users can view own subscription"
ON subscriptions
FOR SELECT
USING (
clerk_user_id = auth.jwt() ->> 'sub'
);

CREATE POLICY "Users can update own subscription"
ON subscriptions
FOR UPDATE
USING (
clerk_user_id = auth.jwt() ->> 'sub'
);

CREATE POLICY "Service role can manage subscriptions"
ON subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 11. CRON JOB FOR EXPIRY (OPTIONAL - requires pg_cron extension)
-- ============================================================================

-- Note: pg_cron may not be available in all environments
-- To enable: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Then manually schedule: SELECT cron.schedule('expire-subscriptions-job', '* * * * *', 'SELECT fn_update_expired_subscriptions();');

-- The following is commented out as it requires pg_cron extension
-- Uncomment if pg_cron is enabled in your environment:
/*
SELECT cron.schedule(
  'expire-subscriptions-job',
  '* * * * *',
  'SELECT fn_update_expired_subscriptions();'
);
*/