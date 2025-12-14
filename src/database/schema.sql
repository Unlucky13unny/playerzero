-- Create profiles table to store trainer profile data
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trainer Information
  trainer_name TEXT NOT NULL,
  trainer_code TEXT NOT NULL,
  trainer_code_private BOOLEAN DEFAULT false,
  social_links_private BOOLEAN DEFAULT false,
  trainer_level INTEGER NOT NULL CHECK (trainer_level >= 1 AND trainer_level <= 80),
  start_date DATE DEFAULT CURRENT_DATE,
  country TEXT,
  team_color TEXT,
  average_daily_xp INTEGER DEFAULT 0,
  last_name_change_date TIMESTAMP WITH TIME ZONE,
  is_profile_setup BOOLEAN DEFAULT false,
  
  -- Subscription Status
  is_paid_user BOOLEAN DEFAULT false,
  subscription_type TEXT, -- 'monthly', 'yearly', 'lifetime', etc.
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- User Role
  role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  
  -- Core Statistics
  distance_walked DECIMAL(10,2) DEFAULT 0,
  pokemon_caught INTEGER DEFAULT 0,
  pokestops_visited INTEGER DEFAULT 0,
  total_xp BIGINT DEFAULT 0,
  unique_pokedex_entries INTEGER DEFAULT 0 CHECK (unique_pokedex_entries >= 0 AND unique_pokedex_entries <= 1000),
  
  -- Profile Screenshot
  profile_screenshot_url TEXT,
  
  -- Social Media (optional)
  instagram TEXT,
  tiktok TEXT,
  twitter TEXT,
  youtube TEXT,
  twitch TEXT,
  reddit TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one profile per user
  UNIQUE(user_id)
);

-- Create stat_entries table to track stats over time
CREATE TABLE stat_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Stats snapshot at this point in time
  distance_walked DECIMAL(10,2) NOT NULL DEFAULT 0,
  pokemon_caught INTEGER NOT NULL DEFAULT 0,
  pokestops_visited INTEGER NOT NULL DEFAULT 0,
  total_xp BIGINT NOT NULL DEFAULT 0,
  unique_pokedex_entries INTEGER NOT NULL DEFAULT 0,
  trainer_level INTEGER NOT NULL DEFAULT 1,
  
  -- Entry metadata
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate entries for same user on same date
  UNIQUE(user_id, entry_date)
);

-- Create notifications table
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  message text not null,
  notification_type text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_read boolean default false not null
);

-- Create index for faster queries
create index notifications_user_id_idx on notifications(user_id);

-- Enable RLS
alter table notifications enable row level security;

-- Create policies
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on notifications for insert
  with check (true);

