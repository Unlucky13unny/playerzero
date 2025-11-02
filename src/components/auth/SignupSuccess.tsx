import { Link } from 'react-router-dom'
import { useMobile } from '../../hooks/useMobile'
import logoSvg from "/images/logo.svg"

export const SignupSuccess = () => {
  const isMobile = useMobile()
  
  return (
    <div className="split-layout" style={{ overflow: 'hidden' }}>
      <div className="split-layout-left" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', width: isMobile ? '100%' : '50%' }}>
        <div className="auth-container" style={{ maxWidth: '400px', padding: '2rem 1.5rem' }}>
          <div style={{ marginTop: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <img src={logoSvg} alt="PlayerZERO" style={{ width: '181px', height: '35px' }} />
          </div>
          
          <div className="auth-header" style={{ marginBottom: '0.75rem' }}>
            <h1 style={{ color: '#000000', fontSize: '1.75rem', fontWeight: 700, margin: 0, textAlign: 'center' }}>Sign Up Successful!</h1>
          </div>
          
          <div className="success-message" style={{ color: '#2ECC40', fontSize: '0.95rem', marginBottom: '1.25rem', textAlign: 'center', fontWeight: 500 }}>
            Your account has been created successfully.
          </div>
          
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '3.5rem', 
              height: '3.5rem', 
              margin: '1rem auto 1rem', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(48, 209, 88, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L9 17L19 7" stroke="#30d158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <p style={{ fontSize: '0.95rem', color: '#000000', marginBottom: '1rem', lineHeight: '1.5', fontWeight: 500 }}>
              Please check your email to confirm your account.
            </p>
            
            <p style={{ fontSize: '0.85rem', color: '#636874', marginBottom: '0.5rem', lineHeight: '1.5', padding: '0 0.5rem' }}>
              Once confirmed, you'll be guided through setting up your Pokémon GO profile with your trainer stats, team color, and more!
            </p>
          </div>
          
          <Link to="/login" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', textDecoration: 'none', backgroundColor: '#DC2627', color: '#FFFFFF', padding: '0.7rem 1.5rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', width: '100%' }}>
            Go to Login
          </Link>
        </div>
      </div>
      
      {!isMobile && (
        <div className="split-layout-right" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="welcome-message" style={{ maxWidth: '600px', padding: '2rem' }}>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 700, lineHeight: '1.2', marginBottom: '1rem', color: '#000000' }}>Welcome to PlayerZERO!</h1>
            <p style={{ fontSize: '1.15rem', color: '#6B7280', lineHeight: '1.7', marginTop: '1.5rem' }}>Get ready to connect with the Pokémon GO community and showcase your trainer achievements.</p>
          </div>
        </div>
      )}
    </div>
  )
} 