"use client"

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../services/profileService';
import { useTrialStatus } from '../../hooks/useTrialStatus';
import { CountryFlag } from '../common/CountryFlag';

// Import team colors from the shared constants
const TEAM_COLORS = [
  { value: 'blue', label: 'Blue', color: '#0074D9', team: 'Blue Team' },
  { value: 'red', label: 'Red', color: '#FF4136', team: 'Red Team' },
  { value: 'yellow', label: 'Yellow', color: '#FFDC00', team: 'Yellow Team' },
  { value: 'black', label: 'Black', color: '#111111', team: 'Black Team' },
  { value: 'green', label: 'Green', color: '#2ECC40', team: 'Green Team' },
  { value: 'orange', label: 'Orange', color: '#FF851B', team: 'Orange Team' },
  { value: 'purple', label: 'Purple', color: '#B10DC9', team: 'Purple Team' },
  { value: 'pink', label: 'Pink', color: '#F012BE', team: 'Pink Team' }
];

interface PlyrZeroProfileStandaloneProps {
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
  trainer_code?: string;
  trainer_code_private?: boolean;
  // Social Media fields
  x?: string;
  bluesky?: string;
  facebook?: string;
  discord?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  twitch?: string;
  reddit?: string;
  social_links_private?: boolean;
  is_paid_user?: boolean;
}

// Social platform definitions matching ProfileInfo
const getSocialPlatforms = () => [
  { id: 'x', name: 'X (Twitter)' },
  { id: 'bluesky', name: 'Bluesky' },
  { id: 'facebook', name: 'Facebook' },
  { id: 'discord', name: 'Discord' },
  { id: 'instagram', name: 'Instagram' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'tiktok', name: 'TikTok' },
  { id: 'twitch', name: 'Twitch' },
  { id: 'reddit', name: 'Reddit' },
]

