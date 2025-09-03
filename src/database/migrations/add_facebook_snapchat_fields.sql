-- Migration to add Facebook and Snapchat fields to profiles table
-- Run this on existing databases to add the new social media fields

BEGIN;

-- Add Facebook field if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'facebook'
    ) THEN
        ALTER TABLE profiles ADD COLUMN facebook TEXT;
    END IF;
END $$;

-- Add Snapchat field if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'snapchat'
    ) THEN
        ALTER TABLE profiles ADD COLUMN snapchat TEXT;
    END IF;
END $$;

COMMIT;
