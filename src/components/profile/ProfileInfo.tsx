import { CountryFlag } from "../common/CountryFlag"
import { useMobile } from "../../hooks/useMobile"
import { useState } from "react"

// Team colors matching PublicProfile implementation
const TEAM_COLORS = [
  { value: 'blue', label: 'Blue', color: '#0074D9', team: 'Blue Team' },
  { value: 'red', label: 'Red', color: '#FF4136', team: 'Red Team' },
  { value: 'yellow', label: 'Yellow', color: '#FFDC00', team: 'Yellow Team' },
  { value: 'black', label: 'Black', color: '#111111', team: 'Black Team' },
  { value: 'green', label: 'Green', color: '#2ECC40', team: 'Green Team' },
  { value: 'orange', label: 'Orange', color: '#FF851B', team: 'Orange Team' },
  { value: 'purple', label: 'Purple', color: '#B10DC9', team: 'Purple Team' },
  { value: 'pink', label: 'Pink', color: '#F012BE', team: 'Pink Team' }
]

interface ProfileInfoProps {
  viewMode: "public" | "private" | "team" | "own"
  userType: "trial" | "upgraded"
  profile?: any
}

// Utility function to generate social media links
const getSocialLink = (platform: string, value: string): string | undefined => {
  if (!value) return undefined
  
  // Special handling for Bluesky URLs - ensure .bsky.social is appended
  if (platform === 'bluesky') {
    // If it's already a full bsky.app URL
    if (value.startsWith('https://bsky.app/profile/') || value.startsWith('http://bsky.app/profile/')) {
      const urlParts = value.split('/profile/')
      if (urlParts.length === 2) {
        const username = urlParts[1].replace('@', '')
        const handle = username.includes('.') ? username : `${username}.bsky.social`
        return `https://bsky.app/profile/${handle}`
      }
    }
    // If it's just a username
    const username = value.replace('@', '')
    const handle = username.includes('.') ? username : `${username}.bsky.social`
    return `https://bsky.app/profile/${handle}`
  }
  
  // If value is already a full URL, return it as is (for other platforms)
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }
  
  switch (platform) {
    case 'x':
      return `https://x.com/${value.replace('@', '')}`
    case 'facebook':
      return `https://www.facebook.com/${value.replace('@', '')}`
    case 'discord':
      // Discord handles should have @ prefix
      return value.startsWith('@') ? value : `@${value}`
    case 'instagram':
      return `https://www.instagram.com/${value.replace('@', '')}`
    case 'youtube':
      return `https://www.youtube.com/@${value.replace('@', '')}`
    case 'tiktok':
      return `https://www.tiktok.com/@${value.replace('@', '')}`
    case 'twitch':
      return `https://www.twitch.tv/${value.replace('@', '')}`
    case 'reddit':
      return `https://www.reddit.com/user/${value.replace('@', '')}`
    default:
      return value
  }
}

// Social platform definitions with SVG file paths
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

