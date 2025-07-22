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

export const RadarChart = ({ profile, isPaidUser, showHeader = true }: RadarChartProps) => {
  const navigate = useNavigate()
  const { user } = useAuth() // Add this to get current user
  const trialStatus = useTrialStatus() // Add this to get current user's trial status
  const [communityAverages, setCommunityAverages] = useState<any>(null)
  const [statBounds, setStatBounds] = useState<StatBounds | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [averages, bounds] = await Promise.all([
          dashboardService.getAverageStats(),
          dashboardService.getPaidUserStatBounds()
        ])
        setCommunityAverages(averages)
        setStatBounds(bounds)
      } catch (err) {
        setError('Failed to load data')
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleUpgradeClick = () => {
    navigate('/upgrade')
  }

  // Only show upgrade prompt if viewing own profile and not paid
  const showUpgradePrompt = profile?.user_id === user?.id && !trialStatus.isPaidUser

  if (showUpgradePrompt) {
    return (
      <div className="locked-content">
        <div className="locked-icon">🔒</div>
        <h3 className="locked-title">Premium Feature</h3>
        <p className="locked-description">
          Upgrade to Premium to see how your stats compare to other trainers!
        </p>
        <button 
          className="upgrade-button"
          onClick={handleUpgradeClick}
        >
          Upgrade to Premium
        </button>
      </div>
    )
  }

  if (!profile || loading || !communityAverages || !statBounds) {
    return (
      <div className="radar-chart-loading">
        <div className="loading-spinner"></div>
        <p>Loading performance data...</p>
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

  const data = {
    labels: [
      'Pokémon Caught',
      'PokéStops Visited',
      'Distance Walked (km)',
      'Total XP',
      'Pokédex Entries' // Moving this to the end since it's not part of core 4
    ],
    datasets: [
      {
        label: 'Your Stats',
        data: [
          normalizeStats(profile.pokemon_caught || 0, 'pokemon_caught'),
          normalizeStats(profile.pokestops_visited || 0, 'pokestops_visited'),
          normalizeStats(profile.distance_walked || 0, 'distance_walked'),
          normalizeStats(profile.total_xp || 0, 'total_xp'),
          normalizeStats(profile.unique_pokedex_entries || 0, 'unique_pokedex_entries')
        ],
        backgroundColor: 'rgba(220, 38, 127, 0.2)',
        borderColor: 'rgba(220, 38, 127, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(220, 38, 127, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(220, 38, 127, 1)'
      },
      {
        label: 'Community Average',
        data: [
          normalizeStats(communityAverages.pokemon_caught, 'pokemon_caught'),
          normalizeStats(communityAverages.pokestops_visited, 'pokestops_visited'),
          normalizeStats(communityAverages.distance_walked, 'distance_walked'),
          normalizeStats(communityAverages.total_xp, 'total_xp'),
          normalizeStats(communityAverages.unique_pokedex_entries, 'unique_pokedex_entries')
        ],
        backgroundColor: 'rgba(128, 128, 128, 0.1)',
        borderColor: 'rgba(128, 128, 128, 0.8)',
        borderWidth: 1,
        pointBackgroundColor: 'rgba(128, 128, 128, 0.8)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(128, 128, 128, 0.8)'
      }
    ]
  }

  // Update tooltip to show actual values instead of percentages
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          font: {
            size: 14,
            weight: 500
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || ''
            const dataIndex = context.dataIndex
            const statKeys: (keyof StatBounds)[] = [
              'pokemon_caught',
              'pokestops_visited',
              'distance_walked',
              'total_xp',
              'unique_pokedex_entries'
            ]
            const actualValue = context.dataset.label === 'Your Stats'
              ? profile[statKeys[dataIndex]]
              : communityAverages[statKeys[dataIndex]]
            
            // Format large numbers with commas
            const formattedValue = new Intl.NumberFormat().format(actualValue)
            return `${label}: ${formattedValue}`
          }
        }
      }
    },
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          circular: true
        },
        pointLabels: {
          color: '#ffffff',
          font: {
            size: 13,
            weight: 500
          }
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          backdropColor: 'transparent',
          font: {
            size: 10
          },
          stepSize: 20
        },
        beginAtZero: true,
        max: 100
      }
    }
  }

  const getPerformanceMessage = () => {
    const userStats = data.datasets[0].data
    const avgStats = data.datasets[1].data
    
    let aboveAverage = 0
    let strongestStat = { index: 0, value: 0, label: '' }
    let weakestStat = { index: 0, value: 100, label: '' }

    userStats.forEach((stat, index) => {
      if (stat > avgStats[index]) {
        aboveAverage++
      }
      
      if (stat > strongestStat.value) {
        strongestStat = { index, value: stat, label: data.labels[index] }
      }
      
      if (stat < weakestStat.value) {
        weakestStat = { index, value: stat, label: data.labels[index] }
      }
    })

    return {
      aboveAverage,
      total: userStats.length,
      strongest: strongestStat.label,
      weakest: weakestStat.label
    }
  }

  const performance = getPerformanceMessage()

  return (
    <div className="radar-chart-container">
      {showHeader && (
        <div className="radar-chart-header">
          <h2>Performance Radar</h2>
          <p>See how your stats compare to the community average</p>
        </div>
      )}

      <div className="radar-chart-content">
        <div className="chart-wrapper">
          <Radar data={data} options={options} />
        </div>
      </div>
    </div>
  )
} 