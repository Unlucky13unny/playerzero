import { type ReactNode, useState, useEffect } from 'react'
import { Logo } from '../common/Logo'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { NotificationBell } from '../common/NotificationBell'
import { Menu, User, Trophy } from "lucide-react"
import { Button } from "../ui/button"
import { Crown } from "../icons/Crown"
import { useMobile } from "../../hooks/useMobile"

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
  const isMobile = useMobile()
  
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
      {/* Header - Updated to match figma-ui design */}
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <Link to="/UserProfile" className="text-xl font-bold text-black">
            Player<span className="font-normal">ZER⊘</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {!isMobile && user && (
            <>
              <Link to="/UserProfile">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-500 hover:bg-red-50 bg-transparent w-32"
                >
                  <User className="w-4 h-4 mr-1" />
                  Profile
                </Button>
              </Link>
              <Link to="/leaderboards">
                <Button variant="outline" size="sm" className="text-black border-black hover:bg-gray-50 w-32">
                  <Trophy className="w-4 h-4 mr-1" />
                  Leaderboard
                </Button>
              </Link>
            </>
          )}

          {user && (
            <>
              {!trialStatus.isPaidUser && !isMobile && (
                <button 
                  onClick={() => navigate('/upgrade')}
                  className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                  title="Upgrade to Premium"
                >
                  <Crown className="w-4 h-4 text-white" />
                </button>
              )}
              <NotificationBell />
            </>
          )}

          {/* Features Dropdown */}
          <div className="relative" id="features-dropdown">
            <button
              onClick={toggleFeaturesDropdown}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              title="Menu"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {featuresDropdownOpen && (
              <div className="layout-menu-dropdown">
              
                
                <Link
                  to="/profile?edit=true"
                  onClick={() => setFeaturesDropdownOpen(false)}
                  className="layout-menu-item"
                >
                
                  Profile Settings
                </Link>
                
                <Link
                  to="/update-stats"
                  onClick={() => setFeaturesDropdownOpen(false)}
                  className="layout-menu-item"
                >
                  Update Stats
                </Link>
                
                <Link
                  to="/calculators"
                  onClick={() => setFeaturesDropdownOpen(false)}
                  className="layout-menu-item"
                >
                 Calculators
                </Link>
                
                <Link
                  to="/search"
                  onClick={() => setFeaturesDropdownOpen(false)}
                  className="layout-menu-item"
                >
                  Search Users
                </Link>
                
                <Link
                  to="/contact"
                  onClick={() => setFeaturesDropdownOpen(false)}
                  className="layout-menu-item"
                >
                  Help & Support
                </Link>

                <div className="layout-menu-separator">
                  <button
                    onClick={handleSignOut}
                    className="layout-menu-item"
                  >
                     Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Old Header - Keep for backwards compatibility but hidden */}
      <header className="header" style={{ display: 'none' }}>
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
            <Logo style={{ width: '93%', marginRight: '45%', marginLeft: '-1%', marginTop: "3%", color: '#000000' }} />
          </Link>

          <div className="mobile-header-right">
            {user && <NotificationBell />}
          </div>
        </div>

        {/* Desktop Logo */}
        <Link to="/UserProfile" className="logo desktop-only">
          <Logo style={{ color: '#000000' }} />
        </Link>
        
        {/* Private Mode Countdown - Only for active private mode users */}
        {user && !trialStatus.isPaidUser && trialStatus.isInTrial && !trialStatus.loading && (
          <div className="private-mode-countdown desktop-only">
            <span className="private-mode-text">Private Mode: {formatTrialTime()}</span>
          </div>
        )}

        {/* Desktop Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
          {user && (
            <>
              <div style={{ marginRight: 'auto' }}>
                {/* Left side - empty or can be used for logo/branding */}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link 
                  to="/UserProfile" 
                  className={`nav-button ${isActiveRoute('/UserProfile') ? 'active' : ''}`}
                  style={{
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    backgroundColor: 'transparent',
                    borderRadius: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.backgroundColor = '#fef2f2';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.backgroundColor = 'transparent';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.25rem' }}>
                    <circle cx="12" cy="7" r="4" />
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  </svg>
                  Profile
                </Link>
                <Link 
                  to="/leaderboards" 
                  className={`nav-button ${isActiveRoute('/leaderboards') ? 'active' : ''}`}
                  style={{
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    backgroundColor: 'transparent',
                    borderRadius: '0.375rem',
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.backgroundColor = '#f9fafb';
                    target.style.borderColor = '#9ca3af';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.backgroundColor = 'transparent';
                    target.style.borderColor = '#d1d5db';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.25rem' }}>
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                    <path d="M14 9h1.5a2.5 2.5 0 0 1 0 5H14"></path>
                    <path d="M6 9v6"></path>
                    <path d="M14 9v6"></path>
                    <path d="M6 15h8"></path>
                    <path d="M8 9h4"></path>
                    <path d="M8 15v6"></path>
                    <path d="M12 15v6"></path>
                  </svg>
                  Leaderboard
                </Link>
                <NotificationBell />
                
                {/* Features Dropdown */}
                <div className="features-dropdown-container" id="features-dropdown">
                  <button 
                    className="nav-button icon-only"
                    onClick={toggleFeaturesDropdown}
                    title="Features"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      marginLeft: '0.25rem'
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="3">
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
                      <button
                        onClick={handleSignOut}
                        className="dropdown-item"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Desktop Actions */}
        <div className="nav-actions desktop-only">
          {user ? (
            <div className="quick-nav-buttons">
              {/* Profile and Leaderboard buttons removed */}
            </div>
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
      
      {/* Footer - Hide on leaderboard page in web view */}
      {!(location.pathname === '/leaderboards' && !isMobile) && (
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-info">
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
      )}
    </div>
  )
} 
