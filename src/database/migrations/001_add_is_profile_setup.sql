-- Migration: Add is_profile_setup column to profiles table
-- This field tracks whether a user has completed their initial profile setup

-- Add the column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_profile_setup BOOLEAN DEFAULT false;

-- Update existing profiles
-- If trainer_name is not 'PENDING', mark them as setup complete
UPDATE profiles 
SET is_profile_setup = true 
WHERE trainer_name IS NOT NULL 
  AND trainer_name != 'PENDING'
  AND trainer_name != '';

-- Set default value for start_date to prevent empty string errors
ALTER TABLE profiles 
ALTER COLUMN start_date SET DEFAULT CURRENT_DATE;

-- Update any NULL start_dates to current date
UPDATE profiles 
SET start_date = CURRENT_DATE 
WHERE start_date IS NULL;

-- Create index for faster queries on this field
CREATE INDEX IF NOT EXISTS idx_profiles_is_profile_setup ON profiles(is_profile_setup);

-- Add comment to document the field
COMMENT ON COLUMN profiles.is_profile_setup IS 'Indicates whether the user has completed initial profile setup';

