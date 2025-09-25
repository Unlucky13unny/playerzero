import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../services/profileService';
import { PlyrZeroProfileStandalone } from '../profile/PlyrZeroProfileStandalone';
import { useTrialStatus } from '../../hooks/useTrialStatus';
import { useMobile } from '../../hooks/useMobile';
import { getCountryFlagSync } from '../../utils/countryFlags';
import { NoResultsState } from './NoResultsState';
import { NoResultsFound } from './NoResultsFound';
import './UserSearch.css';

export const UserSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const trialStatus = useTrialStatus();
  const isMobile = useMobile();

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

  return (
    <div className="user-search-container" ref={searchRef}>
      <div 
        className="search-input-wrapper"
        style={{
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: isMobile ? "12px" : "9px",
          gap: isMobile ? "12px" : "8px",
          width: "100%",
          minWidth: isMobile ? "100%" : "353px",
          height: isMobile ? "44px" : "36px",
          border: "1px solid #848282",
          borderRadius: "6px",
          marginBottom: isMobile ? "1rem" : "0.5rem",
          flex: "none",
          order: 1,
          alignSelf: "stretch",
          flexGrow: 0,
        }}
      >
        {/* Search Icon */}
        <div
          style={{
            width: "18px",
            height: "18px",
            flex: "none",
            order: 0,
            flexGrow: 0,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            style={{
              position: "absolute",
              left: "12.5%",
              right: "14.27%",
              top: "12.5%",
              bottom: "14.27%",
            }}
          >
            <path
              d="M12.5 11H11.71L11.43 10.73C12.41 9.59 13 8.11 13 6.5C13 2.91 10.09 0 6.5 0C2.91 0 0 2.91 0 6.5C0 10.09 2.91 13 6.5 13C8.11 13 9.59 12.41 10.73 11.43L11 11.71V12.5L16 17.49L17.49 16L12.5 11ZM6.5 11C4.01 11 2 8.99 2 6.5C2 4.01 4.01 2 6.5 2C8.99 2 11 4.01 11 6.5C11 8.99 8.99 11 6.5 11Z"
              fill="#000000"
            />
          </svg>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Start typing a trainer name..."
          style={{
            width: "100%",
            minWidth: isMobile ? "100%" : "170px",
            height: isMobile ? "20px" : "18px",
            fontFamily: "Poppins",
            fontStyle: "normal",
            fontWeight: 400,
            fontSize: isMobile ? "14px" : "12px",
            lineHeight: isMobile ? "20px" : "18px",
            color: "rgba(0, 0, 0, 0.8)",
            border: "none",
            outline: "none",
            background: "transparent",
            flex: 1,
            order: 1,
            flexGrow: 1,
            padding: 0,
          }}
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
          <div className="search-results-list">
            {results.map((profile) => (
              <div
                key={profile.id}
                className="search-result-row"
                onClick={(e) => handlePreviewClick(e, profile.id)}
                style={{
                  cursor: trialStatus.canClickIntoProfiles ? 'pointer' : 'default',
                  opacity: trialStatus.canClickIntoProfiles ? 1 : 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  width: '100%'
                }}
              >
                {/* Left Section - Username */}
                <div 
                  className="search-result-left-section"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center'
                  }}
                >
                  <span 
                    className="trainer-name"
                    style={{
                      fontFamily: 'Poppins',
                      fontStyle: 'normal',
                      fontWeight: 600,
                      fontSize: '12px',
                      lineHeight: '18px',
                      color: '#000000'
                    }}
                    title={profile.trainer_name}
                  >
                    {profile.trainer_name}
                  </span>

                  {/* Country Flag + Name */}
                  {profile.country && (
                    <div className="country-section">
                      <img 
                        src={getCountryFlagSync(profile.country).flagUrl} 
                        alt={profile.country}
                        style={{ width: "12px", height: "8px" }}
                      />
                      <span 
                        style={{
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 500,
                          fontSize: '10px',
                          lineHeight: '15px',
                          color: '#616161',
                        }}
                      >
                        {profile.country}
                      </span>
                    </div>
                  )}

                  {/* Level */}
                  <span 
                    className="trainer-level"
                    style={{
                      fontFamily: 'Poppins',
                      fontStyle: 'normal',
                      fontWeight: 500,
                      fontSize: '10px',
                      lineHeight: '15px',
                      color: '#000000'
                    }}
                  >
                    Lvl {profile.trainer_level}
                  </span>
                </div>

                {/* Right Section - Team Circle + Name */}
                <div className="search-result-right-section">
                  <div className="team-section">
                    <div 
                      className="team-circle"
                      style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: getTeamColor(profile.team_color),
                        borderRadius: '50%',
                      }}
                    />
                    <span 
                      style={{
                        fontFamily: 'Poppins',
                        fontStyle: 'normal',
                        fontWeight: 500,
                        fontSize: '10px',
                        lineHeight: '15px',
                        color: 'black',
                      }}
                    >
                      {profile.team_color}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : query.trim().length >= 2 ? (
          <NoResultsFound />
        ) : query.trim().length > 0 ? (
          <div className="search-hint">Type at least 2 characters to search</div>
        ) : (
          <NoResultsState />
        )}
      </div>

      {/* Centered Profile Preview */}
      {selectedProfile && (
        <>
          {/* Subtle backdrop */}
          <div 
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 999
            }}
            onClick={handleClosePreview}
          />
          {/* Centered profile */}
          <div style={{ 
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            maxHeight: '90vh',
            overflow: 'auto',
            maxWidth: '90vw'
          }}>
            <PlyrZeroProfileStandalone 
              profileId={selectedProfile}
              isOpen={true}
              onClose={handleClosePreview}
            />
          </div>
        </>
      )}
    </div>
  );
};