-- ============================================
-- TEAMS / ORGANIZATIONS SCHEMA
-- Enables team collaboration for Team plan users
-- ============================================

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    logo_url TEXT,
    plan public.plan_type DEFAULT 'team' NOT NULL,
    max_members INTEGER DEFAULT 10 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================
CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role organization_role DEFAULT 'member' NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Index for faster lookups
CREATE INDEX idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON public.organization_members(user_id);

-- ============================================
-- ORGANIZATION INVITES TABLE
-- ============================================
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

CREATE TABLE IF NOT EXISTS public.organization_invites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role organization_role DEFAULT 'member' NOT NULL,
    token TEXT UNIQUE NOT NULL,
    status invite_status DEFAULT 'pending' NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- Index for lookups
CREATE INDEX idx_org_invites_org_id ON public.organization_invites(organization_id);
CREATE INDEX idx_org_invites_email ON public.organization_invites(email);
CREATE INDEX idx_org_invites_token ON public.organization_invites(token);

-- ============================================
-- ADD ORGANIZATION REFERENCE TO PROFILES
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Index for faster org-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(organization_id);

-- ============================================
-- ADD ORGANIZATION REFERENCE TO PROJECT_FOLDERS
-- ============================================
ALTER TABLE public.project_folders
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Index for faster org-based queries
CREATE INDEX IF NOT EXISTS idx_folders_org_id ON public.project_folders(organization_id);

-- ============================================
-- RLS POLICIES FOR ORGANIZATIONS
-- ============================================

-- Organization members can view their org
CREATE POLICY "Members can view own organization" ON public.organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Only owners can update organization
CREATE POLICY "Owners can update organization" ON public.organizations
    FOR UPDATE USING (owner_id = auth.uid());

-- Users can create organizations (when subscribing to team plan)
CREATE POLICY "Users can create organizations" ON public.organizations
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Only owners can delete organization
CREATE POLICY "Owners can delete organization" ON public.organizations
    FOR DELETE USING (owner_id = auth.uid());

-- ============================================
-- RLS POLICIES FOR ORGANIZATION MEMBERS
-- ============================================

-- Members can view members of their org
CREATE POLICY "Members can view org members" ON public.organization_members
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Admins and owners can add members
CREATE POLICY "Admins can add org members" ON public.organization_members
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Admins can update member roles (except owner)
CREATE POLICY "Admins can update org members" ON public.organization_members
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
        AND role != 'owner'
    );

-- Admins can remove members (except owner)
CREATE POLICY "Admins can remove org members" ON public.organization_members
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
        AND role != 'owner'
    );

-- ============================================
-- RLS POLICIES FOR ORGANIZATION INVITES
-- ============================================

-- Members can view invites for their org
CREATE POLICY "Members can view org invites" ON public.organization_invites
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid()
        )
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Admins can create invites
CREATE POLICY "Admins can create invites" ON public.organization_invites
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Admins can update invites (revoke)
CREATE POLICY "Admins can update invites" ON public.organization_invites
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- UPDATE PROJECT_FOLDERS RLS FOR TEAM ACCESS
-- ============================================

-- Drop existing select policy if it exists and recreate with org access
DROP POLICY IF EXISTS "Users can view own folders" ON public.project_folders;

CREATE POLICY "Users can view own or org folders" ON public.project_folders
    FOR SELECT USING (
        user_id = auth.uid()
        OR (
            organization_id IS NOT NULL AND
            organization_id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid()
            )
        )
    );

-- Update insert policy to allow org context
DROP POLICY IF EXISTS "Users can create own folders" ON public.project_folders;

CREATE POLICY "Users can create folders" ON public.project_folders
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND (
            organization_id IS NULL
            OR organization_id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid()
            )
        )
    );

-- Update update policy
DROP POLICY IF EXISTS "Users can update own folders" ON public.project_folders;

CREATE POLICY "Users can update own or org folders" ON public.project_folders
    FOR UPDATE USING (
        user_id = auth.uid()
        OR (
            organization_id IS NOT NULL AND
            organization_id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    );

-- Update delete policy
DROP POLICY IF EXISTS "Users can delete own folders" ON public.project_folders;

CREATE POLICY "Users can delete own or org folders" ON public.project_folders
    FOR DELETE USING (
        user_id = auth.uid()
        OR (
            organization_id IS NOT NULL AND
            organization_id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    );

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on organizations
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user is member of an organization
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin/owner of an organization
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = org_id
        AND user_id = user_uuid
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's organization
CREATE OR REPLACE FUNCTION public.get_user_organization(user_uuid UUID DEFAULT auth.uid())
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT organization_id INTO org_id
    FROM public.organization_members
    WHERE user_id = user_uuid
    LIMIT 1;
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate URL-safe slug
CREATE OR REPLACE FUNCTION public.generate_org_slug(org_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert to lowercase, replace spaces with hyphens, remove special chars
    base_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := substring(base_slug from 1 for 50);

    final_slug := base_slug;

    -- Check for uniqueness and add counter if needed
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;
