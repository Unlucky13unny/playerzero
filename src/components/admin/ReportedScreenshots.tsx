import { useState, useEffect } from 'react'
import { reportService, type ReportedScreenshot, type ReportWithDetails } from '../../services/reportService'
import '../../styles/admin.css'

export const ReportedScreenshots = () => {
  const [reportedScreenshots, setReportedScreenshots] = useState<ReportedScreenshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedScreenshot, setSelectedScreenshot] = useState<ReportedScreenshot | null>(null)
  const [reports, setReports] = useState<ReportWithDetails[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [processingAction, setProcessingAction] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'high_priority' | 'pending'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    loadReportedScreenshots()
  }, [])

  const loadReportedScreenshots = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await reportService.getAllReportedScreenshots()
      
      if (error) {
        setError('Failed to load reported screenshots')
        console.error('Error loading reported screenshots:', error)
        return
      }

      setReportedScreenshots(data || [])
    } catch (err) {
      setError('Failed to load reported screenshots')
      console.error('Error loading reported screenshots:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadReportsForScreenshot = async (screenshotId: string) => {
    try {
      setLoadingReports(true)
      const { data, error } = await reportService.getReportsForScreenshot(screenshotId)
      
      if (error) {
        console.error('Error loading reports:', error)
        return
      }

      setReports(data || [])
    } catch (err) {
      console.error('Error loading reports:', err)
    } finally {
      setLoadingReports(false)
    }
  }

  const handleScreenshotClick = async (screenshot: ReportedScreenshot) => {
    setSelectedScreenshot(screenshot)
    await loadReportsForScreenshot(screenshot.screenshot_id)
  }

  const handleCloseDetails = () => {
    setSelectedScreenshot(null)
    setReports([])
  }

  const handleBlockUser = async (userId: string, trainerName: string) => {
    const reason = prompt(`Enter reason for blocking "${trainerName}":`)
    
    if (!reason) return

    try {
      setProcessingAction(true)
      const { error } = await reportService.blockUser(userId, reason)
      
      if (error) {
        alert('Failed to block user. Please try again.')
        return
      }

      alert(`User "${trainerName}" has been blocked successfully.`)
      
      // Reload data
      await loadReportedScreenshots()
      if (selectedScreenshot) {
        await loadReportsForScreenshot(selectedScreenshot.screenshot_id)
      }
    } catch (err) {
      console.error('Error blocking user:', err)
      alert('Failed to block user. Please try again.')
    } finally {
      setProcessingAction(false)
    }
  }

  const handleUnblockUser = async (userId: string, trainerName: string) => {
    if (!confirm(`Are you sure you want to unblock "${trainerName}"?`)) return

    try {
      setProcessingAction(true)
      const { error } = await reportService.unblockUser(userId)
      
      if (error) {
        alert('Failed to unblock user. Please try again.')
        return
      }

      alert(`User "${trainerName}" has been unblocked successfully.`)
      
      // Reload data
      await loadReportedScreenshots()
      if (selectedScreenshot) {
        await loadReportsForScreenshot(selectedScreenshot.screenshot_id)
      }
    } catch (err) {
      console.error('Error unblocking user:', err)
      alert('Failed to unblock user. Please try again.')
    } finally {
      setProcessingAction(false)
    }
  }

  const handleDismissAllReports = async (screenshotId: string) => {
    const adminNotes = prompt('Optional: Add notes about why these reports are being dismissed:')

    try {
      setProcessingAction(true)
      const { error } = await reportService.dismissAllReports(screenshotId, adminNotes || undefined)
      
      if (error) {
        alert('Failed to dismiss reports. Please try again.')
        return
      }

      alert('All pending reports have been dismissed.')
      
      // Reload data
      await loadReportedScreenshots()
      await loadReportsForScreenshot(screenshotId)
    } catch (err) {
      console.error('Error dismissing reports:', err)
      alert('Failed to dismiss reports. Please try again.')
    } finally {
      setProcessingAction(false)
    }
  }

  const filteredScreenshots = reportedScreenshots.filter(screenshot => {
    // Filter by type
    let matchesFilter = true
    if (filterType === 'high_priority') matchesFilter = screenshot.report_count >= 5
    if (filterType === 'pending') matchesFilter = screenshot.pending_reports > 0
    
    // Filter by search term
    let matchesSearch = true
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      matchesSearch = screenshot.trainer_name.toLowerCase().includes(search)
    }
    
    return matchesFilter && matchesSearch
  })

  const highPriorityCount = reportedScreenshots.filter(s => s.report_count >= 5).length
  const pendingCount = reportedScreenshots.filter(s => s.pending_reports > 0).length

  if (loading) {
    return <div className="loading">Loading reported screenshots...</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  return (
    <div className="screenshot-moderation">
      <div className="section-header">
        <h2>Reported Screenshots</h2>
        <p>Review user reports of suspicious stats and take appropriate action</p>
      </div>

      <div className="moderation-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by trainer name..."
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
            All Reports ({reportedScreenshots.length})
          </button>
          <button 
            onClick={() => setFilterType('high_priority')}
            className={`filter-btn ${filterType === 'high_priority' ? 'active' : ''} ${highPriorityCount > 0 ? 'priority' : ''}`}
          >
            🚨 High Priority ({highPriorityCount})
          </button>
          <button 
            onClick={() => setFilterType('pending')}
            className={`filter-btn ${filterType === 'pending' ? 'active' : ''}`}
          >
            ⏳ Pending Review ({pendingCount})
          </button>
        </div>

        <button onClick={loadReportedScreenshots} className="btn btn-secondary refresh-btn">
          🔄 Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-number">{reportedScreenshots.length}</div>
          <div className="stat-label">Total Reported Screenshots</div>
        </div>
        <div className="stat-card priority">
          <div className="stat-number">{highPriorityCount}</div>
          <div className="stat-label">High Priority (5+ Reports)</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{pendingCount}</div>
          <div className="stat-label">Pending Review</div>
        </div>
      </div>

      {/* Screenshots Grid */}
      <div className="screenshots-grid">
        {filteredScreenshots.length === 0 ? (
          <div className="no-screenshots">
            {filterType === 'all' ? 'No reported screenshots found' : `No ${filterType.replace('_', ' ')} screenshots found`}
          </div>
        ) : (
          filteredScreenshots.map(screenshot => (
            <div 
              key={screenshot.screenshot_id} 
              className={`screenshot-card ${screenshot.report_count >= 5 ? 'high-priority' : ''} ${screenshot.is_blocked ? 'blocked-user' : ''}`}
              onClick={() => handleScreenshotClick(screenshot)}
            >
              {/* Priority Badge */}
              {screenshot.report_count >= 5 && (
                <div className="priority-badge">🚨 HIGH PRIORITY</div>
              )}

              {/* Blocked Badge */}
              {screenshot.is_blocked && (
                <div className="blocked-badge">🚫 USER BLOCKED</div>
              )}
              
              <div className="screenshot-image">
                <img 
                  src={screenshot.screenshot_url} 
                  alt={`${screenshot.trainer_name}'s screenshot`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImage(screenshot.screenshot_url)
                  }}
                />
                <div className="report-count-overlay">
                  🚩 {screenshot.report_count} {screenshot.report_count === 1 ? 'Report' : 'Reports'}
                </div>
              </div>
              
              <div className="screenshot-info">
                <h4>{screenshot.trainer_name}</h4>
                <p className="upload-date">
                  Entry Date: {new Date(screenshot.entry_date + 'T12:00:00Z').toLocaleDateString()}
                </p>
                <p className="upload-date">
                  Last Report: {new Date(screenshot.last_report_date).toLocaleDateString()}
                </p>

                {screenshot.is_blocked && screenshot.blocked_reason && (
                  <div className="blocked-info">
                    <p className="blocked-reason">Blocked: {screenshot.blocked_reason}</p>
                  </div>
                )}

                <div className="stats-summary">
                  <span>XP: {screenshot.total_xp?.toLocaleString()}</span>
                  <span>Caught: {screenshot.pokemon_caught?.toLocaleString()}</span>
                  <span>Distance: {screenshot.distance_walked?.toFixed(1)}km</span>
                </div>

                <div className="report-status-badges">
                  <span className="report-badge total">
                    Total: {screenshot.total_reports}
                  </span>
                  {screenshot.pending_reports > 0 && (
                    <span className="report-badge pending">
                      Pending: {screenshot.pending_reports}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Screenshot Details Modal */}
      {selectedScreenshot && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Report Details - {selectedScreenshot.trainer_name}</h3>
              <button 
                onClick={handleCloseDetails}
                className="modal-close"
                type="button"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* Screenshot Preview */}
              <div className="report-details-grid">
                <div className="screenshot-preview">
                  <img 
                    src={selectedScreenshot.screenshot_url} 
                    alt="Screenshot"
                    onClick={() => setSelectedImage(selectedScreenshot.screenshot_url)}
                  />
                  <div className="screenshot-stats">
                    <h4>Submitted Stats</h4>
                    <div className="stat-row">
                      <span>Total XP:</span>
                      <strong>{selectedScreenshot.total_xp?.toLocaleString()}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Pokémon Caught:</span>
                      <strong>{selectedScreenshot.pokemon_caught?.toLocaleString()}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Distance:</span>
                      <strong>{selectedScreenshot.distance_walked?.toFixed(1)} km</strong>
                    </div>
                    <div className="stat-row">
                      <span>PokéStops:</span>
                      <strong>{selectedScreenshot.pokestops_visited?.toLocaleString()}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Pokédex:</span>
                      <strong>{selectedScreenshot.unique_pokedex_entries}</strong>
                    </div>
                    <div className="stat-row">
                      <span>Level:</span>
                      <strong>{selectedScreenshot.trainer_level}</strong>
                    </div>
                  </div>
                </div>

                {/* Reports List */}
                <div className="reports-list">
                  <h4>Individual Reports ({reports.length})</h4>
                  
                  {loadingReports ? (
                    <div className="loading-indicator">Loading reports...</div>
                  ) : reports.length === 0 ? (
                    <div className="no-reports">No reports found</div>
                  ) : (
                    <div className="reports-container">
                      {reports.map((report) => (
                        <div key={report.id} className={`report-item ${report.status}`}>
                          <div className="report-header">
                            <span className="reporter-name">
                              {report.reporter_trainer_name}
                            </span>
                            <span className={`report-status-badge ${report.status}`}>
                              {report.status}
                            </span>
                          </div>
                          <div className="report-reason">
                            <strong>Reason:</strong> {report.reason}
                          </div>
                          {report.additional_notes && (
                            <div className="report-notes">
                              <strong>Notes:</strong> {report.additional_notes}
                            </div>
                          )}
                          <div className="report-date">
                            Reported: {new Date(report.created_at).toLocaleString()}
                          </div>
                          {report.admin_notes && (
                            <div className="admin-notes">
                              <strong>Admin Notes:</strong> {report.admin_notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Actions */}
              <div className="admin-actions">
                <h4>Admin Actions</h4>
                <div className="action-buttons-group">
                  {!selectedScreenshot.is_blocked ? (
                    <button
                      onClick={() => handleBlockUser(selectedScreenshot.screenshot_owner_id, selectedScreenshot.trainer_name)}
                      className="btn btn-danger"
                      disabled={processingAction}
                    >
                      🚫 Block User
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnblockUser(selectedScreenshot.screenshot_owner_id, selectedScreenshot.trainer_name)}
                      className="btn btn-success"
                      disabled={processingAction}
                    >
                      ✅ Unblock User
                    </button>
                  )}

                  {selectedScreenshot.pending_reports > 0 && (
                    <button
                      onClick={() => handleDismissAllReports(selectedScreenshot.screenshot_id)}
                      className="btn btn-secondary"
                      disabled={processingAction}
                    >
                      ✓ Dismiss All Pending Reports
                    </button>
                  )}
                </div>

                {selectedScreenshot.is_blocked && selectedScreenshot.blocked_reason && (
                  <div className="block-info">
                    <strong>Block Reason:</strong> {selectedScreenshot.blocked_reason}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

