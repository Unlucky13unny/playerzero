import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Crown } from "../icons/Crown"
import { Trophy, ChevronDown, Upload } from "lucide-react"
import { useMobile } from "../../hooks/useMobile"
import { dashboardService, type LeaderboardEntry } from "../../services/dashboardService"
import { useAuth } from "../../contexts/AuthContext"

interface LeaderboardViewProps {
  userType: "trial" | "upgraded"
}

export function LeaderboardView({ userType }: LeaderboardViewProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<"trainers" | "country" | "team">("trainers")
  const [timePeriod, setTimePeriod] = useState<"weekly" | "monthly" | "alltime">("monthly")
  const [sortBy, setSortBy] = useState<"xp" | "catches" | "distance" | "pokestops">("xp")
  const [lockedExpanded, setLockedExpanded] = useState(false)
  const [liveExpanded, setLiveExpanded] = useState(true)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMobile = useMobile()

  // Removed unused tabs and timePeriods arrays

  const sortOptions = [
    { id: "xp" as const, label: "Total XP" },
    { id: "catches" as const, label: "Pokemon Caught" },
    { id: "distance" as const, label: "Distance Walked" },
    { id: "pokestops" as const, label: "Pokestops Visited" },
  ]

  // Load leaderboard data when filters change
  useEffect(() => {
    if (user) {
      loadLeaderboardData()
    }
  }, [user, activeTab, timePeriod, sortBy])

  const loadLeaderboardData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const params = {
        period: timePeriod === 'alltime' ? 'all-time' as const : timePeriod,
        sortBy,
        view: activeTab === 'trainers' ? 'all' as const : activeTab,
      }

      console.log('Loading leaderboard with params:', params)
      const result = await dashboardService.getLeaderboard(params)

      if (result.error) {
        throw new Error(result.error.message || 'Failed to load leaderboard')
      }

      console.log('Leaderboard data loaded:', result.data)
      setLeaderboardData(result.data || [])
    } catch (err) {
      console.error('Error loading leaderboard:', err)
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
      setLeaderboardData([])
    } finally {
      setLoading(false)
    }
  }

  // Helper functions for data formatting
  const formatNumber = (num: number | null | undefined) => {
    if (!num) return '0'
    return num.toLocaleString()
  }

  const formatDistance = (distance: number | null | undefined) => {
    if (!distance) return '0.0'
    return distance.toFixed(1)
  }

  const getCountryFlag = (countryCode: string) => {
    // Comprehensive country code to flag mapping
    const flags: { [key: string]: string } = {
      // Major countries
      'AU': '🇦🇺', 'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'UK': '🇬🇧',
      'DE': '🇩🇪', 'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'JP': '🇯🇵', 
      'KR': '🇰🇷', 'CN': '🇨🇳', 'IN': '🇮🇳', 'BR': '🇧🇷', 'MX': '🇲🇽', 
      'AR': '🇦🇷', 'RU': '🇷🇺', 'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴',
      
      // European countries
      'DK': '🇩🇰', 'FI': '🇫🇮', 'CH': '🇨🇭', 'AT': '🇦🇹', 'BE': '🇧🇪',
      'PT': '🇵🇹', 'PL': '🇵🇱', 'CZ': '🇨🇿', 'HU': '🇭🇺', 'RO': '🇷🇴',
      'UA': '🇺🇦', 'HR': '🇭🇷', 'RS': '🇷🇸', 'SI': '🇸🇮', 'SK': '🇸🇰',
      'BG': '🇧🇬', 'LT': '🇱🇹', 'LV': '🇱🇻', 'EE': '🇪🇪', 'GR': '🇬🇷',
      'IE': '🇮🇪', 'IS': '🇮🇸',
      
      // Asian countries
      'TH': '🇹🇭', 'SG': '🇸🇬', 'MY': '🇲🇾', 'PH': '🇵🇭', 'ID': '🇮🇩',
      'VN': '🇻🇳', 'TW': '🇹🇼', 'HK': '🇭🇰', 'PK': '🇵🇰', 'BD': '🇧🇩',
      'LK': '🇱🇰', 'MM': '🇲🇲', 'KH': '🇰🇭', 'LA': '🇱🇦',
      
      // Middle East & Africa
      'TR': '🇹🇷', 'IL': '🇮🇱', 'AE': '🇦🇪', 'SA': '🇸🇦', 'EG': '🇪🇬',
      'ZA': '🇿🇦', 'NG': '🇳🇬', 'KE': '🇰🇪', 'MA': '🇲🇦', 'TN': '🇹🇳',
      'DZ': '🇩🇿', 'GH': '🇬🇭', 'ET': '🇪🇹', 'UG': '🇺🇬',
      
      // Americas
      'CL': '🇨🇱', 'PE': '🇵🇪', 'CO': '🇨🇴', 'VE': '🇻🇪', 'EC': '🇪🇨',
      'BO': '🇧🇴', 'PY': '🇵🇾', 'UY': '🇺🇾', 'CR': '🇨🇷', 'PA': '🇵🇦',
      
      // Oceania
      'NZ': '🇳🇿', 'FJ': '🇫🇯', 'PG': '🇵🇬'
    }
    
    // Handle case variations and fallback
    const upperCode = countryCode?.toUpperCase() || ''
    return flags[upperCode] || flags[countryCode] || '🌍'
  }

  const getTeamColor = (teamColor: string) => {
    const teamNames: { [key: string]: string } = {
      // Color names (primary database format)
      'red': 'Valor',
      'blue': 'Mystic',
      'yellow': 'Instinct',
      
      // Team names
      'valor': 'Valor',
      'mystic': 'Mystic',
      'instinct': 'Instinct',
      
      // Hex codes
      '#FF0000': 'Valor',
      '#0000FF': 'Mystic', 
      '#FFFF00': 'Instinct'
    }
    return teamNames[teamColor?.toLowerCase()] || 'Valor'
  }

  const getStatValue = (entry: LeaderboardEntry) => {
    switch (sortBy) {
      case 'xp':
        return formatNumber(entry.total_xp || entry.xp_delta || 0)
      case 'catches':
        return formatNumber(entry.pokemon_caught || entry.catches_delta || 0)
      case 'distance':
        return formatDistance(entry.distance_walked || entry.distance_delta || 0)
      case 'pokestops':
        return formatNumber(entry.pokestops_visited || entry.pokestops_delta || 0)
      default:
        return '0'
    }
  }

  const getStatLabel = () => {
    switch (sortBy) {
      case 'xp': return 'Total XP'
      case 'catches': return 'Pokemon'
      case 'distance': return 'Km'
      case 'pokestops': return 'Stops'
      default: return 'Points'
    }
  }

  // Process leaderboard data for display
  const processedData = leaderboardData.map((entry, index) => ({
    rank: index + 1,
    name: entry.trainer_name,
    country: getCountryFlag(entry.country),
    team: getTeamColor(entry.team_color),
    teamColor: entry.team_color, // Keep raw team color for web view
    statValue: getStatValue(entry),
    medal: index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : null,
    profileId: entry.profile_id
  }))

  const lockedResults = processedData.slice(0, 3)
  const liveResults = processedData.slice(3)

  const getMedalIcon = (medal: string | null) => {
    if (medal === "gold")
      return (
        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold">
          👑
        </div>
      )
    if (medal === "silver")
      return (
        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">🥈</div>
      )
    if (medal === "bronze")
      return (
        <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold">
          🥉
        </div>
      )
    return null
  }

  // Web-specific rendering functions
  const renderWebLeaderboard = () => {
    return (
      <>
        {/* Frame 588 - Time Period Tabs */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0px',
          width: '826px',
          height: '48px',
          borderRadius: '6px',
          flex: 'none',
          order: 1,
          alignSelf: 'stretch',
          flexGrow: 0,
        }}>
          {/* Frame 636 - Time Period Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '0px',
            margin: '0 auto',
            width: '240px',
            height: '36px',
            flex: 'none',
            order: 0,
            flexGrow: 0,
          }}>
            {/* Weekly */}
            <button
              onClick={() => setTimePeriod('weekly')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '0px 8px',
                gap: '10px',
                width: '80px',
                height: '36px',
                flex: 'none',
                order: 0,
                flexGrow: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{
                width: '45px',
                height: '18px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                color: timePeriod === 'weekly' ? '#DC2627' : '#000000',
                textDecorationLine: timePeriod === 'weekly' ? 'underline' : 'none',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                Weekly
              </span>
            </button>

            {/* Monthly */}
            <button
              onClick={() => setTimePeriod('monthly')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: '0px 8px',
                width: '80px',
                height: '36px',
                borderRadius: '4px',
                flex: 'none',
                order: 1,
                flexGrow: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{
                width: '50px',
                height: '18px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                textDecorationLine: timePeriod === 'monthly' ? 'underline' : 'none',
                color: timePeriod === 'monthly' ? '#DC2627' : '#000000',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                Monthly
              </span>
            </button>

            {/* All-time */}
            <button
              onClick={() => setTimePeriod('alltime')}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '0px 8px',
                gap: '10px',
                width: '80px',
                height: '36px',
                flex: 'none',
                order: 2,
                flexGrow: 0,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span style={{
                width: '47px',
                height: '18px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                color: timePeriod === 'alltime' ? '#DC2627' : '#000000',
                textDecorationLine: timePeriod === 'alltime' ? 'underline' : 'none',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                All time
              </span>
            </button>
          </div>

          {/* Export Button */}
          <div style={{
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0px',
            gap: '8px',
            margin: '0 auto',
            width: '90px',
            height: '36px',
            border: '1px solid #DC2627',
            borderRadius: '4px',
            flex: 'none',
            order: 1,
            flexGrow: 0,
            cursor: 'pointer',
          }}>
            <Upload style={{
              width: '14px',
              height: '15px',
              color: '#DC2627',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }} />
            <span style={{
              width: '39px',
              height: '18px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '18px',
              color: '#DC2627',
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              Export
            </span>
          </div>
        </div>

        {/* Frame 586 - Locked Results */}
        {userType === "trial" && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '12px 8px',
            gap: '8px',
            width: '826px',
            height: '259px',
            background: 'rgba(0, 0, 0, 0.1)',
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.05)',
            borderRadius: '8px',
            flex: 'none',
            order: 2,
            flexGrow: 0,
          }}>
            {renderWebLockedResults()}
          </div>
        )}

        {/* Frame 605 - Monthly Results Container */}
        <div style={{
          /* Frame 605 */
          /* Auto layout */
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '0px',
          gap: '24px',
          width: '826px',
          height: '627px',
          /* Inside auto layout */
          flex: 'none',
          order: 3,
          flexGrow: 0,
        }}>
          {/* Frame 530 - Monthly Leaderboard */}
          <div style={{
            /* Frame 530 */
            /* Auto layout */
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '12px 8px',
            gap: '8px',
            width: '826px',
            height: '627px',
            background: 'rgba(0, 0, 0, 0.1)',
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
            borderRadius: '8px',
            /* Inside auto layout */
            flex: 'none',
            order: 0,
            alignSelf: 'stretch',
            flexGrow: 0,
          }}>
            {renderWebMonthlyResults()}
          </div>
        </div>
      </>
    )
  }

  const renderWebLockedResults = () => {
    return (
      <>
        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '0px',
          gap: '16px',
          width: '810px',
          height: '24px',
          flex: 'none',
          order: 0,
          alignSelf: 'stretch',
          flexGrow: 0,
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '0px',
            gap: '8px',
            margin: '0 auto',
            width: '104px',
            height: '24px',
            flex: 'none',
            order: 0,
            flexGrow: 0,
          }}>
            <Trophy style={{
              width: '24px',
              height: '24px',
              color: '#DC2627',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }} />
            <span style={{
              width: '32px',
              height: '24px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '24px',
              color: '#DC2627',
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              Live
            </span>
          </div>
        </div>

        {/* Locked entries (placeholder) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '0px',
          width: '812px',
          height: '204px',
          flex: 'none',
          order: 1,
          flexGrow: 0,
        }}>
          {[1, 2, 3].map(index => renderWebLockedPlayerCard(index))}
        </div>
      </>
    )
  }

  const renderWebMonthlyResults = () => {
    return (
      <>
        {/* Frame 573 - Header */}
        <div style={{
          /* Frame 573 */
          /* Auto layout */
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '0px',
          gap: '13px',
          width: '212px',
          height: '24px',
          /* Inside auto layout */
          flex: 'none',
          order: 0,
          flexGrow: 0,
        }}>
          {/* material-symbols:trophy-outline */}
          <Trophy style={{
            width: '24px',
            height: '24px',
            /* Inside auto layout */
            flex: 'none',
            order: 0,
            flexGrow: 0,
            /* Vector */
            position: 'relative',
            background: '#000000',
          }} />
          {/* Monthly Leaderboard */}
          <span style={{
            width: '175px',
            height: '24px',
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: 600,
            fontSize: '16px',
            lineHeight: '24px',
            /* identical to box height */
            color: '#000000',
            /* Inside auto layout */
            flex: 'none',
            order: 1,
            flexGrow: 0,
          }}>
            Monthly Leaderboard
          </span>
        </div>

        {/* Frame 574 - Results Container */}
        <div style={{
          /* Frame 574 */
          /* Auto layout */
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '0px',
          width: '810px',
          height: '591px',
          borderRadius: '8px',
          /* Inside auto layout */
          flex: 'none',
          order: 1,
          flexGrow: 0,
        }}>
          {processedData.slice(0, 8).map((player, index) => renderWebMonthlyPlayerCard(player, index))}
        </div>
      </>
    )
  }

  const renderWebMonthlyPlayerCard = (player: any, index: number) => {
    const teamColorHex = getTeamColorHex(player.teamColor || player.team)
    
    return (
      <div key={index} style={{
        /* Frame 611/612/613/etc - Player Row Container */
        /* Auto layout */
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '4px 16px',
        gap: '8px',
        width: '812px',
        height: '68px',
        filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))',
        borderRadius: '8px',
        /* Inside auto layout */
        flex: 'none',
        order: index,
        flexGrow: 0,
      }}>
        {/* Frame 578 - Player Card Content */}
        <div style={{
          /* Frame 578 */
          /* Auto layout */
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 24px',
          gap: '15px',
          width: '780px',
          height: '58px',
          background: '#FFFFFF',
          borderRadius: '4px',
          /* Inside auto layout */
          flex: 'none',
          order: 0,
          flexGrow: 0,
        }}>
          {/* Frame 582 - Left Section */}
          <div style={{
            /* Frame 582 */
            /* Auto layout */
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '0px',
            gap: '15px',
            margin: '0 auto',
            width: '159px',
            height: '33px',
            /* Inside auto layout */
            flex: 'none',
            order: 0,
            flexGrow: 0,
          }}>
            {/* Rank Badge */}
            <div style={{
              /* Auto layout */
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0px',
              gap: '10px',
              width: '24px',
              height: '24px',
              background: '#DC2627',
              borderRadius: '2000px',
              /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}>
              <span style={{
                width: '6px',
                height: '21px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '14px',
                lineHeight: '21px',
                /* identical to box height */
                color: '#FFFFFF',
                /* Inside auto layout */
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                {player.rank}
              </span>
            </div>

            {/* Frame 580 - Player Info */}
            <div style={{
              /* Frame 580 */
              /* Auto layout */
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: '0px',
              width: '120px',
              height: '33px',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              {/* Player Name */}
              <span style={{
                width: '120px',
                height: '18px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                /* identical to box height */
                color: '#000000',
                /* Inside auto layout */
                flex: 'none',
                order: 0,
                flexGrow: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {player.name}
              </span>

              {/* Frame 22 - Country and Team */}
              <div style={{
                /* Frame 22 */
                /* Auto layout */
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                padding: '0px',
                gap: '12px',
                width: '120px',
                height: '15px',
                /* Inside auto layout */
                flex: 'none',
                order: 1,
                flexGrow: 0,
              }}>
                {/* Country Flag */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '15px',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  <span style={{
                    fontSize: '16px',
                    lineHeight: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {player.country}
                  </span>
                </div>

                {/* Frame 584 - Team Info */}
                <div style={{
                  /* Frame 584 */
                  /* Auto layout */
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: '0px',
                  gap: '5px',
                  height: '15px',
                  /* Inside auto layout */
                  flex: '1',
                  order: 1,
                  flexGrow: 0,
                }}>
                  {/* Team Color Circle - Ellipse 3 */}
                  <div style={{
                    /* Ellipse 3 */
                    width: '8px',
                    height: '8px',
                    background: teamColorHex,
                    borderRadius: '50%',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 0,
                    flexGrow: 0,
                  }} />
                  
                  {/* Team Name */}
                  <span style={{
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: 400,
                    fontSize: '9px',
                    lineHeight: '15px',
                    color: teamColorHex,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '45px',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 1,
                    flexGrow: 0,
                  }}>
                    {player.team}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Frame 581 - Stats Section */}
          <div style={{
            /* Frame 581 */
            /* Auto layout */
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '0px',
            margin: '0 auto',
            width: '65px',
            height: '33px',
            /* Inside auto layout */
            flex: 'none',
            order: 1,
            flexGrow: 0,
          }}>
            {/* Stat Value */}
            <span style={{
              width: '65px',
              height: '18px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '18px',
              /* identical to box height */
              textAlign: 'center',
              color: '#000000',
              /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}>
              {formatNumber(player.statValue)}
            </span>

            {/* Stat Label */}
            <span style={{
              width: '40px',
              height: '15px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '10px',
              lineHeight: '15px',
              /* identical to box height */
              color: '#353535',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              Total XP
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Removed unused renderWebPlayerCard function

  const renderWebLockedPlayerCard = (index: number) => {
    const badgeColor = index === 1 ? 'rgba(255, 225, 0, 0.6)' : 
                      index === 2 ? 'rgba(208, 208, 208, 0.4)' : 
                      'rgba(255, 162, 0, 0.5)'
    const borderColor = index === 1 ? '#FFBF00' : 
                        index === 2 ? '#616161' : 
                        '#EA9400'

    return (
      <div key={index} style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '4px 16px',
        width: '812px',
        height: '68px',
        filter: 'drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))',
        borderRadius: '8px',
        flex: 'none',
        order: index - 1,
        flexGrow: 0,
      }}>
        {/* Frame 578 - Locked Player Card Content */}
        <div style={{
          /* Frame 578 */
          /* Auto layout */
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 24px',
          gap: '15px',
          width: '780px',
          height: '58px',
          background: '#FFFFFF',
          borderRadius: '4px',
          border: index === 1 ? `4px solid ${borderColor}` : 'none',
          /* Inside auto layout */
          flex: 'none',
          order: 0,
          flexGrow: 0,
        }}>
          {/* Locked content placeholder */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            width: '100%',
            height: '33px',
          }}>
            <div style={{
              width: '30px',
              height: '30px',
              background: badgeColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '1000px',
            }} />
            <span style={{
              fontFamily: 'Poppins',
              fontWeight: 600,
              fontSize: '12px',
              color: '#000000',
            }}>
              Mustafa Mashoor
            </span>
            <span style={{ marginLeft: 'auto' }}>🇦🇺</span>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                background: '#DC2627',
                borderRadius: '50%',
              }} />
              <span style={{
                fontFamily: 'Poppins',
                fontSize: '10px',
                color: '#DC2627',
              }}>
                Red Team
              </span>
            </div>
            <div style={{
              textAlign: 'center',
              minWidth: '65px',
            }}>
              <div style={{
                fontFamily: 'Poppins',
                fontWeight: 600,
                fontSize: '12px',
              }}>
                33,628,973
              </div>
              <div style={{
                fontFamily: 'Poppins',
                fontSize: '10px',
                color: '#353535',
              }}>
                Total XP
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Removed unused getRankBadgeColor function

  const getTeamColorHex = (teamInput: string) => {
    if (!teamInput) return '#DC2627'
    
    const input = teamInput.toLowerCase()
    
    // Direct hex color mapping
    const hexMap: { [key: string]: string } = {
      '#ff0000': '#DC2627',
      '#0000ff': '#0075BE',
      '#ffff00': '#FDB81E',
    }
    
    // Color name mapping
    const colorMap: { [key: string]: string } = {
      'red': '#DC2627',
      'blue': '#0075BE',
      'yellow': '#FDB81E',
      'valor': '#DC2627',
      'mystic': '#0075BE', 
      'instinct': '#FDB81E',
    }
    
    // Try hex first, then color names
    return hexMap[input] || colorMap[input] || '#DC2627'
  }

  return (
    <>
      {/* Web View */}
      {!isMobile && (
        <div style={{
          /* Frame 607 - Main Web Container */
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 60px',
          gap: '27px',
          position: 'absolute',
          width: '946px',
          height: 'auto',
          minHeight: '1236px',
          left: 'calc(50% - 946px/2)',
          top: '117px',
          background: 'rgba(132, 130, 130, 0.12)',
          borderRadius: '12px',
        }}>
          {/* Frame 606 - Header Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0px',
            gap: '13px',
            width: '826px',
            height: '153px',
            flex: 'none',
            order: 0,
            alignSelf: 'stretch',
            flexGrow: 0,
          }}>
            {/* Community Leaderboards Title */}
            <h1 style={{
              width: '826px',
              height: '31px',
              fontFamily: 'Geist',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '24px',
              lineHeight: '31px',
              textAlign: 'center',
              color: '#000000',
              flex: 'none',
              order: 0,
              alignSelf: 'stretch',
              flexGrow: 0,
            }}>
              Community Leaderboards
            </h1>

            {/* Frame 577 - Main Tab Navigation */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0px',
              gap: '8px',
              width: '826px',
              height: '48px',
              borderRadius: '6px',
              flex: 'none',
              order: 1,
              alignSelf: 'stretch',
              flexGrow: 0,
            }}>
              {/* All Trainers */}
              <button
                onClick={() => setActiveTab('trainers')}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0px 8px',
                  gap: '10px',
                  margin: '0 auto',
                  width: '100px',
                  height: '36px',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  width: '50px',
                  height: '18px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '18px',
                  color: activeTab === 'trainers' ? '#DC2627' : '#000000',
                  textDecorationLine: activeTab === 'trainers' ? 'underline' : 'none',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  Trainers
                </span>
              </button>

              {/* By Country */}
              <button
                onClick={() => setActiveTab('country')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0px 8px',
                  margin: '0 auto',
                  width: '100px',
                  height: '36px',
                  borderRadius: '4px',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  width: '50px',
                  height: '18px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '18px',
                  textDecorationLine: activeTab === 'country' ? 'underline' : 'none',
                  color: activeTab === 'country' ? '#DC2627' : '#000000',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  Country
                </span>
              </button>

              {/* By Team */}
              <button
                onClick={() => setActiveTab('team')}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0px 8px',
                  gap: '10px',
                  margin: '0 auto',
                  width: '100px',
                  height: '36px',
                  flex: 'none',
                  order: 2,
                  flexGrow: 0,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  width: '36px',
                  height: '18px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '18px',
                  color: activeTab === 'team' ? '#DC2627' : '#000000',
                  textDecorationLine: activeTab === 'team' ? 'underline' : 'none',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  Team
                </span>
              </button>
            </div>

            {/* Upgrade Button - Web */}
            {userType === "trial" && (
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '0px',
                gap: '8px',
                width: '838px',
                height: '48px',
                background: '#DC2627',
                borderRadius: '8px',
                flex: 'none',
                order: 2,
                flexGrow: 0,
                cursor: 'pointer',
              }}>
                <Crown style={{
                  width: '24px',
                  height: '24px',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  color: '#FFFFFF',
                }} />
                <span style={{
                  width: '63px',
                  height: '21px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '14px',
                  lineHeight: '21px',
                  color: '#FFFFFF',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                }}>
                  Upgrade
                </span>
              </div>
            )}
          </div>

          {/* Frame 604 - Main Content Container */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '0px',
            gap: '18px',
            width: '826px',
            height: '1024px',
            flex: 'none',
            order: 1,
            alignSelf: 'stretch',
            flexGrow: 0,
          }}>
            {/* Frame 625 - Filter Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '0px',
              gap: '25px',
              width: '826px',
              height: '36px',
              flex: 'none',
              order: 0,
              alignSelf: 'stretch',
              flexGrow: 0,
            }}>
              {/* First Dropdown */}
              <div style={{
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 8px',
                gap: '8px',
                margin: '0 auto',
                width: '397px',
                height: '36px',
                border: '1px solid #000000',
                borderRadius: '6px',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                <span style={{
                  margin: '0 auto',
                  width: '78px',
                  height: '18px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '18px',
                  color: '#000000',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  All Trainers
                </span>
                <ChevronDown style={{
                  width: '16px',
                  height: '16px',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                }} />
              </div>

              {/* Second Dropdown */}
              <div style={{
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 8px',
                gap: '8px',
                margin: '0 auto',
                width: '398px',
                height: '36px',
                border: '1px solid #000000',
                borderRadius: '6px',
                flex: 'none',
                order: 1,
                flexGrow: 0,
              }}>
                <span style={{
                  margin: '0 auto',
                  width: '50px',
                  height: '18px',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '12px',
                  lineHeight: '18px',
                  color: '#000000',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  {sortOptions.find(opt => opt.id === sortBy)?.label || 'Total XP'}
                </span>
                <ChevronDown style={{
                  width: '16px',
                  height: '16px',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                }} />
              </div>
            </div>

            {/* Continue with remaining web implementation... */}
            {renderWebLeaderboard()}
          </div>

          {/* Footer Text for Web View */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 0px',
            gap: '8px',
            width: '826px',
            flex: 'none',
            order: 2,
            alignSelf: 'stretch',
            flexGrow: 0,
          }}>
            <span style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '21px',
              textAlign: 'center',
              color: '#666666',
            }}>
              © 2024 PlayerZero. All rights reserved.
            </span>
            <span style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '18px',
              textAlign: 'center',
              color: '#999999',
            }}>
              Powering the next generation of Pokemon GO trainers
            </span>
          </div>
        </div>
      )}

      {/* Mobile View */}
      {isMobile && (
        <div className="w-full max-w-7xl mx-auto px-4 py-6">

      {/* Loading and Error States */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
          <button 
            onClick={loadLeaderboardData}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Frame 589 - Trainer/Country/Team Tabs */}
      <div 
        style={{
          /* Frame 589 */
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0px',
          gap: '8px',
          width: '353px',
          height: '48px',
          borderRadius: '6px',
          flex: 'none',
          order: 0,
          flexGrow: 0,
        }}
      >
        {/* All Trainers */}
        <button
          onClick={() => setActiveTab('trainers')}
          style={{
            /* All Trainers */
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0px 8px',
            gap: '10px',
            margin: '0 auto',
            width: '100px',
            height: '36px',
            flex: 'none',
            order: 0,
            flexGrow: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span 
            style={{
              /* Trainers */
              width: '50px',
              height: '18px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '18px',
              textDecorationLine: activeTab === 'trainers' ? 'underline' : 'none',
              color: activeTab === 'trainers' ? '#DC2627' : '#000000',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
          >
            Trainers
          </span>
        </button>

        {/* By Country */}
        <button
          onClick={() => setActiveTab('country')}
          style={{
            /* By Country */
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0px 8px',
            margin: '0 auto',
            width: '100px',
            height: '36px',
            borderRadius: '4px',
            flex: 'none',
            order: 1,
            flexGrow: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span 
            style={{
              /* Country */
              width: '50px',
              height: '18px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '18px',
              color: activeTab === 'country' ? '#DC2627' : '#000000',
              textDecorationLine: activeTab === 'country' ? 'underline' : 'none',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
          >
            Country
          </span>
        </button>

        {/* By Team */}
        <button
          onClick={() => setActiveTab('team')}
          style={{
            /* By Team */
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0px 8px',
            gap: '10px',
            margin: '0 auto',
            width: '100px',
            height: '36px',
            flex: 'none',
            order: 2,
            flexGrow: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <span 
            style={{
              /* Team */
              width: '36px',
              height: '18px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '18px',
              color: activeTab === 'team' ? '#DC2627' : '#000000',
              textDecorationLine: activeTab === 'team' ? 'underline' : 'none',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
          >
            Team
          </span>
        </button>
      </div>

      {/* Upgrade Button - Desktop */}
      {!isMobile && userType === "trial" && (
        <Button className="w-full bg-red-500 hover:bg-red-600 text-white mb-6 h-12">
          <Crown className="w-5 h-5 mr-2" />
          Upgrade
        </Button>
      )}

      {/* Frame 623 - Filter Buttons */}
      <div 
        style={{
          /* Frame 623 */
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '0px',
          gap: '16px',
          width: '333px',
          height: '36px',
          flex: 'none',
          order: 1,
          alignSelf: 'stretch',
          flexGrow: 0,
        }}
      >
        {/* All Teams/Countries/Trainers Dropdown */}
        <div 
          style={{
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 8px',
            gap: '8px',
            width: '160px',
            height: '36px',
            border: '1px solid #000000',
            borderRadius: '6px',
            cursor: 'pointer',
            flex: 'none',
            order: 0,
            flexGrow: 0,
            background: '#FFFFFF',
          }}
        >
          <span 
            style={{
              fontFamily: 'Poppins',
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '18px',
              color: '#000000',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
          >
            All {activeTab === "trainers" ? "Trainers" : activeTab === "country" ? "Countries" : "Teams"}
          </span>
          <ChevronDown 
            style={{ 
              width: '6.14px', 
              height: '10.61px', 
              background: '#000000',
              border: '1px solid #000000',
              transform: 'matrix(0, 1, 1, 0, 0, 0)',
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }} 
          />
        </div>

        {/* Total XP/Stats Dropdown */}
        <div 
          style={{
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 8px',
            gap: '8px',
            width: '160px',
            height: '36px',
            border: '1px solid #000000',
            borderRadius: '6px',
            cursor: 'pointer',
            flex: 'none',
            order: 1,
            flexGrow: 0,
            background: '#FFFFFF',
          }}
          onClick={() => {
            // Cycle through sort options
            const currentIndex = sortOptions.findIndex(opt => opt.id === sortBy);
            const nextIndex = (currentIndex + 1) % sortOptions.length;
            setSortBy(sortOptions[nextIndex].id);
          }}
        >
          <span 
            style={{
              fontFamily: 'Poppins',
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '18px',
              color: '#000000',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
          >
            {sortOptions.find(opt => opt.id === sortBy)?.label || 'Total XP'}
          </span>
          <ChevronDown 
            style={{ 
              width: '6.14px', 
              height: '10.61px', 
              background: '#000000',
              border: '1px solid #000000',
              transform: 'matrix(0, 1, 1, 0, 0, 0)',
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }} 
          />
        </div>
      </div>

      {/* Upgrade Section - Mobile */}
      {isMobile && userType === "trial" && (
        <div className="mb-6">
          <Button className="w-full bg-red-500 hover:bg-red-600 text-white h-12 mb-2">
            <Crown className="w-5 h-5 mr-2" />
            Upgrade
          </Button>
          <p className="text-center text-sm text-gray-600">
            To keep tracking your grind and unlock your leaderboard placement, upgrade for $5.99.
          </p>
        </div>
      )}

      {/* Loading and Error States */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">Error: {error}</p>
          <button 
            onClick={loadLeaderboardData}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Frame 588 - Time Period Tabs */}
      <div 
        style={{
          /* Frame 588 */
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0px',
          width: '353px',
          height: '48px',
          borderRadius: '6px',
          flex: 'none',
          order: 3,
          alignSelf: 'stretch',
          flexGrow: 0,
        }}
      >
        {/* Frame 627 - Time Period Buttons Container */}
        <div 
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '0px',
            width: '240px',
            height: '36px',
            flex: 'none',
            order: 0,
            flexGrow: 0,
          }}
        >
          {/* Weekly */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              padding: '0px 8px',
              gap: '10px',
              width: '80px',
              height: '36px',
              cursor: 'pointer',
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
            onClick={() => setTimePeriod('weekly')}
          >
            <span 
              style={{
                width: '45px',
                height: '18px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                color: timePeriod === 'weekly' ? '#DC2627' : '#000000',
                textDecorationLine: timePeriod === 'weekly' ? 'underline' : 'none',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}
            >
              Weekly
            </span>
          </div>

          {/* Monthly */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: '0px 8px',
              width: '80px',
              height: '36px',
              borderRadius: '4px',
              cursor: 'pointer',
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}
            onClick={() => setTimePeriod('monthly')}
          >
            <span 
              style={{
                width: '50px',
                height: '18px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                color: timePeriod === 'monthly' ? '#DC2627' : '#000000',
                textDecorationLine: timePeriod === 'monthly' ? 'underline' : 'none',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}
            >
              Monthly
            </span>
          </div>

          {/* All-time */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              padding: '0px 8px',
              gap: '10px',
              width: '80px',
              height: '36px',
              cursor: 'pointer',
              flex: 'none',
              order: 2,
              flexGrow: 0,
            }}
            onClick={() => setTimePeriod('alltime')}
          >
            <span 
              style={{
                width: '47px',
                height: '18px',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '18px',
                color: timePeriod === 'alltime' ? '#DC2627' : '#000000',
                textDecorationLine: timePeriod === 'alltime' ? 'underline' : 'none',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}
            >
              All time
            </span>
          </div>
        </div>

        {/* Export Button */}
        <div 
          style={{
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0px',
            gap: '8px',
            width: '90px',
            height: '36px',
            border: '1px solid #DC2627',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 'none',
            order: 1,
            flexGrow: 0,
            background: '#FFFFFF',
          }}
        >
          <Upload 
            style={{ 
              width: '14px', 
              height: '15px', 
              color: '#DC2627' 
            }} 
          />
          <span 
            style={{
              width: '39px',
              height: '18px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '12px',
              lineHeight: '18px',
              color: '#DC2627',
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}
          >
            Export
          </span>
        </div>
      </div>

      {/* Component 5 - Locked Results */}
      <div 
        style={{
          /* Component 5 */
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 8px',
          gap: '8px',
          width: '353px',
          height: '213px',
          background: 'rgba(0, 0, 0, 0.1)',
          boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.05)',
          borderRadius: '8px',
          flex: 'none',
          order: 4,
          flexGrow: 0,
        }}
      >
        {/* Locked Header */}
        <button
          onClick={() => setLockedExpanded(!lockedExpanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '8px 0',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy style={{ width: '24px', height: '24px', color: '#DC2627' }} />
            <span style={{
              fontFamily: 'Poppins',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '24px',
              color: '#DC2627',
            }}>
              Locked Results
            </span>
          </div>
          <ChevronDown style={{
            width: '20px',
            height: '20px',
            color: '#000000',
            transform: lockedExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} />
        </button>

        {lockedExpanded && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: '100%',
            maxWidth: '337px',
          }}>
            {lockedResults.map((player, index) => (
              <div
                key={index}
                style={{
                  /* Frame 532/533/534 - Top 3 entries */
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: '4px 16px',
                  gap: '8px',
                  width: '337px',
                  height: '47px',
                  background: player.rank === 1 ? '#FFFFFF' : '#FFFFFF',
                  border: player.rank === 1 ? '3px solid #DC2627' : 'none',
                  boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                  borderRadius: '8px',
                  flex: 'none',
                  order: index,
                  alignSelf: 'stretch',
                  flexGrow: 0,
                }}
              >
                {/* Player Info Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  flex: 1,
                }}>
                  {/* Medal Icon */}
                  {getMedalIcon(player.medal)}

                  {/* Name and Location */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}>
                    <span style={{
                      fontFamily: 'Poppins',
                      fontWeight: 600,
                      fontSize: '12px',
                      lineHeight: '18px',
                      color: '#000000',
                    }}>
                      {player.name}
                    </span>
                    
                    {/* Country and Team */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <span style={{
                        fontSize: '16px',
                        lineHeight: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {player.country}
                      </span>
                      
                      {/* Team */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <div style={{
                          width: '10px',
                          height: '10px',
                          background: '#DC2627',
                          borderRadius: '50%',
                        }} />
                        <span style={{
                          fontFamily: 'Poppins',
                          fontWeight: 400,
                          fontSize: '10px',
                          lineHeight: '15px',
                          color: '#DC2627',
                        }}>
                          {player.team}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '2px',
                }}>
                  <span style={{
                    fontFamily: 'Poppins',
                    fontWeight: 600,
                    fontSize: '12px',
                    lineHeight: '18px',
                    textAlign: 'center',
                    color: '#000000',
                  }}>
                    {player.statValue}
                  </span>
                  <span style={{
                    fontFamily: 'Poppins',
                    fontWeight: 400,
                    fontSize: '10px',
                    lineHeight: '15px',
                    color: '#353535',
                  }}>
                    {getStatLabel()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

             {/* Leaderboard container frame - Live Results */}
       <div 
         style={{
           /* Leaderboard container frame */
           display: 'flex',
           flexDirection: 'column',
           alignItems: 'flex-start',
           padding: '12px 8px',
           gap: '8px',
           width: '353px',
           height: '661px',
           overflowY: 'scroll',
           background: 'rgba(0, 0, 0, 0.1)',
           boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
           borderRadius: '8px',
           flex: 'none',
           order: 5,
           flexGrow: 0,
         }}
       >
         {/* Live Header */}
         <button
           onClick={() => setLiveExpanded(!liveExpanded)}
           style={{
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'space-between',
             width: '100%',
             padding: '8px 0',
             background: 'transparent',
             border: 'none',
             cursor: 'pointer',
           }}
         >
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Trophy style={{ width: '24px', height: '24px', color: '#DC2627' }} />
             <span style={{
               fontFamily: 'Poppins',
               fontWeight: 600,
               fontSize: '16px',
               lineHeight: '24px',
               color: '#DC2627',
             }}>
               {timePeriod === "monthly" ? "Monthly Leaderboard" : "Live"}
             </span>
           </div>
           <ChevronDown style={{
             width: '20px',
             height: '20px',
             color: '#000000',
             transform: liveExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
             transition: 'transform 0.2s ease'
           }} />
         </button>

         {liveExpanded && (
           <div style={{
             display: 'flex',
             flexDirection: 'column',
             gap: '8px',
             width: '100%',
           }}>
             {liveResults.map((player, index) => (
               <div
                 key={index}
                 style={{
                   /* Frame 540 */
                   display: 'flex',
                   flexDirection: 'row',
                   alignItems: 'center',
                   padding: '4px 16px',
                   gap: '8px',
                   width: '337px',
                   height: '47px',
                   background: '#FFFFFF',
                   boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                   borderRadius: '8px',
                   flex: 'none',
                   order: index,
                   alignSelf: 'stretch',
                   flexGrow: 0,
                 }}
               >
                 {/* Player Info Row */}
                 <div style={{
                   display: 'flex',
                   alignItems: 'center',
                   gap: '12px',
                   flex: 1,
                 }}>
                   {/* Rank Circle */}
                   <div style={{
                     display: 'flex',
                     justifyContent: 'center',
                     alignItems: 'center',
                     width: '24px',
                     height: '24px',
                     background: '#DC2627',
                     borderRadius: '50%',
                   }}>
                     <span style={{
                       fontFamily: 'Poppins',
                       fontWeight: 600,
                       fontSize: '14px',
                       lineHeight: '21px',
                       color: '#FFFFFF',
                     }}>
                       {player.rank}
                     </span>
                   </div>

                   {/* Name and Location */}
                   <div style={{
                     display: 'flex',
                     flexDirection: 'column',
                     gap: '2px',
                   }}>
                     <span style={{
                       fontFamily: 'Poppins',
                       fontWeight: 600,
                       fontSize: '12px',
                       lineHeight: '18px',
                       color: '#000000',
                     }}>
                       {player.name}
                     </span>
                     
                     {/* Country and Team */}
                     <div style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: '6px',
                     }}>
                       <span style={{
                         fontSize: '14px',
                         lineHeight: '15px',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                       }}>
                         {player.country}
                       </span>
                       
                       {/* Team */}
                       <div style={{
                         display: 'flex',
                         alignItems: 'center',
                         gap: '4px',
                       }}>
                         <div style={{
                           width: '8px',
                           height: '8px',
                           background: '#DC2627',
                           borderRadius: '50%',
                         }} />
                         <span style={{
                           fontFamily: 'Poppins',
                           fontWeight: 400,
                           fontSize: '10px',
                           lineHeight: '15px',
                           color: '#DC2627',
                         }}>
                           {player.team}
                         </span>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Stats */}
                 <div style={{
                   display: 'flex',
                   flexDirection: 'column',
                   alignItems: 'flex-end',
                   gap: '2px',
                 }}>
                   <span style={{
                     fontFamily: 'Poppins',
                     fontWeight: 600,
                     fontSize: '12px',
                     lineHeight: '18px',
                     color: '#000000',
                   }}>
                     {player.statValue}
                   </span>
                   <span style={{
                     fontFamily: 'Poppins',
                     fontWeight: 400,
                     fontSize: '10px',
                     lineHeight: '15px',
                     color: '#353535',
                   }}>
                     {getStatLabel()}
                   </span>
                 </div>
               </div>
             ))}
           </div>
         )}
       </div>
        </div>
      )}
    </>
  )
}
