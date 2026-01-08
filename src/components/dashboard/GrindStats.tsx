import { dashboardService } from "../../services/dashboardService"
import { useState, useEffect, memo } from "react"
import { useAuth } from "../../contexts/AuthContext"

interface GrindStatsProps {
  isMobile?: boolean
  viewMode?: "public" | "private" | "team" | "own"
  userType?: "trial" | "upgraded"
  profile?: any
}

// Memoize the GrindStats component to prevent unnecessary re-renders;

export const GrindStats = memo(function GrindStats({ isMobile = false, profile }: GrindStatsProps) {
  const { user } = useAuth()
  const [backendStats, setBackendStats] = useState<any>(null)

  // Load all-time stats from backend when component mounts or profile changes
  useEffect(() => {
    let isMounted = true;
    // Prioritize profile.user_id for external profiles, fallback to current user
    const targetUserId = profile?.user_id || user?.id
    
    if (targetUserId) {
      // Define the async function inside useEffect
      const loadBackendStats = async () => {
        try {
          // Always load all-time stats for GrindStats table (gets latest calculated values)
          const result = await dashboardService.calculateAllTimeGrindStats(targetUserId)

          // Only update state if component is still mounted
          if (isMounted) {
            setBackendStats(result)
          }
        } catch (error) {
          // Only update state if component is still mounted
          if (isMounted) {
            console.warn('Failed to load all-time backend stats for GrindStats:', error)
            setBackendStats(null)
          }
        }
      }
      
      // Call the function
      loadBackendStats()
    }
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false
    }
  }, [user?.id, profile?.user_id])

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '0.0'
    const absVal = Math.abs(num)
    const sign = num < 0 ? '-' : ''

    if (absVal === 0) return '0.0'
    if (absVal >= 1_000_000) {
      return sign + (absVal / 1_000_000).toFixed(1) + 'M'
    } else if (absVal >= 1_000) {
      return sign + (absVal / 1_000).toFixed(1) + 'K'
    }
    return sign + absVal.toFixed(1)
  }

  const formatDistance = (distance: number | null | undefined) => {
    if (!distance || distance === 0) return '0.0'
    
    // Use K, M, B suffixes like other core stats
    const absVal = Math.abs(distance)
    const sign = distance < 0 ? '-' : ''
    
    if (absVal >= 1_000_000_000) {
      return sign + (absVal / 1_000_000_000).toFixed(1) + 'B'
    }
    if (absVal >= 1_000_000) {
      return sign + (absVal / 1_000_000).toFixed(1) + 'M'
    }
    if (absVal >= 1_000) {
      return sign + (absVal / 1_000).toFixed(1) + 'K'
    }
    return sign + absVal.toFixed(1)
  }

  const getStatValue = (statType: 'distance_walked' | 'pokemon_caught' | 'pokestops_visited' | 'total_xp') => {
    // For XP, always calculate from raw values to avoid backend formatting confusion
    if (statType === 'total_xp') {
      // First try backend total XP
      if (backendStats && backendStats.totalXP !== undefined) {
        const startDate = profile?.start_date
        if (startDate) {
          // Parse date in a timezone-safe way by adding 'T00:00:00' to force local timezone
          const start = new Date(startDate + 'T00:00:00')
          const current = new Date()
          const daysPlayed = Math.max(1, Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
          const xpPerDay = backendStats.totalXP / daysPlayed
          const dailyAverage = Math.round(xpPerDay * 10) / 10
          console.log(`GrindStats calculated XP daily average from backend totalXP:`, dailyAverage)
          return dailyAverage
        }
      }
      
      // Fallback to profile total XP
      if (profile && profile.total_xp !== undefined) {
        const startDate = profile.start_date
        if (startDate) {
          // Parse date in a timezone-safe way by adding 'T00:00:00' to force local timezone
          const start = new Date(startDate + 'T00:00:00')
          const current = new Date()
          const daysPlayed = Math.max(1, Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
          const xpPerDay = profile.total_xp / daysPlayed
          const dailyAverage = Math.round(xpPerDay * 10) / 10
          console.log(`GrindStats calculated XP daily average from profile:`, dailyAverage)
          return dailyAverage
        }
      }
      
      return 0
    }
    
    // For other stats, use backend values when available
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
        default:
          return 0
      }
    }
    
    // Fallback to profile data - calculate daily average from totals
    if (profile && profile[statType] !== undefined && profile[statType] !== null) {
      const totalValue = profile[statType]
      const startDate = profile.start_date

      if (startDate) {
        // Parse date in a timezone-safe way by adding 'T00:00:00' to force local timezone
        const start = new Date(startDate + 'T00:00:00')
        const current = new Date()
        const daysPlayed = Math.max(1, Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
        const averagePerDay = totalValue / daysPlayed
        const dailyAverage = Math.round(averagePerDay * 10) / 10 // Round to nearest tenth for display

        console.log(`GrindStats using profile fallback daily average for ${statType}:`, dailyAverage)
        return dailyAverage
      }
    }

    console.log(`GrindStats no data available for ${statType}, returning 0`)
    return 0
  }

  const formatXP = (xpValue: number) => {
    // Now that we're calculating raw XP per day values, just use the standard formatter
    // which handles K/M suffixes properly
    return formatNumber(xpValue)
  }

  return (
    <>
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
        <div 
          className="grind-stats-container-mobile"
          style={{
          /* Frame 535 */
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          padding: '0px',
          gap: '21px',
          width: '353px',
          minWidth: '353px',
          maxWidth: '353px',
          height: '74px',
          minHeight: '74px',
          maxHeight: '74px',
          background: 'rgba(0, 0, 0, 0.02)',
          boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
          borderRadius: '4px',
          /* Inside auto layout */
          flex: 'none',
          order: 1,
          alignSelf: 'stretch',
          flexGrow: 0,
          opacity: 1,
          position: 'relative',
          boxSizing: 'border-box',
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
              /* Distance Value */
              width: 'auto',
              minWidth: '50px',
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
              flexGrow: 0,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
              Km
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
              Caught
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
              Stops
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
              {formatXP(getStatValue('total_xp'))}
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
              XP
            </div>
          </div>
        </div>
      ) : (
        /* Frame 535 - Desktop Stats Container */
        <div 
          className="grind-stats-container"
          style={{
          /* Frame 535 */
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0px',
            gap: '21px',
            width: '100%',
            minWidth: '100%',
            maxWidth: '100%',
            height: '111px',
            minHeight: '111px',
            maxHeight: '111px',
            borderRadius: '4px',
            /* Inside auto layout */
            flex: 'none',
            order: 1,
            alignSelf: 'stretch',
            flexGrow: 0,
            opacity: 1,
            position: 'relative',
            boxSizing: 'border-box',
        }}>
          {/* Blur loading overlay */}
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
            <div style={{
              /* Stat Value - Distance */
              width: 'auto',
              minWidth: '120px',
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
            }}>Km</div>
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
            <div style={{
              /* Stat Value - 52.1 */
              width: 'auto',
              minWidth: '67px',
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
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
            }}>Caught</div>
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
            }}>Stops</div>
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
              {formatXP(getStatValue('total_xp'))}
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
            }}>XP</div>
          </div>
        </div>
      )}
      </div>
    </div>
    </>
  )
})
