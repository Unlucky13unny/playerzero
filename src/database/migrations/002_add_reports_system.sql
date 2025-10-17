-- Migration: Add Reports System
-- Description: Add tables and columns for user reporting of suspicious stats

-- ============================================
-- PART 1: Add columns to existing tables
-- ============================================

-- Add report_count to stat_verification_screenshots (NEW COLUMN)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stat_verification_screenshots' AND column_name = 'report_count'
    ) THEN
        ALTER TABLE stat_verification_screenshots ADD COLUMN report_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Check if flagging columns exist, add only if missing
-- Note: These may already exist in your database
DO $$ 
BEGIN 
    -- Add is_flagged if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stat_verification_screenshots' AND column_name = 'is_flagged'
    ) THEN
        ALTER TABLE stat_verification_screenshots ADD COLUMN is_flagged BOOLEAN DEFAULT false;
    END IF;

    -- Add flagged_reason if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stat_verification_screenshots' AND column_name = 'flagged_reason'
    ) THEN
        ALTER TABLE stat_verification_screenshots ADD COLUMN flagged_reason TEXT;
    END IF;

    -- Add flagged_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stat_verification_screenshots' AND column_name = 'flagged_at'
    ) THEN
        ALTER TABLE stat_verification_screenshots ADD COLUMN flagged_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add blocking columns to profiles table (NEW COLUMNS)
DO $$ 
BEGIN 
    -- Add is_blocked if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_blocked'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_blocked BOOLEAN DEFAULT false;
    END IF;

    -- Add blocked_reason if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'blocked_reason'
    ) THEN
        ALTER TABLE profiles ADD COLUMN blocked_reason TEXT;
    END IF;

    -- Add blocked_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'blocked_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN blocked_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add blocked_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'blocked_by'
    ) THEN
        ALTER TABLE profiles ADD COLUMN blocked_by UUID REFERENCES auth.users(id);
    END IF;

    -- Add is_flagged to profiles if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_flagged'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_flagged BOOLEAN DEFAULT false;
    END IF;

    -- Add flagged_reason to profiles if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'flagged_reason'
    ) THEN
        ALTER TABLE profiles ADD COLUMN flagged_reason TEXT;
    END IF;

    -- Add flagged_at to profiles if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'flagged_at'
    ) THEN
        ALTER TABLE profiles ADD COLUMN flagged_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================
-- PART 2: Create stat_reports table
-- ============================================

-- Create stat_reports table to track individual reports
CREATE TABLE IF NOT EXISTS stat_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  screenshot_id UUID NOT NULL REFERENCES stat_verification_screenshots(id) ON DELETE CASCADE,
  
  -- Report details
  reason TEXT NOT NULL,
  additional_notes TEXT,
  
  -- Admin review
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate reports from same user for same screenshot
  UNIQUE(reporter_user_id, screenshot_id)
);

-- ============================================
-- PART 3: Create indexes for better performance
-- ============================================

