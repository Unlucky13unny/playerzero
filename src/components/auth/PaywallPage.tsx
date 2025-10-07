import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../../supabaseClient'
import { Logo } from '../common/Logo'
import stripeLogo from "/images/stripe-logo.svg"

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export const PaywallPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleContinueTrial = () => {
    // Navigate to tutorial/welcome page
    navigate('/tutorial')
  }

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        setError('Please log in to upgrade your account.')
        return
      }

      // Create checkout session
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
          email: currentUser.email,
          userId: currentUser.id
        })
      })

      if (!res.ok) {
        const errorData = await res.text()
        throw new Error(`Failed to create checkout session: ${errorData}`)
      }

      const data = await res.json()
      
      if (!data.sessionId) {
        throw new Error('No session ID returned from checkout creation')
      }

      // Redirect to Stripe checkout
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ 
        sessionId: data.sessionId 
      })

      if (stripeError) {
        throw new Error(stripeError.message || 'Failed to redirect to checkout')
      }
      
    } catch (err: any) {
      console.error('Upgrade error:', err)
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="split-layout">
      <div className="split-layout-left">
        <div className="auth-container">
          <div className="logo-section">
            <Logo className="auth-logo" />
            <div className="mobile-tagline">
              Grind. Compete. Flex.
            </div>
          </div>
          
          <div className="paywall-heading">
            <h1>Unlock your Grind</h1>
            <h2>Track. Compete. Flex</h2>
          </div>

          {/* Special Offer Box */}
          <div className="paywall-offer-box">
            <div className="paywall-offer-header">SPECIAL LAUNCH OFFER:</div>
            <div className="paywall-offer-text">
              Get PlayerZERO Premium for only<br />
              <span className="paywall-price">$5.99</span> your first year.
            </div>
            <div className="paywall-offer-subtext">
              Regular annual price will apply after the trial.
            </div>
          </div>

          {/* Features List */}
          <div className="paywall-features">
            <div className="paywall-feature-item">
              <span className="paywall-bullet">•</span>
              <span>Compete on global leaderboards</span>
            </div>
            <div className="paywall-feature-item">
              <span className="paywall-bullet">•</span>
              <span>Connect through socials</span>
            </div>
            <div className="paywall-feature-item">
              <span className="paywall-bullet">•</span>
              <span>Grow with trainer codes</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="paywall-error">
              {error}
            </div>
          )}

          {/* Unlock Button */}
          <button 
            className="btn btn-primary paywall-unlock-btn"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner">
                <svg className="spinner" viewBox="0 0 24 24">
                  <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4" />
                  <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : 'Unlock Full Access - $5.99'}
          </button>

          {/* Trial Link */}
          <div className="paywall-trial-link">
            Not ready? <button onClick={handleContinueTrial} className="trial-link-btn">Continue with your 7-day trial</button>
          </div>

          {/* Stripe Badge */}
          <div className="paywall-badges">
            <div className="stripe-badge">
              <img src={stripeLogo} alt="Stripe" className="stripe-logo" />
            </div>
            <div className="security-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 6V11C4 16 7.5 20.5 12 22C16.5 20.5 20 16 20 11V6L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>256 BIT</span>
              <span className="security-text">SSL Encrypted</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="split-layout-right">
        <div className="welcome-message">
          <h1>Grind.</h1>
          <h1>Compete.</h1>
          <h1>Flex.</h1>
        </div>
      </div>
    </div>
  )
}

