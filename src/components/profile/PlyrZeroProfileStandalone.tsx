"use client"

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../../services/profileService';
import { useTrialStatus } from '../../hooks/useTrialStatus';
import { useValuePropModal } from '../../hooks/useValuePropModal';
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
  // Social Media fields
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  youtube?: string;
  twitch?: string;
  reddit?: string;
  facebook?: string;
  snapchat?: string;
  social_links_private?: boolean;
  is_paid_user?: boolean;
}

export function PlyrZeroProfileStandalone({ 
  profileId, 
  isOpen, 
  onClose 
}: PlyrZeroProfileStandaloneProps) {
  const [profileData, setProfileData] = useState<QuickProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const trialStatus = useTrialStatus();
  const { showValueProp } = useValuePropModal();

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
      showValueProp('profile');
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
      default:
        return value;
    }
  };


  const styles = {
    container: {
      maxWidth: "384px",
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
      gap: "16px",
    },
    statsRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
    },
    statCard: {
      padding: "16px",
      backgroundColor: "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
    },
    statValue: {
      fontSize: "24px",
      fontWeight: "bold",
      color: "black",
      lineHeight: "1.2",
    },
    statLabel: {
      fontSize: "14px",
      color: "#6b7280",
      marginTop: "4px",
    },
    buttonContainer: {
      padding: "24px 16px 16px 16px",
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
          
          {/* Social Media Icons - Below username, left-aligned */}
          {(() => {
            // Get available social media accounts
            const availableSocial = [];
            if (profileData?.facebook) availableSocial.push({ type: 'facebook', value: profileData.facebook });
            if (profileData?.instagram) availableSocial.push({ type: 'instagram', value: profileData.instagram });
            if (profileData?.snapchat) availableSocial.push({ type: 'snapchat', value: profileData.snapchat });
            
            // Only show if there are social links and they're not private
            if (availableSocial.length === 0 || profileData?.social_links_private) return null;
            
            // Show up to 3 social icons
            const socialToShow = availableSocial.slice(0, 3);
            
            return (
              <div style={{ 
                display: 'flex', 
                gap: '2px', 
                marginTop: '8px',
                alignItems: 'center'
              }}>
                {socialToShow.map((social, index) => {
                  const { type, value } = social;
                  return (
                    <a 
                      key={`${type}-${index}`}
                      href={getSocialLink(type, value)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Visit ${value} on ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                      style={{ display: 'block' }}
                    >
                      <img 
                        src={`/images/${type}.svg`} 
                        alt={type.charAt(0).toUpperCase() + type.slice(1)} 
                        style={{ width: '26.59px', height: '26.59px' }} 
                      />
                    </a>
                  );
                })}
              </div>
            );
          })()}
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
                  ...styles.teamValue, 
                  color: getTeamColor(profileData.team_color) 
                }}>
                  {getTeamName(profileData.team_color)}
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

          {/* Stats Grid */}
          <div style={styles.statsContainer}>
            <div style={styles.statsRow}>
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
            </div>

            <div style={styles.statsRow}>
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
              {!trialStatus.canClickIntoProfiles && <span>🔒 </span>}
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
    </div>
  )
}
