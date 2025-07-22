import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardService } from '../../services/dashboardService'
import { profileService, type ProfileWithMetadata } from '../../services/profileService'
import { adminService } from '../../services/adminService'
import { supabase } from '../../supabaseClient'

type Stats = {
  total_xp?: number
  pokemon_caught?: number
  distance_walked?: number
  pokestops_visited?: number
  unique_pokedex_entries?: number
  trainer_level?: number
  updated_at?: string
}

export const StatUpdater = ({ onStatsUpdated }: { onStatsUpdated: (profile: ProfileWithMetadata) => void }) => {
  const navigate = useNavigate()
  const [currentStats, setCurrentStats] = useState<Stats>({})
  const [updates, setUpdates] = useState<Stats>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [maxPokedexEntries, setMaxPokedexEntries] = useState(1000)
  const [lastUpdateDate, setLastUpdateDate] = useState<string | null>(null)
  const [hasUpdatedToday, setHasUpdatedToday] = useState(false)
  const [nextUpdateTime, setNextUpdateTime] = useState<string | null>(null)
  const [verificationScreenshot, setVerificationScreenshot] = useState<File | null>(null)

  useEffect(() => {
    loadStats()
    loadMaxPokedexEntries()
    checkLastUpdate()
  }, [])

  const checkLastUpdate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setHasUpdatedToday(false)
        return
      }

      const today = new Date().toISOString().split('T')[0]
      const { data: entries } = await supabase
        .from('stat_entries')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('entry_date', today)

      // If we have any entries for today, use the latest one
      if (entries && entries.length > 0) {
        setHasUpdatedToday(true)
        setLastUpdateDate(new Date(entries[0].created_at).toLocaleTimeString())
        
        // Calculate next update time (next UTC midnight)
        const now = new Date()
        const nextUpdateUTC = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1, // next day
          0, // hours
          0, // minutes
          0, // seconds
          0  // milliseconds
        ))
        
        // Format the next update time in user's local timezone
        const nextUpdateLocal = nextUpdateUTC.toLocaleString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          timeZoneName: 'short'
        })
        
        setNextUpdateTime(nextUpdateLocal)
      } else {
        setHasUpdatedToday(false)
        setLastUpdateDate(null)
        setNextUpdateTime(null)
      }
    } catch (err) {
      console.error('Error checking last update:', err)
      // On error, allow updates to be safe
      setHasUpdatedToday(false)
      setLastUpdateDate(null)
      setNextUpdateTime(null)
    }
  }

  const loadStats = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('User not authenticated')
        return
      }

      // Get the most recent stat entry (same logic as backend validation)
      const { data: latestStatEntry } = await supabase
        .from('stat_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false })
        .limit(1)
        .single();

      let stats: Stats = {}

      if (latestStatEntry) {
        // Use latest stat entry if available
        stats = {
          total_xp: latestStatEntry.total_xp,
          pokemon_caught: latestStatEntry.pokemon_caught,
          distance_walked: latestStatEntry.distance_walked,
          pokestops_visited: latestStatEntry.pokestops_visited,
          unique_pokedex_entries: latestStatEntry.unique_pokedex_entries,
          trainer_level: latestStatEntry.trainer_level,
          updated_at: latestStatEntry.created_at
        }
      } else {
        // Fallback to profile if no stat entries exist
        const { data: profileData, error } = await profileService.getProfile()
        if (error) throw error
        if (profileData) {
          stats = {
            total_xp: profileData.total_xp,
            pokemon_caught: profileData.pokemon_caught,
            distance_walked: profileData.distance_walked,
            pokestops_visited: profileData.pokestops_visited,
            unique_pokedex_entries: profileData.unique_pokedex_entries,
            trainer_level: profileData.trainer_level,
            updated_at: profileData.updated_at
          }
        }
      }

      setCurrentStats(stats)
    } catch (err: any) {
      setError(err.message || 'Failed to load stats')
    }
  }

  const loadMaxPokedexEntries = async () => {
    const { value, error } = await adminService.getMaxPokedexEntries()
    if (!error) {
      setMaxPokedexEntries(value)
    }
  }

  const handleInputChange = (field: keyof Stats, value: string) => {
    if (!value.trim()) {
      setUpdates(prev => ({ ...prev, [field]: undefined }))
      return
    }

    const cleanValue = value.replace(/^0+/, '')
    let parsedValue: number | undefined

    if (field === 'distance_walked') {
      parsedValue = cleanValue ? parseFloat(cleanValue) : undefined
    } else {
      parsedValue = cleanValue ? parseInt(cleanValue) : undefined
    }

    if (parsedValue !== undefined) {
      const currentValue = currentStats[field]
      
      // Debug logging for frontend validation
      console.log(`Frontend validation for ${field}:`, {
        parsedValue,
        currentValue,
        comparison: currentValue !== undefined ? `${parsedValue} < ${currentValue} = ${parsedValue < (currentValue as number)}` : 'currentValue is undefined',
        types: `${typeof parsedValue} vs ${typeof currentValue}`
      });

      if (currentValue !== undefined && typeof parsedValue === 'number' && typeof currentValue === 'number' && parsedValue < currentValue) {
        console.log(`Frontend validation blocked update for ${field}: ${parsedValue} < ${currentValue}`);
        return
      }
      if (field === 'unique_pokedex_entries' && parsedValue > maxPokedexEntries) {
        console.log(`Frontend validation blocked update for ${field}: ${parsedValue} > ${maxPokedexEntries}`);
        return
      }
    }

    setUpdates(prev => ({ ...prev, [field]: parsedValue }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setVerificationScreenshot(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      // Check if screenshot is provided
      if (!verificationScreenshot) {
        setError('Please upload a verification screenshot to update your stats')
        setSaving(false)
        return
      }

      const response = await dashboardService.updateUserStats(updates, verificationScreenshot)
      
      if (response.success) {
        setSuccess('Stats updated successfully! Redirecting to your profile...')
        await loadStats()
        setUpdates({})
        setVerificationScreenshot(null)
        
        if (response.updatedProfile) {
          onStatsUpdated(response.updatedProfile as ProfileWithMetadata)
        }

        // Redirect to user profile after 2 seconds
        setTimeout(() => {
          navigate('/UserProfile')
        }, 2000)
      } else {
        setError(response.message || 'Failed to update stats')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update stats')
    } finally {
      setSaving(false)
    }
  }

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return '0';
    return num.toLocaleString();
  };

  if (hasUpdatedToday) {
    return (
      <div className="stat-updater">
        <div className="status-card">
          <div className="status-content">
            <div className="status-header">
              <div className="status-icon">⏳</div>
              <div className="status-title">
                <h3>Daily Update Complete</h3>
                <p>You have already updated your stats today. Next update available tomorrow.</p>
              </div>
            </div>
            
            <div className="status-timeline">
              <div className="timeline-item">
                <div className="timeline-icon completed">✓</div>
                <div className="timeline-info">
                  <span className="timeline-label">Last Update</span>
                  <span className="timeline-value">{lastUpdateDate}</span>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-icon pending">⌛</div>
                <div className="timeline-info">
                  <span className="timeline-label">Next Update Available</span>
                  <span className="timeline-value highlight">{nextUpdateTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentStats) {
    return (
      <div className="stat-updater-container">
        <div className="loading-message">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="stat-updater-container">
      <div className="stat-updater-header">
        <div className="header-content">
          <div className="header-info">
            <h3>📊 Update Your Stats</h3>
            <p>Keep your progress up to date • Last entry: {new Date(currentStats.updated_at || '').toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="stat-updater-form">
        <form onSubmit={handleSubmit}>
          <div className="current-stats">
            <h4>Current Stats</h4>
            <div className="stats-grid">
              <div className="stat-display">
                <span className="stat-label">Total XP</span>
                <span className="stat-value">{formatNumber(currentStats.total_xp)}</span>
              </div>
              <div className="stat-display">
                <span className="stat-label">Pokémon Caught</span>
                <span className="stat-value">{formatNumber(currentStats.pokemon_caught)}</span>
              </div>
              <div className="stat-display">
                <span className="stat-label">Distance (km)</span>
                <span className="stat-value">{formatNumber(currentStats.distance_walked)}</span>
              </div>
              <div className="stat-display">
                <span className="stat-label">PokéStops</span>
                <span className="stat-value">{formatNumber(currentStats.pokestops_visited)}</span>
              </div>
              <div className="stat-display">
                <span className="stat-label">Pokédex</span>
                <span className="stat-value">{formatNumber(currentStats.unique_pokedex_entries)}</span>
              </div>
            </div>
          </div>

          <div className="update-inputs">
            <h4>New Values</h4>
            <div className="inputs-grid">
              <div className="input-group">
                <label htmlFor="total_xp">Total XP</label>
                <input
                  id="total_xp"
                  type="number"
                  min={currentStats.total_xp}
                  value={updates.total_xp || ''}
                  onChange={(e) => handleInputChange('total_xp', e.target.value)}
                  placeholder={`Current: ${formatNumber(currentStats.total_xp)}`}
                  className="stat-input"
                />
              </div>

              <div className="input-group">
                <label htmlFor="pokemon_caught">Pokémon Caught</label>
                <input
                  id="pokemon_caught"
                  type="number"
                  min={currentStats.pokemon_caught}
                  value={updates.pokemon_caught || ''}
                  onChange={(e) => handleInputChange('pokemon_caught', e.target.value)}
                  placeholder={`Current: ${formatNumber(currentStats.pokemon_caught)}`}
                  className="stat-input"
                />
              </div>

              <div className="input-group">
                <label htmlFor="distance_walked">Distance Walked (km)</label>
                <input
                  id="distance_walked"
                  type="number"
                  step="0.01"
                  min={currentStats.distance_walked}
                  value={updates.distance_walked || ''}
                  onChange={(e) => handleInputChange('distance_walked', e.target.value)}
                  placeholder={`Current: ${formatNumber(currentStats.distance_walked)}`}
                  className="stat-input"
                />
              </div>

              <div className="input-group">
                <label htmlFor="pokestops_visited">PokéStops Visited</label>
                <input
                  id="pokestops_visited"
                  type="number"
                  min={currentStats.pokestops_visited}
                  value={updates.pokestops_visited || ''}
                  onChange={(e) => handleInputChange('pokestops_visited', e.target.value)}
                  placeholder={`Current: ${formatNumber(currentStats.pokestops_visited)}`}
                  className="stat-input"
                />
              </div>

              <div className="input-group">
                <label htmlFor="unique_pokedex_entries">
                  Pokédex Entries
                  <span className="max-value">(Max: {maxPokedexEntries.toLocaleString()})</span>
                </label>
                <input
                  id="unique_pokedex_entries"
                  type="number"
                  min={currentStats.unique_pokedex_entries}
                  max={maxPokedexEntries}
                  value={updates.unique_pokedex_entries || ''}
                  onChange={(e) => handleInputChange('unique_pokedex_entries', e.target.value)}
                  placeholder={`Current: ${formatNumber(currentStats.unique_pokedex_entries)}`}
                  className="stat-input"
                />
              </div>
            </div>
          </div>

          {/* Verification Screenshot Upload */}
          <div className="screenshot-upload-section">
            <h4>📷 Verification Screenshot Required</h4>
            <p className="upload-description">
              Upload a screenshot of your current stats to verify the update. This helps maintain the integrity of the leaderboards.
            </p>
            
            <div className="upload-area">
              <input
                id="verificationScreenshot"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{display: 'none'}}
                required
              />
              <label htmlFor="verificationScreenshot" style={{display: 'block', cursor: 'pointer'}}>
                <div className="upload-icon-container">
                  <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="upload-title">
                  {verificationScreenshot ? 'Screenshot Selected ✓' : 'Click to upload verification screenshot'}
                </h3>
                <p className="upload-description">
                  {verificationScreenshot ? `Selected: ${verificationScreenshot.name}` : 'Upload a screenshot showing your current stats'}
                </p>
              </label>
            </div>
            
            {verificationScreenshot && (
              <div className="upload-success">
                <div className="upload-success-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '100%', height: '100%'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="upload-filename">{verificationScreenshot.name}</span>
                <button 
                  type="button" 
                  className="remove-screenshot-button"
                  onClick={() => setVerificationScreenshot(null)}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              {error}
            </div>
          )}
          {success && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              {success}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="update-button"
              disabled={saving || Object.keys(updates).length === 0 || !verificationScreenshot}
            >
              {saving ? (
                <>
                  <div className="loading-spinner"></div>
                  Saving...
                </>
              ) : (
                <>
                  <span className="update-icon">💾</span>
                  Save Updates
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 