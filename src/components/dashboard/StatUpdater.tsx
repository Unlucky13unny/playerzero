import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService, type StatUpdate, type StatUpdateResponse } from '../../services/dashboardService';
import { profileService, type ProfileWithMetadata } from '../../services/profileService';

interface StatUpdaterProps {
  onStatsUpdated?: (profile: ProfileWithMetadata) => void;
}

export const StatUpdater: React.FC<StatUpdaterProps> = ({ onStatsUpdated }) => {
  const { user } = useAuth();
  const [currentProfile, setCurrentProfile] = useState<ProfileWithMetadata | null>(null);
  const [currentStats, setCurrentStats] = useState<any>(null);
  const [updates, setUpdates] = useState<StatUpdate>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadCurrentProfile();
  }, [user]);

  const loadCurrentProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await profileService.getProfile();
      setCurrentProfile(profile);
      
      // Get the most recent stat entry for this user
      const { data: latestStatEntry } = await dashboardService.getUserStatEntries();
      const mostRecentStats = latestStatEntry && latestStatEntry.length > 0 
        ? latestStatEntry[latestStatEntry.length - 1] 
        : profile;
      
      setCurrentStats(mostRecentStats);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleInputChange = (field: keyof StatUpdate, value: string) => {
    const numValue = value === '' ? undefined : Number(value);
    setUpdates(prev => ({
      ...prev,
      [field]: numValue
    }));
    
    // Clear any previous messages when user starts typing
    if (message) setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    // Check if any updates were made
    const hasUpdates = Object.values(updates).some(value => value !== undefined);
    if (!hasUpdates) {
      setMessage({ type: 'error', text: 'Please enter at least one stat to update' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response: StatUpdateResponse = await dashboardService.updateUserStats(updates);
      
      if (response.success) {
        setMessage({ type: 'success', text: response.message });
        setUpdates({}); // Clear form
        
        // Reload current profile and stats to show updated values
        await loadCurrentProfile();
        
        // Notify parent component
        if (response.updatedProfile && onStatsUpdated) {
          onStatsUpdated(response.updatedProfile as ProfileWithMetadata);
        }
        
        // Auto-collapse after successful update
        setTimeout(() => setIsExpanded(false), 2000);
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (error) {
      console.error('Error updating stats:', error);
      setMessage({ type: 'error', text: 'Failed to update stats. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return '0';
    return num.toLocaleString();
  };

  if (!currentProfile || !currentStats) {
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
            <p>Keep your progress up to date • Last entry: {new Date(currentStats.entry_date || currentStats.updated_at).toLocaleDateString()}</p>
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
                <div className="stat-display">
                  <span className="stat-label">Level</span>
                  <span className="stat-value">{currentStats.trainer_level}</span>
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
                  <label htmlFor="unique_pokedex_entries">Pokédex Entries</label>
                  <input
                    id="unique_pokedex_entries"
                    type="number"
                    min={currentStats.unique_pokedex_entries}
                    max={1000}
                    value={updates.unique_pokedex_entries || ''}
                    onChange={(e) => handleInputChange('unique_pokedex_entries', e.target.value)}
                    placeholder={`Current: ${formatNumber(currentStats.unique_pokedex_entries)}`}
                    className="stat-input"
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="trainer_level">Trainer Level</label>
                  <input
                    id="trainer_level"
                    type="number"
                    min={currentStats.trainer_level}
                    max={50}
                    value={updates.trainer_level || ''}
                    onChange={(e) => handleInputChange('trainer_level', e.target.value)}
                    placeholder={`Current: ${currentStats.trainer_level}`}
                    className="stat-input"
                  />
                </div>
              </div>
            </div>

            {message && (
              <div className={`update-message ${message.type}`}>
                <span className="message-icon">
                  {message.type === 'success' ? '✅' : '❌'}
                </span>
                {message.text}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setIsExpanded(false);
                  setUpdates({});
                  setMessage(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="update-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <span className="update-icon">💾</span>
                    Update Stats
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