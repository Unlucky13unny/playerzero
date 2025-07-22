import { supabase } from '../supabaseClient'

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
  total_xp?: number
  pokemon_caught?: number
  distance_walked?: number
  pokestops_visited?: number
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
  sortBy: 'xp' | 'catches' | 'distance' | 'pokestops';
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

export const dashboardService = {
  // Get leaderboard data
  async getLeaderboard(params: LeaderboardParams) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    let query: string
    
    if (params.period === 'weekly') {
      // Show completed week leaderboard
      return this.getCompletedPeriodLeaderboard('weekly', params)
    } else if (params.period === 'monthly') {
      // Show completed month leaderboard
      return this.getCompletedPeriodLeaderboard('monthly', params)
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

    const { data, error } = await dbQuery.limit(100)

    if (error) {
      console.error('Leaderboard query error:', error)
      throw error
    }

    // Sort the data for all-time only (weekly/monthly are handled by getCompletedPeriodLeaderboard)
    if (data && data.length > 0 && params.period === 'all-time') {
      const sortField = params.sortBy === 'xp' ? 'total_xp' : 
                       params.sortBy === 'catches' ? 'pokemon_caught' : 
                       params.sortBy === 'distance' ? 'distance_walked' : 'pokestops_visited'
      
      data.sort((a: any, b: any) => (b[sortField] || 0) - (a[sortField] || 0))
    }

    return { data: data as LeaderboardEntry[], error: null }
  },

  // Get completed period leaderboard
  async getCompletedPeriodLeaderboard(periodType: 'weekly' | 'monthly', params: LeaderboardParams) {
    // First ensure periods are completed
    await this.checkAndCompletePeriods()

    // Get the period dates
    const { data: periodData, error: periodError } = await supabase.rpc(
      periodType === 'weekly' ? 'get_last_completed_week' : 'get_last_completed_month'
    )

    if (periodError || !periodData || periodData.length === 0) {
      return { data: [], error: periodError }
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
      throw error
    }

    // Apply filters and sorting
    let filteredData = data || []

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
      const { data, error } = await supabase.storage
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

  async updateUserStats(updates: StatUpdate, verificationScreenshot?: File): Promise<StatUpdateResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
      }

      // Require screenshot for stat updates
      if (!verificationScreenshot) {
        return { success: false, message: 'A verification screenshot is required to update stats' };
      }

      // Check if user has already updated today (enforce once-per-day limit)
      const today = new Date().toISOString().split('T')[0];
      const { data: existingTodayEntry } = await supabase
        .from('stat_entries')
        .select('id')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .single();

      if (existingTodayEntry) {
        return { 
          success: false, 
          message: 'You have already updated your stats today. Stats can only be updated once per day.' 
        };
      }

      // Get current profile
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError || !currentProfile) {
        return { success: false, message: 'Profile not found' };
      }

      // Get the most recent stat entry to use for validation
      const { data: latestStatEntry } = await supabase
        .from('stat_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
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
      const validationErrors: string[] = [];
      
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

      // Create the new stat entry data
      const newStatEntry = {
        user_id: user.id,
        profile_id: currentProfile.id,
        distance_walked: updates.distance_walked ?? referenceStats.distance_walked,
        pokemon_caught: updates.pokemon_caught ?? referenceStats.pokemon_caught,
        pokestops_visited: updates.pokestops_visited ?? referenceStats.pokestops_visited,
        total_xp: updates.total_xp ?? referenceStats.total_xp,
        unique_pokedex_entries: updates.unique_pokedex_entries ?? referenceStats.unique_pokedex_entries,
        trainer_level: updates.trainer_level ?? referenceStats.trainer_level,
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

      const { data, error } = await supabase
        .from('stat_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
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
  }
} 

function getDaysDifference(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
} 