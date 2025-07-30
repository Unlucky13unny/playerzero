import { useState } from 'react'
import { Link } from 'react-router-dom'

export const ContactHelp = () => {
  const [activeTab, setActiveTab] = useState<'help' | 'contact' | 'faq'>('help')

  const faqItems = [
    {
      question: "How do I get started with PlayerZero?",
      answer: "Sign up for an account, complete your profile setup with your Pokémon GO trainer details, and start tracking your stats. You can update your stats regularly to see your progress on the leaderboards."
    },
    {
      question: "What stats does PlayerZero track?",
      answer: "We track your total XP, Pokémon caught, distance walked, PokéStops visited, and unique Pokédex entries. These are the core metrics that show your grinding progress in Pokémon GO."
    },
    {
      question: "How often should I update my stats?",
      answer: "We recommend updating your stats at least once a week to keep your profile current. You can update them as frequently as you'd like to see your real-time progress."
    },
    {
      question: "What's the difference between Private Mode and Premium?",
      answer: "Private Mode is a free trial that lets you experience the app with limited features. Premium unlocks all features including advanced search, detailed analytics, social links, and unlimited profile views."
    },
    {
      question: "How do the leaderboards work?",
      answer: "Leaderboards are updated weekly and monthly, with historical winners preserved. You can filter by country, team, and time period to see how you rank against other trainers."
    },
    {
      question: "Can I make my profile private?",
      answer: "Yes! You can choose to keep your trainer code private and control which social media links are visible. Premium users get full control over their profile visibility."
    },
    {
      question: "How do the calculators work?",
      answer: "Our calculators help you analyze your Pokémon GO progress. The Grind Stats calculator shows your average daily progress, while other tools help you set goals and track achievements."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use industry-standard encryption and security practices. Your personal information and Pokémon GO stats are protected and never shared without your permission."
    },
    {
      question: "How do I export my stats?",
      answer: "Premium users can create beautiful stat cards to share on social media. These cards showcase your achievements and can be downloaded as high-quality images."
    },
    {
      question: "What if I find incorrect information?",
      answer: "If you notice any issues with your stats or profile, you can update them at any time. For technical issues, please contact our support team."
    }
  ]

  const contactMethods = [
    {
      icon: "📧",
      title: "Email Support",
      description: "Get help with account issues, technical problems, or general questions",
      action: "support@playerzero.com",
      link: "mailto:support@playerzero.com"
    },
    {
      icon: "🐛",
      title: "Report a Bug",
      description: "Found a bug or technical issue? Let us know so we can fix it",
      action: "bug@playerzero.com",
      link: "mailto:bug@playerzero.com"
    },
    {
      icon: "💡",
      title: "Feature Request",
      description: "Have an idea for a new feature? We'd love to hear it",
      action: "ideas@playerzero.com",
      link: "mailto:ideas@playerzero.com"
    },
    {
      icon: "📱",
      title: "Social Media",
      description: "Follow us for updates, tips, and community highlights",
      action: "@pgPlayerZero",
      link: "https://instagram.com/pgPlayerZero"
    }
  ]

  const helpCategories = [
    {
      icon: "👤",
      title: "Profile Setup",
      description: "Learn how to create and customize your trainer profile",
      link: "/profile?edit=true"
    },
    {
      icon: "📊",
      title: "Updating Stats",
      description: "How to keep your stats current and accurate",
      link: "/update-stats"
    },
    {
      icon: "🏆",
      title: "Leaderboards",
      description: "Understanding how rankings and competitions work",
      link: "/leaderboards"
    },
    {
      icon: "🧮",
      title: "Calculators",
      description: "Using our tools to analyze your progress",
      link: "/calculators"
    },
    {
      icon: "🔍",
      title: "Search & Discovery",
      description: "Finding and connecting with other trainers",
      link: "/search"
    },
    {
      icon: "⭐",
      title: "Premium Features",
      description: "What you get with a premium subscription",
      link: "/upgrade"
    }
  ]

  return (
    <div className="contact-help-container">
      {/* Header Section */}
      <div className="contact-help-header">
        <div className="header-content">
          <div className="header-icon">💬</div>
          <h1>Help & Support</h1>
          <p>Get help with PlayerZero, contact our team, or find answers to common questions</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'help' ? 'active' : ''}`}
          onClick={() => setActiveTab('help')}
        >
          🆘 Help Center
        </button>
        <button 
          className={`tab-button ${activeTab === 'contact' ? 'active' : ''}`}
          onClick={() => setActiveTab('contact')}
        >
          📞 Contact Us
        </button>
        <button 
          className={`tab-button ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveTab('faq')}
        >
          ❓ FAQ
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Help Center Tab */}
        {activeTab === 'help' && (
          <div className="help-content">
            <div className="help-intro">
              <h2>Getting Started with PlayerZero</h2>
              <p>Choose a category below to get detailed help with specific features:</p>
            </div>
            
            <div className="help-categories">
              {helpCategories.map((category, index) => (
                <Link 
                  key={index} 
                  to={category.link} 
                  className="help-category-card"
                >
                  <div className="category-icon">{category.icon}</div>
                  <div className="category-content">
                    <h3>{category.title}</h3>
                    <p>{category.description}</p>
                  </div>
                  <div className="category-arrow">→</div>
                </Link>
              ))}
            </div>

            <div className="quick-tips">
              <h3>Quick Tips</h3>
              <div className="tips-grid">
                <div className="tip-card">
                  <div className="tip-icon">⚡</div>
                  <h4>Keep Stats Updated</h4>
                  <p>Update your stats regularly to see accurate progress on leaderboards</p>
                </div>
                <div className="tip-card">
                  <div className="tip-icon">🔒</div>
                  <h4>Privacy Control</h4>
                  <p>Use privacy settings to control what information is visible to others</p>
                </div>
                <div className="tip-card">
                  <div className="tip-icon">📱</div>
                  <h4>Mobile Friendly</h4>
                  <p>PlayerZero works great on mobile devices for on-the-go stat updates</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="contact-content">
            <div className="contact-intro">
              <h2>Get in Touch</h2>
              <p>We're here to help! Choose the best way to reach us based on your needs:</p>
            </div>

            <div className="contact-methods">
              {contactMethods.map((method, index) => (
                <a 
                  key={index} 
                  href={method.link} 
                  className="contact-method-card"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="method-icon">{method.icon}</div>
                  <div className="method-content">
                    <h3>{method.title}</h3>
                    <p>{method.description}</p>
                    <div className="method-action">{method.action}</div>
                  </div>
                </a>
              ))}
            </div>

            <div className="response-time">
              <h3>Response Times</h3>
              <div className="response-info">
                <div className="response-item">
                  <span className="response-label">Email Support:</span>
                  <span className="response-time">Within 24 hours</span>
                </div>
                <div className="response-item">
                  <span className="response-label">Bug Reports:</span>
                  <span className="response-time">Within 48 hours</span>
                </div>
                <div className="response-item">
                  <span className="response-label">Feature Requests:</span>
                  <span className="response-time">We'll review and respond</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="faq-content">
            <div className="faq-intro">
              <h2>Frequently Asked Questions</h2>
              <p>Find quick answers to the most common questions about PlayerZero:</p>
            </div>

            <div className="faq-list">
              {faqItems.map((item, index) => (
                <details key={index} className="faq-item">
                  <summary className="faq-question">
                    {item.question}
                  </summary>
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>

            <div className="faq-footer">
              <p>Still have questions? <button onClick={() => setActiveTab('contact')} className="inline-link">Contact our support team</button></p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="contact-help-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Additional Resources</h4>
            <div className="resource-links">
              <a href="#" className="resource-link">Terms of Service</a>
              <a href="#" className="resource-link">Privacy Policy</a>
              <a href="#" className="resource-link">Community Guidelines</a>
            </div>
          </div>
          <div className="footer-section">
            <h4>Follow Us</h4>
            <div className="social-links">
              <a href="https://instagram.com/pgPlayerZero" target="_blank" rel="noopener noreferrer" className="social-link">
                Instagram
              </a>
              <a href="https://tiktok.com/@pgPlayerZero" target="_blank" rel="noopener noreferrer" className="social-link">
                TikTok
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 