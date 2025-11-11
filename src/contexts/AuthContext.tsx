import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

type UserMetadata = {
  role?: 'free' | 'paid'
  private_mode_start?: string
  private_mode_end?: string
  private_mode_enabled?: boolean
  profile_complete?: boolean
  trainer_name?: string
  trainer_level?: number
  team_color?: string
  country?: string
}

type AuthContextType = {
  user: User | null
  session: Session | null
  userMetadata: UserMetadata | null
  loading: boolean
  signUp: (email: string, password: string, metadata?: UserMetadata, username?: string) => Promise<{ error: any | null }>
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signOut: () => Promise<{ error: any | null }>
  resetPassword: (email: string) => Promise<{ error: any | null }>
  updatePassword: (password: string) => Promise<{ error: any | null }>
  updateProfile: (metadata: Partial<UserMetadata>) => Promise<{ error: any | null }>
  startFreeTrial: () => Promise<{ error: any | null }>
  isInTrial: () => boolean
  trialDaysLeft: () => number | null
  upgradeToFull: () => Promise<{ error: any | null }>
  isProfileComplete: () => boolean
  needsProfileSetup: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setUserMetadata(session?.user?.user_metadata as UserMetadata || null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setUserMetadata(session?.user?.user_metadata as UserMetadata || null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, metadata: UserMetadata = { role: 'free' }, username?: string) => {
    // Get the current URL's origin (hostname including protocol)
    const currentOrigin = window.location.origin

    // Store username in metadata for later use during profile setup
    const signupMetadata = {
      ...metadata,
      ...(username && { preferred_username: username })
    }
    
    // Signup - profile will be created by database trigger when email is confirmed
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: signupMetadata,
        emailRedirectTo: `${currentOrigin}/signup-success`
      }
    })

    if (signUpError) {
      // Check for common Supabase Auth error codes
      if (signUpError.message?.toLowerCase().includes('already registered') || 
          signUpError.message?.toLowerCase().includes('already been registered') ||
          signUpError.status === 422) {
        return { error: { message: 'Email already registered', code: 'email_exists' } }
      }
      return { error: signUpError }
    }

    // Check if user already exists (Supabase sometimes returns success for existing users)
    if (signUpData.user && !signUpData.user.identities?.length) {
      return { error: { message: 'Email already registered', code: 'email_exists' } }
    }

    // Signup successful - profile will be created automatically by trigger when email is confirmed
    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    try {
      console.log('AuthContext: Starting signOut process...')
      
      // First clear local state
      setUser(null)
      setSession(null)
      setUserMetadata(null)
      
      // Clear any local storage items that might persist
      try {
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.clear()
      } catch (storageError) {
        console.warn('Error clearing storage:', storageError)
      }
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'global' // Sign out from all sessions
      })
      
      if (error) {
        console.error('AuthContext: SignOut error:', error)
        return { error }
      }
      
      console.log('AuthContext: SignOut successful')
      return { error: null }
    } catch (error) {
      console.error('AuthContext: SignOut exception:', error)
      return { error }
    }
  }

  const resetPassword = async (email: string) => {
    // Get the current URL's origin (hostname including protocol)
    const currentOrigin = window.location.origin
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${currentOrigin}/reset-password`,
    })
    return { error }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  const updateProfile = async (metadata: Partial<UserMetadata>) => {
    if (!user) return { error: new Error('User not logged in') }
    
    const { error } = await supabase.auth.updateUser({
      data: {
        ...userMetadata,
        ...metadata
      }
    })
    
    if (!error) {
      setUserMetadata({
        ...userMetadata,
        ...metadata
      })
    }
    
    return { error }
  }

  const startFreeTrial = async () => {
    if (!user) return { error: new Error('User not logged in') }
    
    const now = new Date()
    const privateEnd = new Date(now)
    privateEnd.setDate(privateEnd.getDate() + 7)
    
    const { error } = await supabase.auth.updateUser({
      data: {
        private_mode_enabled: true,
        private_mode_start: now.toISOString(),
        private_mode_end: privateEnd.toISOString()
      }
    })
    
    if (!error) {
      setUserMetadata({
        ...userMetadata,
        private_mode_enabled: true,
        private_mode_start: now.toISOString(),
        private_mode_end: privateEnd.toISOString()
      })
    }
    
    return { error }
  }

  const isInTrial = () => {
    if (!userMetadata?.private_mode_enabled || !userMetadata?.private_mode_end) return false
    
    const now = new Date()
    const privateEnd = new Date(userMetadata.private_mode_end)
    return now < privateEnd
  }

  const trialDaysLeft = () => {
    if (!isInTrial() || !userMetadata?.private_mode_end) return null
    
    const now = new Date()
    const privateEnd = new Date(userMetadata.private_mode_end)
    const diffTime = Math.abs(privateEnd.getTime() - now.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const upgradeToFull = async () => {
    if (!user) return { error: new Error('User not logged in') }
    
    const { error } = await supabase.auth.updateUser({
      data: {
        role: 'paid'
      }
    })
    
    if (!error) {
      setUserMetadata({
        ...userMetadata,
        role: 'paid'
      })
    }
    
    return { error }
  }

  const isProfileComplete = () => {
    return userMetadata?.profile_complete === true
  }

  const needsProfileSetup = async () => {
    if (!user) return false

    const { data } = await supabase
      .from('profiles')
      .select('is_profile_setup')
      .eq('user_id', user.id)
      .single()

    return data ? !data.is_profile_setup : false
  }

  const value = {
    user,
    session,
    userMetadata,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    startFreeTrial,
    isInTrial,
    trialDaysLeft,
    upgradeToFull,
    isProfileComplete,
    needsProfileSetup
  }
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 