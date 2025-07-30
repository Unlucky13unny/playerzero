import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { RadarChart } from './RadarChart';
import { ExportCardModal } from './ExportCardModal';
import { type ProfileWithMetadata, calculateSummitDate } from '../../services/profileService';
import { useTrialStatus } from '../../hooks/useTrialStatus';
import { FaDownload } from 'react-icons/fa';

const TEAM_COLORS = {
  blue: { name: 'Blue', color: '#0074D9', icon: '❄️' },
  red: { name: 'Red', color: '#FF4136', icon: '🔥' },
  yellow: { name: 'Yellow', color: '#FFDC00', icon: '⚡' },
  black: { name: 'Black', color: '#111111', icon: '⚫' },
  green: { name: 'Green', color: '#2ECC40', icon: '🌿' },
  orange: { name: 'Orange', color: '#FF851B', icon: '🔸' },
  purple: { name: 'Purple', color: '#B10DC9', icon: '💜' },
  pink: { name: 'Pink', color: '#F012BE', icon: '💗' }
};

export const UserHome = () => {
  const { user } = useAuth();
  const trialStatus = useTrialStatus();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProfileWithMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setStats(data);
    } catch (err: any) {
      console.error('Error loading user stats:', err);
      setError('Failed to load your stats. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num == null) return '0';
    return new Intl.NumberFormat().format(num);
  };

  const getTeamColor = (teamColor: string) => {
    switch (teamColor?.toLowerCase()) {
      case 'valor':
      case 'red':
        return '#FF4444';
      case 'mystic':
      case 'blue':
        return '#4444FF';
      case 'instinct':
      case 'yellow':
        return '#FFAA00';
      default:
        return '#888888';
    }
  };

  if (loading) {
    return (
      <div className="user-home-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-home-container">
        <div className="error-message">
          <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const teamInfo = stats?.team_color ? TEAM_COLORS[stats.team_color as keyof typeof TEAM_COLORS] : null;

  return (
    <div className="user-home-container">
      {/* Private Mode Banner */}
      {!trialStatus.isPaidUser && !trialStatus.loading && (
        <div className={`private-mode-banner ${trialStatus.isInTrial ? 'active' : 'expired'}`}>
          <div className="private-mode-content">
            {trialStatus.isInTrial ? (
              <p className="private-mode-status">
                Private Mode: {trialStatus.timeRemaining.days} day{trialStatus.timeRemaining.days !== 1 ? 's' : ''} remaining
              </p>
            ) : (
              <p className="private-mode-status">
                Private Mode Ended - To keep tracking your grind and unlock your leaderboard placement, upgrade for $5.99.
                <button 
                  className="upgrade-button"
                  onClick={() => window.location.href = '/upgrade'}
                >
                  Upgrade Now
                </button>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="section-header">
        <h1>Welcome Back, Trainer!</h1>
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-info">
          <div className="trainer-level">Level {stats?.trainer_level || 1}</div>
          <div className="trainer-details">
            {teamInfo && (
              <div className="team-badge">
                <div className="team-color-circle" style={{ backgroundColor: getTeamColor(teamInfo.name) }}></div>
                <span className="team-name">Team {teamInfo.name}</span>
              </div>
            )}
            {stats?.country && (
              <div className="country-badge">
                <span className="country-icon">🌍</span>
                <span className="country-name">{stats.country}</span>
              </div>
            )}
            
            <div className="summit-badge">
              <span className="summit-icon">🏔️</span>
              <span className="summit-date">Summit: 50</span>
            </div>
            {stats?.trainer_code && !stats?.trainer_code_private && (
              <div className="trainer-code-badge">
                <span className="code-icon">🎮</span>
                <span className="code-value">{stats.trainer_code}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🚶</div>
          <div className="stat-content">
            <h3>Distance Walked</h3>
            <div className="stat-value">{formatNumber(stats?.distance_walked)} km</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <h3>Pokémon Caught</h3>
            <div className="stat-value">{formatNumber(stats?.pokemon_caught)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <h3>PokéStops Visited</h3>
            <div className="stat-value">{formatNumber(stats?.pokestops_visited)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>Total XP</h3>
            <div className="stat-value">{formatNumber(stats?.total_xp)}</div>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="radar-chart-section">
        <h2>Performance Overview</h2>
        <div className="radar-chart-container">
          <RadarChart
            profile={stats}
            isPaidUser={trialStatus.isPaidUser}
            showHeader={false}
          />
        </div>
      </div>

      {/* Export Card Button */}
      {stats && (
        <div className="export-card-button-container">
          <button 
            className="export-card-button"
            onClick={() => setShowExportModal(true)}
            disabled={!trialStatus.isPaidUser && !trialStatus.isInTrial}
          >
            <FaDownload />
            <span>Create Card</span>
          </button>
        </div>
      )}

      {/* Export Card Modal */}
      <ExportCardModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        profile={stats}
        isPaidUser={!!stats?.is_paid_user}
      />
    </div>
  );
}; 