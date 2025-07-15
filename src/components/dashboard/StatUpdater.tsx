import { useState, useEffect } from 'react'
import { dashboardService } from '../../services/dashboardService'
import { profileService, type ProfileWithMetadata } from '../../services/profileService'
import { adminService } from '../../services/adminService'

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
  const [currentStats, setCurrentStats] = useState<Stats>({})
  const [updates, setUpdates] = useState<Stats>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [maxPokedexEntries, setMaxPokedexEntries] = useState(1000)

  useEffect(() => {
    loadStats()
    loadMaxPokedexEntries()
  }, [])

  const loadStats = async () => {
    try {
      const { data, error } = await profileService.getProfile()
      if (error) throw error
      if (data) {
        const stats: Stats = {
          total_xp: data.total_xp,
          pokemon_caught: data.pokemon_caught,
          distance_walked: data.distance_walked,
          pokestops_visited: data.pokestops_visited,
          unique_pokedex_entries: data.unique_pokedex_entries,
          trainer_level: data.trainer_level,
          updated_at: data.updated_at
        }
        setCurrentStats(stats)
      }
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
      if (currentValue !== undefined && typeof parsedValue === 'number' && typeof currentValue === 'number' && parsedValue < currentValue) {
        return
      }
      if (field === 'unique_pokedex_entries' && parsedValue > maxPokedexEntries) {
        return
      }
    }

    setUpdates(prev => ({ ...prev, [field]: parsedValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await dashboardService.updateUserStats(updates)
      
      if (response.success) {
        setSuccess('Stats updated successfully!')
        await loadStats()
        setUpdates({})
        
        if (response.updatedProfile) {
          onStatsUpdated(response.updatedProfile as ProfileWithMetadata)
        }
        
        setTimeout(() => setIsExpanded(false), 2000)
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
          <button
            type="button"
            className={`expand-button ${isExpanded ? 'expanded' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '📝 Hide Form' : '✏️ Update Stats'}
          </button>
        </div>
      </div>

      {isExpanded && (
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
                type="button"
                className="cancel-button"
                onClick={() => {
                  setIsExpanded(false);
                  setUpdates({});
                  setError(null);
                  setSuccess(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="update-button"
                disabled={saving || Object.keys(updates).length === 0}
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
      )}
    </div>
  );
}; 