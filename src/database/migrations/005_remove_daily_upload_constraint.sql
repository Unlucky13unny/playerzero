-- Migration: Remove daily upload constraint to allow multiple uploads per day
-- This enables paid users to upload stats up to 4 times per day
-- while trial users remain limited to 1 upload per day (enforced in application logic)

-- Remove the unique constraint that prevents multiple uploads per day
ALTER TABLE stat_entries DROP CONSTRAINT IF EXISTS stat_entries_user_id_entry_date_key;

-- Add a comment to document the change
COMMENT ON TABLE stat_entries IS 'Stores user stat entries over time. Daily upload limits are now enforced in application logic: 4/day for paid users, 1/day for trial users.';

-- Optional: Add an index to improve performance for daily upload count queries
CREATE INDEX IF NOT EXISTS idx_stat_entries_user_date ON stat_entries(user_id, entry_date);

-- Verify the constraint was removed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'stat_entries_user_id_entry_date_key'
        AND table_name = 'stat_entries'
    ) THEN
        RAISE EXCEPTION 'Failed to remove unique constraint stat_entries_user_id_entry_date_key';
    ELSE
        RAISE NOTICE 'Successfully removed unique constraint. Multiple daily uploads are now possible.';
    END IF;
END $$;
