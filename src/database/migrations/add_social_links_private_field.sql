-- Add social_links_private field to profiles table
ALTER TABLE profiles ADD COLUMN social_links_private BOOLEAN DEFAULT false;
