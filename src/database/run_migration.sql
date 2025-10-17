-- Run this script in your Supabase SQL editor to add missing social platform fields
-- This will add the missing fields: github, vimeo, discord, telegram, whatsapp

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
