-- Create a function to check if the current user is the owner of an organization
-- This function is SECURITY DEFINER to bypass RLS on organizations/org_members
CREATE OR REPLACE FUNCTION public.is_org_owner(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public -- Set search_path for security
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.organizations
    WHERE id = org_id 
    AND owner_user_id = (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text)
  );
$$;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Enable read access for organization members" ON public.organization_invites;
DROP POLICY IF EXISTS "Enable insert for organization owners" ON public.organization_invites;

-- Re-create policies using the new function (and simplified member check)

-- 1. Insert: Only owners can insert
CREATE POLICY "Enable insert for organization owners"
ON public.organization_invites
FOR INSERT
WITH CHECK (
  public.is_org_owner(organization_id)
);

-- 2. Select: Members + Owners
-- For members, we still need to check membership. 
-- To avoid recursion if we query org_members directly, we can create a helper for that too, 
-- or just rely on the fact that we are query org_members for a DIFFERENT purpose (checking if I am in org X).
-- But let's be safe and use a function for that too.

CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
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

CREATE POLICY "Enable read access for organization members"
ON public.organization_invites
FOR SELECT
USING (
  public.is_org_member(organization_id)
);
