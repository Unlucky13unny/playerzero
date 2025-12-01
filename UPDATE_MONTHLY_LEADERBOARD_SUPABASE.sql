-- Updated current_monthly_leaderboard view with GREATEST() to prevent negative deltas
-- This is the EXACT view that exists in your Supabase database

CREATE OR REPLACE VIEW public.current_monthly_leaderboard AS
WITH monthly_stats AS (
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
      FROM get_month_uploads(p.id, get_current_month_start()) get_month_uploads(
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
      SELECT get_month_uploads.total_xp
      FROM get_month_uploads(p.id, get_current_month_start()) get_month_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_month_uploads.created_at ASC
      LIMIT 1
    ) AS first_xp,
    (
      SELECT get_month_uploads.total_xp
      FROM get_month_uploads(p.id, get_current_month_start()) get_month_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_month_uploads.created_at DESC
      LIMIT 1
    ) AS latest_xp,
    (
      SELECT get_month_uploads.pokemon_caught
      FROM get_month_uploads(p.id, get_current_month_start()) get_month_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_month_uploads.created_at ASC
      LIMIT 1
    ) AS first_catches,
    (
      SELECT get_month_uploads.pokemon_caught
      FROM get_month_uploads(p.id, get_current_month_start()) get_month_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_month_uploads.created_at DESC
      LIMIT 1
    ) AS latest_catches,
    (
      SELECT get_month_uploads.distance_walked
      FROM get_month_uploads(p.id, get_current_month_start()) get_month_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_month_uploads.created_at ASC
      LIMIT 1
    ) AS first_distance,
    (
      SELECT get_month_uploads.distance_walked
      FROM get_month_uploads(p.id, get_current_month_start()) get_month_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_month_uploads.created_at DESC
      LIMIT 1
    ) AS latest_distance,
    (
      SELECT get_month_uploads.pokestops_visited
      FROM get_month_uploads(p.id, get_current_month_start()) get_month_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_month_uploads.created_at ASC
      LIMIT 1
    ) AS first_stops,
    (
      SELECT get_month_uploads.pokestops_visited
      FROM get_month_uploads(p.id, get_current_month_start()) get_month_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_month_uploads.created_at DESC
      LIMIT 1
    ) AS latest_stops,
    (
      SELECT get_month_uploads.unique_pokedex_entries
      FROM get_month_uploads(p.id, get_current_month_start()) get_month_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_month_uploads.created_at ASC
      LIMIT 1
    ) AS first_dex,
    (
      SELECT get_month_uploads.unique_pokedex_entries
      FROM get_month_uploads(p.id, get_current_month_start()) get_month_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_month_uploads.created_at DESC
      LIMIT 1
    ) AS latest_dex,
    (
      SELECT get_month_uploads.entry_date
      FROM get_month_uploads(p.id, get_current_month_start()) get_month_uploads(
        entry_date,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        created_at
      )
      ORDER BY get_month_uploads.created_at DESC
      LIMIT 1
    ) AS last_update
  FROM profiles p
  WHERE p.is_paid_user = TRUE
    AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
    AND p.role = 'user'::TEXT
    AND COALESCE(p.is_blocked, FALSE) = FALSE
)
SELECT
  monthly_stats.profile_id,
  monthly_stats.trainer_name,
  monthly_stats.country,
  monthly_stats.team_color,
  monthly_stats.profile_screenshot_url,
  -- ✅ GREATEST() prevents negative deltas
  GREATEST(COALESCE(monthly_stats.latest_xp - monthly_stats.first_xp, 0::BIGINT), 0) AS xp_delta,
  GREATEST(COALESCE(monthly_stats.latest_catches - monthly_stats.first_catches, 0), 0) AS catches_delta,
  GREATEST(COALESCE(monthly_stats.latest_distance - monthly_stats.first_distance, 0::NUMERIC), 0) AS distance_delta,
  GREATEST(COALESCE(monthly_stats.latest_stops - monthly_stats.first_stops, 0), 0) AS pokestops_delta,
  GREATEST(COALESCE(monthly_stats.latest_dex - monthly_stats.first_dex, 0), 0) AS dex_delta,
  monthly_stats.total_xp,
  monthly_stats.pokemon_caught,
  monthly_stats.distance_walked,
  monthly_stats.pokestops_visited,
  monthly_stats.unique_pokedex_entries,
  monthly_stats.last_update,
  monthly_stats.upload_count
FROM monthly_stats
WHERE monthly_stats.upload_count >= 2
ORDER BY (GREATEST(COALESCE(monthly_stats.latest_xp - monthly_stats.first_xp, 0::BIGINT), 0)) DESC;