create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on notifications for delete
  using (auth.uid() = user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stat_entries ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- All authenticated users can view public profile data (for leaderboards/community)
CREATE POLICY "Public profiles are viewable" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile" ON profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for stat_entries
-- Users can view their own stat entries
CREATE POLICY "Users can view their own stat entries" ON stat_entries
  FOR SELECT USING (auth.uid() = user_id);

-- All authenticated users can view public stat entries (for leaderboards)
CREATE POLICY "Public stat entries are viewable" ON stat_entries
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can insert their own stat entries
CREATE POLICY "Users can insert their own stat entries" ON stat_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own stat entries
CREATE POLICY "Users can update their own stat entries" ON stat_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own stat entries
CREATE POLICY "Users can delete their own stat entries" ON stat_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create stat entry when profile is updated
CREATE OR REPLACE FUNCTION create_stat_entry_on_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create entry if stats have changed
  IF (OLD.distance_walked != NEW.distance_walked OR 
      OLD.pokemon_caught != NEW.pokemon_caught OR 
      OLD.pokestops_visited != NEW.pokestops_visited OR 
      OLD.total_xp != NEW.total_xp OR 
      OLD.unique_pokedex_entries != NEW.unique_pokedex_entries OR
      OLD.trainer_level != NEW.trainer_level) THEN
    
    INSERT INTO stat_entries (
      user_id, profile_id, distance_walked, pokemon_caught, 
      pokestops_visited, total_xp, unique_pokedex_entries, trainer_level
    ) VALUES (
      NEW.user_id, NEW.id, NEW.distance_walked, NEW.pokemon_caught,
      NEW.pokestops_visited, NEW.total_xp, NEW.unique_pokedex_entries, NEW.trainer_level
    ) ON CONFLICT (user_id, entry_date) DO UPDATE SET
      distance_walked = EXCLUDED.distance_walked,
      pokemon_caught = EXCLUDED.pokemon_caught,
      pokestops_visited = EXCLUDED.pokestops_visited,
      total_xp = EXCLUDED.total_xp,
      unique_pokedex_entries = EXCLUDED.unique_pokedex_entries,
      trainer_level = EXCLUDED.trainer_level;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create stat entry on profile update
CREATE TRIGGER create_stat_entry_on_profile_update
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_stat_entry_on_profile_update();

-- Function to create initial stat entry when profile is created
CREATE OR REPLACE FUNCTION create_initial_stat_entry()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO stat_entries (
    user_id, profile_id, distance_walked, pokemon_caught, 
    pokestops_visited, total_xp, unique_pokedex_entries, trainer_level
  ) VALUES (
    NEW.user_id, NEW.id, NEW.distance_walked, NEW.pokemon_caught,
    NEW.pokestops_visited, NEW.total_xp, NEW.unique_pokedex_entries, NEW.trainer_level
  );
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create initial stat entry on profile creation
CREATE TRIGGER create_initial_stat_entry
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_stat_entry();

-- Function to calculate and update average daily XP
CREATE OR REPLACE FUNCTION calculate_average_daily_xp()
RETURNS TRIGGER AS $$
DECLARE
  oldest_entry_date DATE;
  xp_gain BIGINT;
  days_between INTEGER;
BEGIN
  -- Get the oldest stat entry for this user
  SELECT MIN(entry_date) INTO oldest_entry_date
  FROM stat_entries
  WHERE user_id = NEW.user_id;

  -- If we have at least 2 days of data
  IF oldest_entry_date IS NOT NULL AND oldest_entry_date < CURRENT_DATE THEN
    -- Calculate total XP gain
    xp_gain := NEW.total_xp - (
      SELECT total_xp 
      FROM stat_entries 
      WHERE user_id = NEW.user_id 
      AND entry_date = oldest_entry_date
    );
    
    -- Calculate days between
    days_between := CURRENT_DATE - oldest_entry_date;
    
    -- Update average daily XP if we have valid data
    IF days_between > 0 THEN
      NEW.average_daily_xp := GREATEST(xp_gain / days_between, 0);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update average daily XP before profile update
CREATE TRIGGER update_average_daily_xp
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_average_daily_xp();

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_trainer_name ON profiles(trainer_name);
CREATE INDEX idx_profiles_country ON profiles(country);
CREATE INDEX idx_profiles_team_color ON profiles(team_color);
CREATE INDEX idx_profiles_total_xp ON profiles(total_xp);
CREATE INDEX idx_profiles_pokemon_caught ON profiles(pokemon_caught);

CREATE INDEX idx_stat_entries_user_id ON stat_entries(user_id);
CREATE INDEX idx_stat_entries_profile_id ON stat_entries(profile_id);
CREATE INDEX idx_stat_entries_entry_date ON stat_entries(entry_date);
CREATE INDEX idx_stat_entries_total_xp ON stat_entries(total_xp);
CREATE INDEX idx_stat_entries_pokemon_caught ON stat_entries(pokemon_caught);

-- Create table to track period boundaries and completed periods
CREATE TABLE period_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure no overlapping periods for same type
  UNIQUE(period_type, period_start, period_end)
);

-- Create table to store historical period winners
CREATE TABLE period_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_boundary_id UUID NOT NULL REFERENCES period_boundaries(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  rank INTEGER NOT NULL CHECK (rank >= 1 AND rank <= 3),
  
  -- Winner details
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_name TEXT NOT NULL,
  country TEXT,
  team_color TEXT,
  profile_screenshot_url TEXT,
  
  -- Stats for the period
  xp_gained BIGINT NOT NULL DEFAULT 0,
  catches_gained INTEGER NOT NULL DEFAULT 0,
  distance_gained DECIMAL(10,2) NOT NULL DEFAULT 0,
  pokestops_gained INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique rank per period
  UNIQUE(period_boundary_id, rank)
);

-- Create table to store verification screenshots for stat updates
CREATE TABLE stat_verification_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stat_entry_id UUID NOT NULL REFERENCES stat_entries(id) ON DELETE CASCADE,
  
  -- Screenshot details
  screenshot_url TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one screenshot per stat entry
  UNIQUE(stat_entry_id)
);

