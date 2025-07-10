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

export const dashboardService = {
  // Get leaderboard data
  async getLeaderboard(params: LeaderboardParams) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    let query: string
    
    if (params.period === 'weekly') {
      query = 'weekly_leaderboard'
    } else if (params.period === 'monthly') {
      query = 'monthly_leaderboard'
    } else {
      query = 'all_time_leaderboard'
    }

    let dbQuery = supabase.from(query).select('*')

    // Apply view filters
    if (params.view === 'country' && params.filterValue) {
      dbQuery = dbQuery.eq('country', params.filterValue)
    } else if (params.view === 'team' && params.filterValue) {
      dbQuery = dbQuery.eq('team_color', params.filterValue)
    } else if (params.view === 'search' && params.filterValue) {
      dbQuery = dbQuery.ilike('trainer_name', `%${params.filterValue}%`)
    }

    const { data, error } = await dbQuery.limit(100)

    if (error) {
      console.error('Leaderboard query error:', error)
      throw error
    }

    // Sort the data
    if (data && data.length > 0) {
      if (params.period !== 'all-time') {
        // For weekly/monthly, sort by delta values
        const sortField = params.sortBy === 'xp' ? 'xp_delta' : 
                         params.sortBy === 'catches' ? 'catches_delta' : 
                         params.sortBy === 'distance' ? 'distance_delta' : 'pokestops_delta'
        
        data.sort((a: any, b: any) => (b[sortField] || 0) - (a[sortField] || 0))
      } else {
        // For all-time, sort by total values
        const sortField = params.sortBy === 'xp' ? 'total_xp' : 
                         params.sortBy === 'catches' ? 'pokemon_caught' : 
                         params.sortBy === 'distance' ? 'distance_walked' : 'pokestops_visited'
        
        data.sort((a: any, b: any) => (b[sortField] || 0) - (a[sortField] || 0))
      }
    }

    return { data: data as LeaderboardEntry[], error: null }
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

  async updateUserStats(updates: StatUpdate): Promise<StatUpdateResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'User not authenticated' };
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

      // Validate that new stats are not lower than most recent stats (prevent cheating)
      const validationErrors: string[] = [];
      
      if (updates.total_xp !== undefined && updates.total_xp < referenceStats.total_xp) {
        validationErrors.push('Total XP cannot be lower than current value');
      }
      if (updates.pokemon_caught !== undefined && updates.pokemon_caught < referenceStats.pokemon_caught) {
        validationErrors.push('Pokémon caught cannot be lower than current value');
      }
      if (updates.distance_walked !== undefined && updates.distance_walked < referenceStats.distance_walked) {
        validationErrors.push('Distance walked cannot be lower than current value');
      }
      if (updates.pokestops_visited !== undefined && updates.pokestops_visited < referenceStats.pokestops_visited) {
        validationErrors.push('PokéStops visited cannot be lower than current value');
      }
      if (updates.unique_pokedex_entries !== undefined && updates.unique_pokedex_entries < referenceStats.unique_pokedex_entries) {
        validationErrors.push('Pokédex entries cannot be lower than current value');
      }

      if (validationErrors.length > 0) {
        return { success: false, message: validationErrors.join(', ') };
      }

      // Create the new stat entry data
      const today = new Date().toISOString().split('T')[0];
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

      // Check if there's already an entry for today
      const { data: existingTodayEntry } = await supabase
        .from('stat_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .single();

      let statEntryResult;
      let isUpdate = false;

      if (existingTodayEntry) {
        // Update today's entry
        const { data, error } = await supabase
          .from('stat_entries')
          .update(newStatEntry)
          .eq('user_id', user.id)
          .eq('entry_date', today)
          .select('*')
          .single();
        
        statEntryResult = { data, error };
        isUpdate = true;
      } else {
        // Create new entry for today
        const { data, error } = await supabase
          .from('stat_entries')
          .insert(newStatEntry)
          .select('*')
          .single();
        
        statEntryResult = { data, error };
        isUpdate = false;
      }

      if (statEntryResult.error) {
        console.error('Error creating/updating stat entry:', statEntryResult.error);
        return { success: false, message: 'Failed to update stats' };
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

      const message = isUpdate 
        ? "Today's stats updated successfully!" 
        : 'New stat entry created successfully!';

      return { 
        success: true, 
        message,
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
  }
} 

function getDaysDifference(start: string, end: string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
} 