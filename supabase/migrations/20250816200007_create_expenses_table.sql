
--------------------------------------------------------------------------------
-- MIGRATION: 20250816200007_create_expenses_table.sql
--------------------------------------------------------------------------------

-- Create the expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    "date" DATE NOT NULL,
    category TEXT,
    tax_deductible BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_expenses_org_id ON expenses(org_id);
CREATE INDEX idx_expenses_category ON expenses(category);

-- Enable Row-Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policy for expenses: Users can manage expenses in organizations they are a member of.
CREATE POLICY "Users can manage expenses in their own organizations"
ON expenses FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = expenses.org_id
    AND p.clerk_user_id = auth.uid()::text
  )
);
