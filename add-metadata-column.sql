-- Add missing metadata column to ledger_entries table
-- Run this in Supabase SQL Editor

ALTER TABLE public.ledger_entries 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ledger_entries' AND column_name = 'metadata';