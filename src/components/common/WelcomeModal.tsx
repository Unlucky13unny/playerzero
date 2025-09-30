import React from 'react'
import logoSvg from "/images/logo.svg"
import './WelcomeModal.css'

interface WelcomeModalProps {
  isOpen: boolean
  onContinue: () => void
  userName?: string
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onContinue }) => {
  if (!isOpen) return null

  return (
    <div className="welcome-modal-overlay">
      <div className="welcome-modal-content">
        <div className="welcome-modal-header">
          <h2>Welcome to</h2>
          <img src={logoSvg} alt="PlayerZERO" className="welcome-modal-logo" />
        </div>
        
        <button 
          className="welcome-continue-btn"
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

