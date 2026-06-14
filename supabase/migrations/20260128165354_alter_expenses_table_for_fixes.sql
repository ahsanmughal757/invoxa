-- Drop the foreign key constraint first
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_org_id_fkey;

-- Make the column nullable (this assumes the type is already correct)
ALTER TABLE expenses ALTER COLUMN org_id DROP NOT NULL;