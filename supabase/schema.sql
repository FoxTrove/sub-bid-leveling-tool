-- BidVet Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    trial_started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    openai_api_key_encrypted TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TYPE project_status AS ENUM ('draft', 'uploading', 'processing', 'complete', 'error');

CREATE TABLE public.projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    trade_type TEXT NOT NULL,
    location TEXT,
    project_size TEXT,
    deadline DATE,
    notes TEXT,
    status project_status DEFAULT 'draft' NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Users can only access their own projects
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

-- ============================================
-- BID DOCUMENTS TABLE
-- ============================================
CREATE TYPE document_status AS ENUM ('uploading', 'uploaded', 'processing', 'processed', 'error');

CREATE TABLE public.bid_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    contractor_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    upload_status document_status DEFAULT 'uploading' NOT NULL,
    raw_text TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.bid_documents ENABLE ROW LEVEL SECURITY;

-- Users can access documents through their projects
CREATE POLICY "Users can view own bid documents" ON public.bid_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = bid_documents.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create bid documents for own projects" ON public.bid_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = bid_documents.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own bid documents" ON public.bid_documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = bid_documents.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own bid documents" ON public.bid_documents
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = bid_documents.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Index for faster queries
CREATE INDEX idx_bid_documents_project_id ON public.bid_documents(project_id);

-- ============================================
-- EXTRACTED ITEMS TABLE
-- ============================================
CREATE TABLE public.extracted_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bid_document_id UUID REFERENCES public.bid_documents(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(15, 4),
    unit TEXT,
    unit_price DECIMAL(15, 2),
    total_price DECIMAL(15, 2),
    category TEXT,
    normalized_category TEXT,
    is_exclusion BOOLEAN DEFAULT FALSE NOT NULL,
    is_inclusion BOOLEAN DEFAULT FALSE NOT NULL,
    confidence_score DECIMAL(3, 2) DEFAULT 1.00 NOT NULL,
    needs_review BOOLEAN DEFAULT FALSE NOT NULL,
    raw_text TEXT,
    ai_notes TEXT,
    user_modified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.extracted_items ENABLE ROW LEVEL SECURITY;

-- Users can access items through their documents/projects
CREATE POLICY "Users can view own extracted items" ON public.extracted_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bid_documents bd
            JOIN public.projects p ON bd.project_id = p.id
            WHERE bd.id = extracted_items.bid_document_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own extracted items" ON public.extracted_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.bid_documents bd
            JOIN public.projects p ON bd.project_id = p.id
            WHERE bd.id = extracted_items.bid_document_id
            AND p.user_id = auth.uid()
        )
    );

-- Index for faster queries
CREATE INDEX idx_extracted_items_bid_document_id ON public.extracted_items(bid_document_id);
CREATE INDEX idx_extracted_items_category ON public.extracted_items(normalized_category);
CREATE INDEX idx_extracted_items_needs_review ON public.extracted_items(needs_review) WHERE needs_review = TRUE;

-- ============================================
-- COMPARISON RESULTS TABLE
-- ============================================
CREATE TABLE public.comparison_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
    total_bids INTEGER NOT NULL,
    price_low DECIMAL(15, 2),
    price_high DECIMAL(15, 2),
    price_average DECIMAL(15, 2),
    total_scope_items INTEGER NOT NULL,
    common_items INTEGER NOT NULL,
    gap_items INTEGER NOT NULL,
    summary_json JSONB NOT NULL,
    recommendation_json JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.comparison_results ENABLE ROW LEVEL SECURITY;

-- Users can access results through their projects
CREATE POLICY "Users can view own comparison results" ON public.comparison_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = comparison_results.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create comparison results for own projects" ON public.comparison_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = comparison_results.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own comparison results" ON public.comparison_results
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = comparison_results.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Index for faster queries
CREATE INDEX idx_comparison_results_project_id ON public.comparison_results(project_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bid_documents_updated_at
    BEFORE UPDATE ON public.bid_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extracted_items_updated_at
    BEFORE UPDATE ON public.extracted_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comparison_results_updated_at
    BEFORE UPDATE ON public.comparison_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKET SETUP
-- Run these in Supabase Dashboard > Storage
-- ============================================
-- 1. Create bucket named 'bid-documents' with private access
-- 2. Add these policies via SQL:

-- Storage policies (uncomment and run after creating the bucket)
/*
CREATE POLICY "Users can upload bid documents"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'bid-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view own bid documents"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'bid-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own bid documents"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'bid-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
*/
