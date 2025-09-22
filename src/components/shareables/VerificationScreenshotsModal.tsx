import { useState, useEffect } from 'react'
import { dashboardService } from '../../services/dashboardService'

interface VerificationScreenshotsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userName?: string
}

export function VerificationScreenshotsModal({ isOpen, onClose, userId, userName }: VerificationScreenshotsModalProps) {
  const [screenshots, setScreenshots] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      loadScreenshots()
    }
  }, [isOpen, userId])

  const loadScreenshots = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await dashboardService.getVerificationScreenshots(userId, 50) // Get last 50 screenshots
      setScreenshots(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load screenshots')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Verification Screenshots
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {userName ? `${userName}'s` : 'User\'s'} stat verification history
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-3 text-gray-600">Loading screenshots...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-2">⚠️</div>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : screenshots.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">📸</div>
              <p className="text-gray-600">No verification screenshots found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {screenshots.map((screenshot, index) => (
                <div key={screenshot.id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {/* Screenshot Image */}
                  <div className="mb-4">
                    <img
                      src={screenshot.screenshot_url}
                      alt={`Verification screenshot ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder-screenshot.png'
                      }}
                    />
                  </div>

                  {/* Stats Information */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Date:</span>
                      <span className="text-sm text-gray-600">
                        {formatDate(screenshot.stat_entries?.entry_date || screenshot.created_at)}
                      </span>
                    </div>
                    
                    {screenshot.stat_entries && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Level:</span>
                          <span className="text-sm text-gray-600">
                            {screenshot.stat_entries.trainer_level}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Total XP:</span>
                          <span className="text-sm text-gray-600">
                            {formatNumber(screenshot.stat_entries.total_xp)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Pokémon Caught:</span>
                          <span className="text-sm text-gray-600">
                            {formatNumber(screenshot.stat_entries.pokemon_caught)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Distance:</span>
                          <span className="text-sm text-gray-600">
                            {screenshot.stat_entries.distance_walked?.toFixed(1)} km
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Pokéstops:</span>
                          <span className="text-sm text-gray-600">
                            {formatNumber(screenshot.stat_entries.pokestops_visited)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Pokédex:</span>
                          <span className="text-sm text-gray-600">
                            {screenshot.stat_entries.unique_pokedex_entries}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing {screenshots.length} verification screenshot{screenshots.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
