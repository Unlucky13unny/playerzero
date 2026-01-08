import { supabase } from '../supabaseClient'
import { featureFlagService } from './featureFlagService'

export interface StatEntry {
  id: string
  user_id: string
  profile_id: string
  distance_walked: number
  pokemon_caught: number
  pokestops_visited: number
  total_xp: number
  unique_pokedex_entries: number
  trainer_level: number
  entry_date: string
  created_at: string
}

export interface LeaderboardEntry {
  profile_id: string
  trainer_name: string
  country: string
  team_color: string
  profile_screenshot_url?: string
  xp_delta?: number
  catches_delta?: number
  distance_delta?: number
  pokestops_delta?: number
  dex_delta?: number
  total_xp?: number
  pokemon_caught?: number
  distance_walked?: number
  pokestops_visited?: number
  unique_pokedex_entries?: number
  last_update: string
}

export interface PublicProfile {
  id: string
  trainer_name: string
  trainer_level: number
  country: string
  team_color: string
  total_xp: number
  pokemon_caught: number
  distance_walked: number
  pokestops_visited: number
  unique_pokedex_entries: number
  profile_screenshot_url?: string
  created_at: string
  updated_at: string
}

export type StatCalculationResult = {
  totalXP: number
  pokemonCaught: number
  distanceWalked: number
  pokestopsVisited: number
  uniquePokedexEntries: number
  xpPerDay: number
  catchesPerDay: number
  distancePerDay: number
  stopsPerDay: number
  startDate: string
  endDate: string
}

export interface StatUpdate {
  distance_walked?: number;
  pokemon_caught?: number;
  pokestops_visited?: number;
  total_xp?: number;
  unique_pokedex_entries?: number;
  trainer_level?: number;
}

export interface StatUpdateResponse {
  success: boolean;
  message: string;
  updatedProfile?: PublicProfile;
}

export interface LeaderboardParams {
  period: 'weekly' | 'monthly' | 'all-time';
  sortBy: 'xp' | 'catches' | 'distance' | 'pokestops' | 'dex';
  view: 'all' | 'country' | 'team' | 'search';
  filterValue?: string; // country code, team color, or search query when view is filtered
}

export interface HistoricalWinner {
  rank: number
  trainer_name: string
  country: string
  team_color: string
  profile_screenshot_url?: string
  xp_gained: number
  catches_gained: number
  distance_gained: number
  pokestops_gained: number
  period_start: string
  period_end: string
}

export interface StatBounds {
  total_xp: { min: number; max: number };
  pokemon_caught: { min: number; max: number };
  distance_walked: { min: number; max: number };
  pokestops_visited: { min: number; max: number };
  unique_pokedex_entries: { min: number; max: number };
}

export interface DailyUploadStatus {
  uploadsUsed: number;
  dailyLimit: number;
  canUpload: boolean;
  isPaidUser: boolean;
  userType: 'paid' | 'trial';
}

