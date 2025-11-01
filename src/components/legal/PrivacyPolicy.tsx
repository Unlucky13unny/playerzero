import { Layout } from '../layout/Layout'
import './Legal.css'

export const PrivacyPolicy = () => {
  return (
    <Layout>
      <div className="legal-container">
        <div className="legal-content">
          <h1>PlayerZERO Privacy Policy</h1>
          
          <div className="legal-section">
            <p className="last-updated"><strong>Last Updated</strong></p>
            <p>October 2025</p>
          </div>

          <div className="legal-section">
            <h2>Introduction</h2>
            <p>
              PlayerZERO ("we," "our," or "us") values your privacy. This Privacy Policy explains how we collect, use, store, and protect information when you use the PlayerZERO website, mobile app, and related services (collectively, the "Service"). By using the Service, you agree to the practices described below.
            </p>
          </div>

          <div className="legal-section">
            <h2>Information We Collect</h2>
            <p>We collect both information you provide directly and data generated through your use of the Service. This may include:</p>
            <ul>
              <li>Account information such as email address, username, password, and country.</li>
              <li>Uploaded content including screenshots, trainer names, and gameplay data.</li>
              <li>Optional social media links or handles you choose to share.</li>
              <li>Technical information such as IP address, device type, browser version, and usage logs for analytics and troubleshooting.</li>
              <li>Payment details processed by third-party providers like Stripe. We never store full credit-card information.</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>How We Use Information</h2>
            <p>We use collected information to:</p>
            <ul>
              <li>Operate, maintain, and improve the Service.</li>
              <li>Personalize your experience and features.</li>
              <li>Display global and regional gameplay statistics and leaderboards.</li>
              <li>Detect, prevent, and respond to misuse or cheating.</li>
              <li>Communicate product updates, policy changes, and relevant notices.</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Data Visibility and Sharing</h2>
            <ul>
              <li>Public elements such as trainer name, country, and rank may appear to other users depending on your privacy settings.</li>
              <li>Trial accounts remain private by default.</li>
              <li>Social profiles appear only if you set them to public.</li>
              <li>We do not sell, trade, or rent personal information to any third party.</li>
              <li>We may share anonymized, aggregated gameplay data for research, analytics, or promotional purposes (for example, total catches logged by all users in Japan).</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Cookies and Analytics</h2>
            <p>
              PlayerZERO uses cookies and analytics tools to improve performance and user experience. Cookies help manage sessions, remember login states, and store basic preferences. These may include authentication cookies, preference cookies, and limited analytics cookies that help us understand how users interact with the app. We do not use cookies for advertising or tracking across other sites. You can disable cookies in your browser settings, though some features may not function properly if cookies are turned off.
            </p>
          </div>

          <div className="legal-section">
            <h2>Data Retention</h2>
            <p>
              We retain personal data only as long as necessary to operate the Service or meet legal obligations. Uploaded screenshots are automatically cycled; when the upload limit is reached, older images are replaced by newer ones.
            </p>
          </div>

          <div className="legal-section">
            <h2>Data Security</h2>
            <p>
              We apply encryption, secure servers, and access controls to protect your information. However, no online system is entirely secure. You use PlayerZERO at your own risk, and we cannot guarantee absolute security of transmitted data.
            </p>
          </div>

          <div className="legal-section">
            <h2>Your Rights</h2>
            <p>Depending on your region, you may have rights to:</p>
            <ul>
              <li>Access, correct, or delete your personal information.</li>
              <li>Withdraw consent or limit processing.</li>
              <li>Request a copy of data we hold about you.</li>
            </ul>
            <p>
              Requests can be sent to <a href="mailto:contact@playerzero.com">contact@playerzero.com</a>, and we will respond in accordance with applicable laws.
            </p>
          </div>

          <div className="legal-section">
            <h2>Children's Privacy</h2>
            <p>
              PlayerZERO is not directed toward children under 13. If we discover a child's personal data has been collected, we will delete it promptly.
            </p>
          </div>

          <div className="legal-section">
            <h2>International Users</h2>
            <p>
              If you access PlayerZERO from outside the United States, your data may be transferred and processed in the U.S., where data protection laws differ from your country's local regulations.
            </p>
          </div>

          <div className="legal-section">
            <h2>Policy Updates</h2>
            <p>
              We may revise this Privacy Policy from time to time. Significant changes will be announced through in-app notifications or email. Continued use of PlayerZERO after updates constitutes acceptance of the revised terms.
            </p>
          </div>

          <div className="legal-section">
            <h2>Contact</h2>
            <p>
              Questions or concerns about this policy can be directed to: <a href="mailto:support@plyrzero.com">support@plyrzero.com</a>
            </p>
          </div>

          {/* Footer */}
          <div className="legal-footer">
            <span className="legal-footer-copyright">
              © 2025 PlayerZero. All rights reserved.
            </span>
            <span className="legal-footer-tagline">
              Powering the next generation of Pokemon GO trainers
            </span>
          </div>
        </div>
      </div>
    </Layout>
  )
}

