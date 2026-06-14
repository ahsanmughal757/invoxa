-- Add user_id column to payments table to support personal payments
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id);

-- Update RLS policy to allow access to personal payments
DROP POLICY IF EXISTS "Users can manage payments in their own organizations" ON payments;

CREATE POLICY "Users can manage payments in their own organizations or personal payments"
ON payments FOR ALL
USING (
  -- For organization payments: check if user is member of the organization
  (
    EXISTS (
      SELECT 1
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN org_members om ON i.org_id = om.org_id
      JOIN profiles pr ON om.user_id = pr.id
      WHERE p.id = payments.id
      AND pr.clerk_user_id = auth.uid()::text
    )
  )
  OR
  -- For personal payments: check if payment is associated with the user directly
  (
    payments.user_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = auth.uid()::text
    )
  )
);