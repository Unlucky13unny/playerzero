-- ============================================================================
-- UPDATE previous_week_winners VIEW
-- ============================================================================
-- This updates the view to:
-- 1. Add period_start and period_end columns
-- 2. Ensure weeks run Sunday 00:00 UTC through Saturday 23:59 UTC
-- 3. Require at least 2 uploads per period
-- 4. Include grace period (Saturday 20:00-23:59 UTC)
-- 5. Include dex_delta tracking
-- 6. Ensure deltas are never negative
-- 7. Show top 10 winners
-- ============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS public.previous_week_winners CASCADE;

-- Create the updated view
CREATE VIEW public.previous_week_winners AS
WITH date_bounds AS (
  SELECT
    -- Last week start: Previous Sunday 00:00 UTC
    (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 7)::DATE AS week_start,
    -- Last week end: Previous Saturday 23:59 UTC
    (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 1)::DATE AS week_end
),
weekly_uploads AS (
  SELECT 
    p.id AS profile_id,
    p.trainer_name,
    p.team_color,
    p.country,
    p.profile_screenshot_url,
    d.week_start AS period_start,
    d.week_end AS period_end,
    COUNT(*) AS upload_count,
    MIN(se.total_xp) AS first_xp,
    MAX(se.total_xp) AS latest_xp,
    MIN(se.pokemon_caught) AS first_catches,
    MAX(se.pokemon_caught) AS latest_catches,
    MIN(se.distance_walked) AS first_distance,
    MAX(se.distance_walked) AS latest_distance,
    MIN(se.pokestops_visited) AS first_stops,
    MAX(se.pokestops_visited) AS latest_stops,
    MIN(se.unique_pokedex_entries) AS first_dex,
    MAX(se.unique_pokedex_entries) AS latest_dex,
    MAX(se.created_at) AS last_update
  FROM profiles p
  CROSS JOIN date_bounds d
  INNER JOIN stat_entries se ON p.id = se.profile_id
  WHERE p.is_paid_user = true
    AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
    AND p.role = 'user'
    AND COALESCE(p.is_blocked, false) = false
    AND (
      -- Grace period: Saturday 20:00-23:59 UTC (4-hour buffer before week starts)
      (se.entry_date = d.week_start - 1 AND EXTRACT(HOUR FROM se.created_at) >= 20)
      OR
      -- Regular week: Sunday through Saturday
      (se.entry_date >= d.week_start AND se.entry_date <= d.week_end)
    )
  GROUP BY p.id, p.trainer_name, p.team_color, p.country, p.profile_screenshot_url, d.week_start, d.week_end
  HAVING COUNT(*) >= 2  -- Must have at least 2 uploads
)
SELECT 
  profile_id,
  trainer_name,
  team_color,
  country,
  profile_screenshot_url,
  period_start,
  period_end,
  GREATEST(COALESCE(latest_xp - first_xp, 0), 0) AS xp_delta,
  GREATEST(COALESCE(latest_catches - first_catches, 0), 0) AS catches_delta,
  GREATEST(COALESCE(latest_distance - first_distance, 0), 0) AS distance_delta,
  GREATEST(COALESCE(latest_stops - first_stops, 0), 0) AS pokestops_delta,
  GREATEST(COALESCE(latest_dex - first_dex, 0), 0) AS dex_delta,
  last_update,
  ROW_NUMBER() OVER (ORDER BY GREATEST(COALESCE(latest_xp - first_xp, 0), 0) DESC) AS rank
FROM weekly_uploads
WHERE GREATEST(COALESCE(latest_xp - first_xp, 0), 0) > 0  -- Only show positive XP gains
ORDER BY xp_delta DESC
LIMIT 10;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Test the updated view
SELECT 
  rank,
  trainer_name,
  period_start,
  period_end,
  xp_delta,
  catches_delta,
  distance_delta,
  pokestops_delta,
  dex_delta,
  last_update
FROM public.previous_week_winners
ORDER BY rank;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- Key Changes:
-- 1. ✅ Added period_start and period_end columns
-- 2. ✅ Week calculation: (CURRENT_DATE - DOW - 7) ensures Sunday start
-- 3. ✅ Uses INNER JOIN instead of LEFT JOIN (requires data to exist)
-- 4. ✅ HAVING COUNT(*) >= 2 enforces 2-upload minimum
-- 5. ✅ Grace period: Saturday 20:00-23:59 UTC included
-- 6. ✅ GREATEST() ensures deltas are never negative
-- 7. ✅ Added dex_delta tracking
-- 8. ✅ Shows top 10 winners (LIMIT 10)
-- 9. ✅ Only shows users with positive XP gains
--
-- Week Logic:
-- - CURRENT_DATE = Friday (DOW = 5)
-- - week_start = Friday - 5 - 7 = -7 days = Previous Sunday
-- - week_end = Friday - 5 - 1 = -1 day = Last Saturday
--
-- Example for Oct 24, 2025 (Friday):
-- - week_start = Oct 24 - 5 - 7 = Oct 12 (Sunday)
-- - week_end = Oct 24 - 5 - 1 = Oct 18 (Saturday)
-- ============================================================================