export function ProfileInfo({ viewMode, profile }: ProfileInfoProps) {
  const isMobile = useMobile()
  const [showAllSocial, setShowAllSocial] = useState(false)
  const [showCopyToast, setShowCopyToast] = useState(false)

  // Get connected social platforms
  const getConnectedPlatforms = () => {
    const allPlatforms = getSocialPlatforms()
    return allPlatforms.filter(platform => {
      const value = profile?.[platform.id as keyof typeof profile];
      return value && typeof value === 'string' && value.trim() !== '';
    });
  }

  const connectedPlatforms = getConnectedPlatforms()
  const visiblePlatforms = connectedPlatforms.slice(0, 4)
  const remainingPlatforms = connectedPlatforms.slice(4)
  const hasMorePlatforms = remainingPlatforms.length > 0

  const getTrainerCode = () => {
    if (!profile?.trainer_code) {
      return "No trainer code"
    }
    if (profile?.trainer_code_private) {
      return "205***********"
    }
    // Display trainer code without spaces
    return profile.trainer_code
  }

  const getTeamName = () => {
    if (profile?.team_color) {
      const team = TEAM_COLORS.find(t => t.value === profile.team_color)
      return team?.label || profile.team_color.charAt(0).toUpperCase() + profile.team_color.slice(1)
    }
    return "Unknown"
  }

  const getTeamColor = () => {
    if (profile?.team_color) {
      const team = TEAM_COLORS.find(t => t.value === profile.team_color)
      return team?.color || '#666666'
    }
    return '#666666'
  }

  const copyDiscordHandle = (handle: string) => {
    const formattedHandle = handle.startsWith('@') ? handle : `@${handle}`
    navigator.clipboard.writeText(formattedHandle)
    setShowCopyToast(true)
    setTimeout(() => {
      setShowCopyToast(false)
    }, 2000)
  }

  const copyTrainerCode = () => {
    if (profile?.trainer_code && !profile?.trainer_code_private) {
      navigator.clipboard.writeText(profile.trainer_code.replace(/\s/g, ''))
    }
  }

  // Calculate Summit Date based on XP progression and Level 80 threshold
  const calculateSummitDate = () => {
    const GOAL_XP = 203_353_000 // Level 80 XP threshold
    const currentXP = profile?.total_xp || 0
    const currentLevel = profile?.trainer_level || 0
    
    // If reached Level 80 XP threshold
    if (currentXP >= GOAL_XP) {
      // Check if they've also confirmed Level 80
      if (currentLevel >= 80) {
        return 'Complete'
      }
      // They have the XP but haven't updated their level yet
      return 'XP Achieved'
    }
    
    // Below Level 80 XP threshold - calculate projected date
    if (!profile?.start_date) {
      return 'In Progress'
    }
    
    // Calculate days since start
    const startDate = new Date(profile.start_date + 'T00:00:00')
    const today = new Date()
    const daysSinceStart = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    
    // Calculate average daily XP
    const averageDailyXP = currentXP / daysSinceStart
    
    if (averageDailyXP <= 0) {
      return 'In Progress'
    }
    
    // Calculate XP needed and days needed
    const xpNeeded = GOAL_XP - currentXP
    const daysNeeded = Math.round(xpNeeded / averageDailyXP) // Round to nearest whole day
    
    // Calculate summit date
    const summitDate = new Date()
    summitDate.setDate(summitDate.getDate() + daysNeeded)
    
    // Format date as Month Day, Year (e.g., "March 2, 2028")
    return summitDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div style={{
      /* Frame 517 - ProfileInfo Container */
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      padding: '8px 0px',
      gap: '8px',
      width: isMobile ? '312px' : '320px',
      height: isMobile ? '249px' : 'auto',
      /* Inside auto layout */
      flex: 'none',
      order: 0,
      flexGrow: 0,
      background: '#FFFFFF',
      borderRadius: '8px',
      position: 'relative'
    }}>
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
      {/* Frame 25 - Main Profile Container */}
      <div style={{
        /* Frame 25 */
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '0px',
        gap: '24px',
        width: isMobile ? '312px' : '320px',
        height: '101px',
        /* Inside auto layout */
        flex: 'none',
        order: 0,
        alignSelf: 'stretch',
        flexGrow: 0,
      }}>
        {/* Frame 557 - Level Section */}
        <div style={{
          /* Frame 557 */
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0px',
          width: '76px',
          height: '102px',
          /* Inside auto layout */
          flex: 'none',
          order: 0,
          flexGrow: 0,
        }}>
          <div style={{
            /* Level Number - 50 */
            width: '79px',
            height: '66px',
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: '60px',
            lineHeight: '90px',
            color: '#000000',
            /* Inside auto layout */
            flex: 'none',
            order: 0,
            flexGrow: 0,
          }}>{profile?.trainer_level || 50}</div>
          <div style={{
            /* LVL */
            width: '65px',
            height: '36px',
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: '24px',
            lineHeight: '36px',
            textAlign: 'center',
            letterSpacing: '0.5em',
            color: '#000000',
            /* Inside auto layout */
            flex: 'none',
            order: 1,
            flexGrow: 0,
          }}>LVL</div>
        </div>

        {/* Frame 24 - Trainer Info Section */}
        <div style={{
          /* Frame 24 */
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '0px',
          width: '212px',
          height: '94.59px',
          /* Inside auto layout */
          flex: 'none',
          order: 1,
          flexGrow: 0,
        }}>
          {/* Trainer Name */}
          <div style={{
            /* LumbrJackson */
            width: '100%',
            height: '36px',
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: 600,
            fontSize: '24px',
            lineHeight: '36px',
            color: '#000000',
            textAlign: 'left', // Left align for both mobile and web
            /* Inside auto layout */
            flex: 'none',
            order: 0,
            alignSelf: 'stretch',
            flexGrow: 0,
          }}>{profile?.trainer_name || "Unknown Trainer"}</div>

          {/* Frame 22 - Country Section */}
          <div style={{
            /* Frame 22 */
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '0px',
            gap: '6px',
            width: '81px',
            height: '32px',
            /* Inside auto layout */
            flex: 'none',
            order: 1,
            whiteSpace: 'nowrap',
            flexGrow: 0,
          }}>
            {profile?.country && (
              <>
                <div style={{
                  /* Flag */
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: '20px',
                  lineHeight: '20px',
                  color: '#000000',
                  /* Inside auto layout */
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  <CountryFlag countryName={profile.country} size={20} />
            </div>
                <span style={{
                  /* Country Name */
                  width: '55px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '20px',
                  color: '#353535',
                  /* Inside auto layout */
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                }}>{profile?.country || "Unknown Country"}</span>
              </>
            )}
              </div>

          {/* Frame 518 - Social Icons */}
          {connectedPlatforms.length > 0 && (
            <div style={{
              /* Frame 518 */
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              padding: '0px',
              gap: '8px',
              width: 'auto',
              height: '26.59px',
              /* Inside auto layout */
              flex: 'none',
              order: 2,
              flexGrow: 0,
            }}>
              {/* Show first 4 connected platforms */}
              {visiblePlatforms.map((platform, index) => {
                const isPrivate = profile?.social_links_private
                const value = profile?.[platform.id as keyof typeof profile] as string
                const href = isPrivate ? undefined : getSocialLink(platform.id, value)
                const isDiscord = platform.id === 'discord'
                
                return (
                  <div
                    key={platform.id}
                    style={{
                      width: '26.59px',
                      height: '26.59px',
                      flex: 'none',
                      order: index,
                      flexGrow: 0,
                      position: 'relative',
                      opacity: isPrivate ? 0.4 : 1,
                      filter: isPrivate ? 'grayscale(100%)' : 'none',
                      cursor: isPrivate ? 'default' : 'pointer',
                    }}
                    title={isPrivate ? 'Private' : isDiscord ? 'Click to copy Discord handle' : `Visit on ${platform.name}`}
                  >
                    {isPrivate ? (
                      <img 
                        src={`/images/${platform.id}.svg`} 
                        alt={platform.name} 
                        style={{ width: '26.59px', height: '26.59px' }} 
                      />
                    ) : isDiscord ? (
                      <div 
                        onClick={() => copyDiscordHandle(value)}
                        className="hover:opacity-80 transition-opacity"
                        style={{ cursor: 'pointer' }}
                      >
                        <img 
                          src={`/images/${platform.id}.svg`} 
                          alt={platform.name} 
                          style={{ width: '26.59px', height: '26.59px' }} 
                        />
                      </div>
                    ) : (
                      <a 
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
                    )}
                  </div>
                )
              })}
              
              {/* +N Button if there are more than 4 connected platforms */}
              {hasMorePlatforms && (
                <div
                  onClick={() => !profile?.social_links_private && setShowAllSocial(true)}
                  style={{
                    width: '26.59px',
                    height: '26.59px',
                    background: profile?.social_links_private ? '#848282' : '#000000',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: profile?.social_links_private ? 'default' : 'pointer',
                    flex: 'none',
                    order: 4,
                    flexGrow: 0,
                    opacity: profile?.social_links_private ? 0.4 : 1,
                  }}
                  className={profile?.social_links_private ? '' : 'hover:opacity-80 transition-opacity'}
                  title={profile?.social_links_private ? 'Private' : 'View more social accounts'}
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
      </div>


            {/* Frame 515 - Details Section */}
      <div style={{
        /* Frame 515 */
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '0px',
        gap: '8px',
        width: isMobile ? '312px' : '320px',
        height: isMobile ? '126px' : '120px',
        /* Inside auto layout */
        flex: 'none',
        order: 1,
        alignSelf: 'stretch',
        flexGrow: 0,
        marginTop: '8px'
      }}>
        {/* Details in Column Layout - Left Aligned */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: '100%',
        }}>
          {/* Team Row */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            gap: '100px'
          }}>
            <span style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '11px',
              lineHeight: '16px',
              color: '#353535',
              textAlign: 'left',
              minWidth: '80px'
            }}>Team:</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: getTeamColor(),
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }}></div>
              <span style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '18px',
                color: 'black',
                textAlign: 'left',
              }}>{getTeamName()}</span>
            </div>
        </div>

          {/* Start Date Row */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            gap: '100px'
          }}>
            <span style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '11px',
              lineHeight: '16px',
              color: '#353535',
              textAlign: 'left',
              minWidth: '80px'
            }}>Start Date:</span>
            <span style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '18px',
              color: '#000000',
              textAlign: 'left',
            }}>
            {profile?.start_date ? new Date(profile.start_date + 'T00:00:00').toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric'
            }) : 'N/A'}
          </span>
        </div>

          {/* Summit Date Row */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            gap: '100px'
          }}>
            <span style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '11px',
              lineHeight: '16px',
              color: '#353535',
              textAlign: 'left',
              minWidth: '80px'
            }}>Summit Date:</span>
            <span style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '18px',
              color: '#000000',
              textAlign: 'left',
            }}>
              {calculateSummitDate()}
            </span>
        </div>

          {/* Trainer Code Row */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            gap: '100px'
          }}>
            <span style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '11px',
              lineHeight: '16px',
              color: '#353535',
              textAlign: 'left',
              minWidth: '80px'
            }}>Trainer Code:</span>
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span 
                //className="hover:scale-110 transition-transform duration-200 ease-in-out cursor-pointer"
                style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '18px',
                color: profile?.trainer_code_private ? '#848282' : '#000000',
                textAlign: 'left',
              }}>{getTrainerCode()}</span>
            {profile?.trainer_code && !profile?.trainer_code_private && viewMode !== "public" && (
              <button 
                onClick={copyTrainerCode}
                title="Copy trainer code"
                  style={{
                    width: '14px',
                    height: '14px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#636874',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Modal for all social accounts - Matching SocialConnectModal design */}
      {showAllSocial && (
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
                  const isPrivate = profile?.social_links_private
                  const href = isPrivate ? undefined : getSocialLink(platform.id, profile?.[platform.id as keyof typeof profile] as string)
                  
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
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