-- Indexes for stat_reports table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stat_reports_screenshot_id') THEN
        CREATE INDEX idx_stat_reports_screenshot_id ON stat_reports(screenshot_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stat_reports_reported_user_id') THEN
        CREATE INDEX idx_stat_reports_reported_user_id ON stat_reports(reported_user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stat_reports_status') THEN
        CREATE INDEX idx_stat_reports_status ON stat_reports(status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stat_reports_created_at') THEN
        CREATE INDEX idx_stat_reports_created_at ON stat_reports(created_at DESC);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_profiles_is_blocked') THEN
        CREATE INDEX idx_profiles_is_blocked ON profiles(is_blocked);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_stat_verification_screenshots_report_count') THEN
        CREATE INDEX idx_stat_verification_screenshots_report_count ON stat_verification_screenshots(report_count DESC);
    END IF;
END $$;

-- ============================================
-- PART 4: Enable RLS and create policies
-- ============================================

-- Enable RLS on stat_reports
ALTER TABLE stat_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stat_reports
DO $$ 
BEGIN 
    -- Drop existing policies if they exist to avoid conflicts
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stat_reports' AND policyname = 'Users can view their own reports') THEN
        DROP POLICY "Users can view their own reports" ON stat_reports;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stat_reports' AND policyname = 'Users can insert their own reports') THEN
        DROP POLICY "Users can insert their own reports" ON stat_reports;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stat_reports' AND policyname = 'Users can update their own reports') THEN
        DROP POLICY "Users can update their own reports" ON stat_reports;
    END IF;
END $$;

-- Create policies
CREATE POLICY "Users can view their own reports" ON stat_reports
  FOR SELECT USING (auth.uid() = reporter_user_id);

CREATE POLICY "Users can insert their own reports" ON stat_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Users can update their own reports" ON stat_reports
  FOR UPDATE USING (
    auth.uid() = reporter_user_id 
    AND created_at > NOW() - INTERVAL '24 hours'
  );

-- Function to increment report count when a new report is created
CREATE OR REPLACE FUNCTION increment_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stat_verification_screenshots
  SET report_count = report_count + 1
  WHERE id = NEW.screenshot_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment report count on new report
DROP TRIGGER IF EXISTS increment_report_count_trigger ON stat_reports;
CREATE TRIGGER increment_report_count_trigger
  AFTER INSERT ON stat_reports
  FOR EACH ROW
  EXECUTE FUNCTION increment_report_count();

-- Function to decrement report count when a report is deleted
CREATE OR REPLACE FUNCTION decrement_report_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stat_verification_screenshots
  SET report_count = GREATEST(0, report_count - 1)
  WHERE id = OLD.screenshot_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to decrement report count on report deletion
DROP TRIGGER IF EXISTS decrement_report_count_trigger ON stat_reports;
CREATE TRIGGER decrement_report_count_trigger
  AFTER DELETE ON stat_reports
  FOR EACH ROW
  EXECUTE FUNCTION decrement_report_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stat_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on stat_reports
DROP TRIGGER IF EXISTS update_stat_reports_updated_at_trigger ON stat_reports;
CREATE TRIGGER update_stat_reports_updated_at_trigger
  BEFORE UPDATE ON stat_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_stat_reports_updated_at();

-- ============================================
-- PART 5: Create database triggers
-- ============================================

-- These functions and triggers will be created/replaced automatically

-- ============================================
-- PART 6: Create admin view for reported screenshots
-- ============================================

-- Create a view for admin to see reported screenshots with details
-- Using CREATE OR REPLACE to handle existing views
CREATE OR REPLACE VIEW admin_reported_screenshots AS
SELECT 
  svs.id as screenshot_id,
  svs.screenshot_url,
  svs.entry_date,
  svs.report_count,
  svs.user_id as screenshot_owner_id,
  p.trainer_name,
  p.is_blocked,
  p.blocked_reason,
  COUNT(sr.id) as total_reports,
  COUNT(CASE WHEN sr.status = 'pending' THEN 1 END) as pending_reports,
  MAX(sr.created_at) as last_report_date,
  se.total_xp,
  se.pokemon_caught,
  se.distance_walked,
  se.pokestops_visited,
  se.unique_pokedex_entries,
  se.trainer_level
FROM stat_verification_screenshots svs
INNER JOIN profiles p ON svs.user_id = p.user_id
LEFT JOIN stat_reports sr ON svs.id = sr.screenshot_id
LEFT JOIN stat_entries se ON svs.stat_entry_id = se.id
WHERE svs.report_count > 0
GROUP BY 
  svs.id, svs.screenshot_url, svs.entry_date, svs.report_count, 
  svs.user_id, p.trainer_name, p.is_blocked, p.blocked_reason,
  se.total_xp, se.pokemon_caught, se.distance_walked, 
  se.pokestops_visited, se.unique_pokedex_entries, se.trainer_level
ORDER BY svs.report_count DESC, MAX(sr.created_at) DESC;

-- ============================================
-- PART 7: Add documentation comments
-- ============================================

COMMENT ON TABLE stat_reports IS 'Stores user reports of suspicious stat verification screenshots';
COMMENT ON COLUMN stat_reports.status IS 'Report status: pending (not reviewed), reviewed (admin looked at it), dismissed (no action needed), action_taken (user blocked/warned)';
COMMENT ON COLUMN profiles.is_blocked IS 'Whether the user is blocked from submitting stats or appearing on leaderboards';
COMMENT ON COLUMN stat_verification_screenshots.report_count IS 'Number of times this screenshot has been reported';

-- ============================================
-- MIGRATION COMPLETE!
-- ============================================
-- 
-- This migration adds the complete Report System with:
-- 
-- NEW COLUMNS ADDED:
-- - stat_verification_screenshots.report_count (auto-incremented by triggers)
-- - stat_verification_screenshots.is_flagged (if didn't exist)
-- - stat_verification_screenshots.flagged_reason (if didn't exist)
-- - stat_verification_screenshots.flagged_at (if didn't exist)
-- - profiles.is_blocked (NEW - for blocking users)
-- - profiles.blocked_reason (NEW)
-- - profiles.blocked_at (NEW)
-- - profiles.blocked_by (NEW)
-- - profiles.is_flagged (if didn't exist)
-- - profiles.flagged_reason (if didn't exist)
-- - profiles.flagged_at (if didn't exist)
-- 
-- NEW TABLE:
-- - stat_reports (tracks individual user reports)
-- 
-- NEW TRIGGERS:
-- - Auto-increment/decrement report_count on stat_verification_screenshots
-- - Auto-update updated_at timestamp on stat_reports
-- 
-- NEW VIEW:
-- - admin_reported_screenshots (pre-joined data for admin dashboard)
-- 
-- NEW INDEXES:
-- - 6 new indexes for performance optimization
-- 
-- RLS POLICIES:
-- - Users can view/insert/update their own reports
-- - Admins bypass RLS via service role
-- 
-- Note: This migration is IDEMPOTENT - safe to run multiple times!
-- It checks for existing columns/indexes/policies before creating them.
-- ============================================

