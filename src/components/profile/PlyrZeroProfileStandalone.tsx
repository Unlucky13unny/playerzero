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
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  youtube?: string;
  twitch?: string;
  reddit?: string;
  facebook?: string;
  snapchat?: string;
  github?: string;
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

export function PlyrZeroProfileStandalone({ 
  profileId, 
  isOpen, 
  onClose 
}: PlyrZeroProfileStandaloneProps) {
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
      padding: "6px 10px",
      backgroundColor: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      display: "flex",
      flexDirection: "column" as const,
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center" as const,
    },
    statValue: {
      fontSize: "18px",
      fontWeight: "bold",
      color: "black",
      lineHeight: "1.2",
      marginBottom: "3px",
    },
    statLabel: {
      fontSize: "12px",
      color: "#6b7280",
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
    <div style={styles.container}>
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
                const href = isPrivate ? undefined : getSocialLink(platform.id, (profileData?.[platform.id as keyof QuickProfileData] as string) || '');
                
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
        <div style={styles.loadingContainer}>
          <div 
            style={{ 
              width: "40px", 
              height: "40px", 
              border: "4px solid #f3f4f6", 
              borderTop: "4px solid #dc2626", 
              borderRadius: "50%", 
              marginBottom: "16px"
            }}
            className="loading-spinner"
          ></div>
          <p>Loading profile...</p>
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
                  {profileData.country && <CountryFlag countryName={profileData.country} size={20} />}
                  <span>{profileData.country}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats - Row Layout */}
          <div style={styles.statsContainer}>
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {profileData.distance_walked.toFixed(1)} km
              </div>
              <div style={styles.statLabel}>Distance Walked</div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {profileData.pokemon_caught.toLocaleString()}
              </div>
              <div style={styles.statLabel}>Pokémon Caught</div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {profileData.pokestops_visited.toLocaleString()}
              </div>
              <div style={styles.statLabel}>Pokéstops Visited</div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statValue}>
                {formatXP(profileData.total_xp)}
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
      
      {/* CSS Animation for loading spinner */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .loading-spinner {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />

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
                  const href = isPrivate ? undefined : getSocialLink(platform.id, (profileData?.[platform.id as keyof QuickProfileData] as string) || '');
                  
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
