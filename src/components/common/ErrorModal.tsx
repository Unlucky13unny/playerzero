import React from 'react'
import { X } from 'lucide-react'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = 'Wrong email or password',
  message = 'Login failed! Check your email and password.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
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
            <circle cx="30" cy="30" r="28" stroke="#DC2627" strokeWidth="4"/>
            <path d="M38 22L22 38M22 22L38 38" stroke="#DC2627" strokeWidth="4" strokeLinecap="round"/>
          </svg>
        </div>
        
        <h2 className="error-modal-title">{title}</h2>
        <p className="error-modal-message">{message}</p>
        
        <div className="error-modal-actions">
          <button 
            className="error-modal-btn error-modal-confirm" 
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
          <button 
            className="error-modal-btn error-modal-cancel" 
            onClick={onClose}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )
}
