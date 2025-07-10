import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useRef } from 'react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleGetStarted = () => {
    navigate('/signup');
  };

  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <header className="landing-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">PlayerZero</span>
          </div>
          <div className="header-actions">
            <button onClick={() => navigate('/login')} className="header-button text">
              Log In
            </button>
            <button onClick={handleGetStarted} className="hero-button primary glow-effect">
              <span className="button-content">
                <span className="button-text">Sign Up</span>
                <span className="button-icon">
                  <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4L20 12L12 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </span>
              <span className="button-border"></span>
              <span className="button-overlay"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-sphere"></div>
        <div className="gradient-sphere secondary"></div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content animate-on-scroll">
          <div className="badge-pill">
            🚀 Your Pokemon GO Journey Starts Here
          </div>
          <h1 className="hero-title">
            Track your grind.<br />
            <span className="highlight">See your progress.</span><br />
            Compare with friends.
          </h1>
          <p className="hero-description">
            The ultimate companion app for Pokémon GO trainers. Track your stats, showcase your achievements, and connect with the community.
          </p>
        </div>
        <div className="hero-visual animate-on-scroll" ref={statsRef}>
          <div className="stats-preview floating">
            <div className="stat-card shine-effect">
              <div className="stat-icon pulse">⚡</div>
              <div className="stat-content">
                <h3>Total XP</h3>
                <div className="stat-value">24.5M</div>
              </div>
            </div>
            <div className="stat-card shine-effect">
              <div className="stat-icon pulse">🔴</div>
              <div className="stat-content">
                <h3>Pokémon Caught</h3>
                <div className="stat-value">45,892</div>
              </div>
            </div>
            <div className="stat-card shine-effect">
              <div className="stat-icon pulse">📍</div>
              <div className="stat-content">
                <h3>PokéStops</h3>
                <div className="stat-value">12,345</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title animate-on-scroll">Why Choose PlayerZero?</h2>
        <div className="features-grid">
          <div className="feature-card animate-on-scroll">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">📊</div>
            </div>
            <h3>Comprehensive Stats</h3>
            <p>Track all your important Pokémon GO metrics in one place. From XP to catch counts, we've got you covered.</p>
          </div>
          <div className="feature-card animate-on-scroll" style={{ animationDelay: '0.2s' }}>
            <div className="feature-icon-wrapper">
              <div className="feature-icon">🏆</div>
            </div>
            <h3>Leaderboards</h3>
            <p>Compare your progress with trainers worldwide. Climb the ranks and showcase your achievements.</p>
          </div>
          <div className="feature-card animate-on-scroll" style={{ animationDelay: '0.4s' }}>
            <div className="feature-icon-wrapper">
              <div className="feature-icon">🤝</div>
            </div>
            <h3>Community</h3>
            <p>Connect with fellow trainers, share your accomplishments, and build lasting friendships.</p>
          </div>
          <div className="feature-card animate-on-scroll" style={{ animationDelay: '0.6s' }}>
            <div className="feature-icon-wrapper">
              <div className="feature-icon">📱</div>
            </div>
            <h3>Easy Updates</h3>
            <p>Update your stats quickly and easily. Keep your profile current with minimal effort.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-background">
          <div className="cta-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
        <div className="cta-content animate-on-scroll">
          <div className="badge-pill">✨ Limited Time Offer</div>
          <h2>Ready to Start Your Journey?</h2>
          <p>Join the community of dedicated trainers and start tracking your progress today.</p>
          <button onClick={handleGetStarted} className="cta-button glow-effect">
            <span className="button-content">
              <span className="button-text">Sign Up</span>
              <span className="button-icon">
                <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4L20 12L12 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </span>
            <span className="button-border"></span>
            <span className="button-overlay"></span>
          </button>
        </div>
      </section>
    </div>
  );
}; 