-- Migration 003: Update Weekly Leaderboard Logic
-- Changes: Week starts Sunday, 4-hour grace period on Saturday, minimum 2 uploads required

-- ============================================
-- 1. Update week start: Monday → Sunday
-- ============================================

CREATE OR REPLACE FUNCTION get_current_week_start()
RETURNS DATE AS $$
BEGIN
  -- Returns Sunday 00:00 UTC (DOW 0=Sunday)
  RETURN CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. Update last completed week: Sunday-Saturday
-- ============================================

CREATE OR REPLACE FUNCTION get_last_completed_week()
RETURNS TABLE(period_start DATE, period_end DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (get_current_week_start() - INTERVAL '7 days')::DATE AS period_start,
    (get_current_week_start() - INTERVAL '1 day')::DATE AS period_end;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Helper: Check if timestamp is in grace period
-- ============================================

CREATE OR REPLACE FUNCTION is_grace_period(upload_time TIMESTAMP WITH TIME ZONE)
RETURNS BOOLEAN AS $$
BEGIN
  -- Saturday 20:00-23:59 UTC (4-hour buffer)
  RETURN EXTRACT(DOW FROM upload_time)::INTEGER = 6 
         AND EXTRACT(HOUR FROM upload_time)::INTEGER >= 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Helper: Get valid uploads for current week (including grace period)
-- ============================================

CREATE OR REPLACE FUNCTION get_week_uploads(p_profile_id UUID, p_week_start DATE)
RETURNS TABLE(
  entry_date DATE,
  total_xp BIGINT,
  pokemon_caught INTEGER,
  distance_walked DECIMAL(10,2),
  pokestops_visited INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  prev_saturday DATE := p_week_start - 1;
  week_end DATE := p_week_start + 6;
BEGIN
  RETURN QUERY
  SELECT 
    se.entry_date,
    se.total_xp,
    se.pokemon_caught,
    se.distance_walked,
    se.pokestops_visited,
    se.created_at
  FROM stat_entries se
  WHERE se.profile_id = p_profile_id
    AND (
      -- Grace period: Saturday 20:00-23:59 UTC (4-hour buffer)
      (se.entry_date = prev_saturday AND is_grace_period(se.created_at))
      OR
      -- Regular week: Sunday-Saturday
      (se.entry_date >= p_week_start AND se.entry_date <= week_end)
    )
  ORDER BY se.created_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. Update weekly leaderboard view
-- ============================================

CREATE OR REPLACE VIEW current_weekly_leaderboard AS
WITH weekly_stats AS (
  SELECT 
    p.id as profile_id,
    p.trainer_name,
    p.country,
    p.team_color,
    p.profile_screenshot_url,
    p.total_xp,
    p.pokemon_caught,
    p.distance_walked,
    p.pokestops_visited,
    (SELECT COUNT(*) FROM get_week_uploads(p.id, get_current_week_start())) as upload_count,
    (SELECT total_xp FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at ASC LIMIT 1) as first_xp,
    (SELECT total_xp FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) as latest_xp,
    (SELECT pokemon_caught FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at ASC LIMIT 1) as first_catches,
    (SELECT pokemon_caught FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) as latest_catches,
    (SELECT distance_walked FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at ASC LIMIT 1) as first_distance,
    (SELECT distance_walked FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) as latest_distance,
    (SELECT pokestops_visited FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at ASC LIMIT 1) as first_stops,
    (SELECT pokestops_visited FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) as latest_stops,
    (SELECT entry_date FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) as last_update
  FROM profiles p
  WHERE p.is_paid_user = true
    AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
    AND p.role = 'user'
    AND COALESCE(p.is_blocked, false) = false
)
SELECT 
  profile_id,
  trainer_name,
  country,
  team_color,
  profile_screenshot_url,
  COALESCE(latest_xp - first_xp, 0) as xp_delta,
  COALESCE(latest_catches - first_catches, 0) as catches_delta,
  COALESCE(latest_distance - first_distance, 0) as distance_delta,
  COALESCE(latest_stops - first_stops, 0) as pokestops_delta,
  total_xp,
  pokemon_caught,
  distance_walked,
  pokestops_visited,
  last_update,
  upload_count
FROM weekly_stats
WHERE upload_count >= 2  -- Must have 2+ uploads
ORDER BY xp_delta DESC;

-- Update the alias view
DROP VIEW IF EXISTS weekly_leaderboard;
CREATE VIEW weekly_leaderboard AS SELECT * FROM current_weekly_leaderboard;

-- ============================================
-- 6. Update complete_period function (weekly only)
-- ============================================

CREATE OR REPLACE FUNCTION complete_period(
  p_period_type TEXT,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS VOID AS $$
DECLARE
  period_boundary_id UUID;
  winner_record RECORD;
  rank_counter INTEGER := 1;
BEGIN
  INSERT INTO period_boundaries (period_type, period_start, period_end, is_completed, completed_at)
  VALUES (p_period_type, p_period_start, p_period_end, true, NOW())
  ON CONFLICT (period_type, period_start, period_end) 
  DO UPDATE SET is_completed = true, completed_at = NOW()
  RETURNING id INTO period_boundary_id;

  DELETE FROM period_winners WHERE period_boundary_id = period_boundary_id;

  IF p_period_type = 'weekly' THEN
    -- NEW WEEKLY LOGIC with grace period
    FOR winner_record IN
      WITH user_stats AS (
        SELECT 
          p.id as profile_id,
          p.trainer_name,
          p.country,
          p.team_color,
          p.profile_screenshot_url,
          (SELECT COUNT(*) FROM get_week_uploads(p.id, p_period_start)) as upload_count,
          (SELECT total_xp FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_xp,
          (SELECT total_xp FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_xp,
          (SELECT pokemon_caught FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_catches,
          (SELECT pokemon_caught FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_catches,
          (SELECT distance_walked FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_distance,
          (SELECT distance_walked FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_distance,
          (SELECT pokestops_visited FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_stops,
          (SELECT pokestops_visited FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_stops
        FROM profiles p
        WHERE p.is_paid_user = true
          AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
          AND p.role = 'user'
          AND COALESCE(p.is_blocked, false) = false
      )
      SELECT 
        profile_id,
        trainer_name,
        country,
        team_color,
        profile_screenshot_url,
        COALESCE(latest_xp - first_xp, 0) as xp_gained,
        COALESCE(latest_catches - first_catches, 0) as catches_gained,
        COALESCE(latest_distance - first_distance, 0) as distance_gained,
        COALESCE(latest_stops - first_stops, 0) as pokestops_gained
      FROM user_stats
      WHERE upload_count >= 2
      ORDER BY xp_gained DESC
      LIMIT 3
    LOOP
      INSERT INTO period_winners (
        period_boundary_id, period_type, period_start, period_end, rank,
        profile_id, trainer_name, country, team_color, profile_screenshot_url,
        xp_gained, catches_gained, distance_gained, pokestops_gained
      ) VALUES (
        period_boundary_id, p_period_type, p_period_start, p_period_end, rank_counter,
        winner_record.profile_id, winner_record.trainer_name, winner_record.country, 
        winner_record.team_color, winner_record.profile_screenshot_url,
        winner_record.xp_gained, winner_record.catches_gained, 
        winner_record.distance_gained, winner_record.pokestops_gained
      );
      rank_counter := rank_counter + 1;
    END LOOP;
  
  ELSIF p_period_type = 'monthly' THEN
    -- MONTHLY LOGIC (unchanged)
    FOR winner_record IN
      SELECT 
        p.id as profile_id,
        p.trainer_name,
        p.country,
        p.team_color,
        p.profile_screenshot_url,
        COALESCE(end_stats.total_xp - start_stats.total_xp, 0) as xp_gained,
        COALESCE(end_stats.pokemon_caught - start_stats.pokemon_caught, 0) as catches_gained,
        COALESCE(end_stats.distance_walked - start_stats.distance_walked, 0) as distance_gained,
        COALESCE(end_stats.pokestops_visited - start_stats.pokestops_visited, 0) as pokestops_gained
      FROM profiles p
      LEFT JOIN stat_entries start_stats ON p.id = start_stats.profile_id 
        AND start_stats.entry_date = p_period_start
      LEFT JOIN stat_entries end_stats ON p.id = end_stats.profile_id 
        AND end_stats.entry_date = (
          SELECT MAX(entry_date) FROM stat_entries se 
          WHERE se.profile_id = p.id AND se.entry_date <= p_period_end
        )
      WHERE p.is_paid_user = true
        AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
        AND p.role = 'user'
        AND COALESCE(p.is_blocked, false) = false
        AND end_stats.entry_date IS NOT NULL
      ORDER BY xp_gained DESC
      LIMIT 3
    LOOP
      INSERT INTO period_winners (
        period_boundary_id, period_type, period_start, period_end, rank,
        profile_id, trainer_name, country, team_color, profile_screenshot_url,
        xp_gained, catches_gained, distance_gained, pokestops_gained
      ) VALUES (
        period_boundary_id, p_period_type, p_period_start, p_period_end, rank_counter,
        winner_record.profile_id, winner_record.trainer_name, winner_record.country, 
        winner_record.team_color, winner_record.profile_screenshot_url,
        winner_record.xp_gained, winner_record.catches_gained, 
        winner_record.distance_gained, winner_record.pokestops_gained
      );
      rank_counter := rank_counter + 1;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. Update get_completed_period_leaderboard (weekly only)
-- ============================================

CREATE OR REPLACE FUNCTION get_completed_period_leaderboard(
  p_period_type TEXT,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS TABLE(
  rank INTEGER,
  profile_id UUID,
  trainer_name TEXT,
  country TEXT,
  team_color TEXT,
  profile_screenshot_url TEXT,
  xp_gained BIGINT,
  catches_gained INTEGER,
  distance_gained DECIMAL(10,2),
  pokestops_gained INTEGER,
  last_update DATE
) AS $$
BEGIN
  IF p_period_type = 'weekly' THEN
    -- NEW WEEKLY LOGIC
    RETURN QUERY
    WITH user_stats AS (
      SELECT 
        p.id as profile_id,
        p.trainer_name,
        p.country,
        p.team_color,
        p.profile_screenshot_url,
        (SELECT COUNT(*) FROM get_week_uploads(p.id, p_period_start)) as upload_count,
        (SELECT total_xp FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_xp,
        (SELECT total_xp FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_xp,
        (SELECT pokemon_caught FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_catches,
        (SELECT pokemon_caught FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_catches,
        (SELECT distance_walked FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_distance,
        (SELECT distance_walked FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_distance,
        (SELECT pokestops_visited FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_stops,
        (SELECT pokestops_visited FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_stops,
        (SELECT entry_date FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as last_entry
      FROM profiles p
      WHERE p.is_paid_user = true
        AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
        AND p.role = 'user'
        AND COALESCE(p.is_blocked, false) = false
    )
    SELECT 
      ROW_NUMBER() OVER (ORDER BY COALESCE(latest_xp - first_xp, 0) DESC)::INTEGER,
      profile_id,
      trainer_name,
      country,
      team_color,
      profile_screenshot_url,
      COALESCE(latest_xp - first_xp, 0),
      COALESCE(latest_catches - first_catches, 0),
      COALESCE(latest_distance - first_distance, 0),
      COALESCE(latest_stops - first_stops, 0),
      last_entry
    FROM user_stats
    WHERE upload_count >= 2
    ORDER BY xp_gained DESC;
    
  ELSE
    -- MONTHLY LOGIC (unchanged)
    RETURN QUERY
    SELECT 
      ROW_NUMBER() OVER (ORDER BY COALESCE(end_stats.total_xp - start_stats.total_xp, 0) DESC)::INTEGER,
      p.id,
      p.trainer_name,
      p.country,
      p.team_color,
      p.profile_screenshot_url,
      COALESCE(end_stats.total_xp - start_stats.total_xp, 0),
      COALESCE(end_stats.pokemon_caught - start_stats.pokemon_caught, 0),
      COALESCE(end_stats.distance_walked - start_stats.distance_walked, 0),
      COALESCE(end_stats.pokestops_visited - start_stats.pokestops_visited, 0),
      COALESCE(end_stats.entry_date, p.updated_at::date)
    FROM profiles p
    LEFT JOIN stat_entries start_stats ON p.id = start_stats.profile_id 
      AND start_stats.entry_date = p_period_start
    LEFT JOIN stat_entries end_stats ON p.id = end_stats.profile_id 
      AND end_stats.entry_date = (
        SELECT MAX(entry_date) FROM stat_entries se 
        WHERE se.profile_id = p.id AND se.entry_date <= p_period_end
      )
    WHERE p.is_paid_user = true
      AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
      AND p.role = 'user'
      AND COALESCE(p.is_blocked, false) = false
      AND end_stats.entry_date IS NOT NULL
    ORDER BY xp_gained DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Helper: Get valid uploads for current month (including grace period)
-- ============================================

CREATE OR REPLACE FUNCTION get_month_uploads(p_profile_id UUID, p_month_start DATE)
RETURNS TABLE(
  entry_date DATE,
  total_xp BIGINT,
  pokemon_caught INTEGER,
  distance_walked DECIMAL(10,2),
  pokestops_visited INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  prev_month_last_day DATE := p_month_start - 1;
  month_end DATE := (p_month_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
BEGIN
  RETURN QUERY
  SELECT 
    se.entry_date,
    se.total_xp,
    se.pokemon_caught,
    se.distance_walked,
    se.pokestops_visited,
    se.created_at
  FROM stat_entries se
  WHERE se.profile_id = p_profile_id
    AND (
      -- Grace period: Last 24 hours of previous month
      se.entry_date = prev_month_last_day
      OR
      -- Current month: 1st to last day
      (se.entry_date >= p_month_start AND se.entry_date <= month_end)
    )
  ORDER BY se.created_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. Update monthly leaderboard view
-- ============================================

CREATE OR REPLACE VIEW current_monthly_leaderboard AS
WITH monthly_stats AS (
  SELECT 
    p.id as profile_id,
    p.trainer_name,
    p.country,
    p.team_color,
    p.profile_screenshot_url,
    p.total_xp,
    p.pokemon_caught,
    p.distance_walked,
    p.pokestops_visited,
    (SELECT COUNT(*) FROM get_month_uploads(p.id, get_current_month_start())) as upload_count,
    (SELECT total_xp FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at ASC LIMIT 1) as first_xp,
    (SELECT total_xp FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) as latest_xp,
    (SELECT pokemon_caught FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at ASC LIMIT 1) as first_catches,
    (SELECT pokemon_caught FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) as latest_catches,
    (SELECT distance_walked FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at ASC LIMIT 1) as first_distance,
    (SELECT distance_walked FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) as latest_distance,
    (SELECT pokestops_visited FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at ASC LIMIT 1) as first_stops,
    (SELECT pokestops_visited FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) as latest_stops,
    (SELECT entry_date FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) as last_update
  FROM profiles p
  WHERE p.is_paid_user = true
    AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
    AND p.role = 'user'
    AND COALESCE(p.is_blocked, false) = false
)
SELECT 
  profile_id,
  trainer_name,
  country,
  team_color,
  profile_screenshot_url,
  COALESCE(latest_xp - first_xp, 0) as xp_delta,
  COALESCE(latest_catches - first_catches, 0) as catches_delta,
  COALESCE(latest_distance - first_distance, 0) as distance_delta,
  COALESCE(latest_stops - first_stops, 0) as pokestops_delta,
  total_xp,
  pokemon_caught,
  distance_walked,
  pokestops_visited,
  last_update,
  upload_count
FROM monthly_stats
WHERE upload_count >= 2  -- Must have 2+ uploads
ORDER BY xp_delta DESC;

-- Update the alias view
DROP VIEW IF EXISTS monthly_leaderboard;
CREATE VIEW monthly_leaderboard AS SELECT * FROM current_monthly_leaderboard;

-- ============================================
-- 10. Update complete_period function (add monthly logic)
-- ============================================

CREATE OR REPLACE FUNCTION complete_period(
  p_period_type TEXT,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS VOID AS $$
DECLARE
  period_boundary_id UUID;
  winner_record RECORD;
  rank_counter INTEGER := 1;
BEGIN
  INSERT INTO period_boundaries (period_type, period_start, period_end, is_completed, completed_at)
  VALUES (p_period_type, p_period_start, p_period_end, true, NOW())
  ON CONFLICT (period_type, period_start, period_end) 
  DO UPDATE SET is_completed = true, completed_at = NOW()
  RETURNING id INTO period_boundary_id;

  DELETE FROM period_winners WHERE period_boundary_id = period_boundary_id;

  IF p_period_type = 'weekly' THEN
    -- WEEKLY LOGIC with grace period
    FOR winner_record IN
      WITH user_stats AS (
        SELECT 
          p.id as profile_id,
          p.trainer_name,
          p.country,
          p.team_color,
          p.profile_screenshot_url,
          (SELECT COUNT(*) FROM get_week_uploads(p.id, p_period_start)) as upload_count,
          (SELECT total_xp FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_xp,
          (SELECT total_xp FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_xp,
          (SELECT pokemon_caught FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_catches,
          (SELECT pokemon_caught FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_catches,
          (SELECT distance_walked FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_distance,
          (SELECT distance_walked FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_distance,
          (SELECT pokestops_visited FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_stops,
          (SELECT pokestops_visited FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_stops
        FROM profiles p
        WHERE p.is_paid_user = true
          AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
          AND p.role = 'user'
          AND COALESCE(p.is_blocked, false) = false
      )
      SELECT 
        profile_id,
        trainer_name,
        country,
        team_color,
        profile_screenshot_url,
        COALESCE(latest_xp - first_xp, 0) as xp_gained,
        COALESCE(latest_catches - first_catches, 0) as catches_gained,
        COALESCE(latest_distance - first_distance, 0) as distance_gained,
        COALESCE(latest_stops - first_stops, 0) as pokestops_gained
      FROM user_stats
      WHERE upload_count >= 2
      ORDER BY xp_gained DESC
      LIMIT 3
    LOOP
      INSERT INTO period_winners (
        period_boundary_id, period_type, period_start, period_end, rank,
        profile_id, trainer_name, country, team_color, profile_screenshot_url,
        xp_gained, catches_gained, distance_gained, pokestops_gained
      ) VALUES (
        period_boundary_id, p_period_type, p_period_start, p_period_end, rank_counter,
        winner_record.profile_id, winner_record.trainer_name, winner_record.country, 
        winner_record.team_color, winner_record.profile_screenshot_url,
        winner_record.xp_gained, winner_record.catches_gained, 
        winner_record.distance_gained, winner_record.pokestops_gained
      );
      rank_counter := rank_counter + 1;
    END LOOP;
  
  ELSIF p_period_type = 'monthly' THEN
    -- MONTHLY LOGIC with grace period
    FOR winner_record IN
      WITH user_stats AS (
        SELECT 
          p.id as profile_id,
          p.trainer_name,
          p.country,
          p.team_color,
          p.profile_screenshot_url,
          (SELECT COUNT(*) FROM get_month_uploads(p.id, p_period_start)) as upload_count,
          (SELECT total_xp FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_xp,
          (SELECT total_xp FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_xp,
          (SELECT pokemon_caught FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_catches,
          (SELECT pokemon_caught FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_catches,
          (SELECT distance_walked FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_distance,
          (SELECT distance_walked FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_distance,
          (SELECT pokestops_visited FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_stops,
          (SELECT pokestops_visited FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_stops
        FROM profiles p
        WHERE p.is_paid_user = true
          AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
          AND p.role = 'user'
          AND COALESCE(p.is_blocked, false) = false
      )
      SELECT 
        profile_id,
        trainer_name,
        country,
        team_color,
        profile_screenshot_url,
        COALESCE(latest_xp - first_xp, 0) as xp_gained,
        COALESCE(latest_catches - first_catches, 0) as catches_gained,
        COALESCE(latest_distance - first_distance, 0) as distance_gained,
        COALESCE(latest_stops - first_stops, 0) as pokestops_gained
      FROM user_stats
      WHERE upload_count >= 2
      ORDER BY xp_gained DESC
      LIMIT 3
    LOOP
      INSERT INTO period_winners (
        period_boundary_id, period_type, period_start, period_end, rank,
        profile_id, trainer_name, country, team_color, profile_screenshot_url,
        xp_gained, catches_gained, distance_gained, pokestops_gained
      ) VALUES (
        period_boundary_id, p_period_type, p_period_start, p_period_end, rank_counter,
        winner_record.profile_id, winner_record.trainer_name, winner_record.country, 
        winner_record.team_color, winner_record.profile_screenshot_url,
        winner_record.xp_gained, winner_record.catches_gained, 
        winner_record.distance_gained, winner_record.pokestops_gained
      );
      rank_counter := rank_counter + 1;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. Update get_completed_period_leaderboard (add monthly logic)
-- ============================================

CREATE OR REPLACE FUNCTION get_completed_period_leaderboard(
  p_period_type TEXT,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS TABLE(
  rank INTEGER,
  profile_id UUID,
  trainer_name TEXT,
  country TEXT,
  team_color TEXT,
  profile_screenshot_url TEXT,
  xp_gained BIGINT,
  catches_gained INTEGER,
  distance_gained DECIMAL(10,2),
  pokestops_gained INTEGER,
  last_update DATE
) AS $$
BEGIN
  IF p_period_type = 'weekly' THEN
    -- WEEKLY LOGIC
    RETURN QUERY
    WITH user_stats AS (
      SELECT 
        p.id as profile_id,
        p.trainer_name,
        p.country,
        p.team_color,
        p.profile_screenshot_url,
        (SELECT COUNT(*) FROM get_week_uploads(p.id, p_period_start)) as upload_count,
        (SELECT total_xp FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_xp,
        (SELECT total_xp FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_xp,
        (SELECT pokemon_caught FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_catches,
        (SELECT pokemon_caught FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_catches,
        (SELECT distance_walked FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_distance,
        (SELECT distance_walked FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_distance,
        (SELECT pokestops_visited FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_stops,
        (SELECT pokestops_visited FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_stops,
        (SELECT entry_date FROM get_week_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as last_entry
      FROM profiles p
      WHERE p.is_paid_user = true
        AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
        AND p.role = 'user'
        AND COALESCE(p.is_blocked, false) = false
    )
    SELECT 
      ROW_NUMBER() OVER (ORDER BY COALESCE(latest_xp - first_xp, 0) DESC)::INTEGER,
      profile_id,
      trainer_name,
      country,
      team_color,
      profile_screenshot_url,
      COALESCE(latest_xp - first_xp, 0),
      COALESCE(latest_catches - first_catches, 0),
      COALESCE(latest_distance - first_distance, 0),
      COALESCE(latest_stops - first_stops, 0),
      last_entry
    FROM user_stats
    WHERE upload_count >= 2
    ORDER BY xp_gained DESC;
    
  ELSE
    -- MONTHLY LOGIC
    RETURN QUERY
    WITH user_stats AS (
      SELECT 
        p.id as profile_id,
        p.trainer_name,
        p.country,
        p.team_color,
        p.profile_screenshot_url,
        (SELECT COUNT(*) FROM get_month_uploads(p.id, p_period_start)) as upload_count,
        (SELECT total_xp FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_xp,
        (SELECT total_xp FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_xp,
        (SELECT pokemon_caught FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_catches,
        (SELECT pokemon_caught FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_catches,
        (SELECT distance_walked FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_distance,
        (SELECT distance_walked FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_distance,
        (SELECT pokestops_visited FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at ASC LIMIT 1) as first_stops,
        (SELECT pokestops_visited FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as latest_stops,
        (SELECT entry_date FROM get_month_uploads(p.id, p_period_start) ORDER BY created_at DESC LIMIT 1) as last_entry
      FROM profiles p
      WHERE p.is_paid_user = true
        AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
        AND p.role = 'user'
        AND COALESCE(p.is_blocked, false) = false
    )
    SELECT 
      ROW_NUMBER() OVER (ORDER BY COALESCE(latest_xp - first_xp, 0) DESC)::INTEGER,
      profile_id,
      trainer_name,
      country,
      team_color,
      profile_screenshot_url,
      COALESCE(latest_xp - first_xp, 0),
      COALESCE(latest_catches - first_catches, 0),
      COALESCE(latest_distance - first_distance, 0),
      COALESCE(latest_stops - first_stops, 0),
      last_entry
    FROM user_stats
    WHERE upload_count >= 2
    ORDER BY xp_gained DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Migration Complete
-- ============================================
-- 
-- WEEKLY:
-- ✓ Week starts Sunday (was Monday)
-- ✓ Saturday 20:00-23:59 UTC grace period (4 hours)
-- ✓ Minimum 2 uploads required
-- 
-- MONTHLY:
-- ✓ Last 24 hours of previous month grace period
-- ✓ Minimum 2 uploads required
-- ✓ Handles variable month lengths & leap years
-- 
-- BOTH:
-- ✓ Delta = latest - first upload
-- ✓ Blocked users excluded
-- ✓ Live updates
-- ============================================
