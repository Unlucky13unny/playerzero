import { type ReactNode, useState, useEffect } from 'react'
import { Logo } from '../common/Logo'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTrialStatus } from '../../hooks/useTrialStatus'

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

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
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
        <Link to="/home" className="logo">
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
              to="/home" 
              className={`nav-button ${isActiveRoute('/home') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Home
            </Link>

            <Link 
              to="/dashboard" 
              className={`nav-button ${isActiveRoute('/dashboard') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Dashboard
            </Link>
            <Link 
              to="/profile" 
              className={`nav-button ${isActiveRoute('/profile') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Profile
            </Link>
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3v18M3 12h18M3 6h18M3 18h18"></path>
                  </svg>
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    className={`dropdown-arrow ${featuresDropdownOpen ? 'open' : ''}`}
                  >
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </button>
                
                {featuresDropdownOpen && (
                  <div className="features-dropdown-menu">
                    <Link 
                      to="/dashboard?tab=calculators" 
                      className="dropdown-item"
                      onClick={() => setFeaturesDropdownOpen(false)}
                    >
                      🧮 Grind Calculator
                    </Link>
                    <Link 
                      to="/dashboard?tab=calculators&calc=community" 
                      className="dropdown-item"
                      onClick={() => setFeaturesDropdownOpen(false)}
                    >
                      🎉 Community Day Calculator
                    </Link>
                    <Link 
                      to="/dashboard?tab=leaderboards" 
                      className="dropdown-item"
                      onClick={() => setFeaturesDropdownOpen(false)}
                    >
                      🏆 Leaderboards
                    </Link>
                    <Link 
                      to="/dashboard?tab=leaderboards&view=search" 
                      className="dropdown-item"
                      onClick={() => setFeaturesDropdownOpen(false)}
                    >
                      🔍 Search Users
                    </Link>
                    <Link 
                      to="/dashboard?tab=analytics&analyticsTab=performance" 
                      className="dropdown-item"
                      onClick={() => setFeaturesDropdownOpen(false)}
                    >
                      📈 Performance Analytics
                    </Link>
                    <Link 
                      to="/dashboard?tab=analytics&analyticsTab=export" 
                      className="dropdown-item"
                      onClick={() => setFeaturesDropdownOpen(false)}
                    >
                      📤 Visual Export
                    </Link>
                    <Link 
                      to="/dashboard?tab=update" 
                      className="dropdown-item"
                      onClick={() => setFeaturesDropdownOpen(false)}
                    >
                      📊 Update Stats
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