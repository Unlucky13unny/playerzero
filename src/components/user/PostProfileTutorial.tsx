import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { profileService, type ProfileWithMetadata } from '../../services/profileService'
import { PerformanceRadarChart } from '../dashboard/RadarChart'
import { useTrialStatus } from '../../hooks/useTrialStatus'

export const PostProfileTutorial = () => {
  const [showWelcome] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(1)
  const [profile, setProfile] = useState<ProfileWithMetadata | null>(null)
  const navigate = useNavigate()
  const trialStatus = useTrialStatus()

  const isPaid = profile?.is_paid_user === true
  const totalSlides = 5

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data, error } = await profileService.getProfile()
      if (error) {
        console.error('Error loading profile:', error)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      // setLoading(false) // This line was removed from the original file, so it's removed here.
    }
  }

  const nextSlide = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(prev => prev + 1)
    } else {
      navigate('/')
    }
  }

  const prevSlide = () => {
    setCurrentSlide(prev => Math.max(prev - 1, 1))
  }

  const skipTutorial = () => {
    navigate('/')
  }

  const handleUpgrade = async () => {
    navigate('/upgrade')
  }

  const renderSlide1 = () => (
    <div className="tutorial-slide">
      <div className="tutorial-icon">
        <span style={{ fontSize: '4rem' }}>📈</span>
      </div>
      <h2 className="tutorial-title">Your Evolving Stats</h2>
      <p className="tutorial-description">
        Track your growth across weekly, monthly, and all-time views. Watch your progress unfold as you continue your Pokémon GO journey.
      </p>
      <div className="tutorial-visual">
        <div className="stats-preview">
          <div className="stat-timeline">
            <div className="stat-period active">
              <span className="period-label">Week</span>
              <div className="stat-bar" style={{ width: '60%' }}></div>
            </div>
            <div className="stat-period">
              <span className="period-label">Month</span>
              <div className="stat-bar" style={{ width: '80%' }}></div>
            </div>
            <div className="stat-period">
              <span className="period-label">All Time</span>
              <div className="stat-bar" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      </div>
      <div className="tutorial-features">
        <div className="feature-item">
          <span className="feature-icon">⚡</span>
          <span>Live stat tracking</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">📊</span>
          <span>Progress analytics</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🎯</span>
          <span>Goal setting</span>
        </div>
      </div>
    </div>
  )

  const renderSlide2 = () => (
    <div className="tutorial-slide">
      <div className="tutorial-icon">
        <span style={{ fontSize: '4rem' }}>🏆</span>
      </div>
      <h2 className="tutorial-title">Share Your Stats</h2>
      <p className="tutorial-description">
        Here's your performance radar and grind card, generated from your first stat upload. {isPaid ? 'As a full member, you can regenerate and share anytime.' : 'Trial users can share it once right now. Upgrade for unlimited sharing.'}
      </p>
      <div className="tutorial-visual">
        {/* Performance Radar */}
        <div style={{ marginBottom: '2rem' }}>
          <PerformanceRadarChart 
            profile={profile} 
            isPaidUser={trialStatus.isPaidUser} 
            showHeader={false}
          />
        </div>

        {/* Grind Card */}
        <div className="grind-card-preview">
          <div className="grind-card">
            <div className="grind-header">
              <span className="grind-title">ALL-TIME GRIND</span>
              <span className="grind-badge">{isPaid ? 'PRO' : 'TRIAL'}</span>
            </div>
            <div className="grind-stats">
              <div className="grind-stat">
                <span className="grind-number">{profile ? (profile.pokemon_caught || 0).toLocaleString() : '0'}</span>
                <span className="grind-label">Pokémon</span>
              </div>
              <div className="grind-stat">
                <span className="grind-number">{profile ? (profile.distance_walked || 0).toFixed(1) : '0'}</span>
                <span className="grind-label">km Walked</span>
              </div>
              <div className="grind-stat">
                <span className="grind-number">{profile ? (profile.total_xp || 0).toLocaleString() : '0'}</span>
                <span className="grind-label">Total XP</span>
              </div>
            </div>
            <div className="grind-footer">
              <span className="grind-watermark">PlayerZERO</span>
            </div>
          </div>
        </div>
      </div>
      <div className="tutorial-features">
        <div className="feature-item">
          <span className="feature-icon">📱</span>
          <span>Social media ready</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🎨</span>
          <span>{isPaid ? 'Unlimited regeneration' : 'One-time share'}</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🚀</span>
          <span>Show your progress</span>
        </div>
      </div>
    </div>
  )

  const renderSlide3 = () => (
    <div className="tutorial-slide">
      <div className="tutorial-icon">
        <span style={{ fontSize: '4rem' }}>👑</span>
      </div>
      <h2 className="tutorial-title">Leaderboards</h2>
      <p className="tutorial-description">
        See who's grinding hardest in the community. Leaderboard placement updates every week based on your progress and dedication.
      </p>
      <div className="tutorial-visual">
        <div className="leaderboard-preview">
          <div className="leaderboard-header">
            <span className="leaderboard-title">🏆 Top Grinders</span>
            <span className="leaderboard-update">Updates Week</span>
          </div>
          <div className="leaderboard-entries">
            <div className="leaderboard-entry top">
              <span className="rank">#1</span>
              <span className="trainer">PikachuMaster</span>
              <span className="score">15.2M XP</span>
            </div>
            <div className="leaderboard-entry">
              <span className="rank">#2</span>
              <span className="trainer">GyaradosKing</span>
              <span className="score">12.8M XP</span>
            </div>
            <div className="leaderboard-entry">
              <span className="rank">#3</span>
              <span className="trainer">CharizardQueen</span>
              <span className="score">11.5M XP</span>
            </div>
            <div className="leaderboard-entry you">
              <span className="rank">#47</span>
              <span className="trainer">You</span>
              <span className="score">5.2M XP</span>
            </div>
          </div>
        </div>
      </div>
      <div className="tutorial-features">
        <div className="feature-item">
          <span className="feature-icon">🥇</span>
          <span>Global rankings</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">📅</span>
          <span>Week updates</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🎯</span>
          <span>Multiple categories</span>
        </div>
      </div>
    </div>
  )

  const renderSlide4 = () => (
    <div className="tutorial-slide">
      <div className="tutorial-icon">
        <span style={{ fontSize: '4rem' }}>🤝</span>
      </div>
      <h2 className="tutorial-title">Teams & Community</h2>
      <p className="tutorial-description">
        Choose your team color and connect with fellow trainers. Future updates will bring private teams, gifts, and exciting challenges.
      </p>
      <div className="tutorial-visual">
        <div className="teams-preview">
          <div className="team-colors">
            <div className="team-circle" style={{ backgroundColor: '#FF4136' }}>
              <span className="team-initial">V</span>
            </div>
            <div className="team-circle" style={{ backgroundColor: '#0074D9' }}>
              <span className="team-initial">M</span>
            </div>
            <div className="team-circle" style={{ backgroundColor: '#FFDC00' }}>
              <span className="team-initial">I</span>
            </div>
          </div>
          <div className="community-features">
            <div className="feature-coming">
              <span className="feature-emoji">🎁</span>
              <span className="feature-text">Team Gifts</span>
              <span className="coming-soon">Coming Soon</span>
            </div>
            <div className="feature-coming">
              <span className="feature-emoji">🏅</span>
              <span className="feature-text">Team Challenges</span>
              <span className="coming-soon">Coming Soon</span>
            </div>
            <div className="feature-coming">
              <span className="feature-emoji">👥</span>
              <span className="feature-text">Private Teams</span>
              <span className="coming-soon">Coming Soon</span>
            </div>
          </div>
        </div>
      </div>
      <div className="tutorial-features">
        <div className="feature-item">
          <span className="feature-icon">🎨</span>
          <span>Custom team colors</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">💬</span>
          <span>Community chat</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🚀</span>
          <span>Future features</span>
        </div>
      </div>
    </div>
  )

  const renderSlide5 = () => (
    <div className="tutorial-slide">
      <div className="tutorial-icon">
        <span style={{ fontSize: '4rem' }}>{isPaid ? '🎉' : '⭐'}</span>
      </div>
      <h2 className="tutorial-title">
        {isPaid ? 'Welcome to Full Access!' : 'Go Full Access'}
      </h2>
      <p className="tutorial-description">
        {isPaid 
          ? 'You have full access to all features! Enjoy unlimited grind cards, leaderboard presence, and premium profile features.'
          : 'Appear on leaderboards, unlock shareable stat cards, and show off your full profile with premium features.'
        }
      </p>
      <div className="tutorial-visual">
        <div className="upgrade-preview">
          <div className="upgrade-benefits">
            <div className="benefit-item">
              <span className="benefit-icon">📊</span>
              <span className="benefit-text">Leaderboard presence</span>
              <span className={`benefit-status ${isPaid ? 'active' : 'inactive'}`}>
                {isPaid ? '✓' : 'Upgrade'}
              </span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🏆</span>
              <span className="benefit-text">Unlimited grind cards</span>
              <span className={`benefit-status ${isPaid ? 'active' : 'inactive'}`}>
                {isPaid ? '✓' : 'Upgrade'}
              </span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🎨</span>
              <span className="benefit-text">Premium profile features</span>
              <span className={`benefit-status ${isPaid ? 'active' : 'inactive'}`}>
                {isPaid ? '✓' : 'Upgrade'}
              </span>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">👑</span>
              <span className="benefit-text">Exclusive community access</span>
              <span className={`benefit-status ${isPaid ? 'active' : 'inactive'}`}>
                {isPaid ? '✓' : 'Upgrade'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {!isPaid && (
        <div className="upgrade-action">
          <button
            onClick={handleUpgrade}
            className="nav-button primary upgrade-button"
          >
            Upgrade Now
            <svg className="nav-button-icon right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )

  // Welcome screen
  if (showWelcome) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e5e7eb 100%)',
        padding: '2rem',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '4rem 3rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          textAlign: 'center',
          maxWidth: '450px',
          width: '90%',
          animation: 'fadeInScale 0.5s ease-out'
        }}>
          <style>{`
            @keyframes fadeInScale {
              from {
                opacity: 0;
                transform: scale(0.9);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
          
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: '600',
            marginBottom: '2.5rem',
            color: '#1f2937',
            fontFamily: 'Poppins, sans-serif'
          }}>
            Welcome to
          </h2>
          
          <div style={{
            marginBottom: '3rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <img 
              src="/images/logo.svg" 
              alt="PlayerZERO" 
              style={{
                width: '280px',
                height: 'auto',
                maxWidth: '100%'
              }}
            />
          </div>
          
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem 3.5rem',
              fontSize: '1.15rem',
              fontWeight: '600',
              fontFamily: 'Poppins, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(239, 68, 68, 0.25)',
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 25px rgba(239, 68, 68, 0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(239, 68, 68, 0.25)'
            }}
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  // Tutorial slides
  return (
    <div className="profile-setup-container">
      <div className="profile-setup-wrapper">
        <div className="profile-setup-card">
          <div className="profile-setup-content">
            {/* Header */}
            <div className="profile-setup-header">
              <h1 className="profile-setup-title">Welcome to PlayerZERO!</h1>
              <p className="profile-setup-subtitle">
                Let's show you what's possible with your new profile
              </p>
            </div>

            {/* Slide Indicator */}
            <div className="tutorial-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(currentSlide / totalSlides) * 100}%` }}
                ></div>
              </div>
              <span className="progress-text">{currentSlide} of {totalSlides}</span>
            </div>

            {/* Slide Content */}
            <div className="tutorial-content">
              {currentSlide === 1 && renderSlide1()}
              {currentSlide === 2 && renderSlide2()}
              {currentSlide === 3 && renderSlide3()}
              {currentSlide === 4 && renderSlide4()}
              {currentSlide === 5 && renderSlide5()}
            </div>

            {/* Navigation */}
            <div className="navigation">
              <div style={{ display: 'flex', gap: '1rem' }}>
                {currentSlide > 1 && (
                  <button
                    onClick={prevSlide}
                    className="nav-button secondary"
                  >
                    <svg className="nav-button-icon left" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                )}
                <button
                  onClick={skipTutorial}
                  className="nav-button secondary"
                >
                  Skip Tutorial
                </button>
              </div>
              
              <button
                onClick={nextSlide}
                className="nav-button primary"
              >
                {currentSlide === totalSlides ? 'Get Started' : 'Next'}
                <svg className="nav-button-icon right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 