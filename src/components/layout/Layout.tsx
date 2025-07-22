import { type ReactNode, useState, useEffect } from 'react'
import { Logo } from '../common/Logo'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { NotificationBell } from '../common/NotificationBell'

type LayoutProps = {
  children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth()
  const trialStatus = useTrialStatus()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [featuresDropdownOpen, setFeaturesDropdownOpen] = useState(false)
  
  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
    setMobileMenuOpen(false)
  }

  const toggleFeaturesDropdown = () => {
    setFeaturesDropdownOpen(!featuresDropdownOpen)
  }

  const formatTrialTime = () => {
    const { timeRemaining } = trialStatus
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days} day${timeRemaining.days !== 1 ? 's' : ''} remaining`
    }
    return 'Less than a day remaining'
  }

  const isActiveRoute = (path: string) => {
    return location.pathname === path
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('features-dropdown')
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setFeaturesDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <Link to="/UserProfile" className="logo">
          <Logo style={{ color: 'var(--white-pure)' }} />
        </Link>
        
        {/* Private Mode Countdown - Only for active private mode users */}
        {user && !trialStatus.isPaidUser && trialStatus.isInTrial && !trialStatus.loading && (
          <div className="private-mode-countdown">
            <span className="private-mode-text">Private Mode: {formatTrialTime()}</span>
          </div>
        )}

        {/* Navigation Links */}
        {user && (
          <nav className="nav-links">
            <Link 
              to="/UserProfile" 
              className={`nav-button ml-auto ${isActiveRoute('/UserProfile') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="7" r="4" />
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              </svg>
              Profile
            </Link>
            <Link 
              to="/leaderboards" 
              className={`nav-button ${isActiveRoute('/leaderboards') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="8" height="8" />
                <rect x="14" y="2" width="8" height="8" />
                <rect x="2" y="14" width="8" height="8" />
                <rect x="14" y="14" width="8" height="8" />
              </svg>
              Leaderboard
            </Link>
            
            <NotificationBell />
          </nav>
        )}
        
        {/* Desktop and mobile menu */}
        <div className={`nav-actions ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
          {user ? (
            <>
              {/* Features Dropdown */}
              <div className="features-dropdown-container" id="features-dropdown">
                <button 
                  className="nav-button icon-only"
                  onClick={toggleFeaturesDropdown}
                  title="Features"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M3 6h18M3 12h18M3 18h18"></path>
                  </svg>
                </button>
                
                {featuresDropdownOpen && (
                  <div className="features-dropdown-menu">
                    <Link 
                      to="/profile?edit=true" 
                      className="dropdown-item"
                      onClick={() => setFeaturesDropdownOpen(false)}
                    >
                      ✏️ Edit Profile
                    </Link>
                    <Link 
                      to="/update-stats" 
                      className="dropdown-item"
                      onClick={() => setFeaturesDropdownOpen(false)}
                    >
                      📊 Update Stats
                    </Link>
                    <Link 
                      to="/calculators" 
                      className="dropdown-item"
                      onClick={() => setFeaturesDropdownOpen(false)}
                    >
                      🧮 Calculators
                    </Link>
                    <Link 
                      to="/search" 
                      className="dropdown-item"
                      onClick={() => setFeaturesDropdownOpen(false)}
                    >
                      🔍 Search Users
                    </Link>
                  </div>
                )}
              </div>

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