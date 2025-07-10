import { useState, useEffect } from 'react'
import { dashboardService, type StatCalculationResult } from '../../services/dashboardService'
import StatCard from './StatCard'

const TEAM_COLORS = {
  blue: { name: 'Blue', color: '#0074D9' },
  red: { name: 'Red', color: '#FF4136' },
  yellow: { name: 'Yellow', color: '#FFDC00' },
  black: { name: 'Black', color: '#111111' },
  green: { name: 'Green', color: '#2ECC40' },
  orange: { name: 'Orange', color: '#FF851B' },
  purple: { name: 'Purple', color: '#B10DC9' },
  pink: { name: 'Pink', color: '#F012BE' }
}

type CalculatorType = 'grind' | 'community'

interface StatCalculatorsProps {
  initialCalculator?: CalculatorType
}

export const StatCalculators = ({ initialCalculator = 'grind' }: StatCalculatorsProps) => {
  const [calculatorType, setCalculatorType] = useState<CalculatorType>(initialCalculator)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [singleDate, setSingleDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StatCalculationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  // Update calculator type when initialCalculator prop changes
  useEffect(() => {
    setCalculatorType(initialCalculator)
  }, [initialCalculator])

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
    setDownloading(false)
  }

  const getDaysDifference = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const handleDownload = () => {
    if (!result) return
    setDownloading(true)
  }

  const handleDownloadComplete = () => {
    setDownloading(false)
  }

  return (
    <div className="calculators-container">
      <div className="calculators-header">
        <div className="calculators-hero">
          <h2>Performance Analytics</h2>
          <p>Track your progress and generate shareable stat cards</p>
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
            <span className="calc-tab-title">Grind Stats</span>          </div>
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
                  <h3>Grind Stats</h3>
                  <p>Compare your stats between any two dates and generate a shareable card</p>
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
                    <span>Generate Stats</span>
                  </>
                )}
              </button>
            </div>

            {/* Results Section */}
            {result && (
              <div className="results-section">
                <div className="results-preview">
                  <div className="preview-header">
                    <h3>Performance Summary</h3>
                    <button 
                      className="download-button"
                      onClick={handleDownload}
                      disabled={downloading}
                    >
                      {downloading ? (
                        <>
                          <span className="button-icon">⏳</span>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <span className="button-icon">⬇️</span>
                          <span>Download Card</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-label">Total XP</div>
                      <div className="stat-value">{formatNumber(result.totalXP)}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Pokemon Caught</div>
                      <div className="stat-value">{formatNumber(result.pokemonCaught)}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Distance Walked</div>
                      <div className="stat-value">{formatNumber(result.distanceWalked)}km</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Pokestops Visited</div>
                      <div className="stat-value">{formatNumber(result.pokestopsVisited)}</div>
                    </div>
                  </div>

                  <div className="daily-averages">
                    <h4>Daily Averages</h4>
                    <div className="averages-grid">
                      <div className="average-item">
                        <div className="average-label">XP per Day</div>
                        <div className="average-value">{formatNumber(result.xpPerDay)}</div>
                      </div>
                      <div className="average-item">
                        <div className="average-label">Catches per Day</div>
                        <div className="average-value">{formatNumber(result.catchesPerDay)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hidden StatCard component for image generation */}
                {downloading && (
                  <StatCard
                    result={result}
                    onDownloadComplete={handleDownloadComplete}
                    cardType={calculatorType}
                  />
                )}
              </div>
            )}

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
          </div>
        )}

        {calculatorType === 'community' && (
          <div className="community-calculator">
            <div className="calc-card">
              <div className="calc-card-header">
                <div className="calc-card-icon">🎉</div>
                <div className="calc-card-info">
                  <h3>Community Day Stats</h3>
                  <p>Track your performance and generate a shareable card for Community Day events</p>
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
                    <span className="button-icon">🚀</span>
                    <span>Generate Stats</span>
                  </>
                )}
              </button>
            </div>

            {/* Results Section */}
            {result && (
              <div className="results-section">
                <div className="results-preview">
                  <div className="preview-header">
                    <h3>Event Performance</h3>
                    <button 
                      className="download-button"
                      onClick={handleDownload}
                      disabled={downloading}
                    >
                      {downloading ? (
                        <>
                          <span className="button-icon">⏳</span>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <span className="button-icon">⬇️</span>
                          <span>Download Card</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-label">Total XP</div>
                      <div className="stat-value">{formatNumber(result.totalXP)}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Pokemon Caught</div>
                      <div className="stat-value">{formatNumber(result.pokemonCaught)}</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Distance Walked</div>
                      <div className="stat-value">{formatNumber(result.distanceWalked)}km</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-label">Pokestops Visited</div>
                      <div className="stat-value">{formatNumber(result.pokestopsVisited)}</div>
                    </div>
                  </div>
                </div>

                {/* Hidden StatCard component for image generation */}
                {downloading && (
                  <StatCard
                    result={result}
                    onDownloadComplete={handleDownloadComplete}
                    cardType={calculatorType}
                  />
                )}
              </div>
            )}

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatCalculators 