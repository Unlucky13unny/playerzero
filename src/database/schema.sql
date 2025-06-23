-- Create profiles table to store trainer profile data
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Trainer Information
  trainer_name TEXT NOT NULL,
  trainer_code TEXT NOT NULL,
  trainer_code_private BOOLEAN DEFAULT false,
  trainer_level INTEGER NOT NULL CHECK (trainer_level >= 1 AND trainer_level <= 50),
  start_date DATE,
  country TEXT,
  team_color TEXT,
  
  -- Subscription Status
  is_paid_user BOOLEAN DEFAULT false,
  subscription_type TEXT, -- 'monthly', 'yearly', 'lifetime', etc.
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  
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

-- Views for leaderboards and analytics (PAID USERS ONLY)
CREATE OR REPLACE VIEW weekly_leaderboard AS
SELECT 
  p.trainer_name,
  p.country,
  p.team_color,
  p.profile_screenshot_url,
  current_stats.total_xp - week_ago_stats.total_xp as xp_delta,
  current_stats.pokemon_caught - week_ago_stats.pokemon_caught as catches_delta,
  current_stats.distance_walked - week_ago_stats.distance_walked as distance_delta,
  current_stats.pokestops_visited - week_ago_stats.pokestops_visited as pokestops_delta,
  current_stats.entry_date as last_update
FROM profiles p
JOIN stat_entries current_stats ON p.id = current_stats.profile_id
LEFT JOIN stat_entries week_ago_stats ON p.id = week_ago_stats.profile_id 
  AND week_ago_stats.entry_date = CURRENT_DATE - INTERVAL '7 days'
WHERE current_stats.entry_date >= CURRENT_DATE - INTERVAL '7 days'
  AND p.is_paid_user = true
  AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
ORDER BY xp_delta DESC NULLS LAST;

CREATE OR REPLACE VIEW monthly_leaderboard AS
SELECT 
  p.trainer_name,
  p.country,
  p.team_color,
  p.profile_screenshot_url,
  current_stats.total_xp - month_ago_stats.total_xp as xp_delta,
  current_stats.pokemon_caught - month_ago_stats.pokemon_caught as catches_delta,
  current_stats.distance_walked - month_ago_stats.distance_walked as distance_delta,
  current_stats.pokestops_visited - month_ago_stats.pokestops_visited as pokestops_delta,
  current_stats.entry_date as last_update
FROM profiles p
JOIN stat_entries current_stats ON p.id = current_stats.profile_id
LEFT JOIN stat_entries month_ago_stats ON p.id = month_ago_stats.profile_id 
  AND month_ago_stats.entry_date = CURRENT_DATE - INTERVAL '30 days'
WHERE current_stats.entry_date >= CURRENT_DATE - INTERVAL '30 days'
  AND p.is_paid_user = true
  AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
ORDER BY xp_delta DESC NULLS LAST;

CREATE OR REPLACE VIEW all_time_leaderboard AS
SELECT 
  p.trainer_name,
  p.country,
  p.team_color,
  p.profile_screenshot_url,
  p.total_xp,
  p.pokemon_caught,
  p.distance_walked,
  p.pokestops_visited,
  p.updated_at as last_update
FROM profiles p
WHERE p.is_paid_user = true
  AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())
ORDER BY p.total_xp DESC; 