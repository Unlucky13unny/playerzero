import { PlayerHeader } from "../layout/PlayerHeader"
import { ProfileInfo } from "../profile/ProfileInfo"
import { GrindStats } from "./GrindStats"
import { ShareablesHub } from "../shareables/ShareablesHub"
import { MobileFooter } from "../layout/MobileFooter"
import { RadarChart } from "./RadarChart"
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
      let statsResult

      switch (timePeriod) {
        case 'weekly':
          try {
            statsResult = await dashboardService.calculateWeeklyGrindStats(user.id)
            console.log('Weekly stats loaded:', statsResult)
          } catch (weeklyError) {
            console.warn('Weekly stats calculation failed, using fallback:', weeklyError)
            statsResult = null
          }
          break
        case 'monthly':
          try {
            statsResult = await dashboardService.calculateMonthlyGrindStats(user.id)
            console.log('Monthly stats loaded:', statsResult)
          } catch (monthlyError) {
            console.warn('Monthly stats calculation failed, using fallback:', monthlyError)
            statsResult = null
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
    // Clear filtered stats to prevent showing stale data while loading
    setFilteredStats(null)
  }

  const formatNumber = (num: number | null | undefined) => {
    if (!num || num === 0) return '0'
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return Math.round(num).toString()
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
      <div className={showHeader ? " bg-gray-50" : "bg-gray-50"}>
        {showHeader && headerProps && (
          <PlayerHeader
            viewMode={viewMode}
            userType={userType}
            showProfileButton={isMobile ? false : headerProps.showProfileButton}
            showLeaderboardButton={isMobile ? false : headerProps.showLeaderboardButton}
          />
        )}
        <main 
          className="fixed inset-0 flex items-center justify-center bg-gray-50"
          style={{
            top: showMobileFooter ? '0' : '0',
            bottom: showMobileFooter ? '80px' : '0',
            left: '0',
            right: '0',
            zIndex: 10
          }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your profile...</p>
          </div>
        </main>
        {showMobileFooter && <MobileFooter currentPage="profile" />}
      </div>
    )
  }

  return (
    <div className={showHeader ? "min-h-screen bg-gray-50" : "bg-gray-50"}>
      {showHeader && headerProps && (
        <PlayerHeader
          viewMode={viewMode}
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
            maxWidth: '1400px',
            margin: '0 auto',
            overflow: 'hidden',
          }}
        >
          <div 
            className={isMobile ? "space-y-6" : "flex gap-8"}
            style={{
              width: '100%',
            }}
          >
            {/* Left Sidebar - Desktop only */}
            {!isMobile && (
              <div className="w-80 flex-shrink-0 space-y-6">
                <ProfileInfo viewMode={viewMode} userType={userType} profile={profile} />

                <div className="bg-white rounded-lg p-6" style={{ position: 'relative', minHeight: '400px' }}>
                  <div className="flex gap-4 mb-6">
                    <button 
                      onClick={() => handleTimePeriodChange('weekly')}
                      className={`text-sm font-medium transition-colors ${
                        timePeriod === 'weekly' ? 'text-red-500' : 'text-gray-900 hover:text-red-500'
                      }`}
                    >
                      Weekly
                    </button>
                    <button 
                      onClick={() => handleTimePeriodChange('monthly')}
                      className={`text-sm font-medium transition-colors ${
                        timePeriod === 'monthly' ? 'text-red-500' : 'text-gray-900 hover:text-red-500'
                      }`}
                    >
                      Monthly
                    </button>
                    <button 
                      onClick={() => handleTimePeriodChange('alltime')}
                      className={`text-sm font-medium transition-colors ${
                        timePeriod === 'alltime' ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      All time
                    </button>
                  </div>

                  <div 
                    style={{
                      /* Auto layout specifications */
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '0px',
                      gap: '1px',
                      position: 'absolute',
                      width: '200px',
                      height: '200px',
                      top: '50px',
                    }}
                  >
                    {/* Frame 590 - Distance Walked */}
                    <div 
                      style={{
                        /* Frame 590 specifications */
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: '20px 40px',
                        gap: '10px',
                        width: '300px',
                        height: '65px',
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
                          /* Frame 515 specifications */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '0px',
                          gap: '8px',
                          width: '300px',
                          height: '65px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <div className="text-2xl font-bold text-black">
                          {formatDistance(getStatValue('distance_walked'))} km
                        </div>
                        <div className="text-sm text-black">Distance Walked</div>
                      </div>
                    </div>

                    {/* Frame 590 - Pokémon Caught */}
                    <div 
                      style={{
                        /* Frame 590 specifications */
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: '20px 40px',
                        gap: '10px',
                        width: '300px',
                        height: '65px',
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
                          /* Frame 515 specifications */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '0px',
                          gap: '8px',
                          width: '300px',
                          height: '65px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <div className="text-2xl font-bold text-black">{formatNumber(getStatValue('pokemon_caught'))}</div>
                        <div className="text-sm text-black">Pokémon Caught</div>
                      </div>
                    </div>

                    {/* Frame 590 - Pokéstops Visited */}
                    <div 
                      style={{
                        /* Frame 590 specifications */
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: '20px 40px',
                        gap: '10px',
                        width: '300px',
                        height: '65px',
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
                          /* Frame 515 specifications */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '0px',
                          gap: '8px',
                          width: '300px',
                          height: '65px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <div className="text-2xl font-bold text-black">{formatNumber(getStatValue('pokestops_visited'))}</div>
                        <div className="text-sm text-black">Pokéstops Visited</div>
                      </div>
                    </div>

                    {/* Frame 590 - Total XP */}
                    <div 
                      style={{
                        /* Frame 590 specifications */
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        padding: '20px 40px',
                        gap: '10px',
                        width: '300px',
                        height: '65px',
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
                          /* Frame 515 specifications */
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          padding: '0px',
                          gap: '8px',
                          width: '300px',
                          height: '65px',
                          /* Inside auto layout */
                          flex: 'none',
                          order: 0,
                          alignSelf: 'stretch',
                          flexGrow: 0,
                        }}
                      >
                        <div className="text-2xl font-bold text-black">{formatNumber(getStatValue('total_xp'))}</div>
                        <div className="text-sm text-black">Total XP</div>
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
              {/* Mobile Layout - New Organization */}
              {isMobile ? (
                <div className="space-y-6">
                  {/* 1. Profile Info */}
                  <ProfileInfo viewMode={viewMode} userType={userType} profile={profile} />

                  {/* 2. Grind Stats */}
                  <GrindStats 
                    isMobile={isMobile} 
                    viewMode={viewMode} 
                    userType={userType} 
                    profile={profile}
                  />

                  {/* 3. Time Period Controls + Upload Card Button */}
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex gap-4 mb-6 flex-wrap">
                      <button 
                        onClick={() => handleTimePeriodChange('weekly')}
                        className={`text-sm font-medium transition-colors ${
                          timePeriod === 'weekly' ? 'text-red-500' : 'text-gray-900 hover:text-red-500'
                        }`}
                      >
                        Weekly
                      </button>
                      <button 
                        onClick={() => handleTimePeriodChange('monthly')}
                        className={`text-sm font-medium transition-colors ${
                          timePeriod === 'monthly' ? 'text-red-500' : 'text-gray-900 hover:text-red-500'
                        }`}
                      >
                        Monthly
                      </button>
                      <button 
                        onClick={() => handleTimePeriodChange('alltime')}
                        className={`text-sm font-medium transition-colors ${
                          timePeriod === 'alltime' ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        All time
                      </button>
                      {/* Upload Card Icon */}
                      <button 
                        className="ml-auto p-2 hover:bg-gray-100 rounded-md transition-colors"
                        onClick={() => {
                          // TODO: Implement upload card functionality
                          console.log('Upload card clicked')
                        }}
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-black">
                          {formatDistance(getStatValue('distance_walked'))} km
                        </div>
                        <div className="text-xs text-gray-600">Distance Walked</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-black">{formatNumber(getStatValue('pokemon_caught'))}</div>
                        <div className="text-xs text-gray-600">Pokémon Caught</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-black">{formatNumber(getStatValue('pokestops_visited'))}</div>
                        <div className="text-xs text-gray-600">Pokéstops Visited</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-lg font-bold text-black">{formatNumber(getStatValue('total_xp'))}</div>
                        <div className="text-xs text-gray-600">Total XP</div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Radar Chart */}
                  <div 
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '20px',
                      width: '100%',
                      height: '400px',
                      background: 'rgba(0, 0, 0, 0.02)',
                      boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <RadarChart 
                        profile={profile} 
                        isPaidUser={userType === "upgraded"} 
                        showHeader={false}
                      />
                    </div>
                  </div>

                  {/* 5. Upgrade Button (if needed) */}
                  {viewMode === "own" && userType === "trial" && (
                    <div 
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '12px',
                        width: '100%',
                        background: '#DC2627',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                      }}
                      onClick={() => navigate('/upgrade')}
                    >
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                        Upgrade to Premium
                      </span>
                    </div>
                  )}

                  {/* 6. Shareables Section */}
                  <div style={{ position: 'relative', minHeight: '300px' }}>
                    <ShareablesHub />
                  </div>
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
              
              {/* Radar Chart Container - Frame 458 */}
              <div 
                style={{
                  /* Frame 458 specifications */
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '0px 0px 10px',
                  position: 'relative',
                  width: isMobile ? '100%' : '838px',
                  maxWidth: '838px',
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
                  <RadarChart 
                    profile={profile} 
                    isPaidUser={userType === "upgraded"} 
                    showHeader={false}
                  />
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
    </div>
  )
}
