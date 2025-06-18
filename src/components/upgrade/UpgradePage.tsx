import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { profileService } from '../../services/profileService'

export const UpgradePage = () => {
  const { upgradeToFull } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Update auth metadata to paid
      const { error: authError } = await upgradeToFull()
      if (authError) {
        setError(authError.message || 'Failed to update user status. Please try again.')
        return
      }

      // Update database profile to paid with lifetime subscription
      const subscriptionData = {
        is_paid_user: true,
        subscription_type: 'lifetime',
        subscription_expires_at: undefined // Lifetime subscription never expires
      }

      const { error: dbError } = await profileService.updateSubscription(subscriptionData)
      if (dbError) {
        console.error('Database update error:', dbError)
        setError('Upgrade successful but there was an issue updating your profile. Please refresh the page.')
        return
      }

      // Success! User is now premium
      // The page will automatically update due to auth state changes
      console.log('Upgrade successful! User is now premium.')
      
    } catch (err: any) {
      console.error('Upgrade error:', err)
      setError(err.message || 'An unexpected error occurred during upgrade')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upgrade-page-container">
      {/* Header Section */}
      <div className="upgrade-header">
        <div className="upgrade-hero">
          <h1>🚀 Unlock Your Full Potential</h1>
          <p className="hero-subtitle">
            You're currently on a <strong>Trial Account</strong>. Upgrade to unlock all premium features and compete on leaderboards!
          </p>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="pricing-section">
        <div className="pricing-card">
          <div className="pricing-header">
            <div className="plan-badge-large">
              <span className="crown">👑</span>
              <span className="plan-name">Lifetime Premium</span>
            </div>
            <div className="price-display">
              <span className="currency">$</span>
              <span className="amount">5.99</span>
              <span className="period">one-time</span>
            </div>
            <div className="value-prop">
              <span className="savings">🎉 Best Value - No Monthly Fees!</span>
            </div>
          </div>

          <div className="upgrade-action">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}
            
            <button 
              className="upgrade-button-main"
              onClick={handleUpgrade}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span className="button-icon">🚀</span>
                  <span>Upgrade to Lifetime Premium</span>
                  <span className="button-price">$5.99</span>
                </>
              )}
            </button>

            <div className="guarantee">
              <span className="guarantee-icon">🛡️</span>
              <span>30-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section with Features Table */}
      <div className="faq-section">
        <div className="section-header">
          <h2>❓ What You Get with Premium</h2>
          <p>Compare trial limitations with full premium access</p>
        </div>

        <div className="faq-vertical">
          {/* Features Comparison Table */}
          <div className="faq-item features-table">
            <h3>📊 Trial vs Premium Features</h3>
            <div className="features-comparison">
              <div className="comparison-table-compact">
                <div className="table-header-compact">
                  <div className="feature-col">Feature</div>
                  <div className="trial-col">Trial</div>
                  <div className="premium-col">Premium</div>
                </div>
                
                <div className="table-body-compact">
                  <div className="table-row-compact">
                    <div className="feature-name-compact">🎴 Generate Cards</div>
                    <div className="trial-status">Tutorial Only</div>
                    <div className="premium-status">✅ Unlimited</div>
                  </div>
                  
                  <div className="table-row-compact">
                    <div className="feature-name-compact">📅 Weekly/Monthly Cards</div>
                    <div className="trial-status">❌ Locked</div>
                    <div className="premium-status">✅ Available</div>
                  </div>
                  
                  <div className="table-row-compact highlight">
                    <div className="feature-name-compact">🏆 Leaderboard Ranking</div>
                    <div className="trial-status">❌ Hidden</div>
                    <div className="premium-status">✅ Compete</div>
                  </div>
                  
                  <div className="table-row-compact">
                    <div className="feature-name-compact">👥 View Other Profiles</div>
                    <div className="trial-status">❌ Locked</div>
                    <div className="premium-status">✅ Browse All</div>
                  </div>
                  
                  <div className="table-row-compact">
                    <div className="feature-name-compact">🔢 Show Trainer Code</div>
                    <div className="trial-status">❌ Hidden</div>
                    <div className="premium-status">✅ Visible</div>
                  </div>
                  
                  <div className="table-row-compact">
                    <div className="feature-name-compact">🔗 Social Links</div>
                    <div className="trial-status">❌ Hidden</div>
                    <div className="premium-status">✅ Display</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Items */}
          <div className="faq-item">
            <h3>Why lifetime instead of monthly?</h3>
            <p>We believe in providing long-term value. Pay once, use forever - no recurring charges or subscription hassles!</p>
          </div>

          <div className="faq-item">
            <h3>What happens to my data if I upgrade?</h3>
            <p>All your existing profile data, stats, and progress are preserved. You'll immediately gain access to all premium features.</p>
          </div>

          <div className="faq-item">
            <h3>Can I downgrade later?</h3>
            <p>While we don't offer downgrades, you'll keep all premium features forever. If you're unsatisfied, we offer a 30-day refund.</p>
          </div>

          <div className="faq-item">
            <h3>How secure is the payment?</h3>
            <p>All payments are processed securely through industry-standard encryption. We never store your payment information.</p>
          </div>
        </div>
      </div>
    </div>
  )
} 