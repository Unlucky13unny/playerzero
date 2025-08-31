import { Crown } from "../icons/Crown"
import { dashboardService } from "../../services/dashboardService"
import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNavigate } from "react-router-dom"

interface GrindStatsProps {
  isMobile?: boolean
  viewMode?: "public" | "private" | "team" | "own"
  userType?: "trial" | "upgraded"
  profile?: any
}

export function GrindStats({ isMobile = false, viewMode = "public", userType = "trial", profile }: GrindStatsProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [backendStats, setBackendStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const showUpgradeButton = viewMode === "own" && userType === "trial" && !isMobile

  // Load all-time stats from backend when component mounts (ignore time period changes)
  useEffect(() => {
    if (user?.id) {
      loadBackendStats()
    }
  }, [user?.id])

  const loadBackendStats = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      // Always load all-time stats for GrindStats table
      const result = await dashboardService.calculateAllTimeGrindStats(user.id)

      console.log('All-time backend stats loaded for GrindStats:', result)
      setBackendStats(result)
    } catch (error) {
      console.warn('Failed to load all-time backend stats for GrindStats:', error)
      setBackendStats(null)
    } finally {
      setLoading(false)
    }
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
    // Priority 1: Use backend all-time stats if available
    if (backendStats) {
      switch (statType) {
        case 'distance_walked':
          return backendStats.distanceWalked || 0
        case 'pokemon_caught':
          return backendStats.pokemonCaught || 0
        case 'pokestops_visited':
          return backendStats.pokestopsVisited || 0
        case 'total_xp':
          return backendStats.totalXP || 0
        default:
          return 0
      }
    }
    
    // Priority 2: Use profile data as fallback (always all-time totals)
    if (profile && profile[statType]) {
      return profile[statType]
    }

    return 0
  }

  return (
    <div 
      className="bg-white rounded-lg p-6"
      style={{
        width: '100%',
        maxWidth: '1200px',
        position: 'relative',
      }}
    >
      {/* Upgrade Button - Top Right */}
      {showUpgradeButton && (
        <button
          onClick={() => navigate('/upgrade')}
          style={{
            /* Upgrade button specifications */
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0px',
            gap: '8px',
            position: 'absolute',
            width: '130px',
            height: '30px',
            right: '16px',
            top: '10px',
            background: '#DC2627',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
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
            fontSize: '16px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            Upgrade
          </span>
        </button>
      )}

      {/* Grind Stats Title - Left Side */}
      <div
        style={{
          fontFamily: 'Poppins',
          fontStyle: 'normal',
          fontWeight: 600,
          fontSize: '24px',
          lineHeight: '36px',
          color: '#000000',
          marginBottom: isMobile ? '8px' : '10px',
          textAlign: 'left',
        }}
      >
        Grind Stats
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading grind stats...</p>
        </div>
      )}

      {/* Mobile: Single Stats Container */}
      {isMobile ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            width: '100%',
            background: 'rgba(0, 0, 0, 0.02)',
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
            borderRadius: '8px',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {/* Distance Stat */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              flex: '1',
            }}
          >
            <div className="font-bold text-black text-lg">
              {formatDistance(getStatValue('distance_walked'))}
            </div>
            <div className="text-gray-600 text-xs">Km</div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-300 mx-2"></div>

          {/* Pokemon Caught Stat */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              flex: '1',
            }}
          >
            <div className="font-bold text-black text-lg">
              {formatNumber(getStatValue('pokemon_caught'))}
            </div>
            <div className="text-gray-600 text-xs">Caught</div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-300 mx-2"></div>

          {/* Pokestops Stat */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              flex: '1',
            }}
          >
            <div className="font-bold text-black text-lg">
              {formatNumber(getStatValue('pokestops_visited'))}
            </div>
            <div className="text-gray-600 text-xs">Stops</div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-300 mx-2"></div>

          {/* XP Stat */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              flex: '1',
            }}
          >
            <div className="font-bold text-black text-lg">
              {formatNumber(getStatValue('total_xp'))}
            </div>
            <div className="text-gray-600 text-xs">XP</div>
          </div>
        </div>
      ) : (
        /* Web: Separate Stats Containers */
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            width: '100%',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {/* Distance Stat Card */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px',
              minWidth: '180px',
              height: '80px',
              background: 'rgba(0, 0, 0, 0.02)',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
              borderRadius: '8px',
              flex: '1',
            }}
          >
            <div className="font-bold text-black text-2xl">
              {formatDistance(getStatValue('distance_walked'))}
            </div>
            <div className="text-gray-600 text-sm">Km</div>
          </div>

          {/* Pokemon Caught Stat Card */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px',
              minWidth: '180px',
              height: '80px',
              background: 'rgba(0, 0, 0, 0.02)',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
              borderRadius: '8px',
              flex: '1',
            }}
          >
            <div className="font-bold text-black text-2xl">
              {formatNumber(getStatValue('pokemon_caught'))}
            </div>
            <div className="text-gray-600 text-sm">Caught</div>
          </div>

          {/* Pokestops Stat Card */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px',
              minWidth: '180px',
              height: '80px',
              background: 'rgba(0, 0, 0, 0.02)',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
              borderRadius: '8px',
              flex: '1',
            }}
          >
            <div className="font-bold text-black text-2xl">
              {formatNumber(getStatValue('pokestops_visited'))}
            </div>
            <div className="text-gray-600 text-sm">Stops</div>
          </div>

          {/* XP Stat Card */}
          <div 
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px',
              minWidth: '180px',
              height: '80px',
              background: 'rgba(0, 0, 0, 0.02)',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
              borderRadius: '8px',
              flex: '1',
            }}
          >
            <div className="font-bold text-black text-2xl">
              {formatNumber(getStatValue('total_xp'))}
            </div>
            <div className="text-gray-600 text-sm">XP</div>
          </div>
        </div>
      )}
    </div>
  )
}
