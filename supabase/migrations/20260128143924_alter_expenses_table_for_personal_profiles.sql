-- Temporarily disable RLS
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;

-- Drop the RLS policies that depend on org_id
DROP POLICY IF EXISTS "Users can manage expenses in their own organizations" ON expenses;

-- Drop the foreign key constraint first
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_org_id_fkey;

-- Change the column type and make it nullable
ALTER TABLE expenses ALTER COLUMN org_id TYPE UUID USING org_id::UUID;
ALTER TABLE expenses ALTER COLUMN org_id DROP NOT NULL;

-- Re-enable and recreate the RLS policy with the new column type
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Recreate the RLS policy for expenses
CREATE POLICY "Users can manage expenses in their own organizations" ON expenses
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = expenses.org_id::UUID  -- Cast to UUID for comparison
    AND p.clerk_user_id = auth.uid()::text
  )
);