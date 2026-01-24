-- Migration: Add item edit history for version tracking
-- This provides full audit trail for all changes to extracted items

CREATE TABLE IF NOT EXISTS item_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES extracted_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  change_reason TEXT,
  batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_item_edit_history_item ON item_edit_history(item_id);
CREATE INDEX IF NOT EXISTS idx_item_edit_history_user ON item_edit_history(user_id);
CREATE INDEX IF NOT EXISTS idx_item_edit_history_batch ON item_edit_history(batch_id);
CREATE INDEX IF NOT EXISTS idx_item_edit_history_created ON item_edit_history(created_at DESC);

COMMENT ON TABLE item_edit_history IS 'Full audit trail of all changes to extracted items';
COMMENT ON COLUMN item_edit_history.field_name IS 'Name of field that was changed: description, quantity, unit, unit_price, total_price, category, etc.';
COMMENT ON COLUMN item_edit_history.old_value IS 'Previous value before the change (stored as JSONB for type flexibility)';
COMMENT ON COLUMN item_edit_history.new_value IS 'New value after the change';
COMMENT ON COLUMN item_edit_history.change_reason IS 'Optional user-provided reason for the change';
COMMENT ON COLUMN item_edit_history.batch_id IS 'Groups multiple field changes made in a single edit session';

-- Enable RLS
ALTER TABLE item_edit_history ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can see/create history for items they have access to
DO $$ BEGIN
  CREATE POLICY "Users can view edit history for their items"
    ON item_edit_history FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM extracted_items ei
        JOIN bid_documents bd ON bd.id = ei.bid_document_id
        JOIN projects p ON p.id = bd.project_id
        WHERE ei.id = item_edit_history.item_id
        AND p.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create edit history for their items"
    ON item_edit_history FOR INSERT
    WITH CHECK (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM extracted_items ei
        JOIN bid_documents bd ON bd.id = ei.bid_document_id
        JOIN projects p ON p.id = bd.project_id
        WHERE ei.id = item_edit_history.item_id
        AND p.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Team members can also view/create history for shared projects
DO $$ BEGIN
  CREATE POLICY "Team members can view edit history for shared projects"
    ON item_edit_history FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM extracted_items ei
        JOIN bid_documents bd ON bd.id = ei.bid_document_id
        JOIN projects p ON p.id = bd.project_id
        JOIN project_shares ps ON ps.project_id = p.id
        WHERE ei.id = item_edit_history.item_id
        AND ps.shared_with_user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Team members can create edit history for shared projects with edit permission"
    ON item_edit_history FOR INSERT
    WITH CHECK (
      user_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM extracted_items ei
        JOIN bid_documents bd ON bd.id = ei.bid_document_id
        JOIN projects p ON p.id = bd.project_id
        JOIN project_shares ps ON ps.project_id = p.id
        WHERE ei.id = item_edit_history.item_id
        AND ps.shared_with_user_id = auth.uid()
        AND ps.permission IN ('edit', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
