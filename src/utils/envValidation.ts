export const validateEnvironmentVariables = () => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_SERVICE_ROLE_KEY'
  ]

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName])

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars)
    console.error('Please check your .env file or deployment environment variables')
    return false
  }

  console.log('✅ All required environment variables are present')
  return true
}

export const logEnvironmentInfo = () => {
  console.log('🌐 Environment Info:')
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
  console.log('Has Anon Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
  console.log('Has Service Role Key:', !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY)
  console.log('Mode:', import.meta.env.MODE)
  console.log('Base URL:', import.meta.env.BASE_URL)
} 