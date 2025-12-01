import { PlayerHeader } from "../layout/PlayerHeader"
import { ProfileInfo } from "../profile/ProfileInfo"
import { GrindStats } from "./GrindStats"
import { ShareablesHub } from "../shareables/ShareablesHub"
import { VerificationSection } from "../shareables/VerificationSection"
import { MobileFooter } from "../layout/MobileFooter"
import { Footer } from "../common/Footer"
import { PerformanceRadarChart } from "./RadarChart"
import { ExportCardModal } from "./ExportCardModal"
import { Crown } from "../icons/Crown"
import { useMobile } from "../../hooks/useMobile"
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'

// Social platform definitions matching ProfileInfo

interface PlayerProfileProps {
  viewMode: "public" | "private" | "team" | "own"
  userType: "trial" | "upgraded"
  showHeader?: boolean
  profile?: any // Optional profile prop for viewing other users' profiles
}

export function PlayerProfile({ viewMode, userType, showHeader = true, profile: externalProfile }: PlayerProfileProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMobile()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<'weekly' | 'monthly' | 'alltime'>('weekly')
  const [filteredStats, setFilteredStats] = useState<any>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const showMobileFooter = isMobile

  // Calculate header props - these are used in the conditional render
  const headerProps = showHeader ? {
    showProfileButton: viewMode === "private" || viewMode === "own",
    showLeaderboardButton: viewMode === "private" || viewMode === "own"
  } : null

  useEffect(() => {
    if (externalProfile) {
      // If external profile is provided (for viewing other users), use it directly
      setProfile(externalProfile)
      setLoading(false)
    } else {
      // Otherwise load current user's profile
      loadUserProfile()
    }
  }, [user, externalProfile])

  const loadUserProfile = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (err: any) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateFilteredStats = useCallback(async () => {
    console.log('calculateFilteredStats called with:', { timePeriod, profileId: profile?.id, hasProfile: !!profile })
    if (!profile?.id) {
      console.log('Early return: missing profile')
      return
    }

    try {
      if (timePeriod === 'alltime') {
        // For all-time, use profile data directly
        console.log('Setting all-time stats from profile:', {
          distance_walked: profile.distance_walked ?? 0,
          pokemon_caught: profile.pokemon_caught ?? 0,
          pokestops_visited: profile.pokestops_visited ?? 0,
          total_xp: profile.total_xp ?? 0
        })
        setFilteredStats({
          distance_walked: profile.distance_walked ?? 0,
          pokemon_caught: profile.pokemon_caught ?? 0,
          pokestops_visited: profile.pokestops_visited ?? 0,
          total_xp: profile.total_xp ?? 0
        })
        return
      }

      // For weekly/monthly: Query the SAME database views as the Leaderboard Live section
      const viewName = timePeriod === 'weekly' ? 'current_weekly_leaderboard' : 'current_monthly_leaderboard'
      
      console.log(`Querying ${viewName} for profile_id:`, profile.id)
      
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .eq('profile_id', profile.id)
        .single()

      if (error) {
        console.warn(`Error loading ${timePeriod} stats from view:`, error)
        // If no data in view, show zeros (same as leaderboard behavior)
        setFilteredStats({
          distance_walked: 0,
          pokemon_caught: 0,
          pokestops_visited: 0,
          total_xp: 0
        })
        return
      }

      if (data) {
        console.log(`Successfully loaded ${timePeriod} stats:`, data)
        // Use delta values (same as leaderboard Live section)
        setFilteredStats({
          distance_walked: data.distance_delta ?? 0,
          pokemon_caught: data.catches_delta ?? 0,
          pokestops_visited: data.pokestops_delta ?? 0,
          total_xp: data.xp_delta ?? 0
        })
      } else {
        // No data found, show zeros
        console.log(`No ${timePeriod} data found for profile`)
        setFilteredStats({
          distance_walked: 0,
          pokemon_caught: 0,
          pokestops_visited: 0,
          total_xp: 0
        })
      }
    } catch (error) {
      console.error('Error calculating filtered stats:', error)
      
      // Always fallback to profile data for all-time or zeros for periods
      if (timePeriod === 'alltime') {
        setFilteredStats({
          distance_walked: profile.distance_walked ?? 0,
          pokemon_caught: profile.pokemon_caught ?? 0,
          pokestops_visited: profile.pokestops_visited ?? 0,
          total_xp: profile.total_xp ?? 0
        })
      } else {
        setFilteredStats({
          distance_walked: 0,
          pokemon_caught: 0,
          pokestops_visited: 0,
          total_xp: 0
        })
      }
    }
  }, [profile?.id, profile, timePeriod])

  useEffect(() => {
    console.log('useEffect triggered with:', { hasProfile: !!profile, profileId: profile?.id, timePeriod })
    if (profile?.id) {
      console.log('Calling calculateFilteredStats from useEffect')
      calculateFilteredStats()
    } else {
      console.log('Skipping calculateFilteredStats: missing profile')
    }
  }, [profile?.id, timePeriod, calculateFilteredStats])

  const handleTimePeriodChange = (period: 'weekly' | 'monthly' | 'alltime') => {
    console.log('Time period changing to:', period)
    setTimePeriod(period)
  }

  const formatNumber = (num: number | null | undefined) => {
    if (!num || num === 0) return '0'
    return num.toLocaleString()
  }

  const formatDistance = (distance: number | null | undefined) => {
    if (!distance || distance === 0) return '0.0'
    return distance.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  }

  const getStatValue = (statType: 'distance_walked' | 'pokemon_caught' | 'pokestops_visited' | 'total_xp') => {
    // Always prioritize filtered stats if available
    if (filteredStats && filteredStats[statType] !== undefined) {
      console.log(`Using filtered stats for ${statType}:`, filteredStats[statType])
      return filteredStats[statType]
    }
    
    // For all-time, use profile data directly as fallback
    if (timePeriod === 'alltime' && profile && profile[statType] !== undefined) {
      console.log(`Using profile fallback for ${statType}:`, profile[statType])
      return profile[statType]
    }
    
    // For weekly/monthly without filtered stats, show 0 to indicate loading
    console.log(`No data available for ${statType}, returning 0`)
    return 0
  }


  if (loading) {
    return (
      <div className={showHeader ? " bg-white" : "bg-white"}>
        {showHeader && headerProps && (
          <PlayerHeader
            userType={userType}
            showProfileButton={isMobile ? false : headerProps.showProfileButton}
            showLeaderboardButton={isMobile ? false : headerProps.showLeaderboardButton}
          />
        )}
        <main 
          style={{
            position: 'fixed',
            top: showMobileFooter ? '0' : '0',
            bottom: showMobileFooter ? '80px' : '0',
            left: '0',
            right: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            zIndex: 10
          }}
        >
          <p style={{
            color: '#DC2627',
            fontSize: '18px',
            fontWeight: '600',
            fontFamily: 'Poppins, sans-serif',
            textAlign: 'center',
            margin: '0',
            padding: '0 20px'
          }}>Loading your Profile...</p>
        </main>
        {showMobileFooter && <MobileFooter currentPage="profile" />}
      </div>
    )
  }

  return (
    <div className={showHeader ? "min-h-screen bg-white" : "bg-white"}>
      {showHeader && headerProps && (
        <PlayerHeader
          userType={userType}
          showProfileButton={isMobile ? false : headerProps.showProfileButton}
          showLeaderboardButton={isMobile ? false : headerProps.showLeaderboardButton}
        />
      )}

      <main className={`${showMobileFooter ? "pb-20" : "pb-8"}`}>
        <div 
          className={isMobile ? "px-4" : "px-6"}
          style={{
            width: '100%',
            // Removed maxWidth constraint to match header full width behavior
            position: 'relative' // Add relative positioning for absolute child
          }}
        >
          {/* Upgrade Button - Top Right of Main Content */}
          {viewMode === "own" && userType === "trial" && !isMobile && (
            <button
              onClick={() => navigate('/upgrade')}
              style={{
                /* Upgrade button specifications */
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '8px 16px',
                gap: '8px',
                position: 'absolute',
                right: '24px',
                top: '16px',
                background: '#DC2627',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                zIndex: 20,
                boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#B91C1C';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#DC2627';
              }}
            >
              <Crown className="w-4 h-4" style={{ color: 'white' }} />
              <span style={{ 
                color: 'white', 
                fontWeight: '600', 
                fontSize: '14px',
                fontFamily: 'Poppins, system-ui, -apple-system, sans-serif'
              }}>
                Upgrade
              </span>
            </button>
          )}

          <div 
            className={isMobile ? "space-y-6" : "flex gap-8"}
            style={{
              width: '100%',
            }}
          >
            {/* Left Sidebar - Desktop only */}
            {!isMobile && (
                <div style={{
                  /* Frame 603 */
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '0px',
                
                  width: '320px', // Reduced from 400px for better fit
                  minWidth: '280px', // Minimum width for usability
                  minHeight: '646px', // Changed from fixed height to minimum height
                  /* Inside auto layout */
                  flex: 'none',
                  order: 0,
                  flexGrow: 0
                }}>
                <ProfileInfo viewMode={viewMode} userType={userType} profile={profile} />

                <div className="bg-white rounded-lg p-6" style={{ position: 'relative', minHeight: '400px' }}>
                  {/* Frame 541 - Time Period Buttons */}
                  <div style={{
                    /* Frame 541 */
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: '0px',
                    width: '100%', // Make responsive to parent container
                    maxWidth: '320px', // Match sidebar width
                    height: '48px',
                    borderRadius: '6px',
                    flex: 'none',
                    order: 0,
                    alignSelf: 'stretch',
                    flexGrow: 0,
                
                  }}>
                    {/* Week Button */}
                    <button 
                      onClick={() => handleTimePeriodChange('weekly')}
                      style={{
                        /* Week */
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: '0px 8px',
                        gap: '10px',
                        width: '80px',
                        height: '48px',
                        flex: 'none',
                        order: 0,
                        flexGrow: 0,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{
                        /* Week */
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
                        flexGrow: 0
                      }}>
                      Week
                      </span>
                    </button>

                    {/* Month Button */}
                    <button 
                      onClick={() => handleTimePeriodChange('monthly')}
                      style={{
                        /* Month */
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: '0px 8px',
                        width: '80px',
                        height: '48px',
                        borderRadius: '4px',
                        flex: 'none',
                        order: 1,
                        flexGrow: 0,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{
                        /* Month */
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
                        flexGrow: 0
                      }}>
                      Month
                      </span>
                    </button>

                    {/* All-time Button */}
                    <button 
                      onClick={() => handleTimePeriodChange('alltime')}
                      style={{
                        /* All-time */
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: '0px 8px',
                        gap: '10px',
                        width: '80px',
                        height: '48px',
                        flex: 'none',
                        order: 2,
                        flexGrow: 0,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{
                        /* All time */
                        width: 'auto',
                        minWidth: '47px',
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
                        whiteSpace: 'nowrap'
                      }}>

                      All Time

                      </span>
                    </button>
                  </div>

                  <div 
                    style={{
                      /* Frame 593 */
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '0px',
                      gap: isMobile ? '16px' : '8px',
                       // Make responsive
                      maxWidth: '320px', // Match sidebar width
                      minHeight: '361px', // Changed to minHeight for flexibility
                      marginTop: '24px',
                      width: '397px',
                      height: '97px', // Professional gap after time period buttons
                    }}
                  >
                    {/* Frame 589 - Distance Walked */}
                    <div 
                      style={{
                        /* Frame 589 */
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: '20px 40px',
                        gap: '10px',
                        width: '100%',
                        height: '78px',
                        background: 'rgba(0, 0, 0, 0.02)',
                        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                        borderRadius: '6px',
                        /* Inside auto layout */
                        flex: 'none',
                        order: 0,
                        alignSelf: 'stretch',
                        flexGrow: 0,
                      }}
                    >
                      <div 
                        className="hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer group"
                        style={{
                          /* Frame 515 */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '0px',
                          gap: isMobile ? '16px' : '8px',
                          width: '100%',
                          height: '68px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <div 
                          className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                          style={{
                          /* Stat Value - 15 km */
                          width: 'auto',
                          
                          height: '36px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 600,
                          fontSize: '24px',
                          lineHeight: '36px',
                          textAlign: isMobile ? 'left' : 'center',
                          color: '#000000',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          flexGrow: 0,
                          whiteSpace: 'nowrap'
                        }}>
                          {formatDistance(getStatValue('distance_walked'))} km
                        </div>
                        <div 
                          className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                          style={{
                          /* Stat Label - Distance Walked */
                          width: 'auto',
                  
                          height: '18px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '18px',
                          color: '#353535',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 1,
                          flexGrow: 0,
                          whiteSpace: 'nowrap'
                        }}>Distance Walked</div>
                      </div>
                    </div>

                    {/* Frame 590 - Pokémon Caught */}
                    <div 
                      style={{
                        /* Frame 590 */
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: '20px 40px',
                        gap: '10px',
                        width: '100%',
                        height: '77px',
                        background: 'rgba(0, 0, 0, 0.02)',
                        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                        borderRadius: '6px',
                        /* Inside auto layout */
                        flex: 'none',
                        order: 1,
                        alignSelf: 'stretch',
                        flexGrow: 0,
                      }}
                    >
                      <div 
                        className="hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer group"
                        style={{
                          /* Frame 515 */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '0px',
                          gap: isMobile ? '16px' : '8px',
                          width: '100%',
                          height: '68px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <div 
                          className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                          style={{
                          /* Stat Value - 170,000 */
                          width: 'auto',
                          
                          height: '36px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 600,
                          fontSize: '24px',
                          lineHeight: '36px',
                          textAlign: isMobile ? 'left' : 'center',
                          color: '#000000',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          flexGrow: 0,
                          whiteSpace: 'nowrap'
                        }}>{formatNumber(getStatValue('pokemon_caught'))}</div>
                        <div 
                          className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                          style={{
                          /* Stat Label - Pokémon Caught */
                          width: 'auto',
                        
                          height: '18px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '18px',
                          color: '#353535',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 1,
                          flexGrow: 0,
                          whiteSpace: 'nowrap'
                        }}>Pokémon Caught</div>
                      </div>
                    </div>

                    {/* Frame 591 - Pokéstops Visited */}
                    <div 
                      style={{
                        /* Frame 591 */
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: '20px 40px',
                        gap: '10px',
                        width: '100%',
                        height: '77px',
                        background: 'rgba(0, 0, 0, 0.02)',
                        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                        borderRadius: '6px',
                        /* Inside auto layout */
                        flex: 'none',
                        order: 2,
                        alignSelf: 'stretch',
                        flexGrow: 0,
                      }}
                    >
                      <div 
                        className="hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer group"
                        style={{
                          /* Frame 515 */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '0px',
                          gap: isMobile ? '16px' : '8px',
                          width: '100%',
                          height: '68px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <div 
                          className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                          style={{
                          /* Stat Value - 109,000 */
                          width: 'auto',
                        
                          height: '36px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 600,
                          fontSize: '24px',
                          lineHeight: '36px',
                          textAlign: isMobile ? 'left' : 'center',
                          color: '#000000',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          flexGrow: 0,
                          whiteSpace: 'nowrap'
                        }}>{formatNumber(getStatValue('pokestops_visited'))}</div>
                        <div 
                          className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                          style={{
                          /* Stat Label - Pokéstops Visited */
                          width: 'auto',
                        
                          height: '18px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '18px',
                          color: '#353535',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 1,
                          flexGrow: 0,
                          whiteSpace: 'nowrap'
                        }}>Pokéstops Visited</div>
                      </div>
                    </div>

                    {/* Frame 592 - Total XP */}
                    <div 
                      style={{
                        /* Frame 592 */
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: '20px 40px',
                        gap: '10px',
                        width: '100%',
                        height: '78px',
                        background: 'rgba(0, 0, 0, 0.02)',
                        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                        borderRadius: '6px',
                        /* Inside auto layout */
                        flex: 'none',
                        order: 3,
                        alignSelf: 'stretch',
                        flexGrow: 0,
                      }}
                    >
                      <div 
                        className="hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer group"
                        style={{
                          /* Frame 515 */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '0px',
                          gap: isMobile ? '16px' : '8px',
                          width: '100%',
                          height: '68px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <div 
                          className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                          style={{
                          /* Stat Value - 33,628,973 */
                          width: 'auto',
                        
                          height: '36px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 600,
                          fontSize: '24px',
                          lineHeight: '36px',
                          textAlign: isMobile ? 'left' : 'center',
                          color: '#000000',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          flexGrow: 0,
                          whiteSpace: 'nowrap'
                        }}>{formatNumber(getStatValue('total_xp'))}</div>
                        <div 
                          className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                          style={{
                          /* Stat Label - Total XP */
                          width: 'auto',
                         
                          height: '18px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 400,
                          fontSize: '12px',
                          lineHeight: '18px',
                          color: '#353535',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 1,
                          flexGrow: 0,
                          whiteSpace: 'nowrap'
                        }}>Total XP</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ShareablesHub/VerificationSection - Conditional based on viewMode */}
                {viewMode === "own" ? (
                <div style={{ position: 'relative', minHeight: '300px' }}>
                  <ShareablesHub />
                </div>
                ) : (
                  <div style={{ position: 'relative', minHeight: '65px' }}>
                    <VerificationSection profileUserId={profile?.user_id} />
                  </div>
                )}
              </div>
            )}

            {/* Main Content Area */}
            <div 
              className={isMobile ? "space-y-6" : "flex-1 space-y-6"}
              style={{
                width: '100%',
                overflow: 'hidden',
              }}
            >
              {/* Mobile Layout - Frame 522 Structure */}
              {isMobile ? (
                <div style={{
                  /* Frame 522 - Main mobile container */
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '0px',
                  gap: '16px',
                  width: '353px',
                  height: '1382px',
                  /* Inside auto layout */
                  flex: 'none',
                  order: 1,
                  alignSelf: 'stretch',
                  flexGrow: 0,
                  margin: '0 auto'
                }}>
                  {/* Frame 517 - Profile Info Container */}
                  <div style={{
                    /* Frame 517 */
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 0px',
                    gap: '8px',
                    width: '312px',
                    height: '249px',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 0,
                    flexGrow: 0
                  }}>
                  <ProfileInfo viewMode={viewMode} userType={userType} profile={profile} />
                  </div>

                  {/* Frame 530 - Grind Stats Container */}
                  <div style={{
                    /* Frame 530 */
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    padding: '12px 0px',
                    gap: '8px',
                    width: '353px',
                    height: '124px',
                    borderRadius: '8px',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 1,
                    alignSelf: 'stretch',
                    flexGrow: 0
                  }}>
                  <GrindStats 
                    isMobile={isMobile} 
                    viewMode={viewMode} 
                    userType={userType} 
                    profile={profile}
                  />
                  </div>

                  {/* Frame 548 - Performance Overview Container */}
                  <div style={{
                    /* Frame 548 */
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0px',
                    gap: '9px',
                    width: '351px',
                    height: '205px',
                    borderRadius: '12px',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 2,
                    flexGrow: 0
                  }}>
                    {/* Frame 541 - Time Period Buttons */}
                    <div style={{
                      /* Frame 541 */
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: '0px',
                        width: '351px',
                        height: '48px',
                        borderRadius: '6px',
                      /* Inside auto layout */
                        flex: 'none',
                        order: 0,
                        alignSelf: 'stretch',
                      flexGrow: 0
                    }}>
                      {/* Week Button */}
                      <button 
                        onClick={() => handleTimePeriodChange('weekly')}
                        style={{
                          /* Week Button */
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: '0px 8px',
                          gap: '10px',
                          width: '80px',
                          height: '48px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          flexGrow: 0,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{
                          /* Week Text */
                          width: '45px',
                          height: '18px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 600,
                          fontSize: '12px',
                          lineHeight: '18px',
                          color: timePeriod === 'weekly' ? '#DC2627' : '#000000',
                          textDecorationLine: timePeriod === 'weekly' ? 'underline' : 'none',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          flexGrow: 0
                        }}>
                        Week
                        </span>
                      </button>

                      {/* Month Button */}
                      <button 
                        onClick={() => handleTimePeriodChange('monthly')}
                        style={{
                          /* Month Button */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '0px 8px',
                          width: '80px',
                          height: '48px',
                          borderRadius: '4px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 1,
                          flexGrow: 0,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{
                          /* Month Text */
                          width: '50px',
                          height: '18px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 600,
                          fontSize: '12px',
                          lineHeight: '18px',
                          textDecorationLine: timePeriod === 'monthly' ? 'underline' : 'none',
                          color: timePeriod === 'monthly' ? '#DC2627' : '#000000',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          flexGrow: 0
                        }}>
                        Month
                        </span>
                      </button>

                      {/* All-time Button */}
                      <button 
                        onClick={() => handleTimePeriodChange('alltime')}
                        style={{
                          /* All-time Button */
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: '0px 8px',
                          gap: '10px',
                          width: '80px',
                          height: '48px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 2,
                          flexGrow: 0,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{
                          /* All time Text */
                          width: 'auto',
                          height: '18px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 600,
                          fontSize: '12px',
                          lineHeight: '18px',
                          color: timePeriod === 'alltime' ? '#DC2627' : '#000000',
                          textDecorationLine: timePeriod === 'alltime' ? 'underline' : 'none',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          flexGrow: 0,
                          whiteSpace: 'nowrap'
                        }}>
                        All Time
                        </span>
                      </button>

                      {/* Upload Card Icon - Hidden in mobile view */}
                      {!isMobile && (
                      <button 
                        onClick={() => setShowExportModal(true)}
                        style={{
                          /* Vector - Upload Icon */
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: '0px',
                          gap: '10px',
                          width: '24px',
                          height: '24px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 3,
                          flexGrow: 0,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 5.5V14M15 7.5L12 4.5L9 7.5M5 12.5V17.5C5 18.0304 5.21071 18.5391 5.58579 18.9142C5.96086 19.2893 6.46957 19.5 7 19.5H17C17.5304 19.5 18.0391 19.2893 18.4142 18.9142C18.7893 18.5391 19 18.0304 19 17.5V12.5" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      )}
                    </div>

                    {/* Frame 547 - Stats Grid Container */}
                    <div style={{
                      /* Frame 547 */
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      padding: '0px',
                      gap: isMobile ? '16px' : '8px',
                      width: '348px',
                      height: '148px',
                      /* Inside auto layout */
                      flex: 'none',
                      order: 1,
                      flexGrow: 0
                    }}>
                      {/* Frame 546 - First Row Stats */}
                      <div style={{
                        /* Frame 546 */
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: '0px',
                        gap: isMobile ? '16px' : '8px',
                        width: '348px',
                        height: '70px',
                        /* Inside auto layout */
                        flex: 'none',
                        order: 0,
                        alignSelf: 'stretch',
                        flexGrow: 0
                      }}>
                        {/* Frame 22 - Distance Walked */}
                        <div 
                          className="hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer group"
                          style={{
                          /* Frame 22 */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '20px',
                          gap: '10px',
                          width: '166px',
                          height: '70px',
                          background: 'rgba(0, 0, 0, 0.02)',
                          boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                          borderRadius: '6px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          flexGrow: 0
                        }}>
                          <div 
                            className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                            style={{
                            /* 15,526.3 km */
                            width: 'auto',
                            minWidth: '106px',
                            height: '27px',
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 600,
                            fontSize: '18px',
                            lineHeight: '27px',
                            textAlign: isMobile ? 'left' : 'center',
                            color: '#000000',
                            /* Inside auto layout */
                            flex: 'none',
                            order: 0,
                            flexGrow: 0,
                            whiteSpace: 'nowrap'
                          }}>
                          {formatDistance(getStatValue('distance_walked'))} km
                        </div>
                          <div 
                            className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                            style={{
                            /* Distance Walked */
                            width: 'auto',
                            minWidth: '92px',
                            height: '17px',
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 400,
                            fontSize: '11px',
                            lineHeight: '16px',
                            color: '#353535',
                            /* Inside auto layout */
                            flex: 'none',
                            order: 1,
                            flexGrow: 0,
                            whiteSpace: 'nowrap'
                          }}>
                            Distance Walked
                      </div>
                      </div>

                        {/* Frame 542 - Pokemon Caught */}
                        <div 
                          className="hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer group"
                          style={{
                          /* Frame 542 */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '20px',
                          gap: '10px',
                          width: '166px',
                          height: '70px',
                          background: 'rgba(0, 0, 0, 0.02)',
                          boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                          borderRadius: '6px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 1,
                          flexGrow: 0
                        }}>
                          <div 
                            className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                            style={{
                            /* 170,000 */
                            width: 'auto',
                            minWidth: '68px',
                            height: '27px',
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 600,
                            fontSize: '18px',
                            lineHeight: '27px',
                            textAlign: isMobile ? 'left' : 'center',
                            color: '#000000',
                            /* Inside auto layout */
                            flex: 'none',
                            order: 0,
                            flexGrow: 0,
                            whiteSpace: 'nowrap'
                          }}>
                            {formatNumber(getStatValue('pokemon_caught'))}
                      </div>
                          <div 
                            className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                            style={{
                            /* Pokémon Caught */
                            width: 'auto',
                            minWidth: '96px',
                            height: '17px',
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 400,
                            fontSize: '11px',
                            lineHeight: '16px',
                            color: '#353535',
                            /* Inside auto layout */
                            flex: 'none',
                            order: 1,
                            flexGrow: 0,
                            whiteSpace: 'nowrap'
                          }}>
                            Pokémon Caught
                      </div>
                    </div>
                  </div>

                      {/* Frame 545 - Second Row Stats */}
                      <div style={{
                        /* Frame 545 */
                      display: 'flex',
                        flexDirection: 'row',
                      alignItems: 'center',
                        padding: '0px',
                        gap: isMobile ? '16px' : '8px',
                        width: '348px',
                        height: '70px',
                        /* Inside auto layout */
                        flex: 'none',
                        order: 1,
                        alignSelf: 'stretch',
                        flexGrow: 0
                      }}>
                        {/* Frame 544 - Pokestops Visited */}
                        <div 
                          className="hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer group"
                          style={{
                          /* Frame 544 */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                      padding: '20px',
                          gap: '10px',
                          width: '166px',
                          height: '70px',
                      background: 'rgba(0, 0, 0, 0.02)',
                      boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                          borderRadius: '6px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          flexGrow: 0
                        }}>
                          <div 
                            className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                            style={{
                            /* 109,000 */
                            width: 'auto',
                            minWidth: '69px',
                            height: '27px',
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 600,
                            fontSize: '18px',
                            lineHeight: '27px',
                            textAlign: isMobile ? 'left' : 'center',
                            color: '#000000',
                            /* Inside auto layout */
                            flex: 'none',
                            order: 0,
                            flexGrow: 0,
                            whiteSpace: 'nowrap'
                          }}>
                            {formatNumber(getStatValue('pokestops_visited'))}
                          </div>
                          <div 
                            className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                            style={{
                            /* Pokéstops Visited */
                            width: 'auto',
                            minWidth: '96px',
                            height: '17px',
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 400,
                            fontSize: '11px',
                            lineHeight: '16px',
                            color: '#353535',
                            /* Inside auto layout */
                            flex: 'none',
                            order: 1,
                            flexGrow: 0,
                            whiteSpace: 'nowrap'
                          }}>
                            Pokéstops Visited
                          </div>
                        </div>

                        {/* Frame 543 - Total XP */}
                        <div 
                          className="hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer group"
                          style={{
                          /* Frame 543 */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '20px',
                          gap: '10px',
                          width: '166px',
                          height: '70px',
                          background: 'rgba(0, 0, 0, 0.02)',
                          boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                          borderRadius: '6px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 1,
                          flexGrow: 0
                        }}>
                          <div 
                            className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                            style={{
                            /* 33,628,973 */
                            width: 'auto',
                            minWidth: '97px',
                            height: '27px',
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 600,
                            fontSize: '18px',
                            lineHeight: '27px',
                            textAlign: isMobile ? 'left' : 'center',
                            color: '#000000',
                            /* Inside auto layout */
                            flex: 'none',
                            order: 0,
                            flexGrow: 0,
                            whiteSpace: 'nowrap'
                          }}>
                            {formatNumber(getStatValue('total_xp'))}
                          </div>
                          <div 
                            className="group-hover:scale-110 transition-transform duration-200 ease-in-out"
                            style={{
                            /* Total XP */
                            width: 'auto',
                            minWidth: '44px',
                            height: '17px',
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 400,
                            fontSize: '11px',
                            lineHeight: '16px',
                            color: '#353535',
                            /* Inside auto layout */
                            flex: 'none',
                            order: 1,
                            flexGrow: 0,
                            whiteSpace: 'nowrap'
                          }}>
                            Total XP
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Frame 549 - Performance Overview Container */}
                  <div style={{
                    /* Frame 549 */
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '0px', // Remove padding to align with time period buttons
                    gap: '8px',
                    width: '351px', // Match time period buttons container width
                    height: '442px',
                    borderRadius: '8px',
                    marginTop: '15px',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 3,
                    alignSelf: 'stretch',
                    flexGrow: 0
                  }}>
                    {/* Performance Overview Heading */}
                    <div style={{
                      /* Performance Overview */
                      width: 'auto',
                      minWidth: '186px',
                      height: '24px',
                      fontFamily: 'Poppins',
                      fontStyle: 'normal',
                      fontWeight: 600,
                      fontSize: '16px',
                      lineHeight: '24px',
                      textAlign: 'left', // Align left to match time period buttons
                      color: '#000000',
                      marginLeft: '0px', // Align with time period buttons
                      /* Inside auto layout */
                      flex: 'none',
                      order: 0,
                      flexGrow: 0,
                      whiteSpace: 'nowrap'
                    }}>
                      Performance Overview
                    </div>

                    {/* Frame 559 - Radar Chart Container */}
                    <div style={{
                      /* Frame 559 */
                      width: '320.4px',
                      height: '338.89px',
                      /* Inside auto layout */
                      flex: 'none',
                      order: 1,
                      flexGrow: 0,
                      position: 'relative'
                    }}>
                      {/* Frame 458 - Chart Background */}
                      <div style={{
                        /* Frame 458 */
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '0px 0px 10px',
                        position: 'absolute',
                        width: '320.4px',
                        height: '338.89px',
                        left: '0px',
                        top: '0px',
                        background: 'rgba(0, 0, 0, 0.02)',
                        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                        borderRadius: '8px'
                      }}>
                    <div style={{ 
                      width: '100%', 
                      height: '100%', 
                      position: 'relative'
                    }}>
                      <PerformanceRadarChart 
                        profile={profile} 
                        isPaidUser={userType === "upgraded"} 
                        showHeader={false}
                        timePeriod={timePeriod}
                      />
                    </div>
                    </div>
                  </div>

                    {/* Upgrade Button (if needed) */}
                  {viewMode === "own" && userType === "trial" && (
                      <div style={{
                        /* Upgrade button */
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '0px',
                        gap: isMobile ? '16px' : '8px',
                        width: '320.4px',
                        height: '48px',
                        background: '#DC2627',
                        borderRadius: '8px',
                        marginTop: '32px',
                        /* Inside auto layout */
                        flex: 'none',
                        order: 2,
                        flexGrow: 0,
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate('/upgrade')}
                    >
                        <Crown style={{
                          /* Crown icon */
                          width: '24px',
                          height: '24px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          flexGrow: 0,
                          color: '#FFFFFF'
                        }} />
                        <span style={{
                          /* Upgrade */
                          width: '63px',
                          height: '21px',
                          fontFamily: 'Poppins',
                          fontStyle: 'normal',
                          fontWeight: 600,
                          fontSize: '14px',
                          lineHeight: '21px',
                          color: '#FFFFFF',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 1,
                          flexGrow: 0
                        }}>
                          Upgrade
                      </span>
                    </div>
                  )}
                  </div>

                  {/* Frame 599 - ShareablesHub/VerificationSection Container */}
                  {viewMode === "own" ? (
                  <div style={{
                    /* Frame 599 */
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '0px',
                    gap: '16px',
                    width: '348px',
                    height: '234px',
                    marginTop: '-16px',
                    
                    /* Inside auto layout */
                    flex: 'none',
                    order: 4,
                    flexGrow: 0
                  }}>
                    <ShareablesHub />
                  </div>
                  ) : (
                    <div style={{
                      /* Frame 599 */
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '0px',
                      gap: '16px',
                      width: '348px',
                      height: '65px',
                      marginTop: '-16px',
                      
                      /* Inside auto layout */
                      flex: 'none',
                      order: 4,
                      flexGrow: 0
                    }}>
                      <VerificationSection profileUserId={profile?.user_id} />
                    </div>
                  )}


                </div>
              ) : (
                /* Desktop Layout - Keep existing */
                <>
                  <GrindStats 
                    isMobile={isMobile} 
                    viewMode={viewMode} 
                    userType={userType} 
                    profile={profile}
                  />
              
              {/* Performance Overview Heading - Aligned with weekly/monthly buttons */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0px', // Remove padding as requested
                width: '100%',
                maxWidth: '100%',
                background: '#FFFFFF',
                borderRadius: '8px',
                margin: '0 auto',
                marginLeft: '0', 
                marginTop: '36px',// Align with weekly/monthly buttons
                 // Add bottom margin as requested
              }}>
                <span style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '24px',
                  lineHeight: '36px',
                  color: '#000000',
                  textAlign: 'left',
                  whiteSpace: 'nowrap'
                }}>
                  Performance Overview
                </span>
              </div>

              {/* 8px gap before PerformanceRadarChart */}
              <div style={{
                height: '8px',
                background: '#FFFFFF',
                width: '100%'
              }} />
              
              {/* Radar Chart Container - Frame 458 */}
              <div 
                style={{
                  /* Frame 458 specifications */
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '20px',
                  position: 'relative',
                  width: '100%',
                  maxWidth: '100%',
                  height: isMobile ? '400px' : '487px',
                  minHeight: isMobile ? '400px' : '487px',
                  background: 'rgba(0, 0, 0, 0.02)',
                  boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                  borderRadius: '8px',
                  margin: '0 auto',
                  transition: 'none',
                  transform: 'translateZ(0)', // Force GPU acceleration
                  willChange: 'contents', // Prevent layout shifts
                }}
              >

                {/* Group - Radar Chart positioning */}
                <div 
                  style={{
                    position: 'absolute',
                    left: '22.24%',
                    right: '22.51%',
                    top: '0%',
                    bottom: '4.93%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'none',
                    transform: 'translateZ(0)', // Force GPU acceleration
                  }}
                >
                  <div>
                  <PerformanceRadarChart 
                    profile={profile} 
                    isPaidUser={userType === "upgraded"} 
                    showHeader={false}
                    timePeriod={timePeriod}
                  />
                  </div>
                </div>
              </div>

              {/* Upgrade Button */}
              {viewMode === "own" && userType === "trial" && (
                <div 
                  style={{
                    /* Upgrade button specifications */
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '0px',
                    gap: '16px',
                    width: isMobile ? '100%' : '838px',
                    maxWidth: '838px',
                    height: '48px',
                    background: '#DC2627',
                    borderRadius: '8px',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 2,
                    flexGrow: 0,
                    margin: '0 auto',
                    marginTop: '16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                  onClick={() => navigate('/upgrade')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#B91C1C';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#DC2627';
                  }}
                >
                  <span style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>
                    Upgrade to Premium
                  </span>
                </div>
              )}

                </>
              )}
            </div>
          </div>
        </div>

        {/* Social Links Section and Verification Screenshots - Removed for public profiles */}
      </main>

      {showMobileFooter && <MobileFooter currentPage="profile" />}

      {/* Export Card Modal */}
      <ExportCardModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        profile={profile}
        isPaidUser={userType === "upgraded"}
      />

      {/* Footer - Don't show on public profiles */}
      {viewMode !== "public" && <Footer />}

    </div>
  )
}
