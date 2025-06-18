import { Link } from 'react-router-dom'
import { Logo } from '../common/Logo'

export const SignupSuccess = () => {
  return (
    <div className="split-layout">
      <div className="split-layout-left">
        <div className="auth-container">
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
            <Logo style={{ color: 'var(--white-pure)', fontSize: '2rem' }} />
          </div>
          
          <div className="auth-header">
            <h1>Sign Up Successful!</h1>
          </div>
          
          <div className="success-message">
            Your account has been created successfully.
          </div>
          
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              width: '4rem', 
              height: '4rem', 
              margin: '2rem auto', 
              borderRadius: '50%', 
              backgroundColor: 'rgba(48, 209, 88, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L9 17L19 7" stroke="#30d158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            
            <p style={{ fontSize: 'var(--font-md)', color: 'var(--white-muted)', marginBottom: '1rem' }}>
              Please check your email to confirm your account.
            </p>
            
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--white-muted)', marginBottom: '2rem' }}>
              Once confirmed, you'll be guided through setting up your Pokémon GO profile with your trainer stats, team color, and more!
            </p>
          </div>
          
          <Link to="/login" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Go to Login
          </Link>
        </div>
      </div>
      
      <div className="split-layout-right">
        <div className="welcome-message">
          <h1>Welcome to PlayerZERO!</h1>
          <p>Get ready to connect with the Pokémon GO community and showcase your trainer achievements.</p>
        </div>
      </div>
    </div>
  )
} 