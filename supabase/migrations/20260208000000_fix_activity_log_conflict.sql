-- Fix activity_log table by dropping the incorrect one and recreating with correct schema
-- This migration addresses the conflict between different activity_log table definitions

-- First, drop the problematic indexes if they exist
DROP INDEX IF EXISTS idx_activity_log_user_id;
DROP INDEX IF EXISTS idx_activity_log_timestamp;

-- Drop the table if it exists with the wrong schema
-- We'll recreate it with the correct schema
-- The correct schema should have actor_user_id instead of user_id based on the original creation

-- Recreate the activity_log table with the correct schema from the original migration
DROP TABLE IF EXISTS activity_log;

-- Create the activity_log table for auditing (based on the original migration)
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    actor_user_id UUID NOT NULL REFERENCES profiles(id),
    entity_type TEXT NOT NULL,
    entity_id UUID,
    action TEXT NOT NULL,
    meta JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for querying the log
CREATE INDEX idx_activity_log_org_id ON activity_log(org_id);
CREATE INDEX idx_activity_log_entity_type_id ON activity_log(entity_type, entity_id);

-- Enable Row-Level Security
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy for activity_log: Users can view activity logs for their own organizations.
CREATE POLICY "Users can view activity logs for their own organizations"
ON activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = activity_log.org_id
    AND p.clerk_user_id = auth.uid()::text
  )
);

-- RLS Policy for inserts: For now, we assume inserts are handled by the backend with a service role.
-- We will add a restrictive policy to prevent direct client-side inserts.
CREATE POLICY "Restrict inserts to service role only"
ON activity_log FOR INSERT
WITH CHECK (false);