-- Create indexes for better performance
CREATE INDEX idx_period_boundaries_type_date ON period_boundaries(period_type, period_start, period_end);
CREATE INDEX idx_period_boundaries_completed ON period_boundaries(period_type, is_completed);
CREATE INDEX idx_period_winners_period_type ON period_winners(period_type, period_start, period_end);
CREATE INDEX idx_period_winners_rank ON period_winners(period_boundary_id, rank);
CREATE INDEX idx_stat_verification_screenshots_user_id ON stat_verification_screenshots(user_id);
CREATE INDEX idx_stat_verification_screenshots_entry_date ON stat_verification_screenshots(entry_date);
CREATE INDEX idx_stat_verification_screenshots_stat_entry_id ON stat_verification_screenshots(stat_entry_id);

-- Function to get the start of current week (Sunday 00:00 UTC)
CREATE OR REPLACE FUNCTION get_current_week_start()
RETURNS DATE AS $$
BEGIN
  -- Returns Sunday 00:00 UTC (DOW 0=Sunday)
  -- DOW: 0=Sunday, 1=Monday, 2=Tuesday, etc.
  RETURN CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to get the start of current month (1st day 00:00 UTC)
CREATE OR REPLACE FUNCTION get_current_month_start()
RETURNS DATE AS $$
BEGIN
  RETURN DATE_TRUNC('month', CURRENT_DATE)::DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to get the last completed week period (Sunday to Saturday)
