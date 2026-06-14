-- Create the profiles table to store user information
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES profiles(id),
    name TEXT NOT NULL,
    logo_url TEXT,
    branding JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a type for user roles
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member');

-- Create the org_members table to link users and organizations
CREATE TABLE org_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    "role" org_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(org_id, user_id)
);

-- Enable Row-Level Security for the tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy for organizations: Users can only see organizations they are a member of.
CREATE POLICY "Users can view their own organizations"
ON organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = organizations.id
    AND p.clerk_user_id = auth.uid()::text
  )
);

CREATE POLICY "Owners can update their own organizations"
ON organizations FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = organizations.id
    AND p.clerk_user_id = auth.uid()::text
    AND om.role = 'owner'
  )
);


-- RLS Policy for org_members: Users can see other members of organizations they belong to.
CREATE POLICY "Users can view members of their own organizations"
ON org_members FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = org_members.org_id
    AND p.clerk_user_id = auth.uid()::text
  )
);

CREATE POLICY "Owners and admins can manage organization members"
ON org_members FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM org_members om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.org_id = org_members.org_id
    AND p.clerk_user_id = auth.uid()::text
    AND (om.role = 'owner' OR om.role = 'admin')
  )
);