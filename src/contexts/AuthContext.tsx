import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

type UserMetadata = {
  role?: 'free' | 'paid'
  trial_start?: string
  trial_end?: string
  trial_enabled?: boolean
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
  signUp: (email: string, password: string, metadata?: UserMetadata) => Promise<{ error: any | null }>
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

  const signUp = async (email: string, password: string, metadata: UserMetadata = { role: 'free' }) => {
    // Get the current URL's origin (hostname including protocol)
    const currentOrigin = window.location.origin
    
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${currentOrigin}/signup-success`
      }
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
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
    const trialEnd = new Date(now)
    trialEnd.setDate(trialEnd.getDate() + 30)
    
    const { error } = await supabase.auth.updateUser({
      data: {
        trial_enabled: true,
        trial_start: now.toISOString(),
        trial_end: trialEnd.toISOString()
      }
    })
    
    if (!error) {
      setUserMetadata({
        ...userMetadata,
        trial_enabled: true,
        trial_start: now.toISOString(),
        trial_end: trialEnd.toISOString()
      })
    }
    
    return { error }
  }

  const isInTrial = () => {
    if (!userMetadata?.trial_enabled || !userMetadata?.trial_end) return false
    
    const now = new Date()
    const trialEnd = new Date(userMetadata.trial_end)
    return now < trialEnd
  }

  const trialDaysLeft = () => {
    if (!isInTrial() || !userMetadata?.trial_end) return null
    
    const now = new Date()
    const trialEnd = new Date(userMetadata.trial_end)
    const diffTime = Math.abs(trialEnd.getTime() - now.getTime())
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
    isProfileComplete
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