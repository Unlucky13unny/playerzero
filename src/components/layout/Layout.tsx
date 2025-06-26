import { type ReactNode, useState, useEffect } from 'react'
import { Logo } from '../common/Logo'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { profileService } from '../../services/profileService'

type LayoutProps = {
  children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, userMetadata, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isPaidUser, setIsPaidUser] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  
  useEffect(() => {
    if (user) {
      checkPaidStatus()
    } else {
      setIsPaidUser(false)
      setProfileLoading(false)
    }
  }, [user])

  const checkPaidStatus = async () => {
    try {
      setProfileLoading(true)
      const { isPaid } = await profileService.isPaidUser()
      setIsPaidUser(isPaid)
    } catch (error) {
      console.error('Error checking paid status:', error)
      setIsPaidUser(false)
    } finally {
      setProfileLoading(false)
    }
  }
  
  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
    setMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <Link to="/" className="logo">
          <Logo style={{ color: 'var(--white-pure)' }} />
        </Link>
        
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
              {!profileLoading && (
                isPaidUser ? (
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