export const dashboardService = {
  // Get LIVE leaderboard data (current period)
  async getLiveLeaderboard(params: LeaderboardParams) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    let query: string
    
    if (params.period === 'weekly') {
      query = 'current_weekly_leaderboard'
    } else if (params.period === 'monthly') {
      query = 'current_monthly_leaderboard'
    } else {
      // All-time shows live current totals
      query = 'all_time_leaderboard'
    }

    let dbQuery = supabase.from(query).select('*')

    // Apply view filters
    if (params.view === 'country' && params.filterValue) {
      dbQuery = dbQuery.eq('country', params.filterValue)
    } else if (params.view === 'team' && params.filterValue) {
      dbQuery = dbQuery.eq('team_color', params.filterValue)
    }

    const { data, error } = await dbQuery.limit(1000)

    if (error) {
      console.error('Live leaderboard query error:', error)
      throw error
    }

    // Filter out banned countries
    const BANNED_COUNTRIES = ['Iran', 'China', 'Russia', 'Belarus', 'North Korea']
    let filteredData = (data || []).filter((entry: any) => !BANNED_COUNTRIES.includes(entry.country))

    // Debug: Check if unique_pokedex_entries is present in data
    if (params.sortBy === 'dex' && filteredData && filteredData.length > 0) {
      console.log('🔍 Dex data check:', {
        period: params.period,
        viewName: query,
        sampleEntry: {
          trainer: filteredData[0]?.trainer_name,
          unique_pokedex_entries: filteredData[0]?.unique_pokedex_entries,
          dex_delta: filteredData[0]?.dex_delta,
          allFields: Object.keys(filteredData[0] || {})
        }
      })
    }

    // Sort the data
    if (filteredData && filteredData.length > 0) {
      const sortField = params.period === 'all-time' 
        ? (params.sortBy === 'xp' ? 'total_xp' : 
           params.sortBy === 'catches' ? 'pokemon_caught' : 
           params.sortBy === 'distance' ? 'distance_walked' : 
           params.sortBy === 'dex' ? 'unique_pokedex_entries' : 'pokestops_visited')
        : (params.sortBy === 'xp' ? 'xp_delta' : 
           params.sortBy === 'catches' ? 'catches_delta' : 
           params.sortBy === 'distance' ? 'distance_delta' : 
           params.sortBy === 'dex' ? 'dex_delta' : 'pokestops_delta')
      
      filteredData.sort((a: any, b: any) => (b[sortField] || 0) - (a[sortField] || 0))
    }

    return { data: filteredData as LeaderboardEntry[], error: null }
  },

  // Get LOCKED leaderboard data (previous period winners)
  async getLockedLeaderboard(params: LeaderboardParams) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // All-time has no locked results
    if (params.period === 'all-time') {
      return { data: [], error: null }
    }

    // Use the dedicated previous period winner views
    const viewName = params.period === 'weekly' ? 'previous_week_winners' : 'previous_month_winners'

    let dbQuery = supabase.from(viewName).select('*')

    // Apply view filters
    if (params.view === 'country' && params.filterValue) {
      dbQuery = dbQuery.eq('country', params.filterValue)
    } else if (params.view === 'team' && params.filterValue) {
      dbQuery = dbQuery.eq('team_color', params.filterValue)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.error('Locked leaderboard error:', error)
      return { data: [], error: null }
    }

    if (!data || data.length === 0) {
      console.log(`No data found in ${viewName}`)
      return { data: [], error: null }
    }

    // Filter out banned countries
    const BANNED_COUNTRIES = ['Iran', 'China', 'Russia', 'Belarus', 'North Korea']
    const filteredData = data.filter((entry: any) => !BANNED_COUNTRIES.includes(entry.country))

    if (filteredData.length === 0) {
      console.log(`No data found in ${viewName} after filtering banned countries`)
      return { data: [], error: null }
    }

    // Debug: Check if dex_delta is present in locked data
    if (params.sortBy === 'dex' && filteredData && filteredData.length > 0) {
      console.log('🔍 Locked Dex data check:', {
        period: params.period,
        viewName: viewName,
        sampleEntry: {
          trainer: filteredData[0]?.trainer_name,
          dex_delta: filteredData[0]?.dex_delta,
          allFields: Object.keys(filteredData[0] || {})
        }
      })
    }

    // Sort by the requested stat
    const sortField = params.sortBy === 'xp' ? 'xp_delta' : 
                     params.sortBy === 'catches' ? 'catches_delta' : 
                     params.sortBy === 'distance' ? 'distance_delta' : 
                     params.sortBy === 'dex' ? 'dex_delta' : 'pokestops_delta'
    
    const sortedData = [...filteredData].sort((a: any, b: any) => (b[sortField] || 0) - (a[sortField] || 0))

    // Convert to LeaderboardEntry format
    const formattedData = sortedData.map((entry: any) => ({
      profile_id: entry.profile_id,
      trainer_name: entry.trainer_name,
      country: entry.country,
      team_color: entry.team_color,
      profile_screenshot_url: entry.profile_screenshot_url,
      xp_delta: entry.xp_delta,
      catches_delta: entry.catches_delta,
      distance_delta: entry.distance_delta,
      pokestops_delta: entry.pokestops_delta,
      dex_delta: entry.dex_delta,
      total_xp: undefined,
      pokemon_caught: undefined,
      distance_walked: undefined,
      pokestops_visited: undefined,
      unique_pokedex_entries: undefined,
      last_update: entry.last_update
    }))

    return { data: formattedData as LeaderboardEntry[], error: null }
  },

  // Legacy function for backward compatibility
  async getLeaderboard(params: LeaderboardParams) {
    // Default to live leaderboard
    return this.getLiveLeaderboard(params)
  },

  // Get completed period leaderboard
  async getCompletedPeriodLeaderboard(periodType: 'weekly' | 'monthly', params: LeaderboardParams) {
    try {
      // First ensure periods are completed
      await this.checkAndCompletePeriods()

      // Get the period dates
      const { data: periodData, error: periodError } = await supabase.rpc(
        periodType === 'weekly' ? 'get_last_completed_week' : 'get_last_completed_month'
      )

      if (periodError || !periodData || periodData.length === 0) {
        console.log(`No completed ${periodType} periods found`)
        return { data: [], error: null }
      }

      const { period_start, period_end } = periodData[0]

      // Get the completed period leaderboard
      const { data, error } = await supabase.rpc('get_completed_period_leaderboard', {
        p_period_type: periodType,
        p_period_start: period_start,
        p_period_end: period_end
      })

      if (error) {
        console.error('Completed period leaderboard error:', error)
        return { data: [], error: null }
      }

      // Apply filters and sorting
      let filteredData = data || []

      // Filter out banned countries
      const BANNED_COUNTRIES = ['Iran', 'China', 'Russia', 'Belarus', 'North Korea']
      filteredData = filteredData.filter((entry: any) => !BANNED_COUNTRIES.includes(entry.country))

      if (params.view === 'country' && params.filterValue) {
        filteredData = filteredData.filter((entry: any) => entry.country === params.filterValue)
      } else if (params.view === 'team' && params.filterValue) {
        filteredData = filteredData.filter((entry: any) => entry.team_color === params.filterValue)
      }

      // Sort by the requested stat
      const sortField = params.sortBy === 'xp' ? 'xp_gained' : 
                       params.sortBy === 'catches' ? 'catches_gained' : 
                       params.sortBy === 'distance' ? 'distance_gained' : 'pokestops_gained'
      
      filteredData.sort((a: any, b: any) => (b[sortField] || 0) - (a[sortField] || 0))

      // Convert to LeaderboardEntry format
      const formattedData = filteredData.slice(0, 100).map((entry: any) => ({
        profile_id: entry.profile_id,
        trainer_name: entry.trainer_name,
        country: entry.country,
        team_color: entry.team_color,
        profile_screenshot_url: entry.profile_screenshot_url,
        xp_delta: entry.xp_gained,
        catches_delta: entry.catches_gained,
        distance_delta: entry.distance_gained,
        pokestops_delta: entry.pokestops_gained,
        total_xp: null,
        pokemon_caught: null,
        distance_walked: null,
        pokestops_visited: null,
        last_update: entry.last_update
      }))

      return { data: formattedData as LeaderboardEntry[], error: null }
    } catch (error) {
      console.error(`Error getting completed ${periodType} leaderboard:`, error)
      return { data: [], error: null }
    }
  },

  // Get historical winners for last completed week
  async getLastWeekWinners(): Promise<{ data: HistoricalWinner[] | null; error: any }> {
    // First ensure periods are completed
    await this.checkAndCompletePeriods()

    const { data, error } = await supabase
      .from('last_week_winners')
      .select('*')
      .order('rank')

    if (error) {
      console.error('Last week winners error:', error)
      return { data: null, error }
    }

    return { data: data as HistoricalWinner[], error: null }
  },

  // Get historical winners for last completed month
  async getLastMonthWinners(): Promise<{ data: HistoricalWinner[] | null; error: any }> {
    // First ensure periods are completed
    await this.checkAndCompletePeriods()

    const { data, error } = await supabase
      .from('last_month_winners')
      .select('*')
      .order('rank')

    if (error) {
      console.error('Last month winners error:', error)
      return { data: null, error }
    }

    return { data: data as HistoricalWinner[], error: null }
  },

  // Check and complete periods (calls database function)
  async checkAndCompletePeriods(): Promise<void> {
    const { error } = await supabase.rpc('check_and_complete_periods')
    
    if (error) {
      console.error('Error checking/completing periods:', error)
      // Don't throw here, as this is a background operation
    }
  },

  // Get public profiles for community view
  async getPublicProfiles(limit: number = 50, offset: number = 0) {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        trainer_name,
        trainer_level,
        country,
        team_color,
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries,
        profile_screenshot_url,
        created_at,
        updated_at
      `)
      .order('total_xp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return { data: data as PublicProfile[], error: null }
  },

  // Get user's stat entries for calculations
  async getUserStatEntries(userId?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    
    if (!targetUserId) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('stat_entries')
      .select('*')
      .eq('user_id', targetUserId)
      .order('entry_date', { ascending: true })

    if (error) {
      throw error
    }

    return { data: data as StatEntry[], error: null }
  },

  // Calculate stat changes between two dates
  async calculateStatDelta(startDate: string, endDate: string): Promise<StatCalculationResult> {
    try {
      const { data, error } = await supabase
        .from('stat_entries')
        .select('*')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: true })

      if (error) {
        throw new Error('Failed to fetch stat entries')
      }

      if (!data || data.length < 2) {
        throw new Error('Not enough data points for the selected date range')
      }

      const firstEntry = data[0]
      const lastEntry = data[data.length - 1]
      const daysDiff = getDaysDifference(startDate, endDate)

      const totalXP = lastEntry.total_xp - firstEntry.total_xp
      const pokemonCaught = lastEntry.pokemon_caught - firstEntry.pokemon_caught
      const distanceWalked = lastEntry.distance_walked - firstEntry.distance_walked
      const pokestopsVisited = lastEntry.pokestops_visited - firstEntry.pokestops_visited
      const uniquePokedexEntries = lastEntry.unique_pokedex_entries - firstEntry.unique_pokedex_entries

      return {
        totalXP,
        pokemonCaught,
        distanceWalked,
        pokestopsVisited,
        uniquePokedexEntries,
        xpPerDay: Math.round(totalXP / daysDiff),
        catchesPerDay: Math.round(pokemonCaught / daysDiff),
        distancePerDay: Math.round(distanceWalked / daysDiff),
        stopsPerDay: Math.round(pokestopsVisited / daysDiff),
        startDate,
        endDate
      }
    } catch (error) {
      throw error
    }
  },

  // Calculate grind stats from start date to current day
  async calculateGrindStats(): Promise<StatCalculationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Get user's profile to find start date
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('start_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        throw new Error('Profile not found')
      }

      if (!profile.start_date) {
        throw new Error('Start date not set in profile')
      }

      // Calculate days from start date to current day
      // Parse date in a timezone-safe way by adding 'T00:00:00' to force local timezone
      const startDate = new Date(profile.start_date + 'T00:00:00')
      const currentDate = new Date()
      const daysPlayed = Math.max(1, Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

      // Use current total stats (not delta between dates)
      const totalXP = profile.total_xp || 0
      const pokemonCaught = profile.pokemon_caught || 0
      const distanceWalked = profile.distance_walked || 0
      const pokestopsVisited = profile.pokestops_visited || 0
      const uniquePokedexEntries = profile.unique_pokedex_entries || 0

      // Calculate daily averages
      const xpPerDay = totalXP / daysPlayed >= 1000 
        ? Math.round(((totalXP / daysPlayed) / 1000) * 10) / 10 // Convert XP to K and round to tenth
        : Math.round((totalXP / daysPlayed) * 10) / 10 // Round to nearest tenth
      const catchesPerDay = Math.round((pokemonCaught / daysPlayed) * 10) / 10 // Round to nearest tenth
      const distancePerDay = Math.round((distanceWalked / daysPlayed) * 10) / 10 // Keep one decimal place for distance
      const stopsPerDay = Math.round((pokestopsVisited / daysPlayed) * 10) / 10 // Round to nearest tenth

      return {
        totalXP,
        pokemonCaught,
        distanceWalked,
        pokestopsVisited,
        uniquePokedexEntries,
        xpPerDay,
        catchesPerDay,
        distancePerDay,
        stopsPerDay,
        startDate: profile.start_date,
        endDate: currentDate.toISOString().split('T')[0]
      }
    } catch (error) {
      throw error
    }
  },

  // Calculate grind stats for any user by ID
  async calculateGrindStatsForUser(userId: string): Promise<StatCalculationResult> {
    try {
      // Get user's profile to find start date
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('start_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries')
        .eq('user_id', userId)
        .single()

      if (profileError || !profile) {
        throw new Error('Profile not found')
      }

      if (!profile.start_date) {
        throw new Error('Start date not set in profile')
      }

      // Calculate days from start date to current day
      // Parse date in a timezone-safe way by adding 'T00:00:00' to force local timezone
      const startDate = new Date(profile.start_date + 'T00:00:00')
      const currentDate = new Date()
      const daysPlayed = Math.max(1, Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

      // Use current total stats (not delta between dates)
      const totalXP = profile.total_xp || 0
      const pokemonCaught = profile.pokemon_caught || 0
      const distanceWalked = profile.distance_walked || 0
      const pokestopsVisited = profile.pokestops_visited || 0
      const uniquePokedexEntries = profile.unique_pokedex_entries || 0

      // Calculate daily averages
      const xpPerDay = totalXP / daysPlayed >= 1000 
        ? Math.round(((totalXP / daysPlayed) / 1000) * 10) / 10 // Convert XP to K and round to tenth
        : Math.round((totalXP / daysPlayed) * 10) / 10 // Round to nearest tenth
      const catchesPerDay = Math.round((pokemonCaught / daysPlayed) * 10) / 10 // Round to nearest tenth
      const distancePerDay = Math.round((distanceWalked / daysPlayed) * 10) / 10 // Keep one decimal place for distance
      const stopsPerDay = Math.round((pokestopsVisited / daysPlayed) * 10) / 10 // Round to nearest tenth

      return {
        totalXP,
        pokemonCaught,
        distanceWalked,
        pokestopsVisited,
        uniquePokedexEntries,
        xpPerDay,
        catchesPerDay,
        distancePerDay,
        stopsPerDay,
        startDate: profile.start_date,
        endDate: currentDate.toISOString().split('T')[0]
      }
    } catch (error) {
      throw error
    }
  },

  // Calculate weekly grind stats (last 7 days)
  async calculateWeeklyGrindStats(userId?: string): Promise<StatCalculationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id
      
      if (!targetUserId) {
        throw new Error('User not authenticated')
      }

      // Get user's profile to check start date
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('start_date')
        .eq('user_id', targetUserId)
        .single()

      if (profileError || !profile) {
        throw new Error('Profile not found')
      }

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 7)

      const endDateStr = endDate.toISOString().split('T')[0]

      // Check if user's start date is after our calculated start date
      // If so, use the user's start date instead
      // Parse date in a timezone-safe way by adding 'T00:00:00' to force local timezone
      const userStartDate = new Date(profile.start_date + 'T00:00:00')
      const adjustedStartDate = userStartDate > startDate ? userStartDate : startDate
      const adjustedStartDateStr = adjustedStartDate.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('stat_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('entry_date', adjustedStartDateStr)
        .lte('entry_date', endDateStr)
        .order('entry_date', { ascending: true })

      if (error) {
        throw new Error('Failed to fetch weekly stat entries')
      }

      let firstEntry, lastEntry

      if (!data || data.length === 0) {
        // No data in the period, try to get any available data
        const { data: allData, error: allError } = await supabase
          .from('stat_entries')
          .select('*')
          .eq('user_id', targetUserId)
          .order('entry_date', { ascending: true })

        if (allError || !allData || allData.length === 0) {
          return {
            totalXP: 0,
            pokemonCaught: 0,
            distanceWalked: 0,
            pokestopsVisited: 0,
            uniquePokedexEntries: 0,
            xpPerDay: 0,
            catchesPerDay: 0,
            distancePerDay: 0,
            stopsPerDay: 0,
            startDate: adjustedStartDateStr,
            endDate: endDateStr
          }
        }

        // Use the first and last available entries
        firstEntry = allData[0]
        lastEntry = allData[allData.length - 1]
      } else if (data.length === 1) {
        // Only one entry in the period, use it for both first and last
        firstEntry = data[0]
        lastEntry = data[0]
      } else {
        // Multiple entries, use first and last
        firstEntry = data[0]
        lastEntry = data[data.length - 1]
      }

      // For weekly stats, use the actual 7-day period, not just the days between entries
      const actualDaysDiff = getDaysDifference(adjustedStartDateStr, endDateStr)

      const totalXP = Math.max(0, lastEntry.total_xp - firstEntry.total_xp)
      const pokemonCaught = Math.max(0, lastEntry.pokemon_caught - firstEntry.pokemon_caught)
      const distanceWalked = Math.max(0, lastEntry.distance_walked - firstEntry.distance_walked)
      const pokestopsVisited = Math.max(0, lastEntry.pokestops_visited - firstEntry.pokestops_visited)
      const uniquePokedexEntries = Math.max(0, lastEntry.unique_pokedex_entries - firstEntry.unique_pokedex_entries)

      return {
        totalXP,
        pokemonCaught,
        distanceWalked,
        pokestopsVisited,
        uniquePokedexEntries,
        xpPerDay: Math.round(totalXP / actualDaysDiff),
        catchesPerDay: Math.round(pokemonCaught / actualDaysDiff),
        distancePerDay: Math.round((distanceWalked / actualDaysDiff) * 10) / 10,
        stopsPerDay: Math.round(pokestopsVisited / actualDaysDiff),
        startDate: adjustedStartDateStr,
        endDate: endDateStr
      }
    } catch (error) {
      throw error
    }
  },

  // Calculate current week grind stats (Sunday 00:00 UTC to Saturday 23:59 UTC)
  async calculateCurrentWeekGrindStats(userId?: string): Promise<StatCalculationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id
      
      if (!targetUserId) {
        throw new Error('User not authenticated')
      }

      // Get user's profile to check start date
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('start_date')
        .eq('user_id', targetUserId)
        .single()

      if (profileError || !profile) {
        throw new Error('Profile not found')
      }

      // Calculate current week boundaries (Sunday 00:00 UTC to Saturday 23:59 UTC)
      const now = new Date()
      const currentDayOfWeek = now.getUTCDay() // 0 = Sunday, 6 = Saturday
      
      // Calculate start of current week (Sunday 00:00 UTC)
      const weekStart = new Date(now.getTime())
      weekStart.setUTCHours(0, 0, 0, 0)
      weekStart.setUTCDate(weekStart.getUTCDate() - currentDayOfWeek)
      
      // Calculate end of current week (Saturday 23:59 UTC)
      const weekEnd = new Date(weekStart.getTime())
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6)
      weekEnd.setUTCHours(23, 59, 59, 999)

      // Calculate 4-hour buffer window before week start (Saturday 20:00 UTC to Sunday 00:00 UTC)
      const bufferStart = new Date(weekStart.getTime())
      bufferStart.setUTCDate(bufferStart.getUTCDate() - 1) // Go back 1 day to Saturday
      bufferStart.setUTCHours(20, 0, 0, 0) // Set to 20:00 UTC

      const weekStartStr = weekStart.toISOString().split('T')[0]
      const weekEndStr = weekEnd.toISOString().split('T')[0]
      const bufferStartStr = bufferStart.toISOString()
      const weekStartFullStr = weekStart.toISOString()

      console.log('Week Calculation Debug:', {
        weekStart: weekStartStr,
        weekEnd: weekEndStr,
        bufferStart: bufferStartStr,
        currentDayOfWeek,
        today: now.toISOString().split('T')[0]
      })

      // Get all stat entries in the current week
      const { data: weekData, error: weekError } = await supabase
        .from('stat_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('entry_date', weekStartStr)
        .lte('entry_date', weekEndStr)
        .order('entry_date', { ascending: true })

      if (weekError) {
        console.error('Week data error:', weekError)
        throw new Error('Failed to fetch weekly stat entries')
      }

      console.log('Week Data Found:', weekData?.length || 0, 'entries')

      // Get potential baseline from buffer window (Saturday 20:00 - Sunday 00:00 UTC)
      // IMPORTANT: created_at must be in buffer window AND entry_date must be before week start
      const { data: bufferData, error: bufferError } = await supabase
        .from('stat_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('created_at', bufferStartStr)
        .lt('created_at', weekStartFullStr)
        .lt('entry_date', weekStartStr)
        .order('created_at', { ascending: false })
        .limit(1)

      if (bufferError) {
        console.error('Error fetching buffer data:', bufferError)
      }

      console.log('Buffer Data Found:', bufferData?.length || 0, 'entries')

      let baselineEntry = null
      let latestEntry = null

      // Determine baseline: buffer upload OR earliest upload in week
      if (bufferData && bufferData.length > 0) {
        baselineEntry = bufferData[0]
        console.log('Using buffer as baseline:', baselineEntry.entry_date)
      } else if (weekData && weekData.length > 0) {
        baselineEntry = weekData[0]
        console.log('Using first week entry as baseline:', baselineEntry.entry_date)
      } else {
        console.log('No baseline found - returning zeros')
      }

      // Determine latest: most recent upload in week (MUST be from weekData, not buffer)
      if (weekData && weekData.length > 0) {
        latestEntry = weekData[weekData.length - 1]
        console.log('Latest entry selected:', latestEntry.entry_date)
      } else {
        console.log('No latest found - returning zeros')
      }

      // Strict validation: Must have BOTH baseline and latest, AND they must be different entries
      if (!baselineEntry || !latestEntry) {
        console.log('Missing baseline or latest - returning zeros')
        return {
          totalXP: 0,
          pokemonCaught: 0,
          distanceWalked: 0,
          pokestopsVisited: 0,
          uniquePokedexEntries: 0,
          xpPerDay: 0,
          catchesPerDay: 0,
          distancePerDay: 0,
          stopsPerDay: 0,
          startDate: weekStartStr,
          endDate: weekEndStr
        }
      }

      // Check if baseline and latest are the same entry (only 1 upload in week)
      if (baselineEntry.id === latestEntry.id) {
        console.log('Baseline equals latest (same entry) - returning zeros')
        return {
          totalXP: 0,
          pokemonCaught: 0,
          distanceWalked: 0,
          pokestopsVisited: 0,
          uniquePokedexEntries: 0,
          xpPerDay: 0,
          catchesPerDay: 0,
          distancePerDay: 0,
          stopsPerDay: 0,
          startDate: weekStartStr,
          endDate: weekEndStr
        }
      }

      // Calculate deltas (latest - baseline)
      const totalXP = Math.max(0, latestEntry.total_xp - baselineEntry.total_xp)
      const pokemonCaught = Math.max(0, latestEntry.pokemon_caught - baselineEntry.pokemon_caught)
      const distanceWalked = Math.max(0, latestEntry.distance_walked - baselineEntry.distance_walked)
      const pokestopsVisited = Math.max(0, latestEntry.pokestops_visited - baselineEntry.pokestops_visited)
      const uniquePokedexEntries = Math.max(0, latestEntry.unique_pokedex_entries - baselineEntry.unique_pokedex_entries)

      console.log('Calculated Deltas:', {
        distance: distanceWalked,
        caught: pokemonCaught,
        stops: pokestopsVisited,
        xp: totalXP,
        baseline: baselineEntry.entry_date,
        latest: latestEntry.entry_date
      })

      // Return the calculated deltas with proper formatting
      return {
        totalXP,
        pokemonCaught,
        distanceWalked: Math.round(distanceWalked * 10) / 10, // One decimal place
        pokestopsVisited,
        uniquePokedexEntries,
        xpPerDay: Math.round(totalXP / 7),
        catchesPerDay: Math.round(pokemonCaught / 7),
        distancePerDay: Math.round((distanceWalked / 7) * 10) / 10,
        stopsPerDay: Math.round(pokestopsVisited / 7),
        startDate: weekStartStr,
        endDate: weekEndStr
      }
    } catch (error) {
      console.error('Error in calculateCurrentWeekGrindStats:', error)
      throw error
    }
  },

  // Calculate current month grind stats (1st day to last day of current month)
  async calculateCurrentMonthGrindStats(userId?: string): Promise<StatCalculationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id
      
      if (!targetUserId) {
        throw new Error('User not authenticated')
      }

      // Get user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('start_date')
        .eq('user_id', targetUserId)
        .single()

      if (profileError || !profile) {
        throw new Error('Profile not found')
      }

      // Calculate current month boundaries (1st day 00:00 UTC to last day 23:59 UTC)
      const now = new Date()
      
      // Start of current month (1st day at 00:00 UTC)
      const monthStart = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        1,  // 1st day of month
        0, 0, 0, 0
      ))
      
      // End of current month (last day at 23:59 UTC)
      const monthEnd = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,  // Next month
        0,  // 0th day = last day of current month
        23, 59, 59, 999
      ))

      // Calculate 4-hour buffer window before month start
      // Last day of previous month, 20:00 - first day of month, 00:00 UTC
      const bufferStart = new Date(Date.UTC(
        monthStart.getUTCFullYear(),
        monthStart.getUTCMonth(),
        0,  // Last day of previous month
        20, 0, 0, 0  // 20:00 UTC
      ))

      const monthStartStr = monthStart.toISOString().split('T')[0]
      const monthEndStr = monthEnd.toISOString().split('T')[0]
      const bufferStartStr = bufferStart.toISOString()
      const monthStartFullStr = monthStart.toISOString()

      console.log('Month Calculation Debug:', {
        monthStart: monthStartStr,
        monthEnd: monthEndStr,
        bufferStart: bufferStartStr,
        today: now.toISOString().split('T')[0]
      })

      // Get all stat entries in the current month
      const { data: monthData, error: monthError } = await supabase
        .from('stat_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('entry_date', monthStartStr)
        .lte('entry_date', monthEndStr)
        .order('entry_date', { ascending: true })

      if (monthError) {
        console.error('Month data error:', monthError)
        throw new Error('Failed to fetch monthly stat entries')
      }

      console.log('Month Data Found:', monthData?.length || 0, 'entries')

      // Get potential baseline from buffer window
      const { data: bufferData, error: bufferError } = await supabase
        .from('stat_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('created_at', bufferStartStr)
        .lt('created_at', monthStartFullStr)
        .lt('entry_date', monthStartStr)
        .order('created_at', { ascending: false })
        .limit(1)

      if (bufferError) {
        console.error('Error fetching buffer data:', bufferError)
      }

      console.log('Buffer Data Found:', bufferData?.length || 0, 'entries')

      let baselineEntry = null
      let latestEntry = null

      // Determine baseline: buffer upload OR earliest upload in month
      if (bufferData && bufferData.length > 0) {
        baselineEntry = bufferData[0]
        console.log('Using buffer as baseline:', baselineEntry.entry_date)
      } else if (monthData && monthData.length > 0) {
        baselineEntry = monthData[0]
        console.log('Using first month entry as baseline:', baselineEntry.entry_date)
      } else {
        console.log('No baseline found - returning zeros')
      }

      // Determine latest: most recent upload in month
      if (monthData && monthData.length > 0) {
        latestEntry = monthData[monthData.length - 1]
        console.log('Latest entry selected:', latestEntry.entry_date)
      } else {
        console.log('No latest found - returning zeros')
      }

      // Strict validation: Must have BOTH baseline and latest, AND they must be different
      if (!baselineEntry || !latestEntry) {
        console.log('Missing baseline or latest - returning zeros')
        return {
          totalXP: 0,
          pokemonCaught: 0,
          distanceWalked: 0,
          pokestopsVisited: 0,
          uniquePokedexEntries: 0,
          xpPerDay: 0,
          catchesPerDay: 0,
          distancePerDay: 0,
          stopsPerDay: 0,
          startDate: monthStartStr,
          endDate: monthEndStr
        }
      }

      // Check if baseline and latest are the same entry
      if (baselineEntry.id === latestEntry.id) {
        console.log('Baseline equals latest (same entry) - returning zeros')
        return {
          totalXP: 0,
          pokemonCaught: 0,
          distanceWalked: 0,
          pokestopsVisited: 0,
          uniquePokedexEntries: 0,
          xpPerDay: 0,
          catchesPerDay: 0,
          distancePerDay: 0,
          stopsPerDay: 0,
          startDate: monthStartStr,
          endDate: monthEndStr
        }
      }

      // Calculate deltas (latest - baseline)
      const totalXP = Math.max(0, latestEntry.total_xp - baselineEntry.total_xp)
      const pokemonCaught = Math.max(0, latestEntry.pokemon_caught - baselineEntry.pokemon_caught)
      const distanceWalked = Math.max(0, latestEntry.distance_walked - baselineEntry.distance_walked)
      const pokestopsVisited = Math.max(0, latestEntry.pokestops_visited - baselineEntry.pokestops_visited)
      const uniquePokedexEntries = Math.max(0, latestEntry.unique_pokedex_entries - baselineEntry.unique_pokedex_entries)

      // Calculate days in current month so far
      const daysInMonth = now.getUTCDate() // Days from 1st to today

      console.log('Calculated Monthly Deltas:', {
        distance: distanceWalked,
        caught: pokemonCaught,
        stops: pokestopsVisited,
        xp: totalXP,
        baseline: baselineEntry.entry_date,
        latest: latestEntry.entry_date,
        daysInMonth
      })

      // Return the calculated deltas with proper formatting
      return {
        totalXP,
        pokemonCaught,
        distanceWalked: Math.round(distanceWalked * 10) / 10, // One decimal place
        pokestopsVisited,
        uniquePokedexEntries,
        xpPerDay: Math.round(totalXP / daysInMonth),
        catchesPerDay: Math.round(pokemonCaught / daysInMonth),
        distancePerDay: Math.round((distanceWalked / daysInMonth) * 10) / 10,
        stopsPerDay: Math.round(pokestopsVisited / daysInMonth),
        startDate: monthStartStr,
        endDate: monthEndStr
      }
    } catch (error) {
      console.error('Error in calculateCurrentMonthGrindStats:', error)
      throw error
    }
  },

  // OLD FUNCTION - Calculate monthly grind stats (last 30 days)
  // DEPRECATED: Use calculateCurrentMonthGrindStats instead
  async calculateMonthlyGrindStats(userId?: string): Promise<StatCalculationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id
      
      if (!targetUserId) {
        throw new Error('User not authenticated')
      }

      // Get user's profile to check start date
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('start_date')
        .eq('user_id', targetUserId)
        .single()

      if (profileError || !profile) {
        throw new Error('Profile not found')
      }

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 30)

      const endDateStr = endDate.toISOString().split('T')[0]

      // Check if user's start date is after our calculated start date
      // If so, use the user's start date instead
      // Parse date in a timezone-safe way by adding 'T00:00:00' to force local timezone
      const userStartDate = new Date(profile.start_date + 'T00:00:00')
      const adjustedStartDate = userStartDate > startDate ? userStartDate : startDate
      const adjustedStartDateStr = adjustedStartDate.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('stat_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('entry_date', adjustedStartDateStr)
        .lte('entry_date', endDateStr)
        .order('entry_date', { ascending: true })

      if (error) {
        throw new Error('Failed to fetch monthly stat entries')
      }

      let firstEntry, lastEntry

      if (!data || data.length === 0) {
        // No data in the period, try to get any available data
        const { data: allData, error: allError } = await supabase
          .from('stat_entries')
          .select('*')
          .eq('user_id', targetUserId)
          .order('entry_date', { ascending: true })

        if (allError || !allData || allData.length === 0) {
          return {
            totalXP: 0,
            pokemonCaught: 0,
            distanceWalked: 0,
            pokestopsVisited: 0,
            uniquePokedexEntries: 0,
            xpPerDay: 0,
            catchesPerDay: 0,
            distancePerDay: 0,
            stopsPerDay: 0,
            startDate: adjustedStartDateStr,
            endDate: endDateStr
          }
        }

        // Use the first and last available entries
        firstEntry = allData[0]
        lastEntry = allData[allData.length - 1]
      } else if (data.length === 1) {
        // Only one entry in the period, use it for both first and last
        firstEntry = data[0]
        lastEntry = data[0]
      } else {
        // Multiple entries, use first and last
        firstEntry = data[0]
        lastEntry = data[data.length - 1]
      }

      // For monthly stats, use the actual 30-day period, not just the days between entries
      const actualDaysDiff = getDaysDifference(adjustedStartDateStr, endDateStr)

      const totalXP = Math.max(0, lastEntry.total_xp - firstEntry.total_xp)
      const pokemonCaught = Math.max(0, lastEntry.pokemon_caught - firstEntry.pokemon_caught)
      const distanceWalked = Math.max(0, lastEntry.distance_walked - firstEntry.distance_walked)
      const pokestopsVisited = Math.max(0, lastEntry.pokestops_visited - firstEntry.pokestops_visited)
      const uniquePokedexEntries = Math.max(0, lastEntry.unique_pokedex_entries - firstEntry.unique_pokedex_entries)

      return {
        totalXP,
        pokemonCaught,
        distanceWalked,
        pokestopsVisited,
        uniquePokedexEntries,
        xpPerDay: Math.round(totalXP / actualDaysDiff),
        catchesPerDay: Math.round(pokemonCaught / actualDaysDiff),
        distancePerDay: Math.round((distanceWalked / actualDaysDiff) * 10) / 10,
        stopsPerDay: Math.round(pokestopsVisited / actualDaysDiff),
        startDate: adjustedStartDateStr,
        endDate: endDateStr
      }
    } catch (error) {
      throw error
    }
  },

  // Calculate all-time grind stats (from start date to current)
  async calculateAllTimeGrindStats(userId?: string): Promise<StatCalculationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id
      
      if (!targetUserId) {
        throw new Error('User not authenticated')
      }

      // Get user's profile to find start date
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('start_date, total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries')
        .eq('user_id', targetUserId)
        .single()

      if (profileError || !profile) {
        throw new Error('Profile not found')
      }

      if (!profile.start_date) {
        throw new Error('Start date not set in profile')
      }

      // Calculate days from start date to current day
      // Parse date in a timezone-safe way by adding 'T00:00:00' to force local timezone
      const startDate = new Date(profile.start_date + 'T00:00:00')
      const currentDate = new Date()
      const daysPlayed = Math.max(1, Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))

      // Use current total stats (not delta between dates)
      const totalXP = profile.total_xp || 0
      const pokemonCaught = profile.pokemon_caught || 0
      const distanceWalked = profile.distance_walked || 0
      const pokestopsVisited = profile.pokestops_visited || 0
      const uniquePokedexEntries = profile.unique_pokedex_entries || 0

      // Calculate daily averages
      const xpPerDay = totalXP / daysPlayed >= 1000 
        ? Math.round(((totalXP / daysPlayed) / 1000) * 10) / 10 // Convert XP to K and round to tenth
        : Math.round((totalXP / daysPlayed) * 10) / 10 // Round to nearest tenth
      const catchesPerDay = Math.round((pokemonCaught / daysPlayed) * 10) / 10 // Round to nearest tenth
      const distancePerDay = Math.round((distanceWalked / daysPlayed) * 10) / 10 // Keep one decimal place for distance
      const stopsPerDay = Math.round((pokestopsVisited / daysPlayed) * 10) / 10 // Round to nearest tenth

      return {
        totalXP,
        pokemonCaught,
        distanceWalked,
        pokestopsVisited,
        uniquePokedexEntries,
        xpPerDay,
        catchesPerDay,
        distancePerDay,
        stopsPerDay,
        startDate: profile.start_date,
        endDate: currentDate.toISOString().split('T')[0]
      }
    } catch (error) {
      throw error
    }
  },

  // Get Community Day stats for a specific date
  async getCommunityDayStats(date: string): Promise<StatCalculationResult> {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('stat_entries')
        .select('*')
        .gte('entry_date', startOfDay.toISOString())
        .lte('entry_date', endOfDay.toISOString())
        .order('entry_date', { ascending: true })

      if (error) {
        throw new Error('Failed to fetch Community Day stats')
      }

      if (!data || data.length < 2) {
        throw new Error('Not enough data points for the selected Community Day')
      }

      const firstEntry = data[0]
      const lastEntry = data[data.length - 1]

      const totalXP = lastEntry.total_xp - firstEntry.total_xp
      const pokemonCaught = lastEntry.pokemon_caught - firstEntry.pokemon_caught
      const distanceWalked = lastEntry.distance_walked - firstEntry.distance_walked
      const pokestopsVisited = lastEntry.pokestops_visited - firstEntry.pokestops_visited
      const uniquePokedexEntries = lastEntry.unique_pokedex_entries - firstEntry.unique_pokedex_entries

      // For Community Day, we calculate hourly rates instead of daily
      const hoursDiff = 3 // Standard Community Day duration

      return {
        totalXP,
        pokemonCaught,
        distanceWalked,
        pokestopsVisited,
        uniquePokedexEntries,
        xpPerDay: Math.round(totalXP / hoursDiff),
        catchesPerDay: Math.round(pokemonCaught / hoursDiff),
        distancePerDay: Math.round(distanceWalked / hoursDiff),
        stopsPerDay: Math.round(pokestopsVisited / hoursDiff),
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString()
      }
    } catch (error) {
      throw error
    }
  },

  // Get average stats for radar chart comparison
  async getAverageStats() {
    const { data, error } = await supabase
      .from('profiles')
      .select('total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, trainer_level')

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return {
        total_xp: 0,
        pokemon_caught: 0,
        distance_walked: 0,
        pokestops_visited: 0,
        unique_pokedex_entries: 0,
        trainer_level: 0
      }
    }

    const count = data.length
    return {
      total_xp: Math.round(data.reduce((sum: number, p: any) => sum + p.total_xp, 0) / count),
      pokemon_caught: Math.round(data.reduce((sum: number, p: any) => sum + p.pokemon_caught, 0) / count),
      distance_walked: Math.round(data.reduce((sum: number, p: any) => sum + p.distance_walked, 0) / count * 10) / 10,
      pokestops_visited: Math.round(data.reduce((sum: number, p: any) => sum + p.pokestops_visited, 0) / count),
      unique_pokedex_entries: Math.round(data.reduce((sum: number, p: any) => sum + p.unique_pokedex_entries, 0) / count),
      trainer_level: Math.round(data.reduce((sum: number, p: any) => sum + p.trainer_level, 0) / count)
    }
  },

  // Get country average stats for radar chart
  async getCountryAverageStats(country: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, trainer_level')
      .eq('country', country)

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return {
        total_xp: 0,
        pokemon_caught: 0,
        distance_walked: 0,
        pokestops_visited: 0,
        unique_pokedex_entries: 0,
        trainer_level: 0
      }
    }

    const count = data.length
    return {
      total_xp: Math.round(data.reduce((sum: number, p: any) => sum + p.total_xp, 0) / count),
      pokemon_caught: Math.round(data.reduce((sum: number, p: any) => sum + p.pokemon_caught, 0) / count),
      distance_walked: Math.round(data.reduce((sum: number, p: any) => sum + p.distance_walked, 0) / count * 10) / 10,
      pokestops_visited: Math.round(data.reduce((sum: number, p: any) => sum + p.pokestops_visited, 0) / count),
      unique_pokedex_entries: Math.round(data.reduce((sum: number, p: any) => sum + p.unique_pokedex_entries, 0) / count),
      trainer_level: Math.round(data.reduce((sum: number, p: any) => sum + p.trainer_level, 0) / count)
    }
  },

  // Get team average stats for radar chart
  async getTeamAverageStats(teamColor: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, trainer_level')
      .eq('team_color', teamColor)

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return {
        total_xp: 0,
        pokemon_caught: 0,
        distance_walked: 0,
        pokestops_visited: 0,
        unique_pokedex_entries: 0,
        trainer_level: 0
      }
    }

    const count = data.length
    return {
      total_xp: Math.round(data.reduce((sum: number, p: any) => sum + p.total_xp, 0) / count),
      pokemon_caught: Math.round(data.reduce((sum: number, p: any) => sum + p.pokemon_caught, 0) / count),
      distance_walked: Math.round(data.reduce((sum: number, p: any) => sum + p.distance_walked, 0) / count * 10) / 10,
      pokestops_visited: Math.round(data.reduce((sum: number, p: any) => sum + p.pokestops_visited, 0) / count),
      unique_pokedex_entries: Math.round(data.reduce((sum: number, p: any) => sum + p.unique_pokedex_entries, 0) / count),
      trainer_level: Math.round(data.reduce((sum: number, p: any) => sum + p.trainer_level, 0) / count)
    }
  },

  // OPTIMIZED: Get all period stats in a single query with aggregations
  async getPeriodRadarData(profileId: string, country: string, teamColor: string, period: 'weekly' | 'monthly') {
    const viewName = period === 'weekly' ? 'current_weekly_leaderboard' : 'current_monthly_leaderboard'
    
    // Single optimized query to get all data at once
    const { data, error } = await supabase
      .from(viewName)
      .select('profile_id, country, team_color, xp_delta, catches_delta, distance_delta, pokestops_delta, dex_delta')
      .limit(1000) // Reasonable limit for performance

    if (error) {
      console.error('Period radar data error:', error)
      throw error
    }

    // Get latest Dex totals for all users (Dex is cumulative, not delta-based)
    const { data: dexTotals, error: dexError } = await supabase
      .from('profiles')
      .select('id, unique_pokedex_entries')
      .limit(1000)

    if (dexError) {
      console.error('Dex totals error:', dexError)
    }

    // Create a map of profile_id -> dex_total for quick lookup
    const dexMap = new Map<string, number>()
    if (dexTotals) {
      dexTotals.forEach((profile: any) => {
        dexMap.set(profile.id, profile.unique_pokedex_entries || 0)
      })
    }

    if (!data || data.length === 0) {
      // Return empty structure
      return {
        playerStats: null,
        globalAverages: { total_xp: 0, pokemon_caught: 0, distance_walked: 0, pokestops_visited: 0, unique_pokedex_entries: 0 },
        countryAverages: { total_xp: 0, pokemon_caught: 0, distance_walked: 0, pokestops_visited: 0, unique_pokedex_entries: 0 },
        teamAverages: { total_xp: 0, pokemon_caught: 0, distance_walked: 0, pokestops_visited: 0, unique_pokedex_entries: 0 },
        allUserStats: [],
        statBounds: {
          total_xp: { min: 0, max: 1 },
          pokemon_caught: { min: 0, max: 1 },
          distance_walked: { min: 0, max: 1 },
          pokestops_visited: { min: 0, max: 1 },
          unique_pokedex_entries: { min: 0, max: 1 }
        }
      }
    }

    // Process all data in a single pass for efficiency
    let playerStats = null
    let globalSum = { xp: 0, catches: 0, distance: 0, stops: 0, dex: 0 }
    let countrySum = { xp: 0, catches: 0, distance: 0, stops: 0, dex: 0, count: 0 }
    let teamSum = { xp: 0, catches: 0, distance: 0, stops: 0, dex: 0, count: 0 }
    const allStats: any[] = []
    const xpValues: number[] = []
    const catchesValues: number[] = []
    const distanceValues: number[] = []
    const stopsValues: number[] = []
    const dexValues: number[] = []

    // Single iteration through data
    data.forEach((entry: any) => {
      const xp = entry.xp_delta || 0
      const catches = entry.catches_delta || 0
      const distance = entry.distance_delta || 0
      const stops = entry.pokestops_delta || 0
      // For Dex, use the total from profiles (cumulative), not delta
      const dex = dexMap.get(entry.profile_id) || 0

      // Check if this is the player
      if (entry.profile_id === profileId) {
        playerStats = {
          total_xp: xp,
          pokemon_caught: catches,
          distance_walked: distance,
          pokestops_visited: stops,
          unique_pokedex_entries: dex // Use total Dex
        }
      }

      // Global aggregation
      globalSum.xp += xp
      globalSum.catches += catches
      globalSum.distance += distance
      globalSum.stops += stops
      globalSum.dex += dex // Sum totals for averaging

      // Country aggregation
      if (entry.country === country) {
        countrySum.xp += xp
        countrySum.catches += catches
        countrySum.distance += distance
        countrySum.stops += stops
        countrySum.dex += dex // Sum totals for averaging
        countrySum.count++
      }

      // Team aggregation
      if (entry.team_color === teamColor) {
        teamSum.xp += xp
        teamSum.catches += catches
        teamSum.distance += distance
        teamSum.stops += stops
        teamSum.dex += dex // Sum totals for averaging
        teamSum.count++
      }

      // For normalization
      allStats.push({
        total_xp: xp,
        pokemon_caught: catches,
        distance_walked: distance,
        pokestops_visited: stops,
        unique_pokedex_entries: dex // Use total Dex
      })

      // For bounds calculation
      xpValues.push(xp)
      catchesValues.push(catches)
      distanceValues.push(distance)
      stopsValues.push(stops)
      dexValues.push(dex) // Use total Dex for bounds
    })

    const totalCount = data.length

    return {
      playerStats,
      globalAverages: {
        total_xp: totalCount > 0 ? Math.round(globalSum.xp / totalCount) : 0,
        pokemon_caught: totalCount > 0 ? Math.round(globalSum.catches / totalCount) : 0,
        distance_walked: totalCount > 0 ? Math.round((globalSum.distance / totalCount) * 10) / 10 : 0,
        pokestops_visited: totalCount > 0 ? Math.round(globalSum.stops / totalCount) : 0,
        unique_pokedex_entries: totalCount > 0 ? Math.round(globalSum.dex / totalCount) : 0
      },
      countryAverages: {
        total_xp: countrySum.count > 0 ? Math.round(countrySum.xp / countrySum.count) : 0,
        pokemon_caught: countrySum.count > 0 ? Math.round(countrySum.catches / countrySum.count) : 0,
        distance_walked: countrySum.count > 0 ? Math.round((countrySum.distance / countrySum.count) * 10) / 10 : 0,
        pokestops_visited: countrySum.count > 0 ? Math.round(countrySum.stops / countrySum.count) : 0,
        unique_pokedex_entries: countrySum.count > 0 ? Math.round(countrySum.dex / countrySum.count) : 0
      },
      teamAverages: {
        total_xp: teamSum.count > 0 ? Math.round(teamSum.xp / teamSum.count) : 0,
        pokemon_caught: teamSum.count > 0 ? Math.round(teamSum.catches / teamSum.count) : 0,
        distance_walked: teamSum.count > 0 ? Math.round((teamSum.distance / teamSum.count) * 10) / 10 : 0,
        pokestops_visited: teamSum.count > 0 ? Math.round(teamSum.stops / teamSum.count) : 0,
        unique_pokedex_entries: teamSum.count > 0 ? Math.round(teamSum.dex / teamSum.count) : 0
      },
      allUserStats: allStats,
      statBounds: {
        total_xp: { min: Math.min(...xpValues), max: Math.max(...xpValues) },
        pokemon_caught: { min: Math.min(...catchesValues), max: Math.max(...catchesValues) },
        distance_walked: { min: Math.min(...distanceValues), max: Math.max(...distanceValues) },
        pokestops_visited: { min: Math.min(...stopsValues), max: Math.max(...stopsValues) },
        unique_pokedex_entries: { min: Math.min(...dexValues), max: Math.max(...dexValues) }
      }
    }
  },

  // Create a new stat entry
  async createStatEntry(stats: Omit<StatEntry, 'id' | 'user_id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('stat_entries')
      .insert({
        ...stats,
        user_id: user.id
      })
      .select()
      .single()

    return { data, error }
  },

  // Upload stat verification screenshot
  async uploadStatVerificationScreenshot(file: File): Promise<{ data: string | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: new Error('User not authenticated') }
      }

      const fileExt = file.name.split('.').pop()
      const timestamp = new Date().toISOString().replace(/[:.-]/g, '')
      const fileName = `${user.id}/stat-verification-${timestamp}.${fileExt}`

      // Upload file to storage
      const { data: _data, error } = await supabase.storage
        .from('stat-verification-screenshots')
        .upload(fileName, file, {
          upsert: false, // Don't overwrite existing files
          contentType: file.type
        })

      if (error) {
        return { data: null, error }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('stat-verification-screenshots')
        .getPublicUrl(fileName)

      return { data: publicUrl, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  async updateUserStats(updates: StatUpdate, verificationScreenshot?: File, acknowledgeError?: boolean): Promise<StatUpdateResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Require screenshot for stat updates
      if (!verificationScreenshot) {
        return { success: false, message: 'A verification screenshot is required to update stats' };
      }

      // Check daily upload limits based on user type
      // Use local date instead of UTC to match user's timezone
      const now = new Date();
      const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      
      // Get all today's entries to count uploads
      const { data: todayEntries } = await supabase
        .from('stat_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('entry_date', today);

      const uploadCount = todayEntries?.length || 0;

      // Get current profile to check user type and for validation
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError || !currentProfile) {
        return { success: false, message: 'Profile not found' };
      }

      // Check if free mode is enabled
      const { isFreeMode } = await featureFlagService.isFreeMode();

      // Determine if user is paid (has active subscription) or free mode is enabled
      const isPaidUser = isFreeMode || (currentProfile.is_paid_user && 
        (!currentProfile.subscription_expires_at || new Date(currentProfile.subscription_expires_at) > new Date()));
      
      // Set daily limits: 4 for paid users or free mode, 1 for trial users
      const dailyLimit = isPaidUser ? 4 : 1;
      const userType = isPaidUser ? 'paid' : 'trial';

      if (uploadCount >= dailyLimit) {
        return { 
          success: false, 
          message: `You have reached your daily upload limit (${uploadCount}/${dailyLimit} uploads used for ${userType} users). ${isPaidUser ? '' : 'Upgrade to premium for 4 uploads per day!'}`.trim()
        };
      }

      // Get the most recent stat entry to use for validation
      // Use compound sorting: entry_date DESC first, then created_at DESC for same-date entries
      const { data: latestStatEntry } = await supabase
        .from('stat_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Use the latest stat entry for validation if available, otherwise use profile
      const referenceStats = latestStatEntry || currentProfile;

      // Debug logging to help identify validation issues
      console.log('Validation Debug:', {
        updates,
        referenceStats: {
          total_xp: referenceStats.total_xp,
          pokemon_caught: referenceStats.pokemon_caught,
          distance_walked: referenceStats.distance_walked,
          pokestops_visited: referenceStats.pokestops_visited,
          unique_pokedex_entries: referenceStats.unique_pokedex_entries
        },
        latestStatEntry: !!latestStatEntry,
        comparisons: {
          total_xp: `${updates.total_xp} vs ${referenceStats.total_xp} = ${updates.total_xp !== undefined ? (updates.total_xp < referenceStats.total_xp) : 'undefined'}`,
          pokemon_caught: `${updates.pokemon_caught} vs ${referenceStats.pokemon_caught} = ${updates.pokemon_caught !== undefined ? (updates.pokemon_caught < referenceStats.pokemon_caught) : 'undefined'}`,
          distance_walked: `${updates.distance_walked} vs ${referenceStats.distance_walked} = ${updates.distance_walked !== undefined ? (updates.distance_walked < referenceStats.distance_walked) : 'undefined'}`,
          pokestops_visited: `${updates.pokestops_visited} vs ${referenceStats.pokestops_visited} = ${updates.pokestops_visited !== undefined ? (updates.pokestops_visited < referenceStats.pokestops_visited) : 'undefined'}`
        }
      });

      // Validate that new stats are not lower than most recent stats (prevent cheating)
      // Skip validation if user acknowledges previous error
      const validationErrors: string[] = [];
      
      if (!acknowledgeError) {
        if (updates.total_xp !== undefined && referenceStats.total_xp !== null && updates.total_xp < referenceStats.total_xp) {
          validationErrors.push(`Total XP cannot be lower than current value (${updates.total_xp} < ${referenceStats.total_xp})`);
        }
        if (updates.pokemon_caught !== undefined && referenceStats.pokemon_caught !== null && updates.pokemon_caught < referenceStats.pokemon_caught) {
          validationErrors.push(`Pokémon caught cannot be lower than current value (${updates.pokemon_caught} < ${referenceStats.pokemon_caught})`);
        }
        if (updates.distance_walked !== undefined && referenceStats.distance_walked !== null && updates.distance_walked < referenceStats.distance_walked) {
          validationErrors.push(`Distance walked cannot be lower than current value (${updates.distance_walked} < ${referenceStats.distance_walked})`);
        }
        if (updates.pokestops_visited !== undefined && referenceStats.pokestops_visited !== null && updates.pokestops_visited < referenceStats.pokestops_visited) {
          validationErrors.push(`PokéStops visited cannot be lower than current value (${updates.pokestops_visited} < ${referenceStats.pokestops_visited})`);
        }
        if (updates.unique_pokedex_entries !== undefined && referenceStats.unique_pokedex_entries !== null && updates.unique_pokedex_entries < referenceStats.unique_pokedex_entries) {
          validationErrors.push(`Pokédex entries cannot be lower than current value (${updates.unique_pokedex_entries} < ${referenceStats.unique_pokedex_entries})`);
        }

        if (validationErrors.length > 0) {
          return { success: false, message: validationErrors.join(', ') };
        }
      }

      // Create the new stat entry data
      // IMPORTANT: trainer_level should ALWAYS come from currentProfile, never from updates or old stat_entries
      // This prevents level from being accidentally reset during stat updates
      const newStatEntry = {
        user_id: user.id,
        profile_id: currentProfile.id,
        distance_walked: updates.distance_walked ?? referenceStats.distance_walked,
        pokemon_caught: updates.pokemon_caught ?? referenceStats.pokemon_caught,
        pokestops_visited: updates.pokestops_visited ?? referenceStats.pokestops_visited,
        total_xp: updates.total_xp ?? referenceStats.total_xp,
        unique_pokedex_entries: updates.unique_pokedex_entries ?? referenceStats.unique_pokedex_entries,
        trainer_level: currentProfile.trainer_level, // Always use current profile level, never fallback to old stat_entry
        entry_date: today
      };

      // Create new entry for today
      const { data: statEntryData, error: statEntryError } = await supabase
        .from('stat_entries')
        .insert(newStatEntry)
        .select('*')
        .single();

      if (statEntryError) {
        console.error('Error creating stat entry:', statEntryError);
        return { success: false, message: 'Failed to update stats' };
      }

      // Check if user has 7 or more screenshots, and delete the oldest if so
      const { data: existingScreenshots, error: fetchError } = await supabase
        .from('stat_verification_screenshots')
        .select('id, screenshot_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }); // Oldest first

      if (fetchError) {
        console.error('Error fetching existing screenshots:', fetchError);
      }

      // If user has 7 or more screenshots, delete the oldest one
      if (existingScreenshots && existingScreenshots.length >= 7) {
        const oldestScreenshot = existingScreenshots[0];
        
        // Delete from storage
        try {
          const urlParts = oldestScreenshot.screenshot_url.split('/');
          const filePath = urlParts.slice(-2).join('/'); // Get user_id/filename
          
          const { error: storageDeleteError } = await supabase.storage
            .from('stat-verification-screenshots')
            .remove([filePath]);
          
          if (storageDeleteError) {
            console.error('Error deleting old screenshot from storage:', storageDeleteError);
          }
        } catch (err) {
          console.error('Error parsing screenshot URL for deletion:', err);
        }

        // Delete from database
        const { error: dbDeleteError } = await supabase
          .from('stat_verification_screenshots')
          .delete()
          .eq('id', oldestScreenshot.id);

        if (dbDeleteError) {
          console.error('Error deleting old screenshot record:', dbDeleteError);
        } else {
          console.log('Deleted oldest screenshot to maintain limit of 7');
        }
      }

      // Upload verification screenshot
      const screenshotResult = await dashboardService.uploadStatVerificationScreenshot(verificationScreenshot);
      if (screenshotResult.error) {
        console.error('Error uploading verification screenshot:', screenshotResult.error);
        return { success: false, message: 'Failed to upload verification screenshot' };
      }

      // Store verification screenshot record
      const { error: verificationError } = await supabase
        .from('stat_verification_screenshots')
        .insert({
          user_id: user.id,
          stat_entry_id: statEntryData.id,
          screenshot_url: screenshotResult.data,
          entry_date: today
        })
        .select()
        .single();

      if (verificationError) {
        console.error('Error storing verification screenshot record:', verificationError);
        return { success: false, message: 'Failed to store verification record' };
      }

      // Update the profile with the latest stats to keep it current
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          distance_walked: newStatEntry.distance_walked,
          pokemon_caught: newStatEntry.pokemon_caught,
          pokestops_visited: newStatEntry.pokestops_visited,
          total_xp: newStatEntry.total_xp,
          unique_pokedex_entries: newStatEntry.unique_pokedex_entries,
          trainer_level: newStatEntry.trainer_level,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return { success: false, message: 'Failed to update profile' };
      }

      return { 
        success: true, 
        message: 'Stats updated successfully!',
        updatedProfile: updatedProfile as PublicProfile
      };

    } catch (error) {
      console.error('Error in updateUserStats:', error);
      return { success: false, message: 'An unexpected error occurred' };
    }
  },

  async getStatUpdateHistory(limit: number = 30): Promise<StatEntry[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Use compound sorting: entry_date DESC first, then created_at DESC for same-date entries
      const { data, error } = await supabase
        .from('stat_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching stat history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getStatUpdateHistory:', error);
      return [];
    }
  },

  // Get verification screenshots for a user (for public viewing)
  async getVerificationScreenshots(userId: string, limit: number = 30): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('stat_verification_screenshots')
        .select(`
          *,
          stat_entries!inner(
            entry_date,
            total_xp,
            pokemon_caught,
            distance_walked,
            pokestops_visited,
            unique_pokedex_entries,
            trainer_level
          )
        `)
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching verification screenshots:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getVerificationScreenshots:', error);
      return [];
    }
  },

  // Get min and max stats from paid users
  async getPaidUserStatBounds(): Promise<StatBounds> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries
      `)
      .eq('is_paid_user', true)
      .not('total_xp', 'is', null)

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      // Return default bounds if no paid users exist
      return {
        total_xp: { min: 0, max: 100000 },
        pokemon_caught: { min: 0, max: 1000 },
        distance_walked: { min: 0, max: 100 },
        pokestops_visited: { min: 0, max: 1000 },
        unique_pokedex_entries: { min: 0, max: 500 }
      }
    }

    return {
      total_xp: {
        min: Math.min(...data.map(d => d.total_xp || 0)),
        max: Math.max(...data.map(d => d.total_xp || 0))
      },
      pokemon_caught: {
        min: Math.min(...data.map(d => d.pokemon_caught || 0)),
        max: Math.max(...data.map(d => d.pokemon_caught || 0))
      },
      distance_walked: {
        min: Math.min(...data.map(d => d.distance_walked || 0)),
        max: Math.max(...data.map(d => d.distance_walked || 0))
      },
      pokestops_visited: {
        min: Math.min(...data.map(d => d.pokestops_visited || 0)),
        max: Math.max(...data.map(d => d.pokestops_visited || 0))
      },
      unique_pokedex_entries: {
        min: Math.min(...data.map(d => d.unique_pokedex_entries || 0)),
        max: Math.max(...data.map(d => d.unique_pokedex_entries || 0))
      }
    }
  },

  // Get all user stats for percentile-based normalization
  async getAllUserStats() {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        total_xp,
        pokemon_caught,
        distance_walked,
        pokestops_visited,
        unique_pokedex_entries
      `)
      .not('total_xp', 'is', null)

    if (error) {
      throw error
    }

    return data || []
  },

  // Get daily upload status for current user
  async getDailyUploadStatus(): Promise<{ data: DailyUploadStatus | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      // Use local date instead of UTC to match user's timezone
      const now = new Date();
      const today = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      
      // Get all today's entries to count uploads
      const { data: todayEntries } = await supabase
        .from('stat_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('entry_date', today);

      const uploadsUsed = todayEntries?.length || 0;

      // Get current profile to check user type
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('is_paid_user, subscription_expires_at')
        .eq('user_id', user.id)
        .single();

      if (profileError || !currentProfile) {
        return { data: null, error: profileError || new Error('Profile not found') };
      }

      // Check if free mode is enabled
      const { isFreeMode } = await featureFlagService.isFreeMode();

      // Determine if user is paid (has active subscription) or free mode is enabled
      const isPaidUser = isFreeMode || (currentProfile.is_paid_user && 
        (!currentProfile.subscription_expires_at || new Date(currentProfile.subscription_expires_at) > new Date()));
      
      // Set daily limits: 4 for paid users or free mode, 1 for trial users
      const dailyLimit = isPaidUser ? 4 : 1;
      const userType = isPaidUser ? 'paid' : 'trial';
      const canUpload = uploadsUsed < dailyLimit;

      return {
        data: {
          uploadsUsed,
          dailyLimit,
          canUpload,
          isPaidUser,
          userType
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }
} 

function getDaysDifference(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  const daysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  // Ensure we never return 0 to prevent division by zero
  return Math.max(1, daysDiff)
} 