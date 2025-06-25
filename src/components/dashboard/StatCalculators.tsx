import { useState } from 'react'
import { dashboardService, type StatCalculationResult } from '../../services/dashboardService'

export const StatCalculators = () => {
  const [calculatorType, setCalculatorType] = useState<'grind' | 'community'>('grind')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [singleDate, setSingleDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StatCalculationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGrindCalculation = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates')
      return
    }

    const daysDiff = getDaysDifference(startDate, endDate)
    if (daysDiff < 1) {
      setError('End date must be at least 1 day after start date')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const calculation = await dashboardService.calculateStatDelta(startDate, endDate)
      setResult(calculation)
    } catch (err: any) {
      setError(err.message || 'Failed to calculate stats')
    } finally {
      setLoading(false)
    }
  }

  const handleCommunityDayCalculation = async () => {
    if (!singleDate) {
      setError('Please select a Community Day date')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const calculation = await dashboardService.getCommunityDayStats(singleDate)
      setResult(calculation)
    } catch (err: any) {
      setError(err.message || 'Failed to calculate Community Day stats')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toLocaleString()
  }

  const clearResults = () => {
    setResult(null)
    setError(null)
    setCopied(false)
  }

  const getDaysDifference = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="calculators-container">
      <div className="calculators-header">
        <div className="calculators-hero">
          <h2>Stat Calculators</h2>
          <p>Track your progress and analyze your journey with powerful calculation tools</p>
        </div>
      </div>

      {/* Calculator Type Selector */}
      <div className="calculator-tabs">
        <button
          className={`calc-tab ${calculatorType === 'grind' ? 'active' : ''}`}
          onClick={() => {
            setCalculatorType('grind')
            clearResults()
          }}
        >
          <span className="calc-icon">📈</span>
          <div className="calc-tab-content">
            <span className="calc-tab-title">Grind Calculator</span>
            <span className="calc-tab-subtitle">Date range analysis</span>
          </div>
        </button>
        <button
          className={`calc-tab ${calculatorType === 'community' ? 'active' : ''}`}
          onClick={() => {
            setCalculatorType('community')
            clearResults()
          }}
        >
          <span className="calc-icon">🎉</span>
          <div className="calc-tab-content">
            <span className="calc-tab-title">Community Day</span>
            <span className="calc-tab-subtitle">Event performance</span>
          </div>
        </button>
      </div>

      <div className="calculator-content">
        {calculatorType === 'grind' && (
          <div className="grind-calculator">
            <div className="calc-card">
              <div className="calc-card-header">
                <div className="calc-card-icon">📈</div>
                <div className="calc-card-info">
                  <h3>Grind Calculator</h3>
                  <p>Compare your stats between any two dates to see your progression</p>
                </div>
              </div>

              <div className="date-inputs">
                <div className="date-row">
                  <div className="date-group">
                    <label>
                      <span className="date-icon">📅</span>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="date-input"
                      max={endDate || undefined}
                    />
                  </div>
                  <div className="date-separator">
                    <span className="separator-icon">→</span>
                  </div>
                  <div className="date-group">
                    <label>
                      <span className="date-icon">📅</span>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="date-input"
                      min={startDate || undefined}
                    />
                  </div>
                </div>
                {startDate && endDate && (
                  <div className="date-summary">
                    <span className="summary-icon">⏱️</span>
                    <span>{getDaysDifference(startDate, endDate)} days selected</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleGrindCalculation}
                disabled={loading || !startDate || !endDate}
                className="calc-button primary"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Analyzing Progress...</span>
                  </>
                ) : (
                  <>
                    <span className="button-icon">🚀</span>
                    <span>Calculate Progress</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {calculatorType === 'community' && (
          <div className="community-calculator">
            <div className="calc-card">
              <div className="calc-card-header">
                <div className="calc-card-icon">🎉</div>
                <div className="calc-card-info">
                  <h3>Community Day Calculator</h3>
                  <p>Track your performance during special Community Day events</p>
                </div>
              </div>

              <div className="date-inputs">
                <div className="date-group single">
                  <label>
                    <span className="date-icon">🗓️</span>
                    Community Day Date
                  </label>
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    className="date-input"
                  />
                  <div className="input-hint">
                    <span className="hint-icon">💡</span>
                    <span>Select the date of the Community Day event</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCommunityDayCalculation}
                disabled={loading || !singleDate}
                className="calc-button primary"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Analyzing Event...</span>
                  </>
                ) : (
                  <>
                    <span className="button-icon">🎯</span>
                    <span>Calculate Event Stats</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="calc-error">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <div className="error-text">
                <span className="error-title">Calculation Error</span>
                <span className="error-message">{error}</span>
              </div>
            </div>
            <button
              className="error-dismiss"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {result && (
          <div className="calc-results">
            <div className="results-header">
              <div className="results-title">
                <span className="results-icon">📊</span>
                <h3>Your Progress Results</h3>
              </div>
              <div className="results-meta">
                <span className="results-period">
                  {new Date(result.start_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })} → {new Date(result.end_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                {calculatorType === 'grind' && (
                  <span className="results-duration">
                    {getDaysDifference(result.start_date, result.end_date)} days
                  </span>
                )}
              </div>
            </div>

            <div className="results-grid">
              <div className="result-card highlight">
                <div className="result-header">
                  <div className="result-icon">⚡</div>
                  <div className="result-badge">Primary</div>
                </div>
                <div className="result-content">
                  <div className="result-value">+{formatNumber(result.xp_delta)}</div>
                  <div className="result-label">XP Gained</div>
                  {calculatorType === 'grind' && (
                    <div className="result-rate">
                      {Math.round(result.xp_delta / getDaysDifference(result.start_date, result.end_date)).toLocaleString()} XP/day
                    </div>
                  )}
                </div>
              </div>

              <div className="result-card">
                <div className="result-header">
                  <div className="result-icon">🔴</div>
                </div>
                <div className="result-content">
                  <div className="result-value">+{formatNumber(result.catches_delta)}</div>
                  <div className="result-label">Pokémon Caught</div>
                  {calculatorType === 'grind' && (
                    <div className="result-rate">
                      {Math.round(result.catches_delta / getDaysDifference(result.start_date, result.end_date))} catches/day
                    </div>
                  )}
                </div>
              </div>

              <div className="result-card">
                <div className="result-header">
                  <div className="result-icon">🚶</div>
                </div>
                <div className="result-content">
                  <div className="result-value">+{result.distance_delta.toFixed(1)} km</div>
                  <div className="result-label">Distance Walked</div>
                  {calculatorType === 'grind' && (
                    <div className="result-rate">
                      {(result.distance_delta / getDaysDifference(result.start_date, result.end_date)).toFixed(1)} km/day
                    </div>
                  )}
                </div>
              </div>

              <div className="result-card">
                <div className="result-header">
                  <div className="result-icon">📍</div>
                </div>
                <div className="result-content">
                  <div className="result-value">+{formatNumber(result.pokestops_delta)}</div>
                  <div className="result-label">PokéStops Visited</div>
                  {calculatorType === 'grind' && (
                    <div className="result-rate">
                      {Math.round(result.pokestops_delta / getDaysDifference(result.start_date, result.end_date))} stops/day
                    </div>
                  )}
                </div>
              </div>

              <div className="result-card">
                <div className="result-header">
                  <div className="result-icon">📖</div>
                </div>
                <div className="result-content">
                  <div className="result-value">+{result.pokedex_delta}</div>
                  <div className="result-label">Pokédex Entries</div>
                </div>
              </div>

              <div className="result-card">
                <div className="result-header">
                  <div className="result-icon">⬆️</div>
                </div>
                <div className="result-content">
                  <div className="result-value">+{result.level_delta}</div>
                  <div className="result-label">Levels Gained</div>
                </div>
              </div>
            </div>

            <div className="results-actions">
              <button
                className="action-button secondary"
                onClick={clearResults}
              >
                <span className="button-icon">🔄</span>
                Calculate Again
              </button>
              <button
                className={`action-button ${copied ? 'success' : 'primary'}`}
                onClick={async () => {
                  try {
                    const copyText = `My Pokémon GO Progress (${new Date(result.start_date).toLocaleDateString()} → ${new Date(result.end_date).toLocaleDateString()}):
📈 +${formatNumber(result.xp_delta)} XP
🔴 +${formatNumber(result.catches_delta)} Pokémon caught
🚶 +${result.distance_delta.toFixed(1)} km walked
📍 +${formatNumber(result.pokestops_delta)} PokéStops visited
📖 +${result.pokedex_delta} Pokédex entries
⬆️ +${result.level_delta} levels gained`
                    await navigator.clipboard.writeText(copyText)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  } catch (err) {
                    setError('Failed to copy results to clipboard')
                  }
                }}
              >
                <span className="button-icon">{copied ? '✅' : '📤'}</span>
                {copied ? 'Copied!' : 'Copy Results'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 