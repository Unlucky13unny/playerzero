import { type ReactNode, useState, useEffect } from 'react'
import { Logo } from '../common/Logo'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTrialStatus } from '../../hooks/useTrialStatus'

type LayoutProps = {
  children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth()
  const trialStatus = useTrialStatus()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
    setMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const formatTrialTime = () => {
    const { timeRemaining } = trialStatus
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`
    } else if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`
    } else if (timeRemaining.minutes > 0) {
      return `${timeRemaining.minutes}m ${timeRemaining.seconds}s`
    } else {
      return `${timeRemaining.seconds}s`
    }
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <Link to="/" className="logo">
          <Logo style={{ color: 'var(--white-pure)' }} />
        </Link>
        
        {/* Trial Countdown in Navbar - Only for trial users */}
        {user && !trialStatus.isPaidUser && trialStatus.isInTrial && !trialStatus.loading && (
          <div className="trial-countdown-navbar">
            <span className="trial-countdown-icon">⏱️</span>
            <span className="trial-countdown-text">Trial: {formatTrialTime()}</span>
          </div>
        )}
        
        {/* Mobile menu button */}
        <button 
          className="mobile-menu-button" 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {mobileMenuOpen ? (
              <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            ) : (
              <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            )}
          </svg>
        </button>
        
        {/* Desktop and mobile menu */}
        <div className={`nav-actions ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
          {user ? (
            <>
              {!trialStatus.loading && (
                trialStatus.isPaidUser ? (
                  <span className="badge">PRO</span>
                ) : (
                  <Link to="/upgrade" className="nav-link highlight" onClick={() => setMobileMenuOpen(false)}>
                    Upgrade
                  </Link>
                )
              )}
              
              <div className="avatar">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              
              <Link to="/profile" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                Profile
              </Link>
              
              <button
                onClick={handleSignOut}
                className="nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                Sign in
              </Link>
              <Link to="/signup" className="nav-link button" onClick={() => setMobileMenuOpen(false)}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>
      
      {/* Main content */}
      <main className="main-content">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-info">
            <div className="footer-logo">
              <Logo size="small" style={{ color: 'var(--white-pure)' }} />
            </div>
            <p className="footer-copyright">
              © {new Date().getFullYear()} PlayerZERO. All rights reserved.
            </p>
          </div>
          <div className="footer-links">
            <a href="#" className="footer-link">
              Terms
            </a>
            <a href="#" className="footer-link">
              Privacy
            </a>
            <a href="#" className="footer-link">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
} 