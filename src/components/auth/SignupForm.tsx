import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../common/Logo'

type UserMetadata = {
  role: 'free' | 'paid'
}

type ErrorState = {
  message: string;
}

export const SignupForm = () => {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const validateInputs = (): boolean => {
    if (password !== confirmPassword) {
      setError({ message: 'Passwords do not match' })
      return false
    }

    if (username.length < 3) {
      setError({ message: 'Username must be at least 3 characters long' })
      return false
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError({ message: 'Username can only contain letters, numbers, underscores, and hyphens' })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateInputs()) {
      return
    }
    
    setLoading(true)
    
    try {
      const metadata: UserMetadata = {
        role: 'free'
      }
      
      const { error: signUpError } = await signUp(email, password, metadata, username)
      
      if (signUpError) {
        if (signUpError.code === '23505') {
          setError({ message: 'Username already taken' })
        } else {
          setError({ message: signUpError.message })
        }
      } else {
        // Only navigate on success
        navigate('/signup-success')
      }
    } catch (err: any) {
      setError({ message: 'An unexpected error occurred' })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="split-layout">
      <div className="split-layout-left">
        <div className="auth-container">
          <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
            <Logo style={{ color: 'var(--white-pure)', fontSize: '2rem' }} />
          </div>
          
          <div className="auth-header">
            <h1>Create your account</h1>
          </div>
          
          {error && (
            <div className="error-message">
              <p>{error.message}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())} // Convert to lowercase
                className="form-input"
                placeholder="your_username"
                required
                autoFocus
                minLength={3}
                pattern="[a-zA-Z0-9_-]+"
              />
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-light)', marginTop: '0.25rem' }}>
                Username must be at least 3 characters and can only contain letters, numbers, underscores, and hyphens
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="you@example.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--gray-light)', marginTop: '0.25rem' }}>
                Password must be at least 8 characters
              </p>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
              />
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <svg style={{ animation: 'spin 1s linear infinite', width: '1rem', height: '1rem' }} viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4" />
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </span>
                ) : 'Sign Up'}
              </button>
            </div>
          </form>
          
          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="form-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <div className="split-layout-right">
        <div className="welcome-message">
          <h1>Start your journey with PlayerZERO.</h1>
          <p>Join thousands of users who are already gaining new insights with our platform.</p>
        </div>
      </div>
    </div>
  )
} 