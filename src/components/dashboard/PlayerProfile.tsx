import { PlayerHeader } from "../layout/PlayerHeader"
import { ProfileInfo } from "../profile/ProfileInfo"
import { GrindStats } from "./GrindStats"
import { ShareablesHub } from "../shareables/ShareablesHub"
import { MobileFooter } from "../layout/MobileFooter"
import { RadarChart } from "./RadarChart"
import { ExportCardModal } from "./ExportCardModal"
import { Crown } from "../icons/Crown"
import { useMobile } from "../../hooks/useMobile"
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { dashboardService } from '../../services/dashboardService'

interface PlayerProfileProps {
  viewMode: "public" | "private" | "team" | "own"
  userType: "trial" | "upgraded"
  showHeader?: boolean
}

export function PlayerProfile({ viewMode, userType, showHeader = true }: PlayerProfileProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isMobile = useMobile()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<'weekly' | 'monthly' | 'alltime'>('weekly')
  const [filteredStats, setFilteredStats] = useState<any>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [chartLoading, setChartLoading] = useState(false)
  const showMobileFooter = isMobile

  // Calculate header props - these are used in the conditional render
  const headerProps = showHeader ? {
    showProfileButton: viewMode === "private" || viewMode === "own",
    showLeaderboardButton: viewMode === "private" || viewMode === "own"
  } : null

  useEffect(() => {
    loadUserProfile()
  }, [user])

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
    console.log('calculateFilteredStats called with:', { timePeriod, userId: user?.id, hasProfile: !!profile })
    if (!user?.id || !profile) {
      console.log('Early return: missing user or profile')
      return
    }

    try {
      setStatsLoading(true)
      let statsResult

      switch (timePeriod) {
        case 'weekly':
          try {
            statsResult = await dashboardService.calculateWeeklyGrindStats(user.id)
            console.log('Weekly stats loaded:', statsResult)
            // Ensure we have valid data before proceeding
            if (!statsResult || (statsResult.totalXP === 0 && statsResult.pokemonCaught === 0 && 
                               statsResult.distanceWalked === 0 && statsResult.pokestopsVisited === 0)) {
              console.log('Weekly stats are all zero, using profile data as fallback')
              statsResult = {
                totalXP: profile.total_xp || 0,
                pokemonCaught: profile.pokemon_caught || 0,
                distanceWalked: profile.distance_walked || 0,
                pokestopsVisited: profile.pokestops_visited || 0,
                uniquePokedexEntries: profile.unique_pokedex_entries || 0
              }
            }
          } catch (weeklyError) {
            console.warn('Weekly stats calculation failed, using profile fallback:', weeklyError)
            // Use profile data as fallback instead of null
            statsResult = {
              totalXP: profile.total_xp || 0,
              pokemonCaught: profile.pokemon_caught || 0,
              distanceWalked: profile.distance_walked || 0,
              pokestopsVisited: profile.pokestops_visited || 0,
              uniquePokedexEntries: profile.unique_pokedex_entries || 0
            }
          }
          break
        case 'monthly':
          try {
            statsResult = await dashboardService.calculateMonthlyGrindStats(user.id)
            console.log('Monthly stats loaded:', statsResult)
            // Ensure we have valid data before proceeding
            if (!statsResult || (statsResult.totalXP === 0 && statsResult.pokemonCaught === 0 && 
                               statsResult.distanceWalked === 0 && statsResult.pokestopsVisited === 0)) {
              console.log('Monthly stats are all zero, using profile data as fallback')
              statsResult = {
                totalXP: profile.total_xp || 0,
                pokemonCaught: profile.pokemon_caught || 0, 
                distanceWalked: profile.distance_walked || 0,
                pokestopsVisited: profile.pokestops_visited || 0,
                uniquePokedexEntries: profile.unique_pokedex_entries || 0
              }
            }
          } catch (monthlyError) {
            console.warn('Monthly stats calculation failed, using profile fallback:', monthlyError)
            // Use profile data as fallback instead of null
            statsResult = {
              totalXP: profile.total_xp || 0,
              pokemonCaught: profile.pokemon_caught || 0,
              distanceWalked: profile.distance_walked || 0,
              pokestopsVisited: profile.pokestops_visited || 0,
              uniquePokedexEntries: profile.unique_pokedex_entries || 0
            }
          }
          break
        case 'alltime':
        default:
          // For all-time, use profile data directly
          console.log('Setting all-time stats from profile:', {
            distance_walked: profile.distance_walked || 0,
            pokemon_caught: profile.pokemon_caught || 0,
            pokestops_visited: profile.pokestops_visited || 0,
            total_xp: profile.total_xp || 0
          })
          setFilteredStats({
            distance_walked: profile.distance_walked || 0,
            pokemon_caught: profile.pokemon_caught || 0,
            pokestops_visited: profile.pokestops_visited || 0,
            total_xp: profile.total_xp || 0
          })
          return
      }

      if (statsResult) {
        console.log('Successfully calculated stats for', timePeriod, ':', statsResult)
        setFilteredStats({
          distance_walked: statsResult.distanceWalked || 0,
          pokemon_caught: statsResult.pokemonCaught || 0,
          pokestops_visited: statsResult.pokestopsVisited || 0,
          total_xp: statsResult.totalXP || 0
        })
      } else {
        // Fallback to zero if no stats available for weekly/monthly
        console.log('No period stats available, showing zeros for', timePeriod)
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
          distance_walked: profile.distance_walked || 0,
          pokemon_caught: profile.pokemon_caught || 0,
          pokestops_visited: profile.pokestops_visited || 0,
          total_xp: profile.total_xp || 0
        })
      } else {
        setFilteredStats({
          distance_walked: 0,
          pokemon_caught: 0,
          pokestops_visited: 0,
          total_xp: 0
        })
      }
    } finally {
      setStatsLoading(false)
    }
  }, [user?.id, profile, timePeriod])

  useEffect(() => {
    console.log('useEffect triggered with:', { hasProfile: !!profile, hasUser: !!user?.id, timePeriod })
    if (profile && user?.id) {
      console.log('Calling calculateFilteredStats from useEffect')
      calculateFilteredStats()
    } else {
      console.log('Skipping calculateFilteredStats: missing profile or user')
    }
  }, [profile, timePeriod, user?.id])

  const handleTimePeriodChange = (period: 'weekly' | 'monthly' | 'alltime') => {
    console.log('Time period changing to:', period)
    setTimePeriod(period)
    setChartLoading(true)
    // Don't clear filtered stats to prevent data vanishing - let new data overwrite
    // setFilteredStats(null) - REMOVED to fix vanishing issue
    
    // Clear chart loading after a delay to simulate chart re-rendering
    setTimeout(() => setChartLoading(false), 1000)
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
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '2px solid transparent',
              borderTop: '2px solid #DC2627',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{
              color: '#6B7280',
              fontSize: '18px',
              fontWeight: '500',
              margin: '0'
            }}>Loading your profile...</p>
          </div>
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
                fontFamily: 'system-ui, -apple-system, sans-serif'
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
                    {/* Weekly Button */}
                    <button 
                      onClick={() => handleTimePeriodChange('weekly')}
                      style={{
                        /* Weekly */
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
                        /* Weekly */
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
                      Weekly
                      </span>
                    </button>

                    {/* Monthly Button */}
                    <button 
                      onClick={() => handleTimePeriodChange('monthly')}
                      style={{
                        /* Monthly */
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
                        /* Monthly */
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
                      Monthly
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
                        flexGrow: 0
                      }}>
                      All time
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
                      gap: '8px',
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
                        style={{
                          /* Frame 515 */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '0px',
                          gap: '8px',
                          width: '100%',
                          height: '68px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <div style={{
                          /* Stat Value - 15 km */
                          width: '141px',
                          height: '48px',
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
                        }}>
                          {formatDistance(getStatValue('distance_walked'))} km
                        </div>
                        <div style={{
                          /* Stat Label - Distance Walked */
                          width: '101px',
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
                        style={{
                          /* Frame 515 */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '0px',
                          gap: '8px',
                          width: '100%',
                          height: '68px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <div style={{
                          /* Stat Value - 170,000 */
                          width: '90px',
                          height: '48px',
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
                        }}>{formatNumber(getStatValue('pokemon_caught'))}</div>
                        <div style={{
                          /* Stat Label - Pokémon Caught */
                          width: '105px',
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
                        style={{
                          /* Frame 515 */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '0px',
                          gap: '8px',
                          width: '100%',
                          height: '68px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <div style={{
                          /* Stat Value - 109,000 */
                          width: '92px',
                          height: '48px',
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
                        }}>{formatNumber(getStatValue('pokestops_visited'))}</div>
                        <div style={{
                          /* Stat Label - Pokéstops Visited */
                          width: '105px',
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
                        style={{
                          /* Frame 515 */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '0px',
                          gap: '8px',
                          width: '100%',
                          height: '68px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <div style={{
                          /* Stat Value - 33,628,973 */
                          width: '100px',
                          height: '48px',
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
                        }}>{formatNumber(getStatValue('total_xp'))}</div>
                        <div style={{
                          /* Stat Label - Total XP */
                          width: '48px',
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
                        }}>Total XP</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ position: 'relative', minHeight: '300px' }}>
                  <ShareablesHub />
                </div>
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
                    {statsLoading ? (
                      <div className="bg-white rounded-lg p-6">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                        <p className="text-center text-gray-600">Loading stats...</p>
                      </div>
                    ) : (
                  <GrindStats 
                    isMobile={isMobile} 
                    viewMode={viewMode} 
                    userType={userType} 
                    profile={profile}
                  />
                    )}
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
                    marginTop: '40px',
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
                      {/* Weekly Button */}
                      <button 
                        onClick={() => handleTimePeriodChange('weekly')}
                        style={{
                          /* Weekly Button */
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
                          /* Weekly Text */
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
                        Weekly
                        </span>
                      </button>

                      {/* Monthly Button */}
                      <button 
                        onClick={() => handleTimePeriodChange('monthly')}
                        style={{
                          /* Monthly Button */
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
                          /* Monthly Text */
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
                        Monthly
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
                          width: '47px',
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
                          flexGrow: 0
                        }}>
                        All time
                        </span>
                      </button>

                      {/* Upload Card Icon - Vector */}
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
                    </div>

                    {/* Frame 547 - Stats Grid Container */}
                    <div style={{
                      /* Frame 547 */
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      padding: '0px',
                      gap: '8px',
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
                        gap: '8px',
                        width: '348px',
                        height: '70px',
                        /* Inside auto layout */
                        flex: 'none',
                        order: 0,
                        alignSelf: 'stretch',
                        flexGrow: 0
                      }}>
                        {/* Frame 22 - Distance Walked */}
                        <div style={{
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
                          <div style={{
                            /* 15,526.3 km */
                            width: '106px',
                            height: '27px',
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 600,
                            fontSize: '18px',
                            lineHeight: '27px',
                            textAlign: 'center',
                            color: '#000000',
                            /* Inside auto layout */
                            flex: 'none',
                            order: 0,
                            flexGrow: 0
                          }}>
                          {formatDistance(getStatValue('distance_walked'))} km
                        </div>
                          <div style={{
                            /* Distance Walked */
                            width: '92px',
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
                            flexGrow: 0
                          }}>
                            Distance Walked
                      </div>
                      </div>

                        {/* Frame 542 - Pokemon Caught */}
                        <div style={{
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
                          <div style={{
                            /* 170,000 */
                            width: '68px',
                            height: '27px',
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 600,
                            fontSize: '18px',
                            lineHeight: '27px',
                            textAlign: 'center',
                            color: '#000000',
                            /* Inside auto layout */
                            flex: 'none',
                            order: 0,
                            flexGrow: 0
                          }}>
                            {formatNumber(getStatValue('pokemon_caught'))}
                      </div>
                          <div style={{
                            /* Pokémon Caught */
                            width: '96px',
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
                            flexGrow: 0
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
                        gap: '8px',
                        width: '348px',
                        height: '70px',
                        /* Inside auto layout */
                        flex: 'none',
                        order: 1,
                        alignSelf: 'stretch',
                        flexGrow: 0
                      }}>
                        {/* Frame 544 - Pokestops Visited */}
                        <div style={{
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
                          <div style={{
                            /* 109,000 */
                            width: '69px',
                            height: '27px',
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 600,
                            fontSize: '18px',
                            lineHeight: '27px',
                            textAlign: 'center',
                            color: '#000000',
                            /* Inside auto layout */
                            flex: 'none',
                            order: 0,
                            flexGrow: 0
                          }}>
                            {formatNumber(getStatValue('pokestops_visited'))}
                          </div>
                          <div style={{
                            /* Pokéstops Visited */
                            width: '96px',
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
                            flexGrow: 0
                          }}>
                            Pokéstops Visited
                          </div>
                        </div>

                        {/* Frame 543 - Total XP */}
                        <div style={{
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
                          <div style={{
                            /* 33,628,973 */
                            width: '97px',
                            height: '27px',
                            fontFamily: 'Poppins',
                            fontStyle: 'normal',
                            fontWeight: 600,
                            fontSize: '18px',
                            lineHeight: '27px',
                            textAlign: 'center',
                            color: '#000000',
                            /* Inside auto layout */
                            flex: 'none',
                            order: 0,
                            flexGrow: 0
                          }}>
                            {formatNumber(getStatValue('total_xp'))}
                          </div>
                          <div style={{
                            /* Total XP */
                            width: '44px',
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
                            flexGrow: 0
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
                    marginTop: '24px',
                    /* Inside auto layout */
                    flex: 'none',
                    order: 3,
                    alignSelf: 'stretch',
                    flexGrow: 0
                  }}>
                    {/* Performance Overview Heading */}
                    <div style={{
                      /* Performance Overview */
                      width: '186px',
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
                      flexGrow: 0
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
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                          {chartLoading ? (
                            <div className="flex items-center justify-center h-64">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
                              <p className="text-gray-600 ml-4">Loading chart...</p>
                            </div>
                          ) : (
                      <RadarChart 
                        profile={profile} 
                        isPaidUser={userType === "upgraded"} 
                        showHeader={false}
                      />
                          )}
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
                        gap: '8px',
                        width: '320.4px',
                        height: '48px',
                        background: '#DC2627',
                        borderRadius: '8px',
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

                  {/* Frame 599 - ShareablesHub Container */}
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
                    
                    /* Inside auto layout */
                    flex: 'none',
                    order: 4,
                    flexGrow: 0
                  }}>
                    <ShareablesHub />
                  </div>


                </div>
              ) : (
                /* Desktop Layout - Keep existing */
                <>
                  {statsLoading ? (
                    <div className="bg-white rounded-lg p-6">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
                      <p className="text-center text-gray-600">Loading stats...</p>
                    </div>
                  ) : (
                  <GrindStats 
                    isMobile={isMobile} 
                    viewMode={viewMode} 
                    userType={userType} 
                    profile={profile}
                  />
                  )}
              
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
                  textAlign: 'left'
                }}>
                  Performance Overview
                </span>
              </div>

              {/* 8px gap before RadarChart */}
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
                  background: 'rgba(0, 0, 0, 0.02)',
                  boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                  borderRadius: '8px',
                  margin: '0 auto',
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
                  }}
                >
                  {chartLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mb-4"></div>
                      <p className="text-gray-600 ml-4">Loading chart...</p>
                    </div>
                  ) : (
                  <RadarChart 
                    profile={profile} 
                    isPaidUser={userType === "upgraded"} 
                    showHeader={false}
                  />
                  )}
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
                    gap: '8px',
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
      </main>

      {showMobileFooter && <MobileFooter currentPage="profile" />}

      {/* Export Card Modal */}
      <ExportCardModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        profile={profile}
        isPaidUser={userType === "upgraded"}
      />
    </div>
  )
}
