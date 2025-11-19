-- Run this in Supabase SQL Editor to verify and add Stripe columns
-- This will check if columns exist and add them if missing

-- Step 1: Check what columns currently exist in profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN (
    'stripe_customer_id', 
    'stripe_subscription_id', 
    'subscription_status', 
    'subscription_renewal_date', 
    'is_paid'
)
ORDER BY column_name;

-- Step 2: Add missing columns (run this if columns are missing from Step 1)
DO $$ 
BEGIN
    -- Add stripe_customer_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;
        RAISE NOTICE 'Added stripe_customer_id column';
    ELSE
        RAISE NOTICE 'stripe_customer_id column already exists';
    END IF;

    -- Add stripe_subscription_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN stripe_subscription_id TEXT;
        RAISE NOTICE 'Added stripe_subscription_id column';
    ELSE
        RAISE NOTICE 'stripe_subscription_id column already exists';
    END IF;

    -- Add subscription_status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_status TEXT;
        RAISE NOTICE 'Added subscription_status column';
    ELSE
        RAISE NOTICE 'subscription_status column already exists';
    END IF;

    -- Add subscription_renewal_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'subscription_renewal_date'
    ) THEN
        ALTER TABLE profiles ADD COLUMN subscription_renewal_date TIMESTAMPTZ;
        RAISE NOTICE 'Added subscription_renewal_date column';
    ELSE
        RAISE NOTICE 'subscription_renewal_date column already exists';
    END IF;

    -- Ensure is_paid exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_paid'
    ) THEN
        ALTER TABLE profiles ADD COLUMN is_paid BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added is_paid column';
    ELSE
        RAISE NOTICE 'is_paid column already exists';
    END IF;
END $$;

-- Step 3: Create indexes for performance
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

-- Step 4: Add comments
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for subscription management';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN profiles.subscription_status IS 'Subscription status: active, past_due, canceled, incomplete, unpaid';
COMMENT ON COLUMN profiles.subscription_renewal_date IS 'Next renewal date for the subscription';
COMMENT ON COLUMN profiles.is_paid IS 'Whether user has active paid subscription (unlocks premium features)';

-- Step 5: Verify columns were added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN (
    'stripe_customer_id', 
    'stripe_subscription_id', 
    'subscription_status', 
    'subscription_renewal_date', 
    'is_paid'
)
ORDER BY column_name;

-- Step 6: Check if any profiles have Stripe data
SELECT 
    COUNT(*) as total_profiles,
    COUNT(stripe_customer_id) as with_stripe_customer,
    COUNT(stripe_subscription_id) as with_subscription,
    COUNT(CASE WHEN is_paid = true THEN 1 END) as paid_users
FROM profiles;

