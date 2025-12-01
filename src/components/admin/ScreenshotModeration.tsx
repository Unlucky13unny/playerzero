import { useState, useEffect } from 'react'
import { adminService } from '../../services/adminService'
import '../../styles/admin.css'

interface ScreenshotData {
  id: string
  user_id: string
  trainer_name: string
  email: string
  screenshot_url: string
  profile_screenshot_url?: string // Legacy field for profile screenshots
  created_at: string
  is_flagged: boolean
  flagged_reason?: string
  flagged_at?: string
  type: 'profile' | 'verification'
  entry_date?: string // For verification screenshots
  stat_data?: {
    total_xp: number
    pokemon_caught: number
    distance_walked: number
    pokestops_visited: number
    unique_pokedex_entries: number
    trainer_level: number
  } | null
}

export const ScreenshotModeration = () => {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'flagged' | 'unflagged'>('all')
  const [screenshotTypeFilter, setScreenshotTypeFilter] = useState<'all' | 'profile' | 'verification'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadScreenshots()
  }, [])

  const loadScreenshots = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await adminService.getAllScreenshotsForModeration()
      
      if (error) {
        setError('Failed to load screenshots')
        console.error('Error loading screenshots:', error)
        return
      }

      setScreenshots(data || [])
    } catch (err) {
      setError('Failed to load screenshots')
      console.error('Error loading screenshots:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFlagImage = async (screenshotId: string, reason: string, screenshotType: 'profile' | 'verification') => {
    try {
      console.log('🚩 Attempting to flag screenshot:', { screenshotId, reason, screenshotType })
      
      let error
      if (screenshotType === 'profile') {
        const result = await adminService.flagScreenshot(screenshotId, reason)
        error = result.error
      } else {
        const result = await adminService.flagVerificationScreenshot(screenshotId, reason)
        error = result.error
      }
      
      if (error) {
        console.error('❌ Error flagging screenshot:', error)
        alert('Failed to flag screenshot. Please try again.')
        return
      }

      console.log('✅ Successfully flagged screenshot in database')
      
      // Update local state
      setScreenshots(prev => prev.map(screenshot => 
        screenshot.id === screenshotId 
          ? { ...screenshot, is_flagged: true, flagged_reason: reason, flagged_at: new Date().toISOString() }
          : screenshot
      ))
      
      console.log('✅ Updated local state')
    } catch (err) {
      console.error('❌ Error flagging screenshot:', err)
      alert('Failed to flag screenshot. Please try again.')
    }
  }

  const handleUnflagImage = async (screenshotId: string, screenshotType: 'profile' | 'verification') => {
    try {
      console.log('✅ Attempting to unflag screenshot:', { screenshotId, screenshotType })
      
      let error
      if (screenshotType === 'profile') {
        const result = await adminService.unflagScreenshot(screenshotId)
        error = result.error
             } else {
         const result = await adminService.unflagVerificationScreenshot(screenshotId)
         error = result.error
       }
      
      if (error) {
        console.error('❌ Error unflagging screenshot:', error)
        alert('Failed to unflag screenshot. Please try again.')
        return
      }

      console.log('✅ Successfully unflagged screenshot in database')

      // Update local state
      setScreenshots(prev => prev.map(screenshot => 
        screenshot.id === screenshotId 
          ? { ...screenshot, is_flagged: false, flagged_reason: undefined, flagged_at: undefined }
          : screenshot
      ))
      
      console.log('✅ Updated local state')
    } catch (err) {
      console.error('❌ Error unflagging screenshot:', err)
      alert('Failed to unflag screenshot. Please try again.')
    }
  }

  const handleDeleteImage = async (screenshotId: string, screenshotType: 'profile' | 'verification') => {
    if (!confirm('Are you sure you want to delete this screenshot? This will remove the image from storage and cannot be undone.')) {
      return
    }

    try {
      console.log('🗑️ Attempting to delete screenshot:', { screenshotId, screenshotType })
      
      let error
      if (screenshotType === 'profile') {
        const result = await adminService.deleteScreenshot(screenshotId)
        error = result.error
      } else {
        const result = await adminService.deleteVerificationScreenshot(screenshotId)
        error = result.error
      }
      
      if (error) {
        console.error('❌ Error deleting screenshot:', error)
        alert(`Failed to delete screenshot: ${error.message || 'Unknown error'}`)
        return
      }

      console.log('✅ Successfully deleted screenshot from database and storage')
      
      // Remove from local state
      setScreenshots(prev => prev.filter(screenshot => screenshot.id !== screenshotId))
      
      console.log('✅ Updated local state')
    } catch (err) {
      console.error('❌ Error deleting screenshot:', err)
      alert('Failed to delete screenshot. Please try again.')
    }
  }

  const filteredScreenshots = screenshots.filter(screenshot => {
    // Filter by flag status
    let matchesFilter = true
    if (filterType === 'flagged') matchesFilter = screenshot.is_flagged
    if (filterType === 'unflagged') matchesFilter = !screenshot.is_flagged
    
    // Filter by screenshot type
    let matchesType = true
    if (screenshotTypeFilter === 'profile') matchesType = screenshot.type === 'profile'
    if (screenshotTypeFilter === 'verification') matchesType = screenshot.type === 'verification'
    
    // Filter by search term
    let matchesSearch = true
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      matchesSearch = screenshot.trainer_name.toLowerCase().includes(search) ||
                      screenshot.email.toLowerCase().includes(search) ||
                      (screenshot.flagged_reason?.toLowerCase().includes(search) || false)
    }
    
    return matchesFilter && matchesType && matchesSearch
  })

  if (loading) {
    return <div className="loading">Loading screenshots...</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  return (
    <div className="screenshot-moderation">
      <div className="section-header">
        <h2>Screenshot Moderation</h2>
      </div>

      <div className="moderation-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by trainer name, email, or flag reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-buttons">
          <button 
            onClick={() => setFilterType('all')}
            className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
          >
            All ({screenshots.length})
          </button>
          <button 
            onClick={() => setFilterType('unflagged')}
            className={`filter-btn ${filterType === 'unflagged' ? 'active' : ''}`}
          >
            Unflagged ({screenshots.filter(s => !s.is_flagged).length})
          </button>
          <button 
            onClick={() => setFilterType('flagged')}
            className={`filter-btn ${filterType === 'flagged' ? 'active' : ''}`}
          >
            🚩 Flagged ({screenshots.filter(s => s.is_flagged).length})
          </button>
        </div>

        <div className="type-filter-buttons">
          <button 
            onClick={() => setScreenshotTypeFilter('all')}
            className={`filter-btn ${screenshotTypeFilter === 'all' ? 'active' : ''}`}
          >
            All Types ({screenshots.length})
          </button>
          <button 
            onClick={() => setScreenshotTypeFilter('profile')}
            className={`filter-btn ${screenshotTypeFilter === 'profile' ? 'active' : ''}`}
          >
            👤 Profile ({screenshots.filter(s => s.type === 'profile').length})
          </button>
          <button 
            onClick={() => setScreenshotTypeFilter('verification')}
            className={`filter-btn ${screenshotTypeFilter === 'verification' ? 'active' : ''}`}
          >
            📊 Verification ({screenshots.filter(s => s.type === 'verification').length})
          </button>
        </div>

        <button onClick={loadScreenshots} className="btn btn-secondary refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="screenshots-grid">
        {filteredScreenshots.length === 0 ? (
          <div className="no-screenshots">
            {filterType === 'all' ? 'No screenshots found' : `No ${filterType} screenshots found`}
          </div>
        ) : (
          filteredScreenshots.map(screenshot => (
            <div key={screenshot.id} className={`screenshot-card ${screenshot.is_flagged ? 'flagged' : ''} ${screenshot.type}`}>
              <div className="screenshot-type-badge">
                {screenshot.type === 'profile' ? '👤 Profile' : '📊 Verification'}
              </div>
              
              <div className="screenshot-image">
                <img 
                  src={screenshot.screenshot_url} 
                  alt={`${screenshot.trainer_name}'s screenshot`}
                  onClick={() => setSelectedImage(screenshot.screenshot_url)}
                />
                {screenshot.is_flagged && (
                  <div className="flag-indicator">🚩 Flagged</div>
                )}
              </div>
              
              <div className="screenshot-info">
                <h4>{screenshot.trainer_name}</h4>
                <p className="user-email">{screenshot.email}</p>
                <p className="upload-date">
                  Uploaded: {new Date(screenshot.created_at).toLocaleDateString()}
                </p>
                
                {screenshot.type === 'verification' && screenshot.entry_date && (
                  <p className="entry-date">
                    Entry Date: {new Date(screenshot.entry_date + 'T12:00:00Z').toLocaleDateString()}
                  </p>
                )}
                
                {screenshot.type === 'verification' && screenshot.stat_data && (
                  <div className="verification-stats">
                    <h5>📊 Stats Submitted:</h5>
                    <div className="stats-grid">
                      <span>XP: {screenshot.stat_data.total_xp?.toLocaleString()}</span>
                      <span>Caught: {screenshot.stat_data.pokemon_caught?.toLocaleString()}</span>
                      <span>Distance: {screenshot.stat_data.distance_walked?.toFixed(1)}km</span>
                      <span>Stops: {screenshot.stat_data.pokestops_visited?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                {screenshot.is_flagged && (
                  <div className="flag-info">
                    <p className="flag-reason">Reason: {screenshot.flagged_reason}</p>
                    <p className="flag-date">
                      Flagged: {screenshot.flagged_at ? new Date(screenshot.flagged_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                )}
              </div>

              <div className="screenshot-actions">
                {!screenshot.is_flagged ? (
                  <button 
                    onClick={() => {
                      const modal = document.createElement('div')
                      modal.className = 'flag-modal-container'
                      document.body.appendChild(modal)
                      
                      const handleFlag = (reason: string) => {
                        console.log('🚩 Submitting flag with reason:', reason)
                        handleFlagImage(screenshot.id, reason, screenshot.type)
                        document.body.removeChild(modal)
                      }
                      
                      const handleClose = () => {
                        document.body.removeChild(modal)
                      }
                      
                      modal.innerHTML = `
                        <div class="modal-overlay">
                          <div class="modal-content">
                            <h3>Flag Screenshot</h3>
                            <p class="modal-description">Please provide a reason for flagging this screenshot:</p>
                            <textarea 
                              id="flag-reason" 
                              placeholder="Enter reason for flagging (e.g., inappropriate content, fake screenshot, spam, etc.)"
                              rows="4"
                            ></textarea>
                            <div class="modal-actions">
                              <button id="cancel-flag">Cancel</button>
                              <button id="confirm-flag">Flag Screenshot</button>
                            </div>
                          </div>
                        </div>
                      `
                      
                      const textarea = modal.querySelector('#flag-reason') as HTMLTextAreaElement
                      const confirmBtn = modal.querySelector('#confirm-flag') as HTMLButtonElement
                      
                      // Focus the textarea
                      setTimeout(() => textarea.focus(), 100)
                      
                      // Enable/disable confirm button based on input
                      const updateConfirmButton = () => {
                        confirmBtn.disabled = !textarea.value.trim()
                      }
                      
                      textarea.addEventListener('input', updateConfirmButton)
                      updateConfirmButton() // Initial check
                      
                      modal.querySelector('#cancel-flag')?.addEventListener('click', handleClose)
                      confirmBtn.addEventListener('click', () => {
                        const reason = textarea.value.trim()
                        if (reason) {
                          handleFlag(reason)
                        }
                      })
                      modal.querySelector('.modal-overlay')?.addEventListener('click', handleClose)
                      
                      // Handle Enter key to submit (Shift+Enter for new line)
                      textarea.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          const reason = textarea.value.trim()
                          if (reason) {
                            handleFlag(reason)
                          }
                        }
                      })
                    }}
                    className="btn btn-warning"
                  >
                    🚩 Flag
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      console.log('✅ Unflag button clicked for screenshot:', {
                        screenshotId: screenshot.id,
                        trainerName: screenshot.trainer_name,
                        email: screenshot.email,
                        currentFlagStatus: screenshot.is_flagged,
                        flaggedReason: screenshot.flagged_reason,
                        flaggedAt: screenshot.flagged_at,
                        fullScreenshot: screenshot
                      })
                      handleUnflagImage(screenshot.id, screenshot.type)
                    }}
                    className="btn btn-success"
                  >
                    ✅ Unflag
                  </button>
                )}
                
                                 <button 
                   onClick={() => {
                     console.log('🗑️ Delete button clicked for screenshot:', {
                       screenshotId: screenshot.id,
                       trainerName: screenshot.trainer_name,
                       email: screenshot.email,
                       fullScreenshot: screenshot
                     })
                     handleDeleteImage(screenshot.id, screenshot.type)
                   }}
                   className="btn btn-danger"
                 >
                   🗑️ Delete
                 </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="image-modal-content">
            <img src={selectedImage} alt="Screenshot preview" />
            <button 
              className="close-modal"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}