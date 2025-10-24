import { useState } from 'react'
import { reportService } from '../../services/reportService'
import '../../styles/report-modal.css'

interface ReportModalProps {
  screenshotId: string
  reportedUserId: string
  screenshotUrl: string
  onClose: () => void
  onReportSubmitted?: () => void
}

export const ReportModal = ({ 
  screenshotId, 
  reportedUserId, 
  screenshotUrl: _screenshotUrl, // Prefixed with underscore to indicate intentionally unused
  onClose,
  onReportSubmitted
}: ReportModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await reportService.submitReport(
        screenshotId,
        reportedUserId,
        'Suspicious stats reported', // Default reason
        undefined // No additional notes
      )

      if (error) {
        if (error.message?.includes('already reported')) {
          setError('You have already reported this screenshot')
        } else {
          setError('Failed to submit report. Please try again.')
        }
        setIsSubmitting(false)
        return
      }

      // Show success state
      setSuccess(true)
      
      // Call callback if provided
      if (onReportSubmitted) {
        onReportSubmitted()
      }

      // Auto-close after 1.5 seconds
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      console.error('Error submitting report:', err)
      setError('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="report-modal-overlay" onClick={onClose}>
        <div className="report-modal-content success" onClick={(e) => e.stopPropagation()}>
          <div className="report-success-icon">✓</div>
          <h2>Report Submitted</h2>
          <p>Thank you for helping keep our community fair and honest.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-content simple" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-inner">
          {/* Warning Icon SVG */}
          <div className="report-warning-icon">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M36 9L9 63H63L36 9Z" fill="#DC2627" fillOpacity="0.1" stroke="#DC2627" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M36 27V39" stroke="#DC2627" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="36" cy="49" r="2.5" fill="#DC2627"/>
            </svg>
          </div>

          <div className="report-text-container">
            <h2 className="report-modal-title">Report Suspicious Stats</h2>

            <p className="report-modal-description">
              Please let us know if you think these stats may be inaccurate. Our team will review the report and take action if necessary.
            </p>

            {error && (
              <div className="report-error-message">
                {error}                         
              </div>
            )}
          </div>

          <div className="report-modal-actions">
            <button
              type="button"
              className="report-btn-submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Report'}
            </button>
            <button
              type="button"
              className="report-btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

