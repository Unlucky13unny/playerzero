import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../services/profileService';
import { useTrialStatus } from '../../hooks/useTrialStatus';

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
}

interface QuickProfileData {
  trainer_name: string;
  team_color: string;
  trainer_level: number;
  country: string;
  total_xp: number;
  pokemon_caught: number;
  distance_walked: number;
  pokestops_visited: number;
  profile_screenshot_url?: string;
  // Social Media fields
  instagram?: string;
  facebook?: string;
  snapchat?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  twitch?: string;
  github?: string;
  reddit?: string;
  discord?: string;
  telegram?: string;
  whatsapp?: string;
  vimeo?: string;
  social_links_private?: boolean;
  is_paid_user?: boolean;
}

// Social platform definitions matching ProfileInfo
const getSocialPlatforms = () => [
  { id: 'instagram', name: 'Instagram' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'snapchat', name: 'Snapchat' },
  { id: 'twitter', name: 'Twitter' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'twitch', name: 'Twitch' },
  { id: 'github', name: 'GitHub' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'discord', name: 'Discord' },
  { id: 'telegram', name: 'Telegram' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'vimeo', name: 'Vimeo' },
]

export const QuickProfileView = ({ 
  profileId, 
  isOpen, 
  onClose: _onClose
}: QuickProfileViewProps) => {
  const [profileData, setProfileData] = useState<QuickProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllSocial, setShowAllSocial] = useState(false);
  const navigate = useNavigate();
  const trialStatus = useTrialStatus();

  useEffect(() => {
    if (isOpen && profileId) {
      loadProfileData();
    }
  }, [isOpen, profileId]);

  const loadProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await profileService.getQuickProfileView(profileId);
      if (error) throw error;
      setProfileData(data);
    } catch (err) {
      setError('Failed to load profile data');
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullProfile = () => {
    if (!trialStatus.canClickIntoProfiles) {
      navigate('/upgrade');
      return;
    }
    navigate(`/player/${profileId}`);
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

  const formatXP = (xp: number | undefined | null): string => {
    if (!xp) return '0';
    if (xp >= 1000000) {
      return `${(xp / 1000000).toFixed(2)}M`;
    } else if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}K`;
    }
    return xp.toString();
  };

  // Utility function to generate social media links
  const getSocialLink = (platform: string, value: string): string | undefined => {
    if (!value) return undefined;
    
    switch (platform) {
      case 'instagram':
        return value.startsWith('@') ? `https://instagram.com/${value.slice(1)}` : `https://instagram.com/${value}`;
      case 'facebook':
        return value.includes('facebook.com') ? value : `https://facebook.com/${value}`;
      case 'snapchat':
        return value.startsWith('@') ? `https://snapchat.com/add/${value.slice(1)}` : `https://snapchat.com/add/${value}`;
      case 'twitter':
        return value.startsWith('@') ? `https://twitter.com/${value.slice(1)}` : `https://twitter.com/${value}`;
      case 'tiktok':
        return value.startsWith('@') ? `https://tiktok.com/${value}` : `https://tiktok.com/@${value}`;
      case 'youtube':
        return value.includes('youtube.com') ? value : value.startsWith('@') ? `https://youtube.com/${value}` : `https://youtube.com/c/${value}`;
      case 'twitch':
        return `https://twitch.tv/${value}`;
      case 'reddit':
        return value.startsWith('u/') ? `https://reddit.com/${value}` : `https://reddit.com/u/${value}`;
      case 'github':
        return `https://github.com/${value}`;
      case 'discord':
        return value;
      case 'telegram':
        return value.startsWith('@') ? `https://t.me/${value.slice(1)}` : `https://t.me/${value}`;
      case 'whatsapp':
        return `https://wa.me/${value}`;
      case 'vimeo':
        return value.includes('vimeo.com') ? value : `https://vimeo.com/${value}`;
      default:
        return value;
    }
  };

  // Get connected social platforms
  const getConnectedPlatforms = () => {
    if (!profileData) return [];
    const allPlatforms = getSocialPlatforms();
    return allPlatforms.filter(platform => {
      const value = profileData[platform.id as keyof QuickProfileData];
      return value && typeof value === 'string' && value.trim() !== '';
    });
  };

  const connectedPlatforms = getConnectedPlatforms();
  const visiblePlatforms = connectedPlatforms.slice(0, 4);
  const remainingPlatforms = connectedPlatforms.slice(4);
  const hasMorePlatforms = remainingPlatforms.length > 0;

  if (!isOpen) return null;

  return (
    <div className="quick-profile-container" style={{ 
      backgroundColor: 'white', 
      color: 'black',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxWidth: '400px',
      margin: '0 auto'
    }}>
      {loading ? (
        <div className="quick-profile-loading" style={{ textAlign: 'center', color: 'black' }}>
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      ) : error ? (
        <div className="quick-profile-error" style={{ textAlign: 'center', color: 'black' }}>
          <p>{error}</p>
        </div>
      ) : profileData ? (
        <div className="quick-profile-content">
          {/* Header with username top-left aligned */}
          <div className="quick-profile-header" style={{ marginBottom: '16px' }}>
            <div className="quick-profile-info">
              <h3 style={{ 
                color: 'black', 
                margin: '0 0 8px 0', 
                fontSize: '24px', 
                fontWeight: 'bold',
                textAlign: 'left'
              }}>
              {profileData.trainer_name}
              </h3>
              
              {/* Social Links - Below username */}
              {!profileData.social_links_private && connectedPlatforms.length > 0 ? (
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginBottom: '12px',
                  alignItems: 'center',
                }}>
                    {/* Show first 4 connected platforms */}
                  {visiblePlatforms.map((platform) => (
                    <a
                      key={platform.id}
                      href={getSocialLink(platform.id, profileData[platform.id as keyof QuickProfileData] as string)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:opacity-80 transition-opacity"
                      title={`Visit on ${platform.name}`}
                    >
                      <img 
                        src={`/images/${platform.id}.svg`} 
                        alt={platform.name} 
                        style={{ width: '26.59px', height: '26.59px' }} 
                      />
                    </a>
                  ))}
                  
                  {/* +N Button if there are more than 4 connected platforms */}
                  {hasMorePlatforms && (
                    <div
                      onClick={() => setShowAllSocial(true)}
                      style={{
                        width: '26.59px',
                        height: '26.59px',
                        background: '#000000',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      className="hover:opacity-80 transition-opacity"
                      title="View more social accounts"
                    >
                      <span style={{
                        fontFamily: 'Poppins',
                        fontWeight: 600,
                        fontSize: '12px',
                        color: '#FFFFFF',
                      }}>
                        +{remainingPlatforms.length}
                      </span>
                    </div>
                  )}
                </div>
              ) : profileData.social_links_private ? (
                <p style={{ color: '#666', fontSize: '12px', margin: '0 0 12px 0' }}>
                  Social links are private
                </p>
              ) : null}
              
              <div className="quick-profile-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <span className="team-badge" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: 'black'
                }}>
                  <div className="team-color-circle" style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: getTeamColor(profileData.team_color) 
                  }}></div>
                  {getTeamName(profileData.team_color)}
                </span>
                <span className="level-badge" style={{
                  padding: '4px 8px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: 'black'
                }}>
                  Level {profileData.trainer_level}
                </span>
                {profileData.country && (
                  <span className="country-badge" style={{
                    padding: '4px 8px',
                    backgroundColor: '#e0e0e0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'black'
                  }}>
                    {profileData.country}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stats - Row Layout */}
          <div className="quick-profile-stats" style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '10px', 
            marginBottom: '20px' 
          }}>
            <div className="stat-item" style={{ 
              textAlign: 'center', 
              padding: '14px 16px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <div className="stat-value" style={{ fontSize: '22px', fontWeight: 'bold', color: 'black', marginBottom: '3px' }}>
                {profileData.distance_walked.toFixed(1)} km
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>Distance Walked</div>
            </div>
            
            <div className="stat-item" style={{ 
              textAlign: 'center', 
              padding: '14px 16px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <div className="stat-value" style={{ fontSize: '22px', fontWeight: 'bold', color: 'black', marginBottom: '3px' }}>
                {profileData.pokemon_caught.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>Pokémon Caught</div>
            </div>
            
            <div className="stat-item" style={{ 
              textAlign: 'center', 
              padding: '14px 16px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <div className="stat-value" style={{ fontSize: '22px', fontWeight: 'bold', color: 'black', marginBottom: '3px' }}>
                {profileData.pokestops_visited.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>Pokéstops Visited</div>
            </div>
            
            <div className="stat-item" style={{ 
              textAlign: 'center', 
              padding: '14px 16px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <div className="stat-value" style={{ fontSize: '22px', fontWeight: 'bold', color: 'black', marginBottom: '3px' }}>
                {formatXP(profileData.total_xp)}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400' }}>Total XP</div>
            </div>
          </div>

          {/* Footer */}
          <div className="quick-profile-footer" style={{ textAlign: 'center' }}>
            <button 
              className={`view-full-profile-button ${!trialStatus.canClickIntoProfiles ? 'unpaid' : ''}`}
              onClick={handleViewFullProfile}
              title={trialStatus.canClickIntoProfiles ? "View full profile" : "Upgrade to view full profiles"}
              style={{
                backgroundColor: trialStatus.canClickIntoProfiles ? '#DC2627' : '#666',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                width: '100%'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = trialStatus.canClickIntoProfiles ? '#B91C1C' : '#555'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = trialStatus.canClickIntoProfiles ? '#DC2627' : '#666'}
            >
              View Full Profile
            </button>
          </div>
        </div>
      ) : null}

      {/* Modal for all social accounts - Matching SocialConnectModal design */}
      {showAllSocial && profileData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowAllSocial(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              width: '351px',
              height: 'auto',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowAllSocial(false)}
              style={{
                position: 'absolute',
                width: '24px',
                height: '24px',
                right: '13px',
                top: '13px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              className="hover:opacity-70 transition-opacity"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Social Accounts Grid - Matching SocialConnectModal */}
            <div
              style={{
                padding: '60px 16px 24px 16px',
                width: '100%',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '28.25px 31.33px',
                  width: '100%',
                  justifyItems: 'center',
                }}
              >
                {connectedPlatforms.map((platform) => (
                  <a
                    key={platform.id}
                    href={getSocialLink(platform.id, profileData[platform.id as keyof QuickProfileData] as string)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                    }}
                    className="hover:opacity-80 transition-opacity"
                    title={`Visit on ${platform.name}`}
                  >
                    <img 
                      src={`/images/${platform.id}.svg`} 
                      alt={platform.name} 
                      style={{ 
                        width: '44px', 
                        height: '44px',
                      }} 
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 