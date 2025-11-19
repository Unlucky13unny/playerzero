import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../../supabaseClient'
import { useMobile } from '../../hooks/useMobile'
import logoSvg from "/images/logo.svg"

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export const PaywallPage = () => {
  const navigate = useNavigate()
  const isMobile = useMobile()
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
        setLoading(false)
        return
      }

      // Create checkout session using Edge Function
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
    <div className="split-layout" style={{
      minHeight: '100vh',
      height: 'auto',
    }}>
      {/* Left side - Paywall content */}
      <div className="split-layout-left" style={{
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        overflowY: 'auto',
        padding: isMobile ? '2rem 1.5rem' : '3rem 2rem',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: isMobile ? '353px' : '400px',
          margin: '0 auto',
        }}>
          {/* Frame 674 - Main Container */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0px',
            gap: '8px',
            width: '100%',
          }}>
            {/* Logo */}
            <img 
              src={logoSvg} 
              alt="PlayerZERO" 
              style={{
                width: '181px',
                height: '35px',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}
            />

            {/* Frame 742 - Heading */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0px',
              width: '100%',
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              {/* Unlock your Grind */}
              <div style={{
                width: '100%',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: isMobile ? '24px' : '30px',
                lineHeight: isMobile ? '32px' : '48px',
                textAlign: 'center',
                color: '#000000',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                Unlock your Grind
              </div>
              
              {/* Track. Compete. Flex. */}
              <div style={{
                width: '100%',
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: isMobile ? '20px' : '26px',
                lineHeight: isMobile ? '28px' : '42px',
                textAlign: 'center',
                color: '#000000',
                flex: 'none',
                order: 1,
                flexGrow: 0,
              }}>
                Track. Compete. Flex.
              </div>
            </div>

            {/* Frame 191 - Offer Box */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: isMobile ? '20px 12px' : '24px 16px',
              gap: '10px',
              width: '100%',
              background: '#FFFFFF',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
              borderRadius: '12px',
              flex: 'none',
              order: 2,
              alignSelf: 'stretch',
              flexGrow: 0,
            }}>
              {/* Frame 743 - Offer Content */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '0px',
                gap: '8px',
                width: '100%',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                <div style={{
                  width: '100%',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: isMobile ? '20px' : '26px',
                  lineHeight: isMobile ? '28px' : '42px',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  color: '#DC2627',
                  flex: 'none',
                  order: 0,
                  alignSelf: 'stretch',
                  flexGrow: 0,
                }}>
                  SPECIAL LAUNCH OFFER:
                </div>
                <div style={{
                  width: '100%',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: isMobile ? '16px' : '18px',
                  lineHeight: isMobile ? '24px' : '27px',
                  textAlign: 'center',
                  color: '#000000',
                  flex: 'none',
                  order: 1,
                  alignSelf: 'stretch',
                  flexGrow: 0,
                }}>
                  Get PlayerZERO Premium for only $5.99 your first year.
                </div>
                <div style={{
                  width: '100%',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: isMobile ? '11px' : '12px',
                  lineHeight: isMobile ? '16px' : '21px',
                  color: '#636874',
                  flex: 'none',
                  order: 2,
                  flexGrow: 0,
                  textAlign: 'center',
                }}>
                  Regular annual price will apply after the trial.
          </div>
          </div>
            </div>

            {/* Frame 735 - Features List */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '0px',
              gap: isMobile ? '12px' : '16px',
              width: '100%',
              flex: 'none',
              order: 3,
              flexGrow: 0,
            }}>
              {/* Feature 1 */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                padding: '0px',
                gap: '8px',
                width: '100%',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ 
                  minWidth: '22px',
                  height: '18px',
                  marginTop: '3px',
                }}>
                  <path d="M21.3026 2.64634L19.0526 0.437589C18.7714 0.157356 18.3906 0 17.9937 0C17.5967 0 17.2159 0.157356 16.9348 0.437589L8.24509 9.0204L4.8054 5.6829C4.52366 5.40358 4.14273 5.24724 3.74599 5.24812C3.34926 5.249 2.96903 5.40702 2.68852 5.68759L0.438524 7.93759C0.157719 8.21883 0 8.60001 0 8.99743C0 9.39486 0.157719 9.77604 0.438524 10.0573L7.1529 16.8073C7.29219 16.9466 7.45757 17.0571 7.63958 17.1325C7.82159 17.2079 8.01667 17.2467 8.21368 17.2467C8.41069 17.2467 8.60577 17.2079 8.78778 17.1325C8.9698 17.0571 9.13517 16.9466 9.27446 16.8073L21.3073 4.77165C21.4469 4.63198 21.5575 4.46613 21.6328 4.2836C21.7082 4.10108 21.7467 3.90548 21.7463 3.70802C21.7458 3.51056 21.7064 3.31513 21.6303 3.13294C21.5541 2.95075 21.4428 2.78539 21.3026 2.64634ZM8.20946 15.7488L1.49509 8.99884L3.74509 6.74884C3.74782 6.7511 3.75033 6.75361 3.75259 6.75634L7.7229 10.6085C7.86305 10.7457 8.05134 10.8225 8.24743 10.8225C8.44352 10.8225 8.63181 10.7457 8.77196 10.6085L18.0007 1.49884L20.2451 3.71134L8.20946 15.7488Z" fill="#DC2627"/>
            </svg>
            
            <div style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
                  fontSize: isMobile ? '14px' : '16px',
                  lineHeight: isMobile ? '18px' : '19px',
                  flex: 1,
                }}>
                  <span style={{ fontWeight: 600, color: '#000000' }}>Increased Stat Uploads</span>
                  <span style={{ fontWeight: 400, color: '#636874' }}><br/>Upload multiple times per day to track your grind in real time.</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                padding: '0px',
                gap: '8px',
                width: '100%',
                flex: 'none',
                order: 1,
                flexGrow: 0,
              }}>
                <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ 
                  minWidth: '22px',
                  height: '18px',
                  marginTop: '3px',
                }}>
                  <path d="M21.3026 2.64634L19.0526 0.437589C18.7714 0.157356 18.3906 0 17.9937 0C17.5967 0 17.2159 0.157356 16.9348 0.437589L8.24509 9.0204L4.8054 5.6829C4.52366 5.40358 4.14273 5.24724 3.74599 5.24812C3.34926 5.249 2.96903 5.40702 2.68852 5.68759L0.438524 7.93759C0.157719 8.21883 0 8.60001 0 8.99743C0 9.39486 0.157719 9.77604 0.438524 10.0573L7.1529 16.8073C7.29219 16.9466 7.45757 17.0571 7.63958 17.1325C7.82159 17.2079 8.01667 17.2467 8.21368 17.2467C8.41069 17.2467 8.60577 17.2079 8.78778 17.1325C8.9698 17.0571 9.13517 16.9466 9.27446 16.8073L21.3073 4.77165C21.4469 4.63198 21.5575 4.46613 21.6328 4.2836C21.7082 4.10108 21.7467 3.90548 21.7463 3.70802C21.7458 3.51056 21.7064 3.31513 21.6303 3.13294C21.5541 2.95075 21.4428 2.78539 21.3026 2.64634ZM8.20946 15.7488L1.49509 8.99884L3.74509 6.74884C3.74782 6.7511 3.75033 6.75361 3.75259 6.75634L7.7229 10.6085C7.86305 10.7457 8.05134 10.8225 8.24743 10.8225C8.44352 10.8225 8.63181 10.7457 8.77196 10.6085L18.0007 1.49884L20.2451 3.71134L8.20946 15.7488Z" fill="#DC2627"/>
            </svg>
            
            <div style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
                  fontSize: isMobile ? '14px' : '16px',
                  lineHeight: isMobile ? '18px' : '19px',
                  flex: 1,
                }}>
                  <span style={{ fontWeight: 600, color: '#000000' }}>Leaderboard Recognition</span>
                  <span style={{ fontWeight: 400, color: '#636874' }}><br/>Appear in rankings and climb against real trainers.</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: '0px',
            gap: '8px',
            width: '100%',
            flex: 'none',
            order: 2,
            flexGrow: 0,
          }}>
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ 
              minWidth: '22px',
              height: '18px',
              marginTop: '3px',
            }}>
              <path d="M21.3026 2.64634L19.0526 0.437589C18.7714 0.157356 18.3906 0 17.9937 0C17.5967 0 17.2159 0.157356 16.9348 0.437589L8.24509 9.0204L4.8054 5.6829C4.52366 5.40358 4.14273 5.24724 3.74599 5.24812C3.34926 5.249 2.96903 5.40702 2.68852 5.68759L0.438524 7.93759C0.157719 8.21883 0 8.60001 0 8.99743C0 9.39486 0.157719 9.77604 0.438524 10.0573L7.1529 16.8073C7.29219 16.9466 7.45757 17.0571 7.63958 17.1325C7.82159 17.2079 8.01667 17.2467 8.21368 17.2467C8.41069 17.2467 8.60577 17.2079 8.78778 17.1325C8.9698 17.0571 9.13517 16.9466 9.27446 16.8073L21.3073 4.77165C21.4469 4.63198 21.5575 4.46613 21.6328 4.2836C21.7082 4.10108 21.7467 3.90548 21.7463 3.70802C21.7458 3.51056 21.7064 3.31513 21.6303 3.13294C21.5541 2.95075 21.4428 2.78539 21.3026 2.64634ZM8.20946 15.7488L1.49509 8.99884L3.74509 6.74884C3.74782 6.7511 3.75033 6.75361 3.75259 6.75634L7.7229 10.6085C7.86305 10.7457 8.05134 10.8225 8.24743 10.8225C8.44352 10.8225 8.63181 10.7457 8.77196 10.6085L18.0007 1.49884L20.2451 3.71134L8.20946 15.7488Z" fill="#DC2627"/>
            </svg>
            
            <div style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontSize: isMobile ? '14px' : '16px',
              lineHeight: isMobile ? '18px' : '19px',
              flex: 1,
            }}>
              <span style={{ fontWeight: 600, color: '#000000' }}>Full Profile Access</span>
              <span style={{ fontWeight: 400, color: '#636874' }}><br/>View and compare stats across the community.</span>
            </div>
            </div>

          {/* Feature 4 */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: '0px',
            gap: '8px',
            width: '100%',
            flex: 'none',
            order: 3,
            flexGrow: 0,
          }}>
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ 
              minWidth: '22px',
              height: '18px',
              marginTop: '3px',
            }}>
              <path d="M21.3026 2.64634L19.0526 0.437589C18.7714 0.157356 18.3906 0 17.9937 0C17.5967 0 17.2159 0.157356 16.9348 0.437589L8.24509 9.0204L4.8054 5.6829C4.52366 5.40358 4.14273 5.24724 3.74599 5.24812C3.34926 5.249 2.96903 5.40702 2.68852 5.68759L0.438524 7.93759C0.157719 8.21883 0 8.60001 0 8.99743C0 9.39486 0.157719 9.77604 0.438524 10.0573L7.1529 16.8073C7.29219 16.9466 7.45757 17.0571 7.63958 17.1325C7.82159 17.2079 8.01667 17.2467 8.21368 17.2467C8.41069 17.2467 8.60577 17.2079 8.78778 17.1325C8.9698 17.0571 9.13517 16.9466 9.27446 16.8073L21.3073 4.77165C21.4469 4.63198 21.5575 4.46613 21.6328 4.2836C21.7082 4.10108 21.7467 3.90548 21.7463 3.70802C21.7458 3.51056 21.7064 3.31513 21.6303 3.13294C21.5541 2.95075 21.4428 2.78539 21.3026 2.64634ZM8.20946 15.7488L1.49509 8.99884L3.74509 6.74884C3.74782 6.7511 3.75033 6.75361 3.75259 6.75634L7.7229 10.6085C7.86305 10.7457 8.05134 10.8225 8.24743 10.8225C8.44352 10.8225 8.63181 10.7457 8.77196 10.6085L18.0007 1.49884L20.2451 3.71134L8.20946 15.7488Z" fill="#DC2627"/>
            </svg>
            
            <div style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontSize: isMobile ? '14px' : '16px',
              lineHeight: isMobile ? '18px' : '19px',
              flex: 1,
            }}>
              <span style={{ fontWeight: 600, color: '#000000' }}>All Future Features Included</span>
              <span style={{ fontWeight: 400, color: '#636874' }}><br/>Every update released during your subscription year is yours automatically.</span>
            </div>
          </div>

          {/* Feature 5 */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: '0px',
            gap: '8px',
            width: '100%',
            flex: 'none',
            order: 4,
            flexGrow: 0,
          }}>
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ 
              minWidth: '22px',
              height: '18px',
              marginTop: '3px',
            }}>
              <path d="M21.3026 2.64634L19.0526 0.437589C18.7714 0.157356 18.3906 0 17.9937 0C17.5967 0 17.2159 0.157356 16.9348 0.437589L8.24509 9.0204L4.8054 5.6829C4.52366 5.40358 4.14273 5.24724 3.74599 5.24812C3.34926 5.249 2.96903 5.40702 2.68852 5.68759L0.438524 7.93759C0.157719 8.21883 0 8.60001 0 8.99743C0 9.39486 0.157719 9.77604 0.438524 10.0573L7.1529 16.8073C7.29219 16.9466 7.45757 17.0571 7.63958 17.1325C7.82159 17.2079 8.01667 17.2467 8.21368 17.2467C8.41069 17.2467 8.60577 17.2079 8.78778 17.1325C8.9698 17.0571 9.13517 16.9466 9.27446 16.8073L21.3073 4.77165C21.4469 4.63198 21.5575 4.46613 21.6328 4.2836C21.7082 4.10108 21.7467 3.90548 21.7463 3.70802C21.7458 3.51056 21.7064 3.31513 21.6303 3.13294C21.5541 2.95075 21.4428 2.78539 21.3026 2.64634ZM8.20946 15.7488L1.49509 8.99884L3.74509 6.74884C3.74782 6.7511 3.75033 6.75361 3.75259 6.75634L7.7229 10.6085C7.86305 10.7457 8.05134 10.8225 8.24743 10.8225C8.44352 10.8225 8.63181 10.7457 8.77196 10.6085L18.0007 1.49884L20.2451 3.71134L8.20946 15.7488Z" fill="#DC2627"/>
            </svg>
            
            <div style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontSize: isMobile ? '14px' : '16px',
              lineHeight: isMobile ? '18px' : '19px',
              flex: 1,
            }}>
              <span style={{ fontWeight: 600, color: '#000000' }}>Trainer Code & Socials</span>
              <span style={{ fontWeight: 400, color: '#636874' }}><br/>Share yours and connect directly with others.</span>
                </div>
              </div>
            </div>

            {/* Frame 676 - Buttons & Footer */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0px',
              gap: '8px',
              width: '100%',
              flex: 'none',
              order: 4,
              flexGrow: 0,
              marginTop: '16px',
            }}>
          {/* Error Message */}
          {error && (
                <div style={{
                  width: '100%',
                  padding: '12px',
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '6px',
                  fontFamily: 'Poppins',
                  fontSize: '14px',
                  color: '#DC2626',
                  textAlign: 'center',
                  marginBottom: '8px',
                }}>
              {error}
            </div>
          )}

          {/* Unlock Button */}
          <button 
            onClick={handleUpgrade}
            disabled={loading}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '8px 16px',
                  gap: '10px',
                  width: '100%',
                  height: '38px',
                  background: loading ? '#9CA3AF' : '#DC2627',
                  borderRadius: '6px',
                  border: 'none',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#B91C1C'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = '#DC2627'
                  }
                }}
              >
                <span style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '15px',
                  lineHeight: '23px',
                  color: '#FFFFFF',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
            {loading ? 'Processing...' : 'Unlock Full Access - $5.99'}
                </span>
          </button>

          {/* Trial Link */}
              <button
                onClick={handleContinueTrial}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '18px',
                  textAlign: 'center',
                  color: '#636874',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                  padding: '4px',
                }}
              >
                Not ready? Continue with your 7-day trial
              </button>

              {/* Frame 741 - Stripe & SSL Badges */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '0px',
                gap: '8px',
                width: '100%',
                height: '32px',
                flex: 'none',
                order: 2,
                flexGrow: 0,
              }}>
                {/* Stripe */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0px 10px',
                  isolation: 'isolate',
                  width: '69px',
                  height: '32px',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  <span style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontStyle: 'normal',
                    fontWeight: 900,
                    fontSize: '16px',
                    lineHeight: '20px',
                    color: '#000000',
                  }}>
                    stripe
                  </span>
          </div>

                {/* SSL Badge */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: '4px 8px',
                  gap: '4px',
                  width: 'auto',
                  height: '30px',
                  background: '#F3F4F6',
                  borderRadius: '4px',
                  flex: 'none',
                  order: 1,
                  flexGrow: 0,
                }}>
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
                    <path d="M6 0L0 2.5V6C0 9.5 2.84 12.74 6 13.75C9.16 12.74 12 9.5 12 6V2.5L6 0Z" fill="#A4A7B5"/>
                    <path d="M4 6.5L5.5 8L8.5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div style={{
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    width: 'auto',
                    fontWeight: 600,
                    fontSize: '8px',
                    lineHeight: '12px',
                    color: '#6B7280',
                    textAlign: 'center',
                  }}>
                    256 BIT<br/>SSL Encryption
                  </div>
                </div>
            </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Welcome message (hidden on mobile) */}
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

