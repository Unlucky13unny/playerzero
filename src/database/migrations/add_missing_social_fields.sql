-- Migration to add missing social media fields to profiles table
-- Run this on existing databases to add the new social media fields

BEGIN;

-- Add GitHub field if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'github'
    ) THEN
        ALTER TABLE profiles ADD COLUMN github TEXT;
    END IF;
END $$;

-- Add Vimeo field if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'vimeo'
    ) THEN
        ALTER TABLE profiles ADD COLUMN vimeo TEXT;
    END IF;
END $$;

-- Add Discord field if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'discord'
    ) THEN
        ALTER TABLE profiles ADD COLUMN discord TEXT;
    END IF;
END $$;

-- Add Telegram field if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'telegram'
    ) THEN
        ALTER TABLE profiles ADD COLUMN telegram TEXT;
    END IF;
END $$;

-- Add WhatsApp field if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'whatsapp'
    ) THEN
        ALTER TABLE profiles ADD COLUMN whatsapp TEXT;
    END IF;
END $$;

COMMIT;
