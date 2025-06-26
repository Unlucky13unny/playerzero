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
import { dashboardService } from '../../services/dashboardService'

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
  isPaidUser: boolean
  showHeader?: boolean // Optional prop to control header visibility
}

export const RadarChart = ({ profile, isPaidUser, showHeader = true }: RadarChartProps) => {
  const navigate = useNavigate()
  const [communityAverages, setCommunityAverages] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAverages = async () => {
      try {
        const averages = await dashboardService.getAverageStats()
        setCommunityAverages(averages)
      } catch (err) {
        setError('Failed to load community averages')
        console.error('Error loading averages:', err)
      } finally {
        setLoading(false)
      }
    }

    loadAverages()
  }, [])

  const handleUpgradeClick = () => {
    navigate('/upgrade')
  }

  if (!isPaidUser) {
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

  if (!profile || loading || !communityAverages) {
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

  // Normalize stats to a 0-100 scale for radar chart
  const normalizeStats = (value: number, max: number) => {
    return Math.min((value / max) * 100, 100)
  }

  const getMaxValue = (stat: keyof typeof communityAverages) => {
    const profileStat = stat === 'total_xp' ? profile?.total_xp :
      stat === 'pokemon_caught' ? profile?.pokemon_caught :
      stat === 'distance_walked' ? profile?.distance_walked :
      stat === 'pokestops_visited' ? profile?.pokestops_visited :
      stat === 'unique_pokedex_entries' ? profile?.unique_pokedex_entries : 0
    return Math.max(profileStat || 0, communityAverages[stat]) * 2
  }

  const data = {
    labels: [
      'XP',
      'Pokémon Caught',
      'Distance (km)',
      'PokéStops',
      'Level',
      'Pokédex'
    ],
    datasets: [
      {
        label: 'Your Stats',
        data: [
          normalizeStats(profile.total_xp || 0, getMaxValue('total_xp')),
          normalizeStats(profile.pokemon_caught || 0, getMaxValue('pokemon_caught')),
          normalizeStats(profile.distance_walked || 0, getMaxValue('distance_walked')),
          normalizeStats(profile.pokestops_visited || 0, getMaxValue('pokestops_visited')),
          normalizeStats(profile.trainer_level || 1, 50), // Max level 50
          normalizeStats(profile.unique_pokedex_entries || 0, getMaxValue('unique_pokedex_entries'))
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
          normalizeStats(communityAverages.total_xp, getMaxValue('total_xp')),
          normalizeStats(communityAverages.pokemon_caught, getMaxValue('pokemon_caught')),
          normalizeStats(communityAverages.distance_walked, getMaxValue('distance_walked')),
          normalizeStats(communityAverages.pokestops_visited, getMaxValue('pokestops_visited')),
          normalizeStats(communityAverages.trainer_level, 50),
          normalizeStats(communityAverages.unique_pokedex_entries, getMaxValue('unique_pokedex_entries'))
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
            const value = context.parsed.r
            return `${label}: ${value.toFixed(1)}%`
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

        <div className="performance-summary">
          <div className="summary-header">
            <h3>Performance Summary</h3>
          </div>
          
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-label">Above Average:</span>
              <span className="summary-value">
                {performance.aboveAverage}/{performance.total} categories
              </span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Strongest Area:</span>
              <span className="summary-value strongest">
                {performance.strongest}
              </span>
            </div>
            
            <div className="summary-item">
              <span className="summary-label">Growth Opportunity:</span>
              <span className="summary-value weakest">
                {performance.weakest}
              </span>
            </div>
          </div>

          <div className="performance-tips">
            <h4>💡 Tips for Improvement</h4>
            <ul>
              {performance.aboveAverage < 3 && (
                <li>Focus on consistent daily play to improve overall stats</li>
              )}
              {performance.weakest === 'Distance (km)' && (
                <li>Try walking more during your Pokémon GO sessions</li>
              )}
              {performance.weakest === 'Pokémon Caught' && (
                <li>Use items like Incense and Lures to encounter more Pokémon</li>
              )}
              {performance.weakest === 'PokéStops' && (
                <li>Explore new areas with more PokéStops and Gyms</li>
              )}
              {performance.weakest === 'Pokédex' && (
                <li>Participate in events to catch rare and regional Pokémon</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 