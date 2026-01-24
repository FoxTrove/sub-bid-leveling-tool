-- Migration: Add position tracking for document viewer
-- This enables bidirectional highlighting between extracted items and source documents

-- Add text_positions to bid_documents for storing position metadata during extraction
ALTER TABLE bid_documents
ADD COLUMN IF NOT EXISTS text_positions JSONB;

COMMENT ON COLUMN bid_documents.text_positions IS 'Position metadata for extracted text blocks. Structure varies by file type: PDF has page/x/y/width/height, Excel has sheet/row/col/cellRef, Word has paragraph/charStart/charEnd';

-- Add text_position to extracted_items for precise source location
ALTER TABLE extracted_items
ADD COLUMN IF NOT EXISTS text_position JSONB;

COMMENT ON COLUMN extracted_items.text_position IS 'Position in source document where this item was extracted from. Used for bidirectional highlighting in document viewer.';

-- Create index for faster position lookups (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_extracted_items_text_position ON extracted_items USING GIN (text_position);
CREATE INDEX IF NOT EXISTS idx_bid_documents_text_positions ON bid_documents USING GIN (text_positions);
