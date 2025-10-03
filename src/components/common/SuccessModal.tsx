import React from 'react'
import { X } from 'lucide-react'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  confirmText?: string
  onConfirm?: () => void
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = 'SUCCESS!',
  message = 'Success! Stats updated',
  confirmText = 'Okay',
  onConfirm,
}) => {
  if (!isOpen) return null

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  return (
    <div className="error-modal-overlay" onClick={onClose}>
      <div className="error-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="error-modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="error-modal-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="30" r="28" stroke="#2BC49C" strokeWidth="4"/>
            <path d="M18 30L26 38L42 22" stroke="#2BC49C" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h2 className="error-modal-title" style={{ color: '#2BC49C' }}>{title}</h2>
        <p className="error-modal-message">{message}</p>
        
        <div className="error-modal-actions">
          <button 
            className="error-modal-btn error-modal-confirm" 
            onClick={handleConfirm}
            style={{
              background: '#2BC49C'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#24a687'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#2BC49C'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

