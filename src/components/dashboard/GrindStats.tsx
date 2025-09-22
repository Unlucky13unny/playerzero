import { dashboardService } from "../../services/dashboardService"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"

interface GrindStatsProps {
  isMobile?: boolean
  viewMode?: "public" | "private" | "team" | "own"
  userType?: "trial" | "upgraded"
  profile?: any
}

export function GrindStats({ isMobile = false, profile }: GrindStatsProps) {
  const { user } = useAuth()
  const [backendStats, setBackendStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)


  // Load all-time stats from backend when component mounts or profile changes
  useEffect(() => {
    const targetUserId = profile?.user_id || user?.id
    if (targetUserId) {
      loadBackendStats()
    }
  }, [user?.id, profile])

  const loadBackendStats = async () => {
    // Use profile.user_id for public profiles, or current user.id for own profile
    const targetUserId = profile?.user_id || user?.id
    if (!targetUserId) return

    try {
      setLoading(true)
      
      // Always load all-time stats for GrindStats table (gets latest calculated values)
      const result = await dashboardService.calculateAllTimeGrindStats(targetUserId)

      console.log('All-time backend stats loaded for GrindStats:', result)
      console.log('Profile data available:', profile ? 'Yes' : 'No')
      console.log('Target user ID:', targetUserId, profile?.user_id ? '(from profile)' : '(current user)')
      setBackendStats(result)
    } catch (error) {
      console.warn('Failed to load all-time backend stats for GrindStats:', error)
      setBackendStats(null)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number | null | undefined) => {
    if (!num || num === 0) return '0.0'
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toFixed(1)
  }

  const formatDistance = (distance: number | null | undefined) => {
    if (!distance || distance === 0) return '0.0'
    return distance.toFixed(1)
  }

  const getStatValue = (statType: 'distance_walked' | 'pokemon_caught' | 'pokestops_visited' | 'total_xp') => {
    // Always prioritize backend stats (calculated from latest stat_entries) for accuracy
    if (backendStats) {
      switch (statType) {
        case 'distance_walked':
          const backendDistancePerDay = backendStats.distancePerDay || 0
          console.log(`GrindStats using backend daily average for ${statType}:`, backendDistancePerDay)
          return backendDistancePerDay
        case 'pokemon_caught':
          const backendCatchesPerDay = backendStats.catchesPerDay || 0
          console.log(`GrindStats using backend daily average for ${statType}:`, backendCatchesPerDay)
          return backendCatchesPerDay
        case 'pokestops_visited':
          const backendStopsPerDay = backendStats.stopsPerDay || 0
          console.log(`GrindStats using backend daily average for ${statType}:`, backendStopsPerDay)
          return backendStopsPerDay
        case 'total_xp':
          const backendXPPerDay = backendStats.xpPerDay || 0
          console.log(`GrindStats using backend daily average for ${statType}:`, backendXPPerDay)
          return backendXPPerDay
        default:
          return 0
      }
    }
    
    // Fallback to profile data - calculate daily average from totals
    if (profile && profile[statType] !== undefined && profile[statType] !== null) {
      const totalValue = profile[statType]
      const startDate = profile.start_date
      
      if (startDate) {
        const start = new Date(startDate)
        const current = new Date()
        const daysPlayed = Math.max(1, Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
        const dailyAverage = statType === 'distance_walked' 
          ? Math.round((totalValue / daysPlayed) * 10) / 10 // Keep one decimal for distance
          : Math.round(totalValue / daysPlayed)
        
        console.log(`GrindStats using profile fallback daily average for ${statType}:`, dailyAverage)
        return dailyAverage
      }
    }

    console.log(`GrindStats no data available for ${statType}, returning 0`)
    return 0
  }

  return (
    <div 
      className="bg-white rounded-lg p-6"
      style={{
        /* Frame 561 */
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0px',
        gap: '15px',
        width: '100%',
        maxWidth: '100%',
        height: '167px',
        /* Inside auto layout */
        flex: 'none',
        order: 1,
        flexGrow: 0,
        position: 'relative',
        marginTop: isMobile ? '15px' : '65px', // Web view top margin changed to 65px
      }}
    >
      {/* Frame 530 - Main Content Container */}
      <div style={{
        /* Frame 530 */
            display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '12px 0px',
            gap: '8px',
        width: '100%',
        maxWidth: '100%',
        height: '167px',
            borderRadius: '8px',
        /* Inside auto layout */
        flex: 'none',
        order: 0,
        alignSelf: 'stretch',
        flexGrow: 0,
        position: 'relative',
      }}>


        {/* Grind Stats Title */}
        <div style={{
          /* Grind Stats */
          width: 'auto',
          minWidth: '136px',
          height: '36px',
          fontFamily: 'Poppins',
          fontStyle: 'normal',
          fontWeight: 600,
          fontSize: '24px',
          lineHeight: '36px',
          textAlign: 'center',
          color: '#000000',
          /* Inside auto layout */
          flex: 'none',
          order: 0,
          flexGrow: 0,
          whiteSpace: 'nowrap',
        }}>
        Grind Stats
      </div>

      {/* Frame 535 - Stats Container */}
      {isMobile ? (
        <div style={{
          /* Frame 535 */
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          padding: '0px',
          gap: '21px',
          width: '353px',
          height: '74px',
          background: 'rgba(0, 0, 0, 0.02)',
          boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
          borderRadius: '4px',
          /* Inside auto layout */
          flex: 'none',
          order: 1,
          alignSelf: 'stretch',
          flexGrow: 0,
          opacity: loading ? 0.5 : 1,
        }}>
          {/* Frame 531 - Distance Stat */}
          <div style={{
            /* Frame 531 */
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '8px',
            gap: '8px',
            width: '63px',
            height: '73px',
            borderRadius: '2px',
            /* Inside auto layout */
            flex: 'none',
            order: 0,
            flexGrow: 0
          }}>
            <div style={{
              /* 4.6 */
              width: '38px',
              height: '32px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '24px',
              lineHeight: '31px',
              color: '#000000',
              /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0
            }}>
              {formatDistance(getStatValue('distance_walked'))}
            </div>
            <div style={{
              /* Km */
              width: '18px',
              height: '17px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '11px',
              lineHeight: '16px',
              textTransform: 'capitalize',
              color: '#353535',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              flexGrow: 0
            }}>
              Km/day
            </div>
          </div>

          {/* Frame 532 - Pokemon Caught Stat */}
          <div style={{
            /* Frame 532 */
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px',
            gap: '8px',
            width: '78px',
            height: '73px',
            borderRadius: '2px',
            /* Inside auto layout */
            flex: 'none',
            order: 1,
            flexGrow: 0
          }}>
            <div style={{
              /* 52.1 */
              width: '44px',
              height: '32px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '24px',
              lineHeight: '31px',
              letterSpacing: '-0.01em',
              color: '#000000',
              /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0
            }}>
              {formatNumber(getStatValue('pokemon_caught'))}
            </div>
            <div style={{
              /* Caught */
              width: '42px',
              height: '17px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '11px',
              lineHeight: '16px',
              textTransform: 'capitalize',
              color: '#353535',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              flexGrow: 0
            }}>
              Caught/day
            </div>
          </div>

          {/* Frame 533 - Pokestops Stat */}
          <div style={{
            /* Frame 533 */
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px',
            gap: '8px',
            width: '72px',
            height: '73px',
            borderRadius: '2px',
            /* Inside auto layout */
            flex: 'none',
            order: 2,
            flexGrow: 0
          }}>
            <div style={{
              /* 46.8 */
              width: '53px',
              height: '32px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '24px',
              lineHeight: '31px',
              color: '#000000',
              /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0
            }}>
              {formatNumber(getStatValue('pokestops_visited'))}
            </div>
            <div style={{
              /* Stops */
              width: '31px',
              height: '17px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '11px',
              lineHeight: '16px',
              textTransform: 'capitalize',
              color: '#353535',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              flexGrow: 0
            }}>
              Stops/day
            </div>
          </div>

          {/* Frame 534 - XP Stat */}
          <div style={{
            /* Frame 534 */
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px',
            gap: '8px',
            width: '65px',
            height: '74px',
            borderRadius: '2px',
            /* Inside auto layout */
            flex: 'none',
            order: 3,
            flexGrow: 0
          }}>
            <div style={{
              /* 33.4K */
              width: '67px',
              height: '32px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '24px',
              lineHeight: '31px',
              color: '#000000',
              /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0
            }}>
              {formatNumber(getStatValue('total_xp'))}
            </div>
            <div style={{
              /* XP */
              width: '15px',
              height: '18px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '12px',
              lineHeight: '18px',
              textTransform: 'capitalize',
              color: '#353535',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              flexGrow: 0
            }}>
              XP/day
            </div>
          </div>
        </div>
      ) : (
        /* Frame 535 - Desktop Stats Container */
        <div style={{
          /* Frame 535 */
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          padding: '10px 0px',
          gap: '21px',
            width: '100%',
        maxWidth: '100%',
          height: '111px',
          borderRadius: '4px',
          /* Inside auto layout */
          flex: 'none',
          order: 1,
          alignSelf: 'stretch',
          flexGrow: 0,
            opacity: loading ? 0.5 : 1,
        }}>
          {/* Distance Stat Card - Frame 531 */}
          <div 
            className="bg-gray-50 hover:bg-gray-300 transition-colors duration-200 ease-in-out cursor-pointer"
            style={{
              /* Frame 531 */
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px 0px',
              gap: '8px',
              margin: '0 auto',
              width: '200px',
              height: '100px',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
              borderRadius: '4px',
              position: 'relative',
              /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0,
            }}
          >
            {/* Loading Overlay */}
            {loading && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1
              }}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
              </div>
            )}
            <div style={{
              /* Stat Value - 4.6 */
              width: '57px',
              height: '32px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '36px',
              lineHeight: '31px',
              color: '#000000',
              /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0,
              textAlign: 'center',
            }}>
              {formatDistance(getStatValue('distance_walked'))}
            </div>
            <div style={{
              /* Km */
              width: '23px',
              height: '21px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '21px',
              textTransform: 'capitalize',
              color: '#353535',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              flexGrow: 0,
              textAlign: 'center',
            }}>Km/day</div>
          </div>

          {/* Pokemon Caught Stat Card - Frame 531 */}
          <div 
            className="bg-gray-50 hover:bg-gray-300 transition-colors duration-200 ease-in-out cursor-pointer"
            style={{
              /* Frame 531 */
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px 0px',
              gap: '8px',
              margin: '0 auto',
              width: '200px',
              height: '100px',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
              borderRadius: '4px',
              position: 'relative',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}
          >
            {/* Loading Overlay */}
            {loading && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1
              }}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
              </div>
            )}
            <div style={{
              /* Stat Value - 52.1 */
              width: '67px',
              height: '32px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '36px',
              lineHeight: '31px',
              color: '#000000',
              /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0,
              textAlign: 'center',
            }}>
              {formatNumber(getStatValue('pokemon_caught'))}
            </div>
            <div style={{
              /* Caught */
              width: '53px',
              height: '21px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '21px',
              textTransform: 'capitalize',
              color: '#353535',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              flexGrow: 0,
              textAlign: 'center',
            }}>Caught/day</div>
          </div>

          {/* Pokestops Stat Card - Frame 531 */}
          <div 
            className="bg-gray-50 hover:bg-gray-300 transition-colors duration-200 ease-in-out cursor-pointer"
            style={{
              /* Frame 531 */
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px 0px',
              gap: '8px',
              margin: '0 auto',
              width: '200px',
              height: '100px',
           
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
              borderRadius: '4px',
              position: 'relative',
              /* Inside auto layout */
              flex: 'none',
              order: 2,
              flexGrow: 0,
            }}
          >
            {/* Loading Overlay */}
            {loading && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1
              }}>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
              </div>
            )}
            <div style={{
              /* Stat Value - 46.8 */
              width: '80px',
              height: '32px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '36px',
              lineHeight: '31px',
              color: '#000000',
              /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0,
              textAlign: 'center',
            }}>
              {formatNumber(getStatValue('pokestops_visited'))}
            </div>
            <div style={{
              /* Stops */
              width: '40px',
              height: '21px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '21px',
              textTransform: 'capitalize',
              color: '#353535',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              flexGrow: 0,
              textAlign: 'center',
            }}>Stops/day</div>
          </div>

          {/* XP Stat Card - Frame 531 */}
          <div 
            className="bg-gray-50 hover:bg-gray-300 transition-colors duration-200 ease-in-out cursor-pointer"
            style={{
              /* Frame 531 */
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px 0px',
              gap: '8px',
              margin: '0 auto',
              width: '200px',
              height: '100px',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
              borderRadius: '4px',
              /* Inside auto layout */
              flex: 'none',
              order: 3,
              flexGrow: 0,
            }}
          >
            <div style={{
              /* Stat Value - 33.4K */
              width: '101px',
              height: '32px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '36px',
              lineHeight: '31px',
              color: '#000000',
              /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0,
              textAlign: 'center',
            }}>
              {formatNumber(getStatValue('total_xp'))}
            </div>
            <div style={{
              /* XP */
              width: '17px',
              height: '21px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '21px',
              textTransform: 'capitalize',
              color: '#353535',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              flexGrow: 0,
              textAlign: 'center',
            }}>XP/day</div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
