-- Migration: Fix Feature Flags RLS Policy
-- Description: Updates the RLS policy using auth.jwt() instead of auth.users
-- Run this in Supabase SQL Editor to fix the permission issue

-- Step 1: Drop all existing policies on feature_flags
DROP POLICY IF EXISTS "Anyone can read feature flags" ON feature_flags;
DROP POLICY IF EXISTS "Admins can manage feature flags" ON feature_flags;
DROP POLICY IF EXISTS "Admins can insert feature flags" ON feature_flags;
DROP POLICY IF EXISTS "Admins can update feature flags" ON feature_flags;
DROP POLICY IF EXISTS "Admins can delete feature flags" ON feature_flags;

-- Step 2: Recreate the READ policy (for everyone)
CREATE POLICY "Anyone can read feature flags"
  ON feature_flags
  FOR SELECT
  USING (true);

-- Step 3: Create UPDATE policy using auth.jwt() for email check
-- auth.jwt() ->> 'email' gets the email from the JWT token without querying auth.users
CREATE POLICY "Admins can update feature flags"
  ON feature_flags
  FOR UPDATE
  USING (true)
  WITH CHECK (
    -- Check if user has admin role in profile
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    -- Check email from JWT token (no auth.users access needed)
    (auth.jwt() ->> 'email') = 'skaldev01@gmail.com'
    OR
    (auth.jwt() ->> 'email') LIKE '%admin%'
    OR
    (auth.jwt() ->> 'email') LIKE '%@playerzero.com'
    OR
    (auth.jwt() ->> 'email') LIKE '%@admin.playerzero.com'
  );

-- Step 4: Create INSERT policy
CREATE POLICY "Admins can insert feature flags"
  ON feature_flags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    (auth.jwt() ->> 'email') = 'skaldev01@gmail.com'
    OR
    (auth.jwt() ->> 'email') LIKE '%admin%'
    OR
    (auth.jwt() ->> 'email') LIKE '%@playerzero.com'
    OR
    (auth.jwt() ->> 'email') LIKE '%@admin.playerzero.com'
  );

-- Step 5: Create DELETE policy
CREATE POLICY "Admins can delete feature flags"
  ON feature_flags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
    OR
    (auth.jwt() ->> 'email') = 'skaldev01@gmail.com'
    OR
    (auth.jwt() ->> 'email') LIKE '%admin%'
    OR
    (auth.jwt() ->> 'email') LIKE '%@playerzero.com'
    OR
    (auth.jwt() ->> 'email') LIKE '%@admin.playerzero.com'
  );

-- Step 6: Grant necessary permissions
GRANT SELECT ON feature_flags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON feature_flags TO authenticated;
GRANT ALL ON feature_flags TO service_role;

-- Step 7: Ensure the is_free_mode flag exists
INSERT INTO feature_flags (key, value, description)
VALUES (
  'is_free_mode', 
  false, 
  'When enabled, all users get full access without trial or payment restrictions.'
)
ON CONFLICT (key) DO NOTHING;
