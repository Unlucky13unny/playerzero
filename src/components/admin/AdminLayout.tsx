import { type ReactNode } from 'react'
import { Logo } from '../common/Logo'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

type AdminLayoutProps = {
  children: ReactNode
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  
  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  return (
    <div className="app-container">
      {/* Admin Header */}
      <header className="header admin-header">
        <Link to="/admin/dashboard" className="logo">
          <Logo style={{ color: 'var(--white-pure)' }} />
        </Link>
        
        {/* Desktop and mobile menu */}
        <div className="nav-actions">
          {user ? (
            <>
              <span className="badge admin-badge">ADMIN</span>
              
              <div className="avatar admin-avatar">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              
              <Link to="/" className="nav-link">
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
            <Link to="/admin/login" className="nav-link">
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