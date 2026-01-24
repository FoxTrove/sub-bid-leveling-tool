-- Migration: Add breakdown selection feature
-- This adds support for AI-powered grouping strategies in bid comparison

-- Add breakdown columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS breakdown_type TEXT,
ADD COLUMN IF NOT EXISTS breakdown_structure JSONB,
ADD COLUMN IF NOT EXISTS breakdown_source TEXT CHECK (breakdown_source IN ('ai', 'custom', 'template'));

COMMENT ON COLUMN projects.breakdown_type IS 'Type of breakdown selected: by_location, by_material, by_phase, by_unit, etc.';
COMMENT ON COLUMN projects.breakdown_structure IS 'The hierarchical structure of the selected breakdown';
COMMENT ON COLUMN projects.breakdown_source IS 'Whether breakdown came from AI suggestion, custom input, or saved template';

-- Create table for caching AI-generated breakdown options
CREATE TABLE IF NOT EXISTS breakdown_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  breakdown_type TEXT NOT NULL,
  breakdown_structure JSONB NOT NULL,
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.80,
  explanation TEXT,
  is_recommended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_breakdown_options_project ON breakdown_options(project_id);

COMMENT ON TABLE breakdown_options IS 'Cached AI-generated breakdown options for a project';

-- Create table for user-saved breakdown templates
CREATE TABLE IF NOT EXISTS breakdown_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  breakdown_structure JSONB NOT NULL,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_breakdown_templates_user ON breakdown_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_breakdown_templates_trade ON breakdown_templates(trade_type);

COMMENT ON TABLE breakdown_templates IS 'User-saved breakdown templates for reuse across projects';

-- Add breakdown_category to extracted_items for grouping
ALTER TABLE extracted_items
ADD COLUMN IF NOT EXISTS breakdown_category TEXT;

COMMENT ON COLUMN extracted_items.breakdown_category IS 'Category assigned based on selected breakdown structure';

-- Enable RLS on new tables
ALTER TABLE breakdown_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE breakdown_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for breakdown_options (access via project ownership)
DO $$ BEGIN
  CREATE POLICY "Users can view breakdown options for their projects"
    ON breakdown_options FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = breakdown_options.project_id
        AND p.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert breakdown options for their projects"
    ON breakdown_options FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = breakdown_options.project_id
        AND p.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete breakdown options for their projects"
    ON breakdown_options FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = breakdown_options.project_id
        AND p.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS policies for breakdown_templates (user owns their templates)
DO $$ BEGIN
  CREATE POLICY "Users can view their own breakdown templates"
    ON breakdown_templates FOR SELECT
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create their own breakdown templates"
    ON breakdown_templates FOR INSERT
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own breakdown templates"
    ON breakdown_templates FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own breakdown templates"
    ON breakdown_templates FOR DELETE
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Trigger to update updated_at on breakdown_templates
DROP TRIGGER IF EXISTS update_breakdown_templates_updated_at ON breakdown_templates;
CREATE TRIGGER update_breakdown_templates_updated_at
  BEFORE UPDATE ON breakdown_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
