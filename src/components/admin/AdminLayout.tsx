import { type ReactNode, useState } from 'react'
import { Logo } from '../common/Logo'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

type AdminLayoutProps = {
  children: ReactNode
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
    setMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <div className="app-container">
      {/* Admin Header */}
      <header className="header admin-header">
        <Link to="/admin/dashboard" className="logo">
          <Logo style={{ color: 'var(--white-pure)' }} />
          <span style={{ 
            marginLeft: '0.5rem', 
            padding: '0.25rem 0.5rem', 
            background: 'linear-gradient(135deg, #8B0000, #B91C1C)',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            ADMIN
          </span>
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
              <span className="badge admin-badge">ADMIN</span>
              
              <div className="avatar admin-avatar">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              
              <Link to="/" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                User View
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
            <Link to="/admin/login" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Admin Login
            </Link>
          )}
        </div>
      </header>
      
      {/* Main content */}
      <main className="main-content admin-content">
        {children}
      </main>
      
      {/* Admin Footer */}
      <footer className="footer admin-footer">
        <div className="footer-content">
          <div className="footer-info">
            <div className="footer-logo">
              <Logo size="small" style={{ color: 'var(--white-pure)' }} />
              <span style={{ 
                marginLeft: '0.5rem', 
                fontSize: '0.75rem',
                color: '#B91C1C',
                fontWeight: '600'
              }}>
                Admin Panel
              </span>
            </div>
            <p className="footer-copyright">
              © {new Date().getFullYear()} PlayerZERO Admin. Secure access only.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
} 