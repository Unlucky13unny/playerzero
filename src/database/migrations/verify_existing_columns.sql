-- ============================================
-- Verification Script: Check Existing Columns
-- ============================================
-- 
-- Run this BEFORE running the migration to see what already exists
-- This helps you understand what the migration will add
-- 
-- Simply copy and paste this into Supabase SQL Editor
-- ============================================

-- Check stat_verification_screenshots table columns
SELECT 
    'stat_verification_screenshots' as table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('is_flagged', 'flagged_reason', 'flagged_at', 'report_count') 
        THEN '✅ REPORT SYSTEM COLUMN'
        ELSE 'Standard column'
    END as column_type
FROM information_schema.columns
WHERE table_name = 'stat_verification_screenshots'
    AND column_name IN ('id', 'user_id', 'stat_entry_id', 'screenshot_url', 'entry_date', 
                        'is_flagged', 'flagged_reason', 'flagged_at', 'report_count', 'created_at')
ORDER BY 
    CASE 
        WHEN column_name IN ('is_flagged', 'flagged_reason', 'flagged_at', 'report_count') THEN 1
        ELSE 2
    END,
    column_name;

SELECT '─────────────────────────────────────────────────────' as separator;

-- Check profiles table columns
SELECT 
    'profiles' as table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name IN ('is_blocked', 'blocked_reason', 'blocked_at', 'blocked_by') 
        THEN '🚫 BLOCKING COLUMN (NEW)'
        WHEN column_name IN ('is_flagged', 'flagged_reason', 'flagged_at') 
        THEN '🚩 FLAGGING COLUMN (may exist)'
        ELSE 'Standard column'
    END as column_type
FROM information_schema.columns
WHERE table_name = 'profiles'
    AND column_name IN ('id', 'user_id', 'trainer_name', 'is_paid_user', 
                        'is_blocked', 'blocked_reason', 'blocked_at', 'blocked_by',
                        'is_flagged', 'flagged_reason', 'flagged_at')
ORDER BY 
    CASE 
        WHEN column_name IN ('is_blocked', 'blocked_reason', 'blocked_at', 'blocked_by') THEN 1
        WHEN column_name IN ('is_flagged', 'flagged_reason', 'flagged_at') THEN 2
        ELSE 3
    END,
    column_name;

SELECT '─────────────────────────────────────────────────────' as separator;

-- Check if stat_reports table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stat_reports')
        THEN '✅ stat_reports table EXISTS'
        ELSE '❌ stat_reports table DOES NOT EXIST (will be created)'
    END as stat_reports_status;

SELECT '─────────────────────────────────────────────────────' as separator;

-- Summary
SELECT 
    'SUMMARY' as section,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'stat_verification_screenshots' 
     AND column_name IN ('is_flagged', 'flagged_reason', 'flagged_at')) as existing_flagging_cols_verification,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'profiles' 
     AND column_name IN ('is_flagged', 'flagged_reason', 'flagged_at')) as existing_flagging_cols_profiles,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'profiles' 
     AND column_name IN ('is_blocked', 'blocked_reason', 'blocked_at', 'blocked_by')) as existing_blocking_cols,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = 'stat_verification_screenshots' 
     AND column_name = 'report_count') as has_report_count_col,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stat_reports')
        THEN true
        ELSE false
    END as stat_reports_table_exists;

-- ============================================
-- INTERPRETATION GUIDE:
-- ============================================
-- 
-- existing_flagging_cols_verification:
--   0 = None exist, migration will add all 3
--   1-2 = Some exist, migration will add missing ones
--   3 = All exist, migration will skip them
--
-- existing_flagging_cols_profiles:
--   0 = None exist, migration will add all 3
--   1-2 = Some exist, migration will add missing ones
--   3 = All exist, migration will skip them
--
-- existing_blocking_cols:
--   0 = None exist, migration will add all 4 (NEW FEATURE)
--   1-3 = Some exist, migration will add missing ones
--   4 = All exist, migration will skip them
--
-- has_report_count_col:
--   0 = Doesn't exist, migration will add it (NEW FEATURE)
--   1 = Already exists, migration will skip it
--
-- stat_reports_table_exists:
--   false = Will be created by migration (NEW TABLE)
--   true = Already exists, migration will skip table creation
-- ============================================

