import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../../supabaseClient'
import { useTrialStatus } from '../../hooks/useTrialStatus'
import { useMobile } from '../../hooks/useMobile'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export const UpgradePage = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const trialStatus = useTrialStatus()
  const isMobile = useMobile()

  const handleUpgrade = async () => {
    setLoading(true)
    
    try {
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !currentUser) {
        console.error('Please log in to upgrade your account.')
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
          priceId: import.meta.env.VITE_STRIPE_PRICE_ID, // from Stripe dashboard
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
    } finally {
      setLoading(false)
    }
  }

  const handleContinueTrial = () => {
    // If trial has ended (0 days), don't navigate - user should upgrade
    if (trialStatus.daysRemaining === 0) {
      return
    }
    // If trial is active (1-7 days), navigate to UserProfile
    navigate('/UserProfile')
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      
      padding: '20px',
      boxSizing: 'border-box',
      margin: '0',
      position: 'relative',
    }}>
      {/* Frame 729 - Main Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0px',
        gap: isMobile ? '16px' : '22px',
        width: isMobile ? '100%' : '748px',
        maxWidth: isMobile ? '390px' : '90vw',
        margin: '0 auto',
      }}>
        {/* Frame 559 - Top Card */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px 9px',
          gap: '10px',
          width: '100%',
          background: '#FFFFFF',
          boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
          borderRadius: '20px',
        }}>
          {/* Frame 726 - Content */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: isMobile ? '16px' : '0px',
            gap: isMobile ? '16px' : '20px',
            width: '100%',
            maxWidth: isMobile ? '353px' : '563px',
          }}>
            {/* Title */}
            <div style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 700,
              fontSize: isMobile ? '24px' : '32px',
              lineHeight: isMobile ? '30px' : '39px',
              textAlign: 'center',
              textTransform: 'uppercase',
              color: '#DC2627',
            }}>
              Unlock Your Full Potential
            </div>

            {/* Subtitle */}
            <div style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: isMobile ? '14px' : '16px',
              lineHeight: isMobile ? '18px' : '19px',
              textAlign: 'center',
              color: '#000000',
              maxWidth: '100%',
              padding: isMobile ? '0 8px' : '0',
            }}>
              You're currently on a Trial Account. Upgrade to unlock all premium features and compete on leaderboards!
        </div>

            {/* Frame 728 - Price Box */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0px',
              gap: '6px',
              width: '193px',
              background: 'rgba(0, 0, 0, 0.09)',
              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
              borderRadius: '6px',
            }}>
              {/* Price */}
              <div style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 700,
                fontSize: '32px',
                lineHeight: '39px',
                textAlign: 'center',
                textTransform: 'uppercase',
                color: '#DC2627',
              }}>
                $5.99
      </div>

              {/* FIRST YEAR */}
              <div style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '16px',
                lineHeight: '19px',
                textAlign: 'center',
                color: '#000000',
              }}>
                FIRST YEAR
            </div>
          </div>

            {/* Regular price text */}
            <div style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '21px',
              color: '#636874',
              textAlign: 'center',
            }}>
              Regular annual price will apply after the trial.
              </div>

            {/* Frame 727 - Upgrade Button Container */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0px',
              gap: '8px',
              width: isMobile ? '100%' : '316px',
              maxWidth: isMobile ? '320px' : '316px',
            }}>
              {/* Upgrade button */}
            <button 
              onClick={handleUpgrade}
              disabled={loading}
                style={{
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0px',
                  gap: '8px',
                  width: '100%',
                  height: '48px',
                  border: '1px solid #DC2627',
                  borderRadius: '8px',
                  background: 'transparent',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {/* Crown icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 20V18H19V20H5ZM5 16.5L3.725 8.475C3.69167 8.475 3.654 8.47934 3.612 8.488C3.57 8.49667 3.53267 8.50067 3.5 8.5C3.08334 8.5 2.72934 8.354 2.438 8.062C2.14667 7.77 2.00067 7.416 2 7C1.99934 6.584 2.14534 6.23 2.438 5.938C2.73067 5.646 3.08467 5.5 3.5 5.5C3.91534 5.5 4.26967 5.646 4.563 5.938C4.85634 6.23 5.002 6.584 5 7C5 7.11667 4.98734 7.225 4.962 7.325C4.93667 7.425 4.90767 7.51667 4.875 7.6L8 9L11.125 4.725C10.9417 4.59167 10.7917 4.41667 10.675 4.2C10.5583 3.98334 10.5 3.75 10.5 3.5C10.5 3.08334 10.646 2.729 10.938 2.437C11.23 2.145 11.584 1.99934 12 2C12.416 2.00067 12.7703 2.14667 13.063 2.438C13.3557 2.72934 13.5013 3.08334 13.5 3.5C13.5 3.75 13.4417 3.98334 13.325 4.2C13.2083 4.41667 13.0583 4.59167 12.875 4.725L16 9L19.125 7.6C19.0917 7.51667 19.0623 7.425 19.037 7.325C19.0117 7.225 18.9993 7.11667 19 7C19 6.58334 19.146 6.229 19.438 5.937C19.73 5.645 20.084 5.49934 20.5 5.5C20.916 5.50067 21.2703 5.64667 21.563 5.938C21.8557 6.22934 22.0013 6.58334 22 7C21.9987 7.41667 21.853 7.771 21.563 8.063C21.273 8.355 20.9187 8.50067 20.5 8.5C20.4667 8.5 20.4293 8.496 20.388 8.488C20.3467 8.48 20.309 8.47567 20.275 8.475L19 16.5H5ZM6.7 14.5H17.3L17.95 10.325L15.325 11.475L12 6.9L8.675 11.475L6.05 10.325L6.7 14.5Z" fill="#DC2627"/>
                </svg>

                {/* Text */}
                <div style={{
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '15px',
                  lineHeight: '23px',
                  textTransform: 'uppercase',
                  color: '#DC2627',
                }}>
                  {loading ? 'Processing...' : 'Unlock Full Access - $5.99'}
            </div>
              </button>
          </div>
        </div>
      </div>

        {/* Frame 535 - Days Left Banner */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0px',
          gap: '8px',
          width: '100%',
          background: 'rgba(0, 0, 0, 0.08)',
          boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(2px)',
          borderRadius: '12px',
          minHeight: '65px',
        }}>
          {/* Frame 550 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '0px',
            gap: '4px',
          }}>
            {/* Days left */}
            <div style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '20px',
              textAlign: 'center',
              textTransform: 'uppercase',
              color: '#DC2627',
            }}>
              {trialStatus.daysRemaining} DAYS LEFT
        </div>

            {/* Subtitle */}
            <div style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '12px',
              textAlign: 'center',
              color: '#000000',
            }}>
              Until your free account expires!
            </div>
          </div>
                </div>
                
        {/* Frame 560 - Features Card */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          background: '#FFFFFF',
          boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
          borderRadius: '20px',
          padding: isMobile ? '20px 16px' : '20px',
          gap: isMobile ? '16px' : '20px',
        }}>
          {/* Title */}
          <div style={{
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: 700,
            fontSize: isMobile ? '18px' : '24px',
            lineHeight: isMobile ? '24px' : '29px',
            textAlign: 'center',
            textTransform: 'uppercase',
            color: '#DC2627',
            width: '100%',
          }}>
            What You Get with Premium
                  </div>
                  
          {/* Frame 735 - Features List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '0px',
            gap: isMobile ? '12px' : '16px',
            width: '100%',
            maxWidth: isMobile ? '100%' : '666px',
          }}>
            {/* Feature 1 */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              padding: '0px',
              gap: '8px',
              width: '100%',
            }}>
              <svg width="22" height="18" viewBox="0 0 22 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ 
                minWidth: '22px',
                height: '18px',
                marginTop: '3px',
              }}>
                <path d="M21.3026 2.64634L19.0526 0.437589C18.7714 0.157356 18.3906 0 17.9937 0C17.5967 0 17.2159 0.157356 16.9348 0.437589L8.24509 9.0204L4.8054 5.6829C4.52366 5.40358 4.14273 5.24724 3.74599 5.24812C3.34926 5.249 2.96903 5.40702 2.68852 5.68759L0.438524 7.93759C0.157719 8.21883 0 8.60001 0 8.99743C0 9.39486 0.157719 9.77604 0.438524 10.0573L7.1529 16.8073C7.29219 16.9466 7.45757 17.0571 7.63958 17.1325C7.82159 17.2079 8.01667 17.2467 8.21368 17.2467C8.41069 17.2467 8.60577 17.2079 8.78778 17.1325C8.9698 17.0571 9.13517 16.9466 9.27446 16.8073L21.3073 4.77165C21.4469 4.63198 21.5575 4.46613 21.6328 4.2836C21.7082 4.10108 21.7467 3.90548 21.7463 3.70802C21.7458 3.51056 21.7064 3.31513 21.6303 3.13294C21.5541 2.95075 21.4428 2.78539 21.3026 2.64634ZM8.20946 15.7488L1.49509 8.99884L3.74509 6.74884C3.74782 6.7511 3.75033 6.75361 3.75259 6.75634L7.7229 10.6085C7.86305 10.7457 8.05134 10.8225 8.24743 10.8225C8.44352 10.8225 8.63181 10.7457 8.77196 10.6085L18.0007 1.49884L20.2451 3.71134L8.20946 15.7488Z" fill="#DC2627"/>
              </svg>

              {/* Text */}
              <div style={{
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontSize: isMobile ? '14px' : '16px',
                lineHeight: isMobile ? '18px' : '19px',
                flex: 1,
              }}>
                <span style={{ fontWeight: 600, color: '#000000' }}>Increased Stat Uploads</span>
                <span style={{ fontWeight: 400, color: '#636874' }}> – upload multiple times per day to track your grind in real time.</span>
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
                <span style={{ fontWeight: 400, color: '#636874' }}> – appear in rankings and climb against real trainers.</span>
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
                <span style={{ fontWeight: 400, color: '#636874' }}> – view and compare stats across the community.</span>
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
                <span style={{ fontWeight: 400, color: '#636874' }}> – every update released during your subscription year is yours automatically.</span>
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
                <span style={{ fontWeight: 400, color: '#636874' }}> – share yours and connect directly with others.</span>
              </div>
            </div>
          </div>

          {/* Frame 736 - Upgrade Button */}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '0px',
              gap: '8px',
              width: '100%',
              maxWidth: isMobile ? '100%' : '672px',
              height: '48px',
              background: loading ? '#9CA3AF' : '#DC2627',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              marginTop: isMobile ? '8px' : '20px',
            }}
          >
            {/* Crown icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 20V18H19V20H5ZM5 16.5L3.725 8.475C3.69167 8.475 3.654 8.47934 3.612 8.488C3.57 8.49667 3.53267 8.50067 3.5 8.5C3.08334 8.5 2.72934 8.354 2.438 8.062C2.14667 7.77 2.00067 7.416 2 7C1.99934 6.584 2.14534 6.23 2.438 5.938C2.73067 5.646 3.08467 5.5 3.5 5.5C3.91534 5.5 4.26967 5.646 4.563 5.938C4.85634 6.23 5.002 6.584 5 7C5 7.11667 4.98734 7.225 4.962 7.325C4.93667 7.425 4.90767 7.51667 4.875 7.6L8 9L11.125 4.725C10.9417 4.59167 10.7917 4.41667 10.675 4.2C10.5583 3.98334 10.5 3.75 10.5 3.5C10.5 3.08334 10.646 2.729 10.938 2.437C11.23 2.145 11.584 1.99934 12 2C12.416 2.00067 12.7703 2.14667 13.063 2.438C13.3557 2.72934 13.5013 3.08334 13.5 3.5C13.5 3.75 13.4417 3.98334 13.325 4.2C13.2083 4.41667 13.0583 4.59167 12.875 4.725L16 9L19.125 7.6C19.0917 7.51667 19.0623 7.425 19.037 7.325C19.0117 7.225 18.9993 7.11667 19 7C19 6.58334 19.146 6.229 19.438 5.937C19.73 5.645 20.084 5.49934 20.5 5.5C20.916 5.50067 21.2703 5.64667 21.563 5.938C21.8557 6.22934 22.0013 6.58334 22 7C21.9987 7.41667 21.853 7.771 21.563 8.063C21.273 8.355 20.9187 8.50067 20.5 8.5C20.4667 8.5 20.4293 8.496 20.388 8.488C20.3467 8.48 20.309 8.47567 20.275 8.475L19 16.5H5ZM6.7 14.5H17.3L17.95 10.325L15.325 11.475L12 6.9L8.675 11.475L6.05 10.325L6.7 14.5Z" fill="#FFFFFF"/>
            </svg>

            {/* Text */}
            <div style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '14px',
              lineHeight: '21px',
              color: '#FFFFFF',
            }}>
              {loading ? 'Processing...' : 'UPGRADE NOW'}
          </div>
          </button>
          </div>

        {/* Frame 741 - Stripe & SSL Badges */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          width: 'auto',
          alignItems: 'center',
          padding: '0px',
          gap: '8px',
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
              Stripe
            </span>
          </div>

          {/* SSL Badge */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            padding: '4px 8px',
            gap: '4px',
            background: '#F3F4F6',
            borderRadius: '4px',
          }}>
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
              <path d="M6 0L0 2.5V6C0 9.5 2.84 12.74 6 13.75C9.16 12.74 12 9.5 12 6V2.5L6 0Z" fill="#A4A7B5"/>
              <path d="M4 6.5L5.5 8L8.5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{
              fontFamily: 'Poppins',
              fontStyle: 'normal',
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

        {/* Continue trial link / Trial ended message */}
        <button
          onClick={handleContinueTrial}
          style={{
            background: 'transparent',
            border: 'none',
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: trialStatus.daysRemaining === 0 ? 600 : 400,
            fontSize: '12px',
            lineHeight: '18px',
            textAlign: 'center',
            color: trialStatus.daysRemaining === 0 ? '#DC2627' : '#636874',
            cursor: trialStatus.daysRemaining === 0 ? 'default' : 'pointer',
            textDecoration: 'none',
            padding: '4px',
            opacity: trialStatus.daysRemaining === 0 ? 0.9 : 1,
          }}
          disabled={trialStatus.daysRemaining === 0}
        >
          {trialStatus.daysRemaining === 0 
            ? 'Free trial ended - Upgrade your account' 
            : `Continue my free trial for next ${trialStatus.daysRemaining} day${trialStatus.daysRemaining === 1 ? '' : 's'}`
          }
        </button>
      </div>
    </div>
  )
} 