"use client"

import { useState, useEffect, memo } from "react"
import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts"
import { type ProfileWithMetadata } from '../../services/profileService'
import { dashboardService, type StatBounds } from '../../services/dashboardService'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { useMobile } from '../../hooks/useMobile'

export type FilterType = "you" | "country" | "team" | "global" | null

interface PerformanceRadarChartProps {
  profile: ProfileWithMetadata | null
  isPaidUser: boolean
  showHeader?: boolean
}

// Dynamic filter configuration based on user's actual country and team
const getFilterConfig = (profile: ProfileWithMetadata | null) => {
  const countryName = profile?.country || 'Unknown'
  const teamName = profile?.team_color || 'Unknown'
  
  return {
    you: { key: "You", color: "#DC2627", fillColor: "rgba(220, 38, 39, 0.3)", name: "You" },
    country: {
      key: "Country",
      color: "#848282",
      fillColor: "rgba(132, 130, 130, 0.3)",
      name: countryName,
    },
    team: { key: "Team", color: "#353535", fillColor: "rgba(53, 53, 53, 0.5)", name: teamName.charAt(0).toUpperCase() + teamName.slice(1) },
    global: { key: "Global", color: "#000000", fillColor: "transparent", name: "Global" },
  }
}

const getFilterButtons = (profile: ProfileWithMetadata | null) => {
  const countryName = profile?.country || 'Unknown'
  const teamName = profile?.team_color || 'Unknown'
  
  return [
    {
      id: "you" as FilterType,
      label: "You",
      bgColor: "rgba(220, 38, 39, 0.3)",
      borderColor: "#DC2627",
    },
    {
      id: "country" as FilterType,
      label: countryName,
      bgColor: "rgba(132, 130, 130, 0.3)",
      borderColor: "#848282",
    },
    {
      id: "team" as FilterType,
      label: teamName.charAt(0).toUpperCase() + teamName.slice(1),
      bgColor: "rgba(53, 53, 53, 0.5)",
      borderColor: "#353535",
    },
    {
      id: "global" as FilterType,
      label: "Global",
      bgColor: "transparent",
      borderColor: "#000000",
    },
  ]
}

interface FilterButtonsProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  onHoverChange: (filter: FilterType) => void
  profile: ProfileWithMetadata | null
  isMobile: boolean
}

