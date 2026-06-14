CREATE TABLE IF NOT EXISTS public.organization_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    email TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'expired'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    accepted_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_organization_invites_token ON public.organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_organization_invites_organization_id ON public.organization_invites(organization_id);

ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for organization members"
ON public.organization_invites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organizations org
    LEFT JOIN public.org_members om ON org.id = om.org_id
    LEFT JOIN public.profiles p ON om.user_id = p.id
    WHERE org.id = organization_invites.organization_id AND (
      -- Owner access
      org.owner_user_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text)
      OR
      -- Member access
      (p.clerk_user_id = auth.uid()::text)
    )
  )
);

CREATE POLICY "Enable insert for organization owners"
ON public.organization_invites
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organizations org
    WHERE org.id = organization_invites.organization_id
    AND org.owner_user_id IN (SELECT id FROM public.profiles WHERE clerk_user_id = auth.uid()::text)
  )
);
