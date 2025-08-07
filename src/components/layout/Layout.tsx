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
        {/* Mobile Layout */}
        <div className="mobile-header-container mobile-only">
          <div className="mobile-header-left">
            {user && (
              <button 
                className="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                )}
              </button>
            )}
          </div>
          
          <Link to="/UserProfile" className="logo mobile-logo">
            <Logo style={{ width: '93%',marginRight: '45%',marginLeft: '-1%' ,marginTop:"3%",color: 'var(--white-pure)' }} />
          </Link>

          <div className="mobile-header-right">
            {user && <NotificationBell />}
          </div>
        </div>

        {/* Desktop Logo */}
        <Link to="/UserProfile" className="logo desktop-only">
          <Logo style={{ color: 'var(--white-pure)' }} />
        </Link>
        
        {/* Private Mode Countdown - Only for active private mode users */}
        {user && !trialStatus.isPaidUser && trialStatus.isInTrial && !trialStatus.loading && (
          <div className="private-mode-countdown desktop-only">
            <span className="private-mode-text">Private Mode: {formatTrialTime()}</span>
          </div>
        )}

        {/* Desktop Navigation */}
        {user && (
          <nav className="nav-links desktop-only">
            <Link 
              to="/UserProfile" 
              className={`nav-button ${isActiveRoute('/UserProfile') ? 'active' : ''}`}
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
        
        {/* Desktop Actions */}
        <div className="nav-actions desktop-only">
          {user ? (
            <>
              {/* Quick Navigation Buttons */}
              <div className="quick-nav-buttons">
                {/* Profile and Leaderboard buttons removed */}
              </div>

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
                    <Link 
                      to="/contact" 
                      className="dropdown-item"
                      onClick={() => setFeaturesDropdownOpen(false)}
                    >
                      💬 Help & Support
                    </Link>
                  </div>
                )}
              </div>

              {!trialStatus.loading && (
                trialStatus.isPaidUser ? (
                  <span className="badge">PRO</span>
                ) : (
                  <Link to="/upgrade" className="nav-link highlight">
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
              <Link to="/login" className="nav-link">
                Sign in
              </Link>
              <Link to="/signup" className="nav-link button">
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {user && (
          <>
            {mobileMenuOpen && (
              <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}></div>
            )}
            
            <div className={`mobile-menu ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
              <div className="mobile-menu-header">
                <div className="avatar">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <div className="user-email">{user.email}</div>
                {!trialStatus.loading && (
                  trialStatus.isPaidUser ? (
                    <span className="badge">PRO</span>
                  ) : trialStatus.isInTrial ? (
                    <div className="trial-info">
                      Private Mode: {formatTrialTime()}
                    </div>
                  ) : null
                )}
              </div>

              <div className="mobile-menu-section">
                <Link 
                  to="/UserProfile" 
                  className={`mobile-menu-item ${isActiveRoute('/UserProfile') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  </svg>
                  Home
                </Link>

                <Link 
                  to="/leaderboards" 
                  className={`mobile-menu-item ${isActiveRoute('/leaderboards') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  </svg>
                  Leaderboards
                </Link>

                <Link 
                  to="/search" 
                  className={`mobile-menu-item ${isActiveRoute('/search') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  Search Users
                </Link>

                <Link 
                  to="/profile?edit=true" 
                  className={`mobile-menu-item ${location.search.includes('edit=true') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Edit Profile
                </Link>

                <Link 
                  to="/update-stats" 
                  className={`mobile-menu-item ${isActiveRoute('/update-stats') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="20" x2="12" y2="10"></line>
                    <line x1="18" y1="20" x2="18" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="16"></line>
                  </svg>
                  Update Stats
                </Link>

                <Link 
                  to="/calculators" 
                  className={`mobile-menu-item ${isActiveRoute('/calculators') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                    <rect x="9" y="9" width="6" height="6"></rect>
                    <line x1="9" y1="1" x2="9" y2="4"></line>
                    <line x1="15" y1="1" x2="15" y2="4"></line>
                    <line x1="9" y1="20" x2="9" y2="23"></line>
                    <line x1="15" y1="20" x2="15" y2="23"></line>
                  </svg>
                  Calculators
                </Link>

                <Link 
                  to="/contact" 
                  className={`mobile-menu-item ${isActiveRoute('/contact') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  Help & Support
                </Link>
              </div>

              <div className="mobile-menu-section">
                {!trialStatus.loading && !trialStatus.isPaidUser && (
                  <Link 
                    to="/upgrade" 
                    className="mobile-menu-item button"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    Upgrade to Premium
                  </Link>
                )}

                <button
                  onClick={handleSignOut}
                  className="mobile-menu-item"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
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
            <Link to="/contact" className="footer-link">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
} 