function FilterButtons({ activeFilter, onFilterChange, onHoverChange, profile, isMobile }: FilterButtonsProps) {
  const trialStatus = useTrialStatus()
  const isPremiumUser = trialStatus.isPaidUser
  
  // Get all buttons but filter based on user type
  const allFilterButtons = getFilterButtons(profile)
  const filterButtons = isPremiumUser 
    ? allFilterButtons // Premium users see all 4 buttons
    : allFilterButtons.filter(button => button.id === 'you' || button.id === 'global') // Free trial users see only "You" and "Global"
  
  return (
    <div style={{
      /* Frame 639 */
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: isMobile ? 'space-between' : 'center',
      padding: '0px',
      gap: isMobile ? '8px' : '80px',
      width: isMobile ? '269px' : '450px',
      height: isMobile ? '14px' : '10px',
      /* Inside auto layout */
      flex: 'none',
      order: 1,
      flexGrow: 0,
      flexWrap: 'wrap'
    }}>
      {filterButtons.map((button) => (
        <div
          key={button.id}
          onClick={() => onFilterChange(activeFilter === button.id ? null : button.id)}
          style={{
            /* Frame 635/636/637/638 */
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '0px',
            gap: isMobile ? '2.54px' : '4px',
            cursor: 'pointer',
            background: 'transparent',
            border: 'none',
            /* Inside auto layout */
            flex: 'none',
            order: button.id === 'you' ? 0 : button.id === 'country' ? 1 : button.id === 'team' ? 2 : 3,
            flexGrow: 0,
            width: isMobile 
              ? (button.id === 'you' ? '32.49px' : button.id === 'country' ? '58.49px' : button.id === 'team' ? '62.49px' : '46.49px')
              : (button.id === 'you' ? '40px' : button.id === 'country' ? '59px' : button.id === 'team' ? '62px' : '49px'),
            height: isMobile ? '14px' : '10px'
          }}
          onMouseEnter={() => onHoverChange(button.id)}
          onMouseLeave={() => onHoverChange(null)}
        >
          <div
            style={{
              /* Rectangle 18/19 */
              boxSizing: 'border-box',
              width: isMobile ? '13.95px' : '22px',
              height: isMobile ? '6.34px' : '10px',
              background: activeFilter === button.id ? button.bgColor : (activeFilter === null ? button.bgColor : 'rgba(200, 200, 200, 0.2)'),
              border: isMobile ? `0.63424px solid ${activeFilter === button.id ? button.borderColor : (activeFilter === null ? button.borderColor : '#CCCCCC')}` : `1px solid ${activeFilter === button.id ? button.borderColor : (activeFilter === null ? button.borderColor : '#CCCCCC')}`,
              /* Inside auto layout */
              flex: 'none',
              order: 0,
              flexGrow: 0
            }}
          />
          <span
            style={{
              /* Your stats / Average Player from your County / Average Player Overall / Average Player from your Team */
              width: isMobile 
                ? (button.id === 'you' ? '16px' : button.id === 'country' ? '42px' : button.id === 'team' ? '46px' : '30px')
                : (button.id === 'you' ? '14px' : button.id === 'country' ? '33px' : button.id === 'team' ? '36px' : '23px'),
              height: isMobile ? '14px' : '10px',
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: isMobile ? (button.id === 'you' ? '8px' : '9px') : '6.93307px',
              lineHeight: isMobile ? (button.id === 'you' ? '12px' : '14px') : '10px',
              color: activeFilter === button.id ? button.borderColor : (activeFilter === null ? '#000000' : '#999999'),
              whiteSpace: 'nowrap',
              /* Inside auto layout */
              flex: 'none',
              order: 1,
              flexGrow: 0
            }}
          >
            {button.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// Memoize the radar chart component to prevent unnecessary re-renders
// Add CSS styles to fix chart rendering
const chartStyles = `
  .radar-chart-outer-container {
    transition: none !important;
  }
  
  .radar-chart-inner-container {
    transition: none !important;
  }
  
  .recharts-wrapper {
    position: static !important;
    transform: none !important;
    transition: none !important;
    animation: none !important;
  }
  
  .recharts-surface {
    transform: none !important;
    transition: none !important;
    animation: none !important;
    overflow: visible !important;
  }
`;

export const PerformanceRadarChart = memo(({ profile, showHeader = true }: PerformanceRadarChartProps) => {
  const trialStatus = useTrialStatus()
  const isMobile = useMobile()
  const [activeFilter, setActiveFilter] = useState<FilterType>(null)
  const [hoveredFilter, setHoveredFilter] = useState<FilterType>(null)
  const [chartData, setChartData] = useState<{
    communityAverages: any;
    countryAverages: any;
    teamAverages: any;
    statBounds: StatBounds | null;
    allUserStats: any;
  }>({
    communityAverages: null,
    countryAverages: null,
    teamAverages: null,
    statBounds: null,
    allUserStats: null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Always show radar chart, but with different styling for free vs premium users
  const isPremiumUser = trialStatus.isPaidUser

  // Use a single effect for data loading with proper cleanup
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    const loadData = async () => {
      try {
        if (isPremiumUser && profile) {
          // Premium users get enhanced data with country and team averages
          const [averages, countryAvg, teamAvg, bounds, allStats] = await Promise.all([
            dashboardService.getAverageStats(),
            dashboardService.getCountryAverageStats(profile.country || 'US'),
            dashboardService.getTeamAverageStats(profile.team_color || 'valor'),
            dashboardService.getPaidUserStatBounds(),
            dashboardService.getAllUserStats()
          ])
          
          // Only update state if component is still mounted
          if (isMounted) {
            setChartData({
              communityAverages: averages,
              countryAverages: countryAvg,
              teamAverages: teamAvg,
              statBounds: bounds,
              allUserStats: allStats
            });
            setLoading(false);
          }
        } else {
          // Free users get basic comparison only
          const [averages, bounds, allStats] = await Promise.all([
            dashboardService.getAverageStats(),
            dashboardService.getPaidUserStatBounds(),
            dashboardService.getAllUserStats()
          ])
          
          // Only update state if component is still mounted
          if (isMounted) {
            setChartData({
              communityAverages: averages,
              countryAverages: null,
              teamAverages: null,
              statBounds: bounds,
              allUserStats: allStats
            });
            setLoading(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load data')
          setLoading(false);
          console.error('Error loading data:', err)
        }
      }
    }

    loadData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [isPremiumUser, profile?.country, profile?.team_color, profile?.id])

  // Destructure chart data for easier access
  const { communityAverages, countryAverages, teamAverages, statBounds, allUserStats } = chartData;

  // Percentile-based normalization for better visual representation
  const normalizeStats = (value: number, stat: string) => {
    if (!allUserStats || !allUserStats.length) return 0
    
    // Get all values for this stat and sort them
    const allValues = allUserStats
      .map((user: any) => user[stat] || 0)
      .filter((val: number) => val > 0) // Remove zeros for better distribution
      .sort((a: number, b: number) => a - b)
    
    if (allValues.length === 0) return 0
    
    // Calculate 5th and 95th percentiles for robust scaling
    const p5Index = Math.floor(allValues.length * 0.05)
    const p95Index = Math.floor(allValues.length * 0.95)
    const p5 = allValues[p5Index] || allValues[0]
    const p95 = allValues[p95Index] || allValues[allValues.length - 1]
    
    // Handle edge case where p5 = p95
    if (p5 === p95) return 50
    
    // Scale value between 5th and 95th percentiles
    let normalized = ((value - p5) / (p95 - p5)) * 100
    
    // Soft clamp to 0-100 range
    normalized = Math.max(0, Math.min(100, normalized))
    
    return normalized
  }

  if (!profile || loading || !communityAverages || !statBounds || !allUserStats || (isPremiumUser && (!countryAverages || !teamAverages))) {
    return (
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: isMobile ? '310px' : '487px',
          background: isMobile ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
          borderRadius: isMobile ? '0px' : '8px',
        }}
      >
        <div 
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #dc2626',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }}
        ></div>
        <p style={{ color: '#000000', fontSize: '14px', textAlign: 'center' }}>Loading performance data...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        color: '#dc2626',
        fontSize: '14px'
      }}>
        ❌ {error}
      </div>
    )
  }

  // Create performance data for the radar chart
  const performanceData = [
    {
      metric: "XP",
      You: normalizeStats(profile.total_xp || 0, 'total_xp'),
      Country: isPremiumUser && countryAverages ? normalizeStats(countryAverages.total_xp, 'total_xp') : 0,
      Team: isPremiumUser && teamAverages ? normalizeStats(teamAverages.total_xp, 'total_xp') : 0,
      Global: normalizeStats(communityAverages.total_xp, 'total_xp'),
    },
    {
      metric: "Caught",
      You: normalizeStats(profile.pokemon_caught || 0, 'pokemon_caught'),
      Country: isPremiumUser && countryAverages ? normalizeStats(countryAverages.pokemon_caught, 'pokemon_caught') : 0,
      Team: isPremiumUser && teamAverages ? normalizeStats(teamAverages.pokemon_caught, 'pokemon_caught') : 0,
      Global: normalizeStats(communityAverages.pokemon_caught, 'pokemon_caught'),
    },
    {
      metric: "Stops",
      You: normalizeStats(profile.pokestops_visited || 0, 'pokestops_visited'),
      Country: isPremiumUser && countryAverages ? normalizeStats(countryAverages.pokestops_visited, 'pokestops_visited') : 0,
      Team: isPremiumUser && teamAverages ? normalizeStats(teamAverages.pokestops_visited, 'pokestops_visited') : 0,
      Global: normalizeStats(communityAverages.pokestops_visited, 'pokestops_visited'),
    },
    {
      metric: "Dex",
      You: normalizeStats(profile.unique_pokedex_entries || 0, 'unique_pokedex_entries'),
      Country: isPremiumUser && countryAverages ? normalizeStats(countryAverages.unique_pokedex_entries, 'unique_pokedex_entries') : 0,
      Team: isPremiumUser && teamAverages ? normalizeStats(teamAverages.unique_pokedex_entries, 'unique_pokedex_entries') : 0,
      Global: normalizeStats(communityAverages.unique_pokedex_entries, 'unique_pokedex_entries'),
    },
    {
      metric: "Distance",
      You: normalizeStats(profile.distance_walked || 0, 'distance_walked'),
      Country: isPremiumUser && countryAverages ? normalizeStats(countryAverages.distance_walked, 'distance_walked') : 0,
      Team: isPremiumUser && teamAverages ? normalizeStats(teamAverages.distance_walked, 'distance_walked') : 0,
      Global: normalizeStats(communityAverages.distance_walked, 'distance_walked'),
    },
  ]

  // Create actual values for tooltip/reference
  const actualValues = {
    XP: {
      You: profile.total_xp || 0,
      Global: communityAverages.total_xp,
      Country: isPremiumUser && countryAverages ? countryAverages.total_xp : 0,
      Team: isPremiumUser && teamAverages ? teamAverages.total_xp : 0,
    },
    Caught: {
      You: profile.pokemon_caught || 0,
      Global: communityAverages.pokemon_caught,
      Country: isPremiumUser && countryAverages ? countryAverages.pokemon_caught : 0,
      Team: isPremiumUser && teamAverages ? teamAverages.pokemon_caught : 0,
    },
    Stops: {
      You: profile.pokestops_visited || 0,
      Global: communityAverages.pokestops_visited,
      Country: isPremiumUser && countryAverages ? countryAverages.pokestops_visited : 0,
      Team: isPremiumUser && teamAverages ? teamAverages.pokestops_visited : 0,
    },
    Dex: {
      You: profile.unique_pokedex_entries || 0,
      Global: communityAverages.unique_pokedex_entries,
      Country: isPremiumUser && countryAverages ? countryAverages.unique_pokedex_entries : 0,
      Team: isPremiumUser && teamAverages ? teamAverages.unique_pokedex_entries : 0,
    },
    Distance: {
      You: profile.distance_walked || 0,
      Global: communityAverages.distance_walked,
      Country: isPremiumUser && countryAverages ? countryAverages.distance_walked : 0,
      Team: isPremiumUser && teamAverages ? teamAverages.distance_walked : 0,
    }
  }

  // Debug logging to understand the data
  console.log('🔍 Radar Chart Analysis:', {
    'Raw Values': actualValues,
    'Normalized Values': performanceData.map(item => ({
      metric: item.metric,
      You: `${item.You.toFixed(1)}% (${actualValues[item.metric as keyof typeof actualValues].You})`,
      Global: `${item.Global.toFixed(1)}% (${actualValues[item.metric as keyof typeof actualValues].Global})`,
    })),
    'Stat Bounds': statBounds
  })

  const getRadarElements = () => {
    const filterConfig = getFilterConfig(profile)
    
    // Use hoveredFilter if available, otherwise use activeFilter
    const effectiveFilter = hoveredFilter !== null ? hoveredFilter : activeFilter
    
    // For premium users: show all 4 series with dominant filtering
    if (isPremiumUser) {
      return Object.entries(filterConfig).map(([key, config]) => {
        // If no filter is active or hovered, show all 4 series with normal opacity
        if (effectiveFilter === null) {
          const strokeWidth = config.key === "Global" ? 3 : 1.5
          const fillOpacity = config.key === "Global" ? 0.1 : 
                            config.key === "Team" ? 0.65 : 
                            config.key === "You" ? 0.85 : 0.5
          
          return (
            <Radar
              key={config.key}
              name={config.name}
              dataKey={config.key}
              stroke={config.color}
              fill={config.color}
              fillOpacity={fillOpacity}
              strokeWidth={strokeWidth}
              strokeOpacity={1}
              dot={false}
              activeDot={false}
              animationDuration={0}
              animationBegin={0}
              isAnimationActive={false}
              onMouseEnter={() => setHoveredFilter(key as FilterType)}
              onMouseLeave={() => setHoveredFilter(null)}
            />
          )
        }
        
        // If a filter is active or hovered, show ALL series but highlight the selected one
        const isSelected = effectiveFilter === key
        
        if (isSelected) {
          // Make selected series bold and prominent - fill matches border color
          const fillOpacity = config.key === "Global" ? 0.2 : 0.9
          
          return (
            <Radar
              key={config.key}
              name={config.name}
              dataKey={config.key}
              stroke={config.color}
              fill={config.color}
              fillOpacity={fillOpacity}
              strokeWidth={4}
              strokeOpacity={1}
              dot={false}
              activeDot={false}
              animationDuration={0}
              animationBegin={0}
              isAnimationActive={false}
              onMouseEnter={() => setHoveredFilter(key as FilterType)}
              onMouseLeave={() => setHoveredFilter(null)}
            />
          )
        } else {
          // Show other series with normal visibility but less prominent - fill matches border color
          const fillOpacity = config.key === "Global" ? 0.05 : 0.3
          
          return (
            <Radar
              key={config.key}
              name={config.name}
              dataKey={config.key}
              stroke={config.color}
              fill={config.color}
              fillOpacity={fillOpacity}
              strokeWidth={config.key === "Global" ? 2 : 1.5}
              strokeOpacity={0.6}
              dot={false}
              activeDot={false}
              animationDuration={0}
              animationBegin={0}
              isAnimationActive={false}
              onMouseEnter={() => setHoveredFilter(key as FilterType)}
              onMouseLeave={() => setHoveredFilter(null)}
            />
          )
        }
      })
    }
    
    // For free trial users: show only "You" and "Global" (community logic)
    else {
      if (effectiveFilter === null) {
        // Show both "You" and "Global" with normal styling
        return ['you', 'global'].map((key) => {
          const config = filterConfig[key as keyof typeof filterConfig]
          if (!config) return null
          
          const strokeWidth = config.key === "Global" ? 3 : 1.5
          const fillOpacity = config.key === "Global" ? 0.1 : 0.85
          
          return (
            <Radar
              key={config.key}
              name={config.name}
              dataKey={config.key}
              stroke={config.color}
              fill={config.color}
              fillOpacity={fillOpacity}
              strokeWidth={strokeWidth}
              strokeOpacity={1}
              dot={false}
              activeDot={false}
              animationDuration={0}
              animationBegin={0}
              isAnimationActive={false}
              onMouseEnter={() => setHoveredFilter(key as FilterType)}
              onMouseLeave={() => setHoveredFilter(null)}
            />
          )
        }).filter(Boolean)
      } else {
        // Show both but highlight selected one
        return ['you', 'global'].map((key) => {
          const config = filterConfig[key as keyof typeof filterConfig]
          if (!config) return null
          
          const isSelected = effectiveFilter === key
          
          if (isSelected) {
            // Make selected series bold and prominent - fill matches border color
            const fillOpacity = config.key === "Global" ? 0.2 : 0.9
            
            return (
              <Radar
                key={config.key}
                name={config.name}
                dataKey={config.key}
                stroke={config.color}
                fill={config.color}
                fillOpacity={fillOpacity}
                strokeWidth={config.key === "Global" ? 4 : 4}
                strokeOpacity={1}
                dot={false}
                activeDot={false}
                animationDuration={0}
                animationBegin={0}
                isAnimationActive={false}
                onMouseEnter={() => setHoveredFilter(key as FilterType)}
                onMouseLeave={() => setHoveredFilter(null)}
              />
            )
          } else {
            // Show other series with normal visibility but less prominent - fill matches border color
            const fillOpacity = config.key === "Global" ? 0.05 : 0.3
            
            return (
              <Radar
                key={config.key}
                name={config.name}
                dataKey={config.key}
                stroke={config.color}
                fill={config.color}
                fillOpacity={fillOpacity}
                strokeWidth={config.key === "Global" ? 2 : 1.5}
                strokeOpacity={0.6}
                dot={false}
                activeDot={false}
                animationDuration={0}
                animationBegin={0}
                isAnimationActive={false}
                onMouseEnter={() => setHoveredFilter(key as FilterType)}
                onMouseLeave={() => setHoveredFilter(null)}
              />
            )
          }
        }).filter(Boolean)
      }
    }
  }

  return (
    <>
      <style>{chartStyles}</style>
      <div style={{
        width: '100%',
        maxWidth: '100%',
        background: '#F9FAFB',
        borderRadius: '8px',
        border: 'none',
        padding: isMobile ? '16px' : '24px',
        boxSizing: 'border-box'
      }}>
      {showHeader && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <h2 style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: 600,
            color: '#000000',
            margin: 0,
            fontFamily: 'Poppins, sans-serif'
          }}>
            Performance Overview
          </h2>
          <div style={{
            background: 'rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(2px)',
            padding: '8px 16px',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span
              style={{
                color: '#DC2627',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontFamily: 'Poppins, sans-serif'
              }}
            >
              5 DAYS LEFT
            </span>
            <div style={{
              fontSize: '10px',
              color: '#000000',
              textDecoration: 'underline',
              fontFamily: 'Poppins, sans-serif'
            }}>
              Learn more
            </div>
          </div>
        </div>
      )}
      
      <div 
        className="radar-chart-outer-container"
        style={{
          width: isMobile ? 300 : 500,
          minWidth: isMobile ? 300 : 500,
          maxWidth: isMobile ? 300 : 500,
          height: isMobile ? 300 : 384,
          minHeight: isMobile ? 300 : 384,
          maxHeight: isMobile ? 300 : 384,
          marginBottom: '24px',
          marginLeft: 'auto',
          marginRight: 'auto',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          flexGrow: 0,
          boxSizing: 'border-box',
          transition: 'none',
          transform: 'translateZ(0)', // Force GPU acceleration to prevent layout shift
          willChange: 'contents', // Hint browser that only content will change, not dimensions
      }}>
        {loading ? (
          <div 
            className="loading-skeleton-container"
            style={{
              width: isMobile ? 300 : 500,
              minWidth: isMobile ? 300 : 500,
              maxWidth: isMobile ? 300 : 500,
              height: isMobile ? 300 : 384,
              minHeight: isMobile ? 300 : 384,
              maxHeight: isMobile ? 300 : 384,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            {/* Skeleton loader that mimics the radar chart shape */}
            <svg
              viewBox="0 0 500 384"
              style={{
                width: '100%',
                height: '100%',
                opacity: 0.15,
              }}
            >
              {/* Pentagon shape skeleton */}
              <polygon
                points="250,60 420,160 370,340 130,340 80,160"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              {/* Inner pentagons */}
              <polygon
                points="250,120 340,180 315,270 185,270 160,180"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="3,3"
              />
              <polygon
                points="250,180 260,200 255,220 245,220 240,200"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="1"
              />
              {/* Radial lines */}
              <line x1="250" y1="192" x2="250" y2="60" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="250" y1="192" x2="420" y2="160" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="250" y1="192" x2="370" y2="340" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="250" y1="192" x2="130" y2="340" stroke="#f3f4f6" strokeWidth="1" />
              <line x1="250" y1="192" x2="80" y2="160" stroke="#f3f4f6" strokeWidth="1" />
            </svg>
            {/* Subtle loading indicator */}
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                fontSize: '12px',
                color: '#9ca3af',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 400,
              }}
            >
              Loading...
            </div>
          </div>
        ) : (
          <div 
            className="radar-chart-inner-container"
            style={{
              width: isMobile ? 300 : 500,
              minWidth: isMobile ? 300 : 500,
              maxWidth: isMobile ? 300 : 500,
              height: isMobile ? 300 : 384,
              minHeight: isMobile ? 300 : 384,
              maxHeight: isMobile ? 300 : 384,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              flexGrow: 0,
              boxSizing: 'border-box',
              transition: 'none',
            }}>
            <ResponsiveContainer width="100%" height="100%" debounce={0}>
              <RechartsRadarChart 
                data={performanceData} 
                margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
                style={{ transition: 'none' }}
              >
                <PolarGrid stroke="#A5B7C6" strokeDasharray="3 3" radialLines={true} />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{
                    fontSize: isMobile ? 10 : 11.559,
                    fill: "#000000",
                    fontFamily: "Poppins, sans-serif",
                    fontWeight: 600,
                  }}
                />
                {getRadarElements()}
              </RechartsRadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <FilterButtons activeFilter={activeFilter} onFilterChange={setActiveFilter} onHoverChange={setHoveredFilter} profile={profile} isMobile={isMobile} />
    </div>
    </>
  )
})