-- Updated current_weekly_leaderboard view with GREATEST() to prevent negative deltas
-- This is the EXACT view that exists in your Supabase database

CREATE OR REPLACE VIEW public.current_weekly_leaderboard AS
WITH weekly_stats AS (
  SELECT
    p.id AS profile_id,
    p.trainer_name,
    p.country,
    p.team_color,
    p.profile_screenshot_url,
    p.total_xp,
    p.pokemon_caught,
    p.distance_walked,
    p.pokestops_visited,
    p.unique_pokedex_entries,
    (
      SELECT COUNT(*) AS count
      FROM get_week_uploads(p.id, get_current_week_start()) get_week_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
    ) AS upload_count,
    (
      SELECT get_week_uploads.total_xp
      FROM get_week_uploads(p.id, get_current_week_start()) get_week_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_week_uploads.created_at
      LIMIT 1
    ) AS first_xp,
    (
      SELECT get_week_uploads.total_xp
      FROM get_week_uploads(p.id, get_current_week_start()) get_week_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_week_uploads.created_at DESC
      LIMIT 1
    ) AS latest_xp,
    (
      SELECT get_week_uploads.pokemon_caught
      FROM get_week_uploads(p.id, get_current_week_start()) get_week_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_week_uploads.created_at
      LIMIT 1
    ) AS first_catches,
    (
      SELECT get_week_uploads.pokemon_caught
      FROM get_week_uploads(p.id, get_current_week_start()) get_week_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_week_uploads.created_at DESC
      LIMIT 1
    ) AS latest_catches,
    (
      SELECT get_week_uploads.distance_walked
      FROM get_week_uploads(p.id, get_current_week_start()) get_week_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_week_uploads.created_at
      LIMIT 1
    ) AS first_distance,
    (
      SELECT get_week_uploads.distance_walked
      FROM get_week_uploads(p.id, get_current_week_start()) get_week_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_week_uploads.created_at DESC
      LIMIT 1
    ) AS latest_distance,
    (
      SELECT get_week_uploads.pokestops_visited
      FROM get_week_uploads(p.id, get_current_week_start()) get_week_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_week_uploads.created_at
      LIMIT 1
    ) AS first_stops,
    (
      SELECT get_week_uploads.pokestops_visited
      FROM get_week_uploads(p.id, get_current_week_start()) get_week_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_week_uploads.created_at DESC
      LIMIT 1
    ) AS latest_stops,
    (
      SELECT get_week_uploads.unique_pokedex_entries
      FROM get_week_uploads(p.id, get_current_week_start()) get_week_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_week_uploads.created_at
      LIMIT 1
    ) AS first_dex,
    (
      SELECT get_week_uploads.unique_pokedex_entries
      FROM get_week_uploads(p.id, get_current_week_start()) get_week_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_week_uploads.created_at DESC
      LIMIT 1
    ) AS latest_dex,
    (
      SELECT get_week_uploads.entry_date
      FROM get_week_uploads(p.id, get_current_week_start()) get_week_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_week_uploads.created_at DESC
      LIMIT 1
    ) AS last_update
  FROM profiles p
  WHERE p.is_paid_user = TRUE
    AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
    AND p.role = 'user'::TEXT
    AND COALESCE(p.is_blocked, FALSE) = FALSE
)
SELECT
  weekly_stats.profile_id,
  weekly_stats.trainer_name,
  weekly_stats.country,
  weekly_stats.team_color,
  weekly_stats.profile_screenshot_url,
  -- ✅ GREATEST() prevents negative deltas
  GREATEST(COALESCE(weekly_stats.latest_xp - weekly_stats.first_xp, 0::BIGINT), 0) AS xp_delta,
  GREATEST(COALESCE(weekly_stats.latest_catches - weekly_stats.first_catches, 0), 0) AS catches_delta,
  GREATEST(COALESCE(weekly_stats.latest_distance - weekly_stats.first_distance, 0::NUMERIC), 0) AS distance_delta,
  GREATEST(COALESCE(weekly_stats.latest_stops - weekly_stats.first_stops, 0), 0) AS pokestops_delta,
  GREATEST(COALESCE(weekly_stats.latest_dex - weekly_stats.first_dex, 0), 0) AS dex_delta,
  weekly_stats.total_xp,
  weekly_stats.pokemon_caught,
  weekly_stats.distance_walked,
  weekly_stats.pokestops_visited,
  weekly_stats.unique_pokedex_entries,
  weekly_stats.last_update,
  weekly_stats.upload_count
FROM weekly_stats
WHERE weekly_stats.upload_count >= 2
ORDER BY (GREATEST(COALESCE(weekly_stats.latest_xp - weekly_stats.first_xp, 0::BIGINT), 0)) DESC;

