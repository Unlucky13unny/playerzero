-- Migration: Add Feature Flags System
-- Description: Creates the feature_flags table for controlling app-wide feature toggles
-- This enables the global paywall bypass (is_free_mode) and future feature flags

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment describing the table
COMMENT ON TABLE feature_flags IS 'Global feature flags for controlling app-wide behavior without redeployment';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_updated_at ON feature_flags(updated_at);

-- Enable RLS on feature_flags table
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read feature flags (needed for the app to check flags)
CREATE POLICY "Anyone can read feature flags"
  ON feature_flags
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert/update/delete feature flags
-- This checks either:
-- 1. User has admin role in their profile
-- 2. User email is in the whitelist
-- 3. User email matches admin patterns
CREATE POLICY "Admins can manage feature flags"
  ON feature_flags
  FOR ALL
  USING (
    -- Check if user has admin role in profile
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    -- Check if user email is whitelisted or matches admin patterns
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        auth.users.email = 'skaldev01@gmail.com'
        OR auth.users.email LIKE '%admin%'
        OR auth.users.email LIKE '%@playerzero.com'
        OR auth.users.email LIKE '%@admin.playerzero.com'
      )
    )
  );

-- Insert default feature flags
INSERT INTO feature_flags (key, value, description)
VALUES 
  (
    'is_free_mode', 
    false, 
    'When enabled, all users get full access without trial or payment restrictions. Bypasses all paywall and subscription checks.'
  )
ON CONFLICT (key) DO NOTHING;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on changes
DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_flags_updated_at();

-- Grant permissions to authenticated users (read only via RLS)
GRANT SELECT ON feature_flags TO authenticated;
GRANT SELECT ON feature_flags TO anon;

-- Grant full permissions to service role (for admin operations)
GRANT ALL ON feature_flags TO service_role;