CREATE OR REPLACE FUNCTION get_last_completed_week()
RETURNS TABLE(period_start DATE, period_end DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (get_current_week_start() - INTERVAL '7 days')::DATE AS period_start,
    (get_current_week_start() - INTERVAL '1 day')::DATE AS period_end;
END;
$$ LANGUAGE plpgsql;

-- Function to get the last completed month period
CREATE OR REPLACE FUNCTION get_last_completed_month()
RETURNS TABLE(period_start DATE, period_end DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month')::DATE AS period_start,
    (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day')::DATE AS period_end;
END;
$$ LANGUAGE plpgsql;

-- Updated weekly leaderboard view for current period
-- Only shows users who have uploaded data during the current week (minimum 2 uploads)
-- Respects is_free_mode feature flag
CREATE OR REPLACE VIEW current_weekly_leaderboard AS
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
    (SELECT COUNT(*) FROM get_week_uploads(p.id, get_current_week_start())) AS upload_count,
    (SELECT total_xp FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at LIMIT 1) AS first_xp,
    (SELECT pokemon_caught FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at LIMIT 1) AS first_catches,
    (SELECT distance_walked FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at LIMIT 1) AS first_distance,
    (SELECT pokestops_visited FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at LIMIT 1) AS first_stops,
    (SELECT unique_pokedex_entries FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at LIMIT 1) AS first_dex,
    (SELECT total_xp FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) AS latest_xp,
    (SELECT pokemon_caught FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) AS latest_catches,
    (SELECT distance_walked FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) AS latest_distance,
    (SELECT pokestops_visited FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) AS latest_stops,
    (SELECT unique_pokedex_entries FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) AS latest_dex,
    (SELECT entry_date FROM get_week_uploads(p.id, get_current_week_start()) ORDER BY created_at DESC LIMIT 1) AS last_update
  FROM profiles p
  WHERE p.role = 'user'
    AND COALESCE(p.is_blocked, false) = false
    AND (
      (SELECT value FROM feature_flags WHERE key = 'is_free_mode' LIMIT 1) = true
      OR
      (
        p.is_paid_user = true
        AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
      )
    )
)
SELECT
  weekly_stats.profile_id,
  weekly_stats.trainer_name,
  weekly_stats.country,
  weekly_stats.team_color,
  weekly_stats.profile_screenshot_url,
  GREATEST(COALESCE(weekly_stats.latest_xp - weekly_stats.first_xp, 0), 0) AS xp_delta,
  GREATEST(COALESCE(weekly_stats.latest_catches - weekly_stats.first_catches, 0), 0) AS catches_delta,
  GREATEST(COALESCE(weekly_stats.latest_distance - weekly_stats.first_distance, 0), 0) AS distance_delta,
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
ORDER BY xp_delta DESC NULLS LAST;

-- Updated monthly leaderboard view for current period
-- Only shows users who have uploaded data during the current month (minimum 2 uploads)
-- Respects is_free_mode feature flag
CREATE OR REPLACE VIEW current_monthly_leaderboard AS
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
    (SELECT COUNT(*) FROM get_month_uploads(p.id, get_current_month_start())) AS upload_count,
    (SELECT total_xp FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at LIMIT 1) AS first_xp,
    (SELECT pokemon_caught FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at LIMIT 1) AS first_catches,
    (SELECT distance_walked FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at LIMIT 1) AS first_distance,
    (SELECT pokestops_visited FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at LIMIT 1) AS first_stops,
    (SELECT unique_pokedex_entries FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at LIMIT 1) AS first_dex,
    (SELECT total_xp FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) AS latest_xp,
    (SELECT pokemon_caught FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) AS latest_catches,
    (SELECT distance_walked FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) AS latest_distance,
    (SELECT pokestops_visited FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) AS latest_stops,
    (SELECT unique_pokedex_entries FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) AS latest_dex,
    (SELECT entry_date FROM get_month_uploads(p.id, get_current_month_start()) ORDER BY created_at DESC LIMIT 1) AS last_update
  FROM profiles p
  WHERE p.role = 'user'
    AND COALESCE(p.is_blocked, false) = false
    AND (
      (SELECT value FROM feature_flags WHERE key = 'is_free_mode' LIMIT 1) = true
      OR
      (
        p.is_paid_user = true
        AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
      )
    )
)
SELECT
  monthly_stats.profile_id,
  monthly_stats.trainer_name,
  monthly_stats.country,
  monthly_stats.team_color,
  monthly_stats.profile_screenshot_url,
  GREATEST(COALESCE(monthly_stats.latest_xp - monthly_stats.first_xp, 0), 0) AS xp_delta,
  GREATEST(COALESCE(monthly_stats.latest_catches - monthly_stats.first_catches, 0), 0) AS catches_delta,
  GREATEST(COALESCE(monthly_stats.latest_distance - monthly_stats.first_distance, 0), 0) AS distance_delta,
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
ORDER BY xp_delta DESC NULLS LAST;

-- View for last completed week winners
CREATE OR REPLACE VIEW last_week_winners AS
SELECT 
  pw.rank,
  pw.trainer_name,
  pw.country,
  pw.team_color,
  pw.profile_screenshot_url,
  pw.xp_gained,
  pw.catches_gained,
  pw.distance_gained,
  pw.pokestops_gained,
  pw.period_start,
  pw.period_end
FROM period_winners pw
JOIN period_boundaries pb ON pw.period_boundary_id = pb.id
WHERE pw.period_type = 'weekly'
  AND pb.is_completed = true
  AND pw.period_start = (SELECT period_start FROM get_last_completed_week())
  AND pw.period_end = (SELECT period_end FROM get_last_completed_week())
ORDER BY pw.rank;

-- View for last completed month winners  
CREATE OR REPLACE VIEW last_month_winners AS
SELECT 
  pw.rank,
  pw.trainer_name,
  pw.country,
  pw.team_color,
  pw.profile_screenshot_url,
  pw.xp_gained,
  pw.catches_gained,
  pw.distance_gained,
  pw.pokestops_gained,
  pw.period_start,
  pw.period_end
FROM period_winners pw
JOIN period_boundaries pb ON pw.period_boundary_id = pb.id
WHERE pw.period_type = 'monthly'
  AND pb.is_completed = true
  AND pw.period_start = (SELECT period_start FROM get_last_completed_month())
  AND pw.period_end = (SELECT period_end FROM get_last_completed_month())
ORDER BY pw.rank;

-- Replace the old weekly_leaderboard view to point to current period
DROP VIEW IF EXISTS weekly_leaderboard;
CREATE VIEW weekly_leaderboard AS SELECT * FROM current_weekly_leaderboard;

-- Replace the old monthly_leaderboard view to point to current period  
DROP VIEW IF EXISTS monthly_leaderboard;
CREATE VIEW monthly_leaderboard AS SELECT * FROM current_monthly_leaderboard;

-- Views for leaderboards and analytics
-- Respects is_free_mode feature flag
CREATE OR REPLACE VIEW all_time_leaderboard AS
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
  p.unique_pokedex_entries,
  p.updated_at as last_update
FROM profiles p
WHERE p.role = 'user'
  AND COALESCE(p.is_blocked, false) = false
  AND (
    -- If free mode is enabled, show all users
    (SELECT value FROM feature_flags WHERE key = 'is_free_mode' LIMIT 1) = true
    OR
    -- Otherwise, only show paid users with active subscriptions
    (
      p.is_paid_user = true
      AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
    )
  )
ORDER BY p.total_xp DESC; 

-- Function to complete a period and record the top 3 winners
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
  -- First, create or get the period boundary
  INSERT INTO period_boundaries (period_type, period_start, period_end, is_completed, completed_at)
  VALUES (p_period_type, p_period_start, p_period_end, true, NOW())
  ON CONFLICT (period_type, period_start, period_end) 
  DO UPDATE SET is_completed = true, completed_at = NOW()
  RETURNING id INTO period_boundary_id;

  -- Delete existing winners for this period (in case of recompute)
  DELETE FROM period_winners WHERE period_boundary_id = period_boundary_id;

  -- Get top 3 winners for the completed period and insert them
  IF p_period_type = 'weekly' THEN
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
          SELECT MAX(entry_date) 
          FROM stat_entries se 
          WHERE se.profile_id = p.id 
          AND se.entry_date <= p_period_end
        )
      WHERE p.is_paid_user = true
        AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
        AND p.role = 'user'
        AND end_stats.entry_date IS NOT NULL
      ORDER BY (COALESCE(end_stats.total_xp - start_stats.total_xp, 0)) DESC
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
          SELECT MAX(entry_date) 
          FROM stat_entries se 
          WHERE se.profile_id = p.id 
          AND se.entry_date <= p_period_end
        )
      WHERE p.is_paid_user = true
        AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
        AND p.role = 'user'
        AND end_stats.entry_date IS NOT NULL
      ORDER BY (COALESCE(end_stats.total_xp - start_stats.total_xp, 0)) DESC
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

  RAISE NOTICE 'Completed % period from % to % with % winners', 
    p_period_type, p_period_start, p_period_end, rank_counter - 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if current periods need to be completed
