import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import { type ProfileWithMetadata } from '../../services/profileService'
import { dashboardService, type StatBounds } from '../../services/dashboardService'
import { useAuth } from '../../contexts/AuthContext'
import { useTrialStatus } from '../../hooks/useTrialStatus'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

interface RadarChartProps {
  profile: ProfileWithMetadata | null
  isPaidUser: boolean // This now represents if the VIEWING user is paid
  showHeader?: boolean // Optional prop to control header visibility
}

export const RadarChart = ({ profile, isPaidUser: _isPaidUser, showHeader = true }: RadarChartProps) => {
  const navigate = useNavigate()
  const { user } = useAuth() // Add this to get current user
  const trialStatus = useTrialStatus() // Add this to get current user's trial status
  const [communityAverages, setCommunityAverages] = useState<any>(null)
  const [countryAverages, setCountryAverages] = useState<any>(null)
  const [teamAverages, setTeamAverages] = useState<any>(null)
  const [statBounds, setStatBounds] = useState<StatBounds | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(window.innerWidth <= 360)

  // Always show radar chart, but with different styling for free vs premium users
  const isPremiumUser = trialStatus.isPaidUser

  useEffect(() => {
    const loadData = async () => {
      try {
        if (isPremiumUser && profile) {
          // Premium users get enhanced data with country and team averages
          const [averages, countryAvg, teamAvg, bounds] = await Promise.all([
            dashboardService.getAverageStats(),
            dashboardService.getCountryAverageStats(profile.country || 'US'),
            dashboardService.getTeamAverageStats(profile.team_color || 'valor'),
            dashboardService.getPaidUserStatBounds()
          ])
          setCommunityAverages(averages)
          setCountryAverages(countryAvg)
          setTeamAverages(teamAvg)
          setStatBounds(bounds)
        } else {
          // Free users get basic comparison only
        const [averages, bounds] = await Promise.all([
          dashboardService.getAverageStats(),
          dashboardService.getPaidUserStatBounds()
        ])
        setCommunityAverages(averages)
        setStatBounds(bounds)
        }
      } catch (err) {
        setError('Failed to load data')
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isPremiumUser, profile?.country, profile?.team_color])

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      setIsVerySmallScreen(window.innerWidth <= 360)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleUpgradeClick = () => {
    navigate('/upgrade')
  }

  if (!profile || loading || !communityAverages || !statBounds || (isPremiumUser && (!countryAverages || !teamAverages))) {
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
          boxShadow: isMobile ? 'none' : '0px 4px 4px rgba(0, 0, 0, 0.25)',
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
      <div className="radar-chart-error">
        <p>❌ {error}</p>
      </div>
    )
  }

  // Normalize stats based on min/max values from paid users
  const normalizeStats = (value: number, stat: keyof StatBounds) => {
    const { min, max } = statBounds[stat]
    // Clamp the value between min and max, then normalize to 0-100
    const clampedValue = Math.max(min, Math.min(max, value))
    return ((clampedValue - min) / (max - min)) * 100
  }

  // Create shorter labels for mobile to prevent text wrapping issues
  const labels = isMobile 
    ? isVerySmallScreen
      ? [
          'Pokémon\nCaught',
          'Stops', 
          'Distance\nWalked',
          'XP',
          'Dex'
        ]
      : [
          'Pokémon\nCaught',
          'PokéStops', 
          'Distance\nWalked',
          'Total XP',
          'Pokédex'
        ]
    : [
        'Pokémon Caught',
        'PokéStops Visited',
        'Distance Walked (km)',
        'Total XP',
        'Pokédex Entries'
      ];

  // Create datasets based on user type
  const createDatasets = () => {
    const userStatsData = [
          normalizeStats(profile.pokemon_caught || 0, 'pokemon_caught'),
          normalizeStats(profile.pokestops_visited || 0, 'pokestops_visited'),
          normalizeStats(profile.distance_walked || 0, 'distance_walked'),
          normalizeStats(profile.total_xp || 0, 'total_xp'),
          normalizeStats(profile.unique_pokedex_entries || 0, 'unique_pokedex_entries')
    ]

    const communityStatsData = [
          normalizeStats(communityAverages.pokemon_caught, 'pokemon_caught'),
          normalizeStats(communityAverages.pokestops_visited, 'pokestops_visited'),
          normalizeStats(communityAverages.distance_walked, 'distance_walked'),
          normalizeStats(communityAverages.total_xp, 'total_xp'),
          normalizeStats(communityAverages.unique_pokedex_entries, 'unique_pokedex_entries')
    ]

    const countryStatsData = isPremiumUser && countryAverages ? [
          normalizeStats(countryAverages.pokemon_caught, 'pokemon_caught'),
          normalizeStats(countryAverages.pokestops_visited, 'pokestops_visited'),
          normalizeStats(countryAverages.distance_walked, 'distance_walked'),
          normalizeStats(countryAverages.total_xp, 'total_xp'),
          normalizeStats(countryAverages.unique_pokedex_entries, 'unique_pokedex_entries')
    ] : []

    const teamStatsData = isPremiumUser && teamAverages ? [
          normalizeStats(teamAverages.pokemon_caught, 'pokemon_caught'),
          normalizeStats(teamAverages.pokestops_visited, 'pokestops_visited'),
          normalizeStats(teamAverages.distance_walked, 'distance_walked'),
          normalizeStats(teamAverages.total_xp, 'total_xp'),
          normalizeStats(teamAverages.unique_pokedex_entries, 'unique_pokedex_entries')
    ] : []

    if (isPremiumUser) {
      // Figma design: 4 overlapping data areas with specific colors
      return [
        // 1. Your stats - Red fill with ~60% opacity
        {
          label: 'Your stats',
          data: userStatsData,
          backgroundColor: 'rgba(230, 57, 70, 0.6)', // #E63946 at 0.6 opacity
          borderColor: '#E63946',
          borderWidth: 2,
          pointBackgroundColor: '#E63946',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3 // Smooth, rounded polygon
        },
        // 2. Average Player from your Country - Orange fill with ~50% opacity
        {
          label: 'Average Player from your Country',
          data: countryStatsData,
          backgroundColor: 'rgba(255, 183, 3, 0.5)', // #FFB703 at 0.5 opacity
          borderColor: '#FFB703',
          borderWidth: 2,
          pointBackgroundColor: '#FFB703',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3 // Smooth, rounded polygon
        },
        // 3. Average Player from your Team - Sky blue fill with ~50% opacity
        {
          label: 'Average Player from your Team',
          data: teamStatsData,
          backgroundColor: 'rgba(135, 206, 235, 0.5)', // Sky blue at 0.5 opacity
          borderColor: '#87CEEB',
          borderWidth: 2,
          pointBackgroundColor: '#87CEEB',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3 // Smooth, rounded polygon
        },
        // 4. Average Player Overall - Green fill with ~40% opacity
        {
          label: 'Average Player Overall',
          data: communityStatsData,
          backgroundColor: 'rgba(33, 158, 188, 0.4)', // #219EBC at 0.4 opacity
          borderColor: '#219EBC',
          borderWidth: 2,
          pointBackgroundColor: '#219EBC',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3 // Smooth, rounded polygon
        }
      ]
    } else {
      // Free users get simple monochrome design
      return [
        {
          label: 'Own stats',
          data: userStatsData,
          backgroundColor: 'rgba(230, 57, 70, 0.3)', // Red background with transparency
          borderColor: '#E63946', // Solid red border
          borderWidth: 2,
          pointBackgroundColor: '#E63946',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#E63946',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3 // Smooth, rounded polygon
        },
        {
          label: 'Community stats',
          data: communityStatsData,
          backgroundColor: 'rgba(230, 57, 70, 0.1)', // Lighter red background
          borderColor: 'rgba(230, 57, 70, 0.6)', // Semi-transparent red border
          borderWidth: 1,
          borderDash: [3, 3],
          pointBackgroundColor: 'rgba(230, 57, 70, 0.6)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(230, 57, 70, 0.6)',
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.3 // Smooth, rounded polygon
        }
      ]
    }
  }

  const data = {
    labels: labels,
    datasets: createDatasets()
  }

  // Update tooltip to show actual values instead of percentages
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 10
    },
    plugins: {
      legend: {
        display: false, // Always hide default legend (we'll create custom one)
        position: 'bottom' as const
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context: any): string {
            const label = context.dataset.label || ''
            const dataIndex = context.dataIndex
            const statKeys: (keyof StatBounds)[] = [
              'pokemon_caught',
              'pokestops_visited',
              'distance_walked',
              'total_xp',
              'unique_pokedex_entries'
            ]
            
            // For premium users with multiple data sources
            if (isPremiumUser) {
              let actualValue = 0
              
              if (label === 'Your stats') {
                actualValue = profile[statKeys[dataIndex]] || 0
              } else if (label === 'Average Player from your Country' && countryAverages) {
                actualValue = countryAverages[statKeys[dataIndex]] || 0
              } else if (label === 'Average Player from your Team' && teamAverages) {
                actualValue = teamAverages[statKeys[dataIndex]] || 0
              } else if (label === 'Average Player Overall') {
                actualValue = communityAverages[statKeys[dataIndex]] || 0
              }
              
              const formattedValue = new Intl.NumberFormat().format(actualValue)
              return `${label}: ${formattedValue}`
            }
            
            // For free users
            const actualValue = context.dataset.label === 'Your Stats'
              ? profile[statKeys[dataIndex]]
              : communityAverages[statKeys[dataIndex]]
            
            const formattedValue = new Intl.NumberFormat().format(actualValue)
            return `${label}: ${formattedValue}`
          },
          filter: function() {
            // Show all tooltips for the clean Figma design
            return true
          }
        }
      }
    },
    scales: {
      r: {
        angleLines: {
          color: '#AAAAAA', // Light grey axis lines
          lineWidth: 1
        },
        grid: {
          color: '#AAAAAA', // Light grey grid lines
          circular: true,
          lineWidth: 1
        },
        pointLabels: {
          color: '#AAAAAA', // Light grey labels
          font: {
            size: isVerySmallScreen ? 10 : isMobile ? 12 : 14,
            weight: 400
          },
          callback: function(value: any, index: number) {
            // Handle multi-line labels on mobile
            if (isMobile) {
              const labels = isVerySmallScreen
                ? [
                    'Pokémon\nCaught',
                    'Stops', 
                    'Distance\nWalked',
                    'XP',
                    'Dex'
                  ]
                : [
                    'Pokémon\nCaught',
                    'PokéStops', 
                    'Distance\nWalked',
                    'Total XP',
                    'Pokédex'
                  ];
              return labels[index] || value;
            }
            return value;
          }
        },
        ticks: {
          display: false, // Hide the scale numbers
          stepSize: 20
        },
        backgroundColor: 'transparent', // Transparent background
        beginAtZero: true,
        max: 100
      }
    }
  }

  return (
    <div 
      style={{
        /* Removed container styling - clean minimal design */
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: isMobile ? '100%' : '1000px',
        height: isMobile ? '350px' : (isPremiumUser ? '500px' : '450px'),
        margin: '0 auto'
      }}
    >
      {showHeader && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: isMobile ? '10px' : '20px', 
          marginTop: isMobile ? '10px' : '20px' 
        }}>
          <h2 style={{ 
            color: '#000000', 
            fontSize: isMobile ? '16px' : '20px', 
            fontWeight: 'bold', 
            margin: '0 0 8px 0' 
          }}>
            Performance Radar {isPremiumUser && <span style={{ color: '#FFD700', fontSize: '0.8em' }}>✨ Premium</span>}
          </h2>
          <p style={{ 
            color: '#666666', 
            fontSize: isMobile ? '12px' : '14px', 
            margin: '0' 
          }}>
            {isPremiumUser 
              ? 'Advanced colorful visualization of your stats vs community' 
              : 'See how your stats compare to the community average'}
          </p>
          {!isPremiumUser && profile?.user_id === user?.id && (
            <div style={{ 
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 193, 7, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 193, 7, 0.3)'
            }}>
              <p style={{ 
                color: '#F57C00', 
                fontSize: '12px', 
                margin: '0 0 4px 0',
                fontWeight: '500'
              }}>
                Upgrade to Premium
              </p>
              <button 
                onClick={handleUpgradeClick}
                style={{
                  backgroundColor: '#FF6B35',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Upgrade Now
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ 
        width: '100%', 
        height: showHeader ? (isMobile ? 'calc(100% - 60px)' : 'calc(100% - 80px)') : '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '0 5px' : '0 20px'
      }}>
        <div style={{ 
          width: '100%', 
          height: '100%', 
          maxWidth: isMobile ? '100%' : '900px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: '100%', height: '100%' }}>
            <Radar data={data} options={options} />
          </div>
        </div>
      </div>

      {/* Compact Legend - Mobile Responsive */}
      {isPremiumUser && (
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '5px' : '10px',
          gap: isMobile ? '5px' : '20px',
          width: '100%',
          maxWidth: '100%',
          flexWrap: 'wrap',
          margin: '10px auto 0 auto'
        }}>
          {/* Your stats - Red square */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '3px' : '4px'
          }}>
            <div style={{
              width: isMobile ? '6px' : '8px',
              height: isMobile ? '6px' : '8px',
              backgroundColor: '#E63946',
              borderRadius: '1px',
              flex: 'none'
            }}></div>
            <span style={{
              fontSize: isMobile ? '8px' : '10px',
              fontWeight: '500',
              color: '#000000', // Black text as requested
              fontFamily: 'system-ui, -apple-system, sans-serif',
              whiteSpace: 'nowrap'
            }}>Your stats</span>
          </div>

          {/* Average Player from your Country - Orange square */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '3px' : '4px'
          }}>
            <div style={{
              width: isMobile ? '6px' : '8px',
              height: isMobile ? '6px' : '8px',
              backgroundColor: '#FFB703',
              borderRadius: '1px',
              flex: 'none'
            }}></div>
            <span style={{
              fontSize: isMobile ? '8px' : '10px',
              fontWeight: '500',
              color: '#000000', // Black text as requested
              fontFamily: 'system-ui, -apple-system, sans-serif',
              whiteSpace: 'nowrap'
            }}>Country Avg</span>
          </div>

          {/* Average Player from your Team - Sky blue square */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '3px' : '4px'
          }}>
            <div style={{
              width: isMobile ? '6px' : '8px',
              height: isMobile ? '6px' : '8px',
              backgroundColor: '#87CEEB',
              borderRadius: '1px',
              flex: 'none'
            }}></div>
            <span style={{
              fontSize: isMobile ? '8px' : '10px',
              fontWeight: '500',
              color: '#000000', // Black text as requested
              fontFamily: 'system-ui, -apple-system, sans-serif',
              whiteSpace: 'nowrap'
            }}>Team Avg</span>
          </div>

          {/* Average Player Overall - Green square */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '3px' : '4px'
          }}>
            <div style={{
              width: isMobile ? '6px' : '8px',
              height: isMobile ? '6px' : '8px',
              backgroundColor: '#219EBC',
              borderRadius: '1px',
              flex: 'none'
            }}></div>
            <span style={{
              fontSize: isMobile ? '8px' : '10px',
              fontWeight: '500',
              color: '#000000', // Black text as requested
              fontFamily: 'system-ui, -apple-system, sans-serif',
              whiteSpace: 'nowrap'
            }}>Overall Avg</span>
          </div>
        </div>
      )}

      {/* Free User Legend - Simple Two-Item Legend */}
      {!isPremiumUser && (
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '5px' : '10px',
          gap: isMobile ? '15px' : '30px',
          width: '100%',
          maxWidth: '100%',
          flexWrap: 'wrap',
          margin: '10px auto 0 auto'
        }}>
          {/* Own stats - Red square */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '3px' : '4px'
          }}>
            <div style={{
              width: isMobile ? '6px' : '8px',
              height: isMobile ? '6px' : '8px',
              backgroundColor: '#E63946',
              borderRadius: '1px',
              flex: 'none'
            }}></div>
            <span style={{
              fontSize: isMobile ? '8px' : '10px',
              fontWeight: '500',
              color: '#000000', // Black text as requested
              fontFamily: 'system-ui, -apple-system, sans-serif',
              whiteSpace: 'nowrap'
            }}>Own stats</span>
          </div>

          {/* Community stats - Light red square */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '3px' : '4px'
          }}>
            <div style={{
              width: isMobile ? '6px' : '8px',
              height: isMobile ? '6px' : '8px',
              backgroundColor: 'rgba(230, 57, 70, 0.6)',
              borderRadius: '1px',
              flex: 'none'
            }}></div>
            <span style={{
              fontSize: isMobile ? '8px' : '10px',
              fontWeight: '500',
              color: '#000000', // Black text as requested
              fontFamily: 'system-ui, -apple-system, sans-serif',
              whiteSpace: 'nowrap'
            }}>Community stats</span>
          </div>
        </div>
      )}
    </div>
  )
} 