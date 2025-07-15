import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../services/profileService';
import { useTrialStatus } from '../../hooks/useTrialStatus';
import { useValuePropModal } from '../../hooks/useValuePropModal';

// Import team colors from the shared constants
const TEAM_COLORS = [
  { value: 'blue', label: 'Blue', color: '#0074D9', team: 'Team Blue' },
  { value: 'red', label: 'Red', color: '#FF4136', team: 'Team Red' },
  { value: 'yellow', label: 'Yellow', color: '#FFDC00', team: 'Team Yellow' },
  { value: 'black', label: 'Black', color: '#111111', team: 'Team Black' },
  { value: 'green', label: 'Green', color: '#2ECC40', team: 'Team Green' },
  { value: 'orange', label: 'Orange', color: '#FF851B', team: 'Team Orange' },
  { value: 'purple', label: 'Purple', color: '#B10DC9', team: 'Team Purple' },
  { value: 'pink', label: 'Pink', color: '#F012BE', team: 'Team Pink' }
];

interface QuickProfileViewProps {
  profileId: string;
  isOpen: boolean;
  onClose: () => void;
  position?: { top: number; left: number };
  anchorEl?: HTMLElement | null;
}

interface QuickProfileData {
  username: string;
  team: string;
  level: number;
  country: string;
  total_xp: number;
  pokemon_caught: number;
  distance_walked: number;
  pokestops_visited: number;
  profile_screenshot_url?: string;
}

export const QuickProfileView = ({ 
  profileId, 
  isOpen, 
  onClose, 
  position,
  anchorEl 
}: QuickProfileViewProps) => {
  const [profileData, setProfileData] = useState<QuickProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const trialStatus = useTrialStatus();
  const { showValueProp } = useValuePropModal();

  useEffect(() => {
    if (isOpen && profileId) {
      loadProfileData();
    }
  }, [isOpen, profileId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await profileService.getQuickProfileView(profileId);
      if (error) throw error;
      
      // Map database fields to our interface
      if (data) {
        const mappedData: QuickProfileData = {
          username: data.username,
          team: data.team_color,
          level: data.trainer_level,
          country: data.country,
          total_xp: data.total_xp,
          pokemon_caught: data.pokemon_caught,
          distance_walked: data.distance_walked,
          pokestops_visited: data.pokestops_visited,
          profile_screenshot_url: data.profile_screenshot_url
        };
        setProfileData(mappedData);
      }
    } catch (err) {
      setError('Failed to load profile data');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullProfile = () => {
    if (!trialStatus.canClickIntoProfiles) {
      showValueProp('profile');
      return;
    }
    navigate(`/profile/${profileId}`);
  };

  // Helper function to get team color with proper type checking
  const getTeamColor = (team: string | undefined | null): string => {
    if (!team) return '#666666'; // Default color for unknown team
    const teamInfo = TEAM_COLORS.find(t => t.value.toLowerCase() === team.toLowerCase());
    return teamInfo?.color || '#666666';
  };

  // Helper function to get team display name
  const getTeamName = (team: string | undefined | null): string => {
    if (!team) return 'Unknown Team';
    const teamInfo = TEAM_COLORS.find(t => t.value.toLowerCase() === team.toLowerCase());
    return teamInfo?.team || 'Unknown Team';
  };

  if (!isOpen) return null;

  // Calculate position for desktop popup
  const getPopupStyle = () => {
    if (!anchorEl) return position;

    const rect = anchorEl.getBoundingClientRect();
    const isRightSide = window.innerWidth - rect.right > 300; // Check if enough space on right

    return {
      top: rect.bottom + window.scrollY,
      left: isRightSide ? rect.right : rect.left - 300,
    };
  };

  return (
    <div 
      ref={containerRef}
      className={`quick-profile-view ${window.innerWidth <= 768 ? 'mobile' : 'desktop'}`}
      style={window.innerWidth > 768 ? getPopupStyle() : undefined}
    >
      {loading ? (
        <div className="quick-profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      ) : error ? (
        <div className="quick-profile-error">
          <p>{error}</p>
          <button onClick={onClose}>Close</button>
        </div>
      ) : profileData ? (
        <div className="quick-profile-content">
          {/* Header */}
          <div className="quick-profile-header">
            <div className="quick-profile-info">
              <h3>{profileData.username}</h3>
              <div className="quick-profile-meta">
                <span className="team-badge" style={{ backgroundColor: getTeamColor(profileData.team) }}>
                  {getTeamName(profileData.team)}
                </span>
                <span className="level-badge">Level {profileData.level}</span>
                <span className="country-badge">{profileData.country || 'Unknown Location'}</span>
              </div>
            </div>
            <button className="close-button" onClick={onClose}>✕</button>
          </div>

          {/* Stats */}
          <div className="quick-profile-stats">
            <div className="stat-item">
              <label>Total XP</label>
              <span className="stat-value">{profileData.total_xp.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <label>Pokémon Caught</label>
              <span className="stat-value">{profileData.pokemon_caught.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <label>Distance Walked</label>
              <span className="stat-value">{profileData.distance_walked.toFixed(1)} km</span>
            </div>
            <div className="stat-item">
              <label>Pokéstops Visited</label>
              <span className="stat-value">{profileData.pokestops_visited.toLocaleString()}</span>
            </div>
          </div>

          {/* Screenshot Preview */}
          {profileData.profile_screenshot_url && (
            <div className="quick-profile-screenshot">
              <img 
                src={profileData.profile_screenshot_url} 
                alt="Profile Screenshot" 
                className="preview-image"
              />
            </div>
          )}

          {/* Footer */}
          <div className="quick-profile-footer">
            <button 
              className="view-full-profile-button"
              onClick={handleViewFullProfile}
            >
              View Full Profile
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}; 