CREATE OR REPLACE FUNCTION check_and_complete_periods()
RETURNS VOID AS $$
DECLARE
  last_week_start DATE;
  last_week_end DATE;
  last_month_start DATE;
  last_month_end DATE;
BEGIN
  -- Get last completed week period
  SELECT period_start, period_end INTO last_week_start, last_week_end
  FROM get_last_completed_week();

  -- Get last completed month period  
  SELECT period_start, period_end INTO last_month_start, last_month_end
  FROM get_last_completed_month();

  -- Check if last week is already completed
  IF NOT EXISTS (
    SELECT 1 FROM period_boundaries 
    WHERE period_type = 'weekly' 
    AND period_start = last_week_start 
    AND period_end = last_week_end 
    AND is_completed = true
  ) THEN
    -- Complete last week
    PERFORM complete_period('weekly', last_week_start, last_week_end);
  END IF;

  -- Check if last month is already completed
  IF NOT EXISTS (
    SELECT 1 FROM period_boundaries 
    WHERE period_type = 'monthly' 
    AND period_start = last_month_start 
    AND period_end = last_month_end 
    AND is_completed = true
  ) THEN
    -- Complete last month
    PERFORM complete_period('monthly', last_month_start, last_month_end);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get completed period leaderboard (for viewing finalized results)
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
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY 
      COALESCE(end_stats.total_xp - start_stats.total_xp, 0) DESC
    )::INTEGER as rank,
    p.id as profile_id,
    p.trainer_name,
    p.country,
    p.team_color,
    p.profile_screenshot_url,
    COALESCE(end_stats.total_xp - start_stats.total_xp, 0) as xp_gained,
    COALESCE(end_stats.pokemon_caught - start_stats.pokemon_caught, 0) as catches_gained,
    COALESCE(end_stats.distance_walked - start_stats.distance_walked, 0) as distance_gained,
    COALESCE(end_stats.pokestops_visited - start_stats.pokestops_visited, 0) as pokestops_gained,
    COALESCE(end_stats.entry_date, p.updated_at::date) as last_update
  FROM profiles p
  LEFT JOIN stat_entries start_stats ON p.id = start_stats.profile_id 
    AND start_stats.entry_date = p_period_start
  LEFT JOIN stat_entries end_stats ON p.id = end_stats.profile_id 
    AND end_stats.entry_date = (
      SELECT MAX(entry_date) 
      FROM stat_entries se 
      WHERE se.profile_id = p.id 
      AND se.entry_date <= p_period_end
    )
  WHERE p.is_paid_user = true
    AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
    AND p.role = 'user'
    AND end_stats.entry_date IS NOT NULL
  ORDER BY xp_gained DESC;
END;
$$ LANGUAGE plpgsql; 