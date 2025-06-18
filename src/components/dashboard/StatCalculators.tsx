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

  const handleGrindCalculation = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates')
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

  return (
    <div className="calculators-container">
      <div className="calculators-header">
        <h2>Stat Calculators</h2>
        <p>Calculate your progress between any two dates or during special events</p>
      </div>

      {/* Calculator Type Selector */}
      <div className="calculator-tabs">
        <button 
          className={`calc-tab ${calculatorType === 'grind' ? 'active' : ''}`}
          onClick={() => setCalculatorType('grind')}
        >
          <span className="calc-icon">📈</span>
          Grind Calculator
        </button>
        <button 
          className={`calc-tab ${calculatorType === 'community' ? 'active' : ''}`}
          onClick={() => setCalculatorType('community')}
        >
          <span className="calc-icon">🎉</span>
          Community Day
        </button>
      </div>

      <div className="calculator-content">
        {calculatorType === 'grind' && (
          <div className="grind-calculator">
            <div className="calc-card">
              <h3>Grind Calculator</h3>
              <p>Select any two dates to see your stat progression</p>
              
              <div className="date-inputs">
                <div className="date-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="date-input"
                  />
                </div>
                <div className="date-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="date-input"
                  />
                </div>
              </div>

              <button 
                onClick={handleGrindCalculation}
                disabled={loading || !startDate || !endDate}
                className="calc-button"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Calculating...
                  </>
                ) : (
                  'Calculate Progress'
                )}
              </button>
            </div>
          </div>
        )}

        {calculatorType === 'community' && (
          <div className="community-calculator">
            <div className="calc-card">
              <h3>Community Day Calculator</h3>
              <p>See your progress during a specific Community Day</p>
              
              <div className="date-inputs">
                <div className="date-group">
                  <label>Community Day Date</label>
                  <input
                    type="date"
                    value={singleDate}
                    onChange={(e) => setSingleDate(e.target.value)}
                    className="date-input"
                  />
                </div>
              </div>

              <button 
                onClick={handleCommunityDayCalculation}
                disabled={loading || !singleDate}
                className="calc-button"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Calculating...
                  </>
                ) : (
                  'Calculate Community Day'
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="calc-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="calc-results">
            <div className="results-header">
              <h3>Results</h3>
              <p>
                From {new Date(result.start_date).toLocaleDateString()} to {new Date(result.end_date).toLocaleDateString()}
              </p>
            </div>
            
            <div className="results-grid">
              <div className="result-card positive">
                <div className="result-icon">⚡</div>
                <div className="result-content">
                  <div className="result-value">+{formatNumber(result.xp_delta)}</div>
                  <div className="result-label">XP Gained</div>
                </div>
              </div>
              
              <div className="result-card positive">
                <div className="result-icon">🔴</div>
                <div className="result-content">
                  <div className="result-value">+{formatNumber(result.catches_delta)}</div>
                  <div className="result-label">Pokémon Caught</div>
                </div>
              </div>
              
              <div className="result-card positive">
                <div className="result-icon">🚶</div>
                <div className="result-content">
                  <div className="result-value">+{result.distance_delta.toFixed(1)} km</div>
                  <div className="result-label">Distance Walked</div>
                </div>
              </div>
              
              <div className="result-card positive">
                <div className="result-icon">📍</div>
                <div className="result-content">
                  <div className="result-value">+{formatNumber(result.pokestops_delta)}</div>
                  <div className="result-label">PokéStops Visited</div>
                </div>
              </div>
              
              <div className="result-card positive">
                <div className="result-icon">📖</div>
                <div className="result-content">
                  <div className="result-value">+{result.pokedex_delta}</div>
                  <div className="result-label">Pokédex Entries</div>
                </div>
              </div>
              
              <div className="result-card positive">
                <div className="result-icon">⬆️</div>
                <div className="result-content">
                  <div className="result-value">+{result.level_delta}</div>
                  <div className="result-label">Levels Gained</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 