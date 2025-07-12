import { createClient } from '@supabase/supabase-js'

// These values should be stored in environment variables in a production application
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

// Regular client for normal operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for administrative operations (accessing auth users, etc.)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey) 