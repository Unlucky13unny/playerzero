import { Button } from "../ui/button"
import { CountryFlag } from "../common/CountryFlag"
import { useMobile } from "../../hooks/useMobile"

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
  
  switch (platform) {
    case 'instagram':
      return value.startsWith('@') ? `https://instagram.com/${value.slice(1)}` : `https://instagram.com/${value}`
    case 'facebook':
      return value.includes('facebook.com') ? value : `https://facebook.com/${value}`
    case 'snapchat':
      return value.startsWith('@') ? `https://snapchat.com/add/${value.slice(1)}` : `https://snapchat.com/add/${value}`
    case 'twitter':
      return value.startsWith('@') ? `https://twitter.com/${value.slice(1)}` : `https://twitter.com/${value}`
    case 'tiktok':
      return value.startsWith('@') ? `https://tiktok.com/${value}` : `https://tiktok.com/@${value}`
    case 'youtube':
      return value.includes('youtube.com') ? value : value.startsWith('@') ? `https://youtube.com/${value}` : `https://youtube.com/c/${value}`
    case 'twitch':
      return `https://twitch.tv/${value}`
    case 'reddit':
      return value.startsWith('u/') ? `https://reddit.com/${value}` : `https://reddit.com/u/${value}`
    default:
      return value
  }
}

export function ProfileInfo({ viewMode, profile }: ProfileInfoProps) {
  const isMobile = useMobile()
  const getModeButton = () => {
    if (viewMode === "public") {
      return (
        <div style={{
          /* Public mode button */
          boxSizing: 'border-box',
          /* Auto layout */
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '4px 8px',
          gap: '10px',
          width: '100px',
          height: '28px',
          background: 'rgba(43, 196, 156, 0.09)',
          border: '1px solid #2BC49C',
          borderRadius: '20px',
          /* Inside auto layout */
          flex: 'none',
          order: 0,
          flexGrow: 0,
          cursor: 'default'
        }}>
          <span style={{
            /* Public mode text */
            width: '64px',
            height: '15px',
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: 600,
            fontSize: '10px',
            lineHeight: '15px',
            /* identical to box height */
            color: '#2BC49C',
            /* Inside auto layout */
            flex: 'none',
            order: 0,
            flexGrow: 0,
            whiteSpace: 'nowrap',
          }}>
            Public mode
          </span>
        </div>
      )
    }
    if (viewMode === "team") {
      return (
        <Button size="sm" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
          Team mode
        </Button>
      )
    }
    return (
      <div style={{
        /* Private mode button */
        boxSizing: 'border-box',
        /* Auto layout */
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '4px 8px',
        gap: '10px',
        width: 'auto',
        minWidth: '100px',
        height: '28px',
        background: 'rgba(220, 38, 39, 0.05)',
        border: '1px solid #DC2627',
        borderRadius: '20px',
        /* Inside auto layout */
        flex: 'none',
        order: 0,
        flexGrow: 0,
        cursor: 'default'
      }}>
        <span style={{
          /* Private mode text */
          width: 'auto',
          minWidth: '68px',
          height: '15px',
          fontFamily: 'Poppins',
          fontStyle: 'normal',
          fontWeight: 600,
          fontSize: '10px',
          lineHeight: '15px',
          /* identical to box height */
          color: '#DC2627',
          /* Inside auto layout */
          flex: 'none',
          order: 0,
          flexGrow: 0,
          whiteSpace: 'nowrap',
        }}>
          Private mode
        </span>
      </div>
    )
  }

  const getTrainerCode = () => {
    if (!profile?.trainer_code) {
      return "No trainer code"
    }
    if (profile?.trainer_code_private) {
      return "205***********"
    }
    // Format trainer code with spaces like PublicProfile: 2056 5536 4353
    return profile.trainer_code.replace(/(.{4})/g, "$1 ").trim()
  }

  const getTeamName = () => {
    if (profile?.team_color) {
      const team = TEAM_COLORS.find(t => t.value === profile.team_color)
      return team?.label || profile.team_color.charAt(0).toUpperCase() + profile.team_color.slice(1)
    }
    return "Unknown"
  }

  const copyTrainerCode = () => {
    if (profile?.trainer_code && !profile?.trainer_code_private) {
      navigator.clipboard.writeText(profile.trainer_code.replace(/\s/g, ''))
    }
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
      borderRadius: '8px'
    }}>
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
          <div style={{
            /* Frame 518 */
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: '0px',
            gap: '8px',
            width: '131px',
            height: '26.59px',
            /* Inside auto layout */
            flex: 'none',
            order: 2,
            flexGrow: 0,
          }}>
                {/* Facebook Icon - Only show if linked */}
            {profile?.facebook && (
              <div style={{
                /* Group 396 */
                width: '26.59px',
                height: '26.59px',
                /* Inside auto layout */
                flex: 'none',
                order: 0,
                flexGrow: 0,
                position: 'relative',
              }}>
                <a 
                  href={getSocialLink('facebook', profile.facebook)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title={`Visit ${profile.facebook} on Facebook`}
                >
                  <img src="/images/facebook.svg" alt="Facebook" style={{ width: '26.59px', height: '26.59px' }} />
                </a>
              </div>
            )}
                
                {/* Instagram Icon - Only show if linked */}
            {profile?.instagram && (
              <div style={{
                /* Group 397 */
                width: '26.59px',
                height: '26.59px',
                /* Inside auto layout */
                flex: 'none',
                order: 1,
                flexGrow: 0,
                position: 'relative',
              }}>
                <a 
                  href={getSocialLink('instagram', profile.instagram)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title={`Visit ${profile.instagram} on Instagram`}
                >
                  <img src="/images/instagram.svg" alt="Instagram" style={{ width: '26.59px', height: '26.59px' }} />
                </a>
              </div>
            )}
                
                {/* Snapchat Icon - Only show if linked */}
            {profile?.snapchat && (
              <div style={{
                /* Group 398 */
                width: '26.59px',
                height: '26.59px',
                /* Inside auto layout */
                flex: 'none',
                order: 2,
                flexGrow: 0,
                position: 'relative',
              }}>
                <a 
                  href={getSocialLink('snapchat', profile.snapchat)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  title={`Add ${profile.snapchat} on Snapchat`}
                >
                  <img src="/images/snapchat.svg" alt="Snapchat" style={{ width: '26.59px', height: '26.59px' }} />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mode Button */}
      <div style={{ 
        marginTop: '8px', 
        display: 'flex', 
        justifyContent: 'flex-start',
        alignItems: 'flex-start'
      }}>
        {getModeButton()}
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
            <span style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '18px',
              color: '#DC2627',
              textAlign: 'left',
            }}>{getTeamName()}</span>
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
            {profile?.start_date ? new Date(profile.start_date).toLocaleDateString('en-US', {
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
              {(profile?.trainer_level || 0) >= 50 ? 'Complete' : 'In Progress'}
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
              <span style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '18px',
                color: '#848282',
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


    </div>
  )
}
