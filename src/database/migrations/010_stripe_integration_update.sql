-- Migration: 010_stripe_integration_update.sql
-- Description: Add Stripe subscription fields to profiles table
-- Date: November 17, 2025

-- Add Stripe subscription fields if they don't exist
DO $$ 
BEGIN
    -- Add stripe_customer_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
    END IF;

    -- Add stripe_subscription_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN stripe_subscription_id TEXT;
    END IF;

    -- Add subscription_status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_status TEXT;
    END IF;

    -- Add subscription_renewal_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'subscription_renewal_date'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_renewal_date TIMESTAMPTZ;
    END IF;

    -- Ensure is_paid exists (should already exist, but adding for completeness)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_paid'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_paid BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
    ON profiles(stripe_customer_id) 
    WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id 
    ON profiles(stripe_subscription_id) 
    WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_is_paid 
    ON profiles(is_paid) 
    WHERE is_paid = true;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status 
    ON profiles(subscription_status) 
    WHERE subscription_status IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for subscription management';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN profiles.subscription_status IS 'Subscription status: active, past_due, canceled, incomplete, unpaid';
COMMENT ON COLUMN profiles.subscription_renewal_date IS 'Next renewal date for the subscription';
COMMENT ON COLUMN profiles.is_paid IS 'Whether user has active paid subscription (unlocks premium features)';

-- Update existing is_paid_user values to is_paid if needed
UPDATE profiles 
SET is_paid = is_paid_user 
WHERE is_paid_user IS NOT NULL AND is_paid IS NULL;

