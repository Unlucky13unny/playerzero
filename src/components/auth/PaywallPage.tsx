import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../../supabaseClient'
import { useMobile } from '../../hooks/useMobile'
import logoSvg from "/images/logo.svg"
import stripeLogo from "/images/stripe-logo.svg"

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

            {/* Frame 742 - Heading - EXACT FIGMA SPECS */}
            <div style={{
              // Auto layout
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0px',
              
              width: '299px',
              height: '90px',
              
              // Inside auto layout
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              {/* Unlock your Grind */}
              <div style={{
                width: '288px',
                height: '48px',
                
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 600,
                fontSize: '30px',
                lineHeight: '48px',
                
                color: '#000000',
                
                // Inside auto layout
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                Unlock your Grind
              </div>
              
              {/* Track. Compete. Flex. */}
              <div style={{
                width: '299px',
                height: '42px',
                
                fontFamily: 'Poppins',
                fontStyle: 'normal',
                fontWeight: 500,
                fontSize: '26px',
                lineHeight: '42px',
                
                color: '#000000',
                
                // Inside auto layout
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
              padding: '24px 16px',
              gap: '10px',
              width: isMobile ? '353px' : '400px',
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
                width: isMobile ? '321px' : '368px',
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                <div style={{
                  width: '100%',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 600,
                  fontSize: '26px',
                  lineHeight: '42px',
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
                  fontSize: '18px',
                  lineHeight: '27px',
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
                  width: isMobile ? '312px' : '100%',
                  fontFamily: 'Poppins',
                  fontStyle: 'normal',
                  fontWeight: 400,
                  fontSize: '12px',
                  lineHeight: '21px',
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

            {/* Frame 735 - Features List - EXACT FIGMA SPECS */}
            <div style={{
              // Auto layout
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '0px',
              gap: '16px',
              
              width: '292px',
              height: '367px',
              
              // Inside auto layout
              flex: 'none',
              order: 3,
              flexGrow: 0,
            }}>
              {/* Frame 730 - Feature 1 */}
              <div style={{
                // Auto layout
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                padding: '0px',
                gap: '8px',
                
                width: '299px',
                height: '57px',
                
                // Inside auto layout
                flex: 'none',
                order: 0,
                flexGrow: 0,
              }}>
                {/* CheckFat */}
                <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ 
              width: '24px',
              height: '24px',
              flex: 'none', 
              order: 0, 
              flexGrow: 0 
            }}>
              <path d="M23.3075 6.39732L21.0575 4.18857C20.7763 3.90833 20.3955 3.75098 19.9986 3.75098C19.6016 3.75098 19.2208 3.90833 18.9397 4.18857L10.25 12.7714L6.81028 9.43388C6.52854 9.15455 6.14761 8.99822 5.75088 8.9991C5.35414 8.99998 4.97391 9.15799 4.69341 9.43857L2.44341 11.6886C2.1626 11.9698 2.00488 12.351 2.00488 12.7484C2.00488 13.1458 2.1626 13.527 2.44341 13.8083L9.15778 20.5583C9.29707 20.6976 9.46245 20.8081 9.64446 20.8835C9.82647 20.9589 10.0216 20.9977 10.2186 20.9977C10.4156 20.9977 10.6107 20.9589 10.7927 20.8835C10.9747 20.8081 11.1401 20.6976 11.2793 20.5583L23.3122 8.52263C23.4517 8.38296 23.5624 8.2171 23.6377 8.03458C23.713 7.85206 23.7516 7.65646 23.7512 7.459C23.7507 7.26154 23.7113 7.06611 23.6352 6.88392C23.559 6.70173 23.4477 6.53637 23.3075 6.39732ZM10.2143 19.4998L3.49997 12.7498L5.74997 10.4998C5.7527 10.5021 5.75521 10.5046 5.75747 10.5073L9.72778 14.3595C9.86794 14.4966 10.0562 14.5734 10.2523 14.5734C10.4484 14.5734 10.6367 14.4966 10.7768 14.3595L20.0056 5.24982L22.25 7.46232L10.2143 19.4998Z" fill="#DC2627"/>
            </svg>
            
            {/* Text */}
            <div style={{
              width: '267px',
              height: '57px',
              
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '19px',
              
              color: '#848282',
              
              // Inside auto layout
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              <strong style={{ color: '#000000' }}>Increased Stat Uploads</strong><br/>
              Upload multiple times per day to track your grind in real time.
                </div>
              </div>

              {/* Frame 731 - Feature 2 */}
              <div style={{
                // Auto layout
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                padding: '0px',
                gap: '8px',
                
                width: '307px',
                height: '60px',
                
                // Inside auto layout
                flex: 'none',
                order: 1,
                flexGrow: 0,
              }}>
                {/* CheckFat */}
                <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ 
              width: '24px',
              height: '24px',
              flex: 'none', 
              order: 0, 
              flexGrow: 0 
            }}>
              <path d="M23.3075 6.39732L21.0575 4.18857C20.7763 3.90833 20.3955 3.75098 19.9986 3.75098C19.6016 3.75098 19.2208 3.90833 18.9397 4.18857L10.25 12.7714L6.81028 9.43388C6.52854 9.15455 6.14761 8.99822 5.75088 8.9991C5.35414 8.99998 4.97391 9.15799 4.69341 9.43857L2.44341 11.6886C2.1626 11.9698 2.00488 12.351 2.00488 12.7484C2.00488 13.1458 2.1626 13.527 2.44341 13.8083L9.15778 20.5583C9.29707 20.6976 9.46245 20.8081 9.64446 20.8835C9.82647 20.9589 10.0216 20.9977 10.2186 20.9977C10.4156 20.9977 10.6107 20.9589 10.7927 20.8835C10.9747 20.8081 11.1401 20.6976 11.2793 20.5583L23.3122 8.52263C23.4517 8.38296 23.5624 8.2171 23.6377 8.03458C23.713 7.85206 23.7516 7.65646 23.7512 7.459C23.7507 7.26154 23.7113 7.06611 23.6352 6.88392C23.559 6.70173 23.4477 6.53637 23.3075 6.39732ZM10.2143 19.4998L3.49997 12.7498L5.74997 10.4998C5.7527 10.5021 5.75521 10.5046 5.75747 10.5073L9.72778 14.3595C9.86794 14.4966 10.0562 14.5734 10.2523 14.5734C10.4484 14.5734 10.6367 14.4966 10.7768 14.3595L20.0056 5.24982L22.25 7.46232L10.2143 19.4998Z" fill="#DC2627"/>
            </svg>
            
            {/* Text */}
            <div style={{
              width: '275px',
              height: '60px',
              
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '19px',
              
              color: '#848282',
              
              // Inside auto layout
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              <strong style={{ color: '#000000' }}>Leaderboard Recognition</strong><br/>
              Appear in rankings and climb against real trainers.
            </div>
          </div>

          {/* Frame 732 - Feature 3 */}
          <div style={{
            // Auto layout
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: '0px',
            gap: '8px',
            
            width: '297px',
            height: '57px',
            
            // Inside auto layout
            flex: 'none',
            order: 2,
            flexGrow: 0,
          }}>
            {/* CheckFat */}
            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ 
              width: '24px',
              height: '24px',
              flex: 'none', 
              order: 0, 
              flexGrow: 0 
            }}>
              <path d="M23.3075 6.39732L21.0575 4.18857C20.7763 3.90833 20.3955 3.75098 19.9986 3.75098C19.6016 3.75098 19.2208 3.90833 18.9397 4.18857L10.25 12.7714L6.81028 9.43388C6.52854 9.15455 6.14761 8.99822 5.75088 8.9991C5.35414 8.99998 4.97391 9.15799 4.69341 9.43857L2.44341 11.6886C2.1626 11.9698 2.00488 12.351 2.00488 12.7484C2.00488 13.1458 2.1626 13.527 2.44341 13.8083L9.15778 20.5583C9.29707 20.6976 9.46245 20.8081 9.64446 20.8835C9.82647 20.9589 10.0216 20.9977 10.2186 20.9977C10.4156 20.9977 10.6107 20.9589 10.7927 20.8835C10.9747 20.8081 11.1401 20.6976 11.2793 20.5583L23.3122 8.52263C23.4517 8.38296 23.5624 8.2171 23.6377 8.03458C23.713 7.85206 23.7516 7.65646 23.7512 7.459C23.7507 7.26154 23.7113 7.06611 23.6352 6.88392C23.559 6.70173 23.4477 6.53637 23.3075 6.39732ZM10.2143 19.4998L3.49997 12.7498L5.74997 10.4998C5.7527 10.5021 5.75521 10.5046 5.75747 10.5073L9.72778 14.3595C9.86794 14.4966 10.0562 14.5734 10.2523 14.5734C10.4484 14.5734 10.6367 14.4966 10.7768 14.3595L20.0056 5.24982L22.25 7.46232L10.2143 19.4998Z" fill="#DC2627"/>
            </svg>
            
            {/* Text */}
            <div style={{
              width: '265px',
              height: '57px',
              
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '19px',
              
              color: '#848282',
              
              // Inside auto layout
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              <strong style={{ color: '#000000' }}>Full Profile Access</strong><br/>
              View and compare stats across the community.
            </div>
            </div>

          {/* Frame 734 - Feature 4 */}
          <div style={{
            // Auto layout
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: '0px',
            gap: '8px',
            
            width: '292px',
            height: '72px',
            
            // Inside auto layout
            flex: 'none',
            order: 3,
            alignSelf: 'stretch',
            flexGrow: 0,
          }}>
            {/* CheckFat */}
            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ 
              width: '24px',
              height: '24px',
              flex: 'none', 
              order: 0, 
              flexGrow: 0 
            }}>
              <path d="M23.3075 6.39732L21.0575 4.18857C20.7763 3.90833 20.3955 3.75098 19.9986 3.75098C19.6016 3.75098 19.2208 3.90833 18.9397 4.18857L10.25 12.7714L6.81028 9.43388C6.52854 9.15455 6.14761 8.99822 5.75088 8.9991C5.35414 8.99998 4.97391 9.15799 4.69341 9.43857L2.44341 11.6886C2.1626 11.9698 2.00488 12.351 2.00488 12.7484C2.00488 13.1458 2.1626 13.527 2.44341 13.8083L9.15778 20.5583C9.29707 20.6976 9.46245 20.8081 9.64446 20.8835C9.82647 20.9589 10.0216 20.9977 10.2186 20.9977C10.4156 20.9977 10.6107 20.9589 10.7927 20.8835C10.9747 20.8081 11.1401 20.6976 11.2793 20.5583L23.3122 8.52263C23.4517 8.38296 23.5624 8.2171 23.6377 8.03458C23.713 7.85206 23.7516 7.65646 23.7512 7.459C23.7507 7.26154 23.7113 7.06611 23.6352 6.88392C23.559 6.70173 23.4477 6.53637 23.3075 6.39732ZM10.2143 19.4998L3.49997 12.7498L5.74997 10.4998C5.7527 10.5021 5.75521 10.5046 5.75747 10.5073L9.72778 14.3595C9.86794 14.4966 10.0562 14.5734 10.2523 14.5734C10.4484 14.5734 10.6367 14.4966 10.7768 14.3595L20.0056 5.24982L22.25 7.46232L10.2143 19.4998Z" fill="#DC2627"/>
            </svg>
            
            {/* Text */}
            <div style={{
              width: '259px',
              height: '72px',
              
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '19px',
              
              color: '#848282',
              
              // Inside auto layout
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              <strong style={{ color: '#000000' }}>All Future Features Included</strong><br/>
              Every update released during your subscription year is yours automatically.
            </div>
          </div>

          {/* Frame 733 - Feature 5 */}
          <div style={{
            // Auto layout
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            padding: '0px',
            gap: '8px',
            
            width: '294px',
            height: '57px',
            
            // Inside auto layout
            flex: 'none',
            order: 4,
            flexGrow: 0,
          }}>
            {/* CheckFat */}
            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ 
              width: '24px',
              height: '24px',
              flex: 'none', 
              order: 0, 
              flexGrow: 0 
            }}>
              <path d="M23.3075 6.39732L21.0575 4.18857C20.7763 3.90833 20.3955 3.75098 19.9986 3.75098C19.6016 3.75098 19.2208 3.90833 18.9397 4.18857L10.25 12.7714L6.81028 9.43388C6.52854 9.15455 6.14761 8.99822 5.75088 8.9991C5.35414 8.99998 4.97391 9.15799 4.69341 9.43857L2.44341 11.6886C2.1626 11.9698 2.00488 12.351 2.00488 12.7484C2.00488 13.1458 2.1626 13.527 2.44341 13.8083L9.15778 20.5583C9.29707 20.6976 9.46245 20.8081 9.64446 20.8835C9.82647 20.9589 10.0216 20.9977 10.2186 20.9977C10.4156 20.9977 10.6107 20.9589 10.7927 20.8835C10.9747 20.8081 11.1401 20.6976 11.2793 20.5583L23.3122 8.52263C23.4517 8.38296 23.5624 8.2171 23.6377 8.03458C23.713 7.85206 23.7516 7.65646 23.7512 7.459C23.7507 7.26154 23.7113 7.06611 23.6352 6.88392C23.559 6.70173 23.4477 6.53637 23.3075 6.39732ZM10.2143 19.4998L3.49997 12.7498L5.74997 10.4998C5.7527 10.5021 5.75521 10.5046 5.75747 10.5073L9.72778 14.3595C9.86794 14.4966 10.0562 14.5734 10.2523 14.5734C10.4484 14.5734 10.6367 14.4966 10.7768 14.3595L20.0056 5.24982L22.25 7.46232L10.2143 19.4998Z" fill="#DC2627"/>
            </svg>
            
            {/* Text */}
            <div style={{
              width: '262px',
              height: '57px',
              
              fontFamily: 'Poppins',
              fontStyle: 'normal',
              fontWeight: 600,
              fontSize: '16px',
              lineHeight: '19px',
              
              color: '#848282',
              
              // Inside auto layout
              flex: 'none',
              order: 1,
              flexGrow: 0,
            }}>
              <strong style={{ color: '#000000' }}>Trainer Code & Socials</strong><br/>
              Share yours and connect directly with others.
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
              width: isMobile ? '355px' : '400px',
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
                alignItems: 'flex-start',
                padding: '0px',
                gap: '8px',
                width: '157px',
                height: '32px',
                flex: 'none',
                order: 2,
                flexGrow: 0,
              }}>
                {/* Stripe Logo */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '0px 10px',
                  width: '69px',
                  height: '32px',
                  flex: 'none',
                  order: 0,
                  flexGrow: 0,
                }}>
                  <img src={stripeLogo} alt="Stripe" style={{ width: '100%', height: 'auto' }} />
          </div>

                {/* SSL Badge */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: '4px 8px',
                  gap: '4px',
                  width: '80px',
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

