export const validateVercelEnvironment = () => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_SERVICE_ROLE_KEY'
  ]

  const missingVars = requiredVars.filter(varName => !import.meta.env[varName])

  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables for Vercel deployment:', missingVars)
    console.error('Please set these in your Vercel project settings:')
    console.error('1. Go to your Vercel dashboard')
    console.error('2. Select your project')
    console.error('3. Go to Settings > Environment Variables')
    console.error('4. Add the missing variables')
    return false
  }

  console.log('✅ Vercel environment variables are properly configured')
  return true
}

export const getVercelEnvironmentInfo = () => {
  return {
    isVercel: !!import.meta.env.VERCEL,
    environment: import.meta.env.VERCEL_ENV || 'development',
    url: import.meta.env.VERCEL_URL,
    gitCommitSha: import.meta.env.VERCEL_GIT_COMMIT_SHA,
    gitCommitMessage: import.meta.env.VERCEL_GIT_COMMIT_MESSAGE,
    gitBranch: import.meta.env.VERCEL_GIT_COMMIT_REF
  }
}

export const logVercelInfo = () => {
  const info = getVercelEnvironmentInfo()
  console.log('🚀 Vercel Environment Info:', info)
} 