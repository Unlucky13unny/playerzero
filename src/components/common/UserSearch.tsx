import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../services/profileService';
import { QuickProfileView } from '../profile/QuickProfileView';
import { useTrialStatus } from '../../hooks/useTrialStatus';
import './UserSearch.css';

export const UserSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const trialStatus = useTrialStatus();

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await profileService.searchUsers(query);
        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handlePreviewClick = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation(); // Prevent row click
    if (!trialStatus.isPaidUser && !trialStatus.isInTrial) {
      navigate('/upgrade');
      return;
    }
    setSelectedProfile(profileId === selectedProfile ? null : profileId);
  };

  const handleClosePreview = () => {
    setSelectedProfile(null);
  };

  const getTeamColor = (teamColor: string) => {
    const teamColors: { [key: string]: string } = {
      blue: '#0074D9',
      red: '#FF4136',
      yellow: '#FFDC00',
      black: '#111111',
      green: '#2ECC40',
      orange: '#FF851B',
      purple: '#B10DC9',
      pink: '#F012BE'
    };
    return teamColors[teamColor.toLowerCase()] || '#6B7280';
  };

  const PersonIcon = () => (
    <div className="person-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );

  return (
    <div className="user-search-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search trainers..."
          className="search-input"
        />
        {loading && <div className="search-spinner"></div>}
      </div>

      <div className="search-results-section">
        {loading ? (
          <div className="search-loading">
            <div className="loading-spinner"></div>
            <span>Searching trainers...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="search-results-table">
            <div className="table-header">
              <div className="header-cell trainer">Trainer</div>
              <div className="header-cell level">Level</div>
              <div className="header-cell team">Team</div>
              <div className="header-cell actions">Actions</div>
            </div>
            <div className="table-body">
              {results.map((profile) => (
                <div
                  key={profile.id}
                  className="table-row"
                >
                  <div className="table-cell trainer">
                    {profile.profile_screenshot_url ? (
                      <img
                        src={profile.profile_screenshot_url}
                        alt={profile.trainer_name}
                        className="trainer-avatar"
                        onClick={(e) => handlePreviewClick(e, profile.id)}
                        style={{
                          cursor: trialStatus.canClickIntoProfiles ? 'pointer' : 'default',
                          opacity: trialStatus.canClickIntoProfiles ? 1 : 0.6
                        }}
                      />
                    ) : (
                      <div 
                        className="person-icon" 
                        onClick={(e) => handlePreviewClick(e, profile.id)}
                        style={{
                          cursor: trialStatus.canClickIntoProfiles ? 'pointer' : 'default',
                          opacity: trialStatus.canClickIntoProfiles ? 1 : 0.6
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    )}
                    <span 
                      className="trainer-name"
                      onClick={(e) => handlePreviewClick(e, profile.id)}
                      style={{
                        cursor: trialStatus.canClickIntoProfiles ? 'pointer' : 'default',
                        color: trialStatus.canClickIntoProfiles ? 'var(--white-pure)' : 'var(--gray-light)',
                      }}
                    >
                      {profile.trainer_name}
                      {!trialStatus.canClickIntoProfiles && <span className="locked-indicator">🔒</span>}
                    </span>
                  </div>
                  <div className="table-cell level">
                    <span className="level-badge">Level {profile.trainer_level}</span>
                  </div>
                  <div className="table-cell team">
                    <span 
                      className="team-badge"
                      style={{ backgroundColor: getTeamColor(profile.team_color) }}
                    >
                      {profile.team_color}
                    </span>
                  </div>
                  <div className="table-cell actions">
                    <button 
                      className="preview-button"
                      onClick={(e) => handlePreviewClick(e, profile.id)}
                      title={trialStatus.canClickIntoProfiles ? "View profile" : "Upgrade to view profiles"}
                    >
                      {selectedProfile === profile.id ? 'Hide Preview' : 'Preview Profile'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : query.trim().length >= 2 ? (
          <div className="no-results">No trainers found</div>
        ) : query.trim().length > 0 ? (
          <div className="search-hint">Type at least 2 characters to search</div>
        ) : null}
      </div>

      {/* Modal Preview */}
      {selectedProfile && (
        <div className="profile-preview-modal">
          <div className="modal-backdrop" onClick={handleClosePreview}></div>
          <div className="modal-content">
            <div className="modal-inner">
              <button className="modal-close" onClick={handleClosePreview}>×</button>
              <div className="quick-profile-container">
                <QuickProfileView 
                  profileId={selectedProfile}
                  isOpen={true}
                  onClose={handleClosePreview}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 