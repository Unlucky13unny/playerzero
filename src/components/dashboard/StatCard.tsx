import { useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'

interface StatCardProps {
  result: {
    startDate?: string
    endDate?: string
    singleDate?: string
    totalXP?: number
    pokemonCaught?: number
    distanceWalked?: number
    pokestopsVisited?: number
    uniquePokedexEntries?: number
    xpPerDay?: number
    catchesPerDay?: number
    distancePerDay?: number
    stopsPerDay?: number
  }
  onDownloadComplete?: () => void
  cardType: 'grind' | 'community'
}

const formatNumber = (num: number | undefined) => {
  if (!num) return '0'
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toLocaleString()
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const StatCard = ({ result, onDownloadComplete, cardType }: StatCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const generateImage = async () => {
      if (!cardRef.current) return

      try {
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: '#1a1a1a',
          scale: 2, // Higher resolution
          logging: false,
          useCORS: true
        })

        // Convert to PNG and download
        const image = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `${cardType}-stats-${new Date().getTime()}.png`
        link.href = image
        link.click()

        onDownloadComplete?.()
      } catch (error) {
        console.error('Error generating image:', error)
      }
    }

    generateImage()
  }, [result, cardType, onDownloadComplete])

  return (
    <div 
      ref={cardRef}
      className="results-card"
      style={{
        position: 'fixed',
        left: '-9999px', // Hide off-screen while rendering
        top: '-9999px'
      }}
    >
      <div className="results-card-gradient"></div>
      
      {/* Header */}
      <div className="results-header">
        <div className="results-header-content">
          <div className="results-title-wrapper">
            <span className="results-type-icon">
              {cardType === 'grind' ? '📈' : '🎉'}
            </span>
            <h3>{cardType === 'grind' ? 'Grind Stats' : 'Community Day Stats'}</h3>
          </div>
          <div className="date-range">
            <span className="date-icon">📅</span>
            {cardType === 'grind' ? (
              <>
                {result.startDate && result.endDate && (
                  `${formatDate(result.startDate)} - ${formatDate(result.endDate)}`
                )}
              </>
            ) : (
              <>
                {result.singleDate && formatDate(result.singleDate)}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-item stat-item-xp">
          <div className="stat-label">
            <span className="stat-icon">⭐</span>
            <span>Total XP</span>
          </div>
          <div className="stat-value">{formatNumber(result.totalXP)}</div>
        </div>
        <div className="stat-item stat-item-catches">
          <div className="stat-label">
            <span className="stat-icon">🔴</span>
            <span>Pokemon Caught</span>
          </div>
          <div className="stat-value">{formatNumber(result.pokemonCaught)}</div>
        </div>
        <div className="stat-item stat-item-distance">
          <div className="stat-label">
            <span className="stat-icon">👣</span>
            <span>Distance Walked</span>
          </div>
          <div className="stat-value">{formatNumber(result.distanceWalked)}km</div>
        </div>
        <div className="stat-item stat-item-stops">
          <div className="stat-label">
            <span className="stat-icon">🔵</span>
            <span>Pokestops Visited</span>
          </div>
          <div className="stat-value">{formatNumber(result.pokestopsVisited)}</div>
        </div>
      </div>

      {/* Daily Averages - Only show for grind stats */}
      {(cardType === 'grind') && (
        <div className="daily-averages">
          <div className="daily-averages-header">
            <span className="daily-icon">📊</span>
            <h4>Daily Averages</h4>
          </div>
          <div className="averages-grid">
            <div className="average-item">
              <div className="average-label">
                <span className="stat-icon">📈</span>
                <span>XP per Day</span>
              </div>
              <div className="average-value">{formatNumber(result.xpPerDay)}</div>
            </div>
            <div className="average-item">
              <div className="average-label">
                <span className="stat-icon">📊</span>
                <span>Catches per Day</span>
              </div>
              <div className="average-value">{formatNumber(result.catchesPerDay)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Watermark */}
      <div className="watermark">
        <div className="watermark-content">
          <span className="watermark-icon">⚡</span>
          Generated by PlayerZero
        </div>
      </div>
    </div>
  )
}

export default StatCard 