export function PlyrZeroProfileStandalone({ 
  profileId, 
  isOpen, 
  onClose 
}: PlyrZeroProfileStandaloneProps) {
  const [profileData, setProfileData] = useState<QuickProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllSocial, setShowAllSocial] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
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

  // Format large numbers with full values (e.g., 1000 instead of 1K)
  const formatNumber = (num: number | undefined | null): string => {
    if (!num) return '0';
    return Math.floor(num).toLocaleString();
  };

  const copyDiscordHandle = (handle: string) => {
    const formattedHandle = handle.startsWith('@') ? handle : `@${handle}`;
    navigator.clipboard.writeText(formattedHandle);
    setShowCopyToast(true);
    setTimeout(() => {
      setShowCopyToast(false);
    }, 2000);
  };

  // Utility function to generate social media links
  const getSocialLink = (platform: string, value: string): string | undefined => {
    if (!value) return undefined;
    
    // Special handling for Bluesky URLs - ensure .bsky.social is appended
    if (platform === 'bluesky') {
      // If it's already a full bsky.app URL
      if (value.startsWith('https://bsky.app/profile/') || value.startsWith('http://bsky.app/profile/')) {
        const urlParts = value.split('/profile/');
        if (urlParts.length === 2) {
          const username = urlParts[1].replace('@', '');
          const handle = username.includes('.') ? username : `${username}.bsky.social`;
          return `https://bsky.app/profile/${handle}`;
        }
      }
      // If it's just a username
      const username = value.replace('@', '');
      const handle = username.includes('.') ? username : `${username}.bsky.social`;
      return `https://bsky.app/profile/${handle}`;
    }
    
    // If value is already a full URL, return it as is (for other platforms)
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return value;
    }
    
    switch (platform) {
      case 'x':
        return `https://x.com/${value.replace('@', '')}`;
      case 'facebook':
        return `https://www.facebook.com/${value.replace('@', '')}`;
      case 'discord':
        // Discord handles should have @ prefix
        return value.startsWith('@') ? value : `@${value}`;
      case 'instagram':
        return `https://www.instagram.com/${value.replace('@', '')}`;
      case 'youtube':
        return `https://www.youtube.com/@${value.replace('@', '')}`;
      case 'tiktok':
        return `https://www.tiktok.com/@${value.replace('@', '')}`;
      case 'twitch':
        return `https://www.twitch.tv/${value.replace('@', '')}`;
      case 'reddit':
        return `https://www.reddit.com/user/${value.replace('@', '')}`;
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

  // Determine if social links should be shown based on viewer status
  const shouldShowSocialLinks = () => {
    // Trial users can never see social links
    if (!trialStatus.isPaidUser) {
      return false;
    }
    // Paid users see social links if the profile owner has made them public
    return profileData?.is_paid_user && !profileData?.social_links_private;
  };


  const styles = {
    container: {
      maxWidth: "430px",
      margin: "0",
      backgroundColor: "white",
      minHeight: "auto",
      fontFamily: "system-ui, -apple-system, sans-serif",
      borderRadius: "12px",
      overflow: "hidden",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 16px 8px 16px",
    },
    title: {
      fontSize: "20px",
      fontWeight: "600",
      color: "black",
      margin: 0,
    },
    closeButton: {
      background: "none",
      border: "none",
      padding: "8px",
      cursor: "pointer",
      borderRadius: "4px",
      color: "black",
    },
    socialContainer: {
      display: "flex",
      gap: "12px",
      padding: "0 16px 16px 16px",
    },
    socialIcon: {
      width: "32px",
      height: "32px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "transform 0.2s",
    },
    facebookIcon: {
      backgroundColor: "#1877f2",
    },
    instagramIcon: {
      backgroundColor: "black",
    },
    snapchatIcon: {
      backgroundColor: "#fffc00",
    },
    snapchatInner: {
      width: "16px",
      height: "16px",
      backgroundColor: "white",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    snapchatDot: {
      width: "8px",
      height: "8px",
      backgroundColor: "black",
      borderRadius: "50%",
    },
    userInfo: {
      padding: "0 16px 24px 16px",
    },
    userInfoGrid: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontSize: "14px",
      gap : "40px",
      marginTop : "20px",
    },
    userInfoItem: {
      display: "flex",
      flexDirection: "column" as const,
    },
    label: {
      color: "#6b7280",
      marginBottom: "2px",
    },
    value: {
      fontWeight: "500",
      color: "black",
    },
    teamValue: {
      fontWeight: "500",
    },
    countryValue: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontWeight: "500",
      color: "black",
    },
    statsContainer: {
      padding: "0 16px",
      display: "flex",
      flexDirection: "column" as const,
      gap: "10px",
    },
    statCard: {
      padding: "10px 12px",
      backgroundColor: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "flex-start",
      justifyContent: "flex-start",
      textAlign: "left" as const,
    },
    statValue: {
      fontSize: "18px",
      fontWeight: "600",
      color: "black",
      lineHeight: "1.2",
      marginBottom: "3px",
      letterSpacing: "-0.5px",
    },
    statLabel: {
      fontSize: "12px",
      color: "#9ca3af",
      fontWeight: "400",
    },
    buttonContainer: {
      padding: "20px 16px 16px 16px",
    },
    viewProfileButton: {
      width: "100%",
      border: "none",
      borderRadius: "8px",
      padding: "12px",
      fontSize: "16px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    loadingContainer: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 16px",
      color: "black",
    },
    errorContainer: {
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 16px",
      color: "#dc2626",
    },
  }

  if (!isOpen) return null;

  return (
    <div style={{ ...styles.container, position: 'relative' }}>
      {/* Copy Toast Notification */}
      {showCopyToast && (
        <div style={{
          position: 'absolute',
          top: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#22c55e',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: '8px',
          fontFamily: 'Poppins',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          animation: 'slideDown 0.3s ease-out',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap'
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.667 5L7.50033 14.1667L3.33366 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Discord handle copied!
        </div>
      )}
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
          <h1 style={styles.title}>{profileData?.trainer_name || "PlyrZero"}</h1>
          
          {/* Social Media Icons - Show up to 4 with +N button */}
          {connectedPlatforms.length > 0 && (
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginTop: '8px',
              alignItems: 'center'
            }}>
              {/* Show first 4 connected platforms */}
              {visiblePlatforms.map((platform) => {
                const isPrivate = !shouldShowSocialLinks();
                const value = (profileData?.[platform.id as keyof QuickProfileData] as string) || '';
                const href = isPrivate ? undefined : getSocialLink(platform.id, value);
                const isDiscord = platform.id === 'discord';
                
                return isPrivate ? (
                  <div
                    key={platform.id}
                    style={{
                      opacity: 0.4,
                      filter: 'grayscale(100%)',
                      cursor: 'default',
                    }}
                    title="Private"
                  >
                    <img 
                      src={`/images/${platform.id}.svg`} 
                      alt={platform.name} 
                      style={{ width: '26.59px', height: '26.59px' }} 
                    />
                  </div>
                ) : isDiscord ? (
                  <div
                    key={platform.id}
                    onClick={() => copyDiscordHandle(value)}
                    className="hover:opacity-80 transition-opacity"
                    style={{ cursor: 'pointer' }}
                    title="Click to copy Discord handle"
                  >
                    <img 
                      src={`/images/${platform.id}.svg`} 
                      alt={platform.name} 
                      style={{ width: '26.59px', height: '26.59px' }} 
                    />
                  </div>
                ) : (
                  <a
                    key={platform.id}
                    href={href}
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
                );
              })}
              
              {/* +N Button if there are more than 4 connected platforms */}
              {hasMorePlatforms && (
                <div
                  onClick={() => shouldShowSocialLinks() && setShowAllSocial(true)}
                  style={{
                    width: '26.59px',
                    height: '26.59px',
                    background: shouldShowSocialLinks() ? '#000000' : '#848282',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: shouldShowSocialLinks() ? 'pointer' : 'default',
                    opacity: shouldShowSocialLinks() ? 1 : 0.4,
                  }}
                  className={shouldShowSocialLinks() ? 'hover:opacity-80 transition-opacity' : ''}
                  title={shouldShowSocialLinks() ? 'View more social accounts' : 'Private'}
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
          )}
        </div>
        
        <button
          style={styles.closeButton}
          onClick={onClose}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', width: '100%' }}>
          <p style={{ fontSize: '18px', color: '#DC2627', fontWeight: 600, fontFamily: 'Poppins, sans-serif', textAlign: 'center', padding: '0 20px' }}>Loading your Profile...</p>
        </div>
      ) : error ? (
        <div style={styles.errorContainer}>
          <p>{error}</p>
          <button 
            onClick={loadProfileData}
            style={{
              marginTop: "16px",
              padding: "8px 16px",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Retry
          </button>
        </div>
      ) : profileData ? (
        <>

          {/* User Info */}
          <div style={styles.userInfo}>
            <div style={styles.userInfoGrid}>
              <div style={styles.userInfoItem}>
                <span style={styles.label}>Level:</span>
                <div style={styles.value}>{profileData.trainer_level}</div>
              </div>
              <div style={styles.userInfoItem}>
                <span style={styles.label}>Team:</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: getTeamColor(profileData.team_color),
                    border: '1px solid rgba(0, 0, 0, 0.1)'
                  }}></div>
                  <span style={{
                    ...styles.teamValue,
                    color: 'black'
                  }}>
                    {getTeamName(profileData.team_color)}
                  </span>
                </div>
              </div>
              <div style={styles.userInfoItem}>
                <span style={styles.label}>Country:</span>
                <div style={styles.countryValue}>
                  {profileData.country && <CountryFlag countryName={profileData.country} width={20} height={15} />}
                  <span>{profileData.country}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats - Row Layout */}
          <div style={styles.statsContainer}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {formatNumber(profileData.distance_walked)} km
              </div>
              <div style={styles.statLabel}>Distance Walked</div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {formatNumber(profileData.pokemon_caught)}
              </div>
              <div style={styles.statLabel}>Pokémon Caught</div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {formatNumber(profileData.pokestops_visited)}
              </div>
              <div style={styles.statLabel}>Pokéstops Visited</div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {formatNumber(profileData.total_xp)}
              </div>
              <div style={styles.statLabel}>Total XP</div>
            </div>
          </div>

          {/* View Profile Button */}
          <div style={styles.buttonContainer}>
            <button
              style={{
                ...styles.viewProfileButton,
                backgroundColor: trialStatus.canClickIntoProfiles ? "#dc2626" : "#666",
                color: "white",
              }}
              onClick={handleViewFullProfile}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = trialStatus.canClickIntoProfiles ? "#b91c1c" : "#555")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = trialStatus.canClickIntoProfiles ? "#dc2626" : "#666")}
              title={trialStatus.canClickIntoProfiles ? "View full profile" : "Upgrade to view full profiles"}
            >
              View Profile
            </button>
          </div>
        </>
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
                {connectedPlatforms.map((platform) => {
                  const isPrivate = !shouldShowSocialLinks();
                  const value = (profileData?.[platform.id as keyof QuickProfileData] as string) || '';
                  const href = isPrivate ? undefined : getSocialLink(platform.id, value);
                  const isDiscord = platform.id === 'discord';
                  
                  return isPrivate ? (
                    <div
                      key={platform.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.4,
                        filter: 'grayscale(100%)',
                        cursor: 'default',
                      }}
                      title="Private"
                    >
                      <img 
                        src={`/images/${platform.id}.svg`} 
                        alt={platform.name} 
                        style={{ 
                          width: '44px', 
                          height: '44px',
                        }} 
                      />
                    </div>
                  ) : isDiscord ? (
                    <div
                      key={platform.id}
                      onClick={() => copyDiscordHandle(value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      className="hover:opacity-80 transition-opacity"
                      title="Click to copy Discord handle"
                    >
                      <img 
                        src={`/images/${platform.id}.svg`} 
                        alt={platform.name} 
                        style={{ 
                          width: '44px', 
                          height: '44px',
                        }} 
                      />
                    </div>
                  ) : (
                    <a
                      key={platform.id}
                      href={href}
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
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
