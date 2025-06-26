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

export interface StatCalculationResult {
  start_date: string
  end_date: string
  xp_delta: number
  catches_delta: number
  distance_delta: number
  pokestops_delta: number
  pokedex_delta: number
  level_delta: number
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

export const dashboardService = {
  // Get leaderboard data
  async getLeaderboard(period: 'weekly' | 'monthly' | 'all-time', sortBy: 'xp' | 'catches' | 'distance' | 'pokestops' = 'xp') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    let query: string
    
    if (period === 'weekly') {
      query = 'weekly_leaderboard'
    } else if (period === 'monthly') {
      query = 'monthly_leaderboard'
    } else {
      query = 'all_time_leaderboard'
    }

    const { data, error } = await supabase
      .from(query)
      .select('*')
      .limit(100)

    if (error) {
      console.error('Leaderboard query error:', error)
      throw error
    }

    // The views already filter for paid users, so we just need to sort
    if (data && data.length > 0) {
      if (period !== 'all-time') {
        // For weekly/monthly, sort by delta values
        const sortField = sortBy === 'xp' ? 'xp_delta' : 
                         sortBy === 'catches' ? 'catches_delta' : 
                         sortBy === 'distance' ? 'distance_delta' : 'pokestops_delta'
        
        data.sort((a: any, b: any) => (b[sortField] || 0) - (a[sortField] || 0))
      } else {
        // For all-time, sort by total values
        const sortField = sortBy === 'xp' ? 'total_xp' : 
                         sortBy === 'catches' ? 'pokemon_caught' : 
                         sortBy === 'distance' ? 'distance_walked' : 'pokestops_visited'
        
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

  // Calculate stats between two dates
  async calculateStatDelta(startDate: string, endDate: string, userId?: string): Promise<StatCalculationResult> {
    const { data: entries } = await this.getUserStatEntries(userId)
    console.log(entries);
    if (!entries || entries.length < 2) {
      throw new Error('Insufficient data for calculation')
    }

    // Find closest entries to the specified dates
    const startEntry = entries.reduce((closest, current) => {
      const currentDiff = Math.abs(new Date(current.entry_date).getTime() - new Date(startDate).getTime())
      const closestDiff = Math.abs(new Date(closest.entry_date).getTime() - new Date(startDate).getTime())
      return currentDiff < closestDiff ? current : closest
    })

    const endEntry = entries.reduce((closest, current) => {
      const currentDiff = Math.abs(new Date(current.entry_date).getTime() - new Date(endDate).getTime())
      const closestDiff = Math.abs(new Date(closest.entry_date).getTime() - new Date(endDate).getTime())
      return currentDiff < closestDiff ? current : closest
    })

    return {
      start_date: startEntry.entry_date,
      end_date: endEntry.entry_date,
      xp_delta: endEntry.total_xp - startEntry.total_xp,
      catches_delta: endEntry.pokemon_caught - startEntry.pokemon_caught,
      distance_delta: endEntry.distance_walked - startEntry.distance_walked,
      pokestops_delta: endEntry.pokestops_visited - startEntry.pokestops_visited,
      pokedex_delta: endEntry.unique_pokedex_entries - startEntry.unique_pokedex_entries,
      level_delta: endEntry.trainer_level - startEntry.trainer_level
    }
  },

  // Get community day stats (single date or date range)
  async getCommunityDayStats(date: string, endDate?: string, userId?: string): Promise<StatCalculationResult> {
    const actualEndDate = endDate || date
    console.log(date, actualEndDate);
    return this.calculateStatDelta(date, actualEndDate, userId)
  },

  // Get average stats for radar chart comparison
  async getAverageStats() {
    const { data, error } = await supabase
      .from('profiles')
      .select('total_xp, pokemon_caught, distance_walked, pokestops_visited, unique_pokedex_entries, trainer_level')

    if (error) {
      throw error
    }
    console.log(data);
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