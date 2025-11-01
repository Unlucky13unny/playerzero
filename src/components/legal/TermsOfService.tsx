import { Layout } from '../layout/Layout'
import './Legal.css'

export const TermsOfService = () => {
  return (
    <Layout>
      <div className="legal-container">
        <div className="legal-content">
          <h1>PlayerZERO Terms of Service</h1>
          
          <div className="legal-section">
            <p className="last-updated"><strong>Last Updated</strong></p>
            <p>October 2025</p>
          </div>

          <div className="legal-section">
            <h2>Introduction</h2>
            <p>
              Welcome to PlayerZERO ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the PlayerZERO website, mobile app, and related services (collectively, the "Service"). By creating an account, accessing, or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
            </p>
          </div>

          <div className="legal-section">
            <h2>Eligibility</h2>
            <p>
              You must be at least 13 years old (or the minimum age of digital consent in your country) to use PlayerZERO. If you are under 18, you must have permission from a parent or guardian. By using the Service, you confirm that all information you provide is accurate and that you are using the Service for lawful purposes.
            </p>
          </div>

          <div className="legal-section">
            <h2>Account Registration</h2>
            <p>
              To access certain features, you must create a PlayerZERO account using a valid email address. You are responsible for maintaining the confidentiality of your login information and for all activity under your account. We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>
          </div>

          <div className="legal-section">
            <h2>User Content</h2>
            <p>User Content includes screenshots, trainer names, profile images, gameplay data, and other materials you upload.</p>
            <ul>
              <li>You retain ownership of your User Content. By uploading, you grant PlayerZERO a non-exclusive, worldwide, royalty-free license to host, display, analyze, and share that content within the Service and in aggregated, anonymized reports.</li>
              <li>Depending on your privacy settings, certain profile elements may be visible to others. Trial users' profiles remain private by default.</li>
              <li>We may remove or disable access to any content that violates these Terms.</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Submit false or manipulated screenshots or statistics.</li>
              <li>Use the Service to harass, defraud, or harm others.</li>
              <li>Interfere with servers, security features, or data collection.</li>
              <li>Upload content that violates copyright, trademarks, or privacy rights.</li>
              <li>Impersonate other trainers or brands.</li>
            </ul>
            <p>Violation of these rules may result in account termination.</p>
          </div>

          <div className="legal-section">
            <h2>Payments and Subscriptions</h2>
            <p>
              Some features require a paid subscription (e.g., leaderboard visibility or social linking). Current pricing is displayed in-app and may change with notice. Trial accounts have limited functionality; when a trial ends, continued access requires upgrading to a paid plan.
            </p>
            <ul>
              <li>Payments are processed securely through Stripe or another approved third-party processor. We do not store your credit-card information directly.</li>
              <li>All sales are final unless required by law.</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Privacy and Data</h2>
            <p>Our use of data is governed by the PlayerZERO Privacy Policy.</p>
            <ul>
              <li>We collect only what is necessary to operate the Service. We do not sell or share personal data (like emails or Trainer Codes). Aggregated, anonymized gameplay data may be analyzed and shared publicly (e.g., global stats, top regions). Uploaded screenshots may be automatically deleted after a limited number of uploads.</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>No Affiliation with Niantic</h2>
            <p>
              PlayerZERO is an independent platform and has no official affiliation with Niantic, Pokémon GO, or The Pokémon Company. All trademarks and intellectual property belong to their respective owners.
            </p>
          </div>

          <div className="legal-section">
            <h2>Disclaimers</h2>
            <p>
              PlayerZERO is provided "as is" and "as available." We make no warranties regarding accuracy, availability, or fitness for a particular purpose. Gameplay results and rankings are user-generated and not guaranteed to be error-free.
            </p>
          </div>

          <div className="legal-section">
            <h2>Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, PlayerZERO and its operators are not liable for any indirect, incidental, or consequential damages, loss of data, profits, or reputation arising from your use of the Service. Your sole remedy is to stop using the Service.
            </p>
          </div>

          <div className="legal-section">
            <h2>Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms or engage in suspicious or abusive behavior. Upon termination, your license to use the Service ends immediately, but aggregate data may remain for analytics.
            </p>
          </div>

          <div className="legal-section">
            <h2>Changes to Terms</h2>
            <p>
              We may update these Terms periodically. If material changes occur, we'll notify you by email or in-app notice. Continued use after changes means you accept the revised Terms.
            </p>
          </div>

          <div className="legal-section">
            <h2>Governing Law</h2>
            <p>
              These Terms are governed by the laws of California, United States. Any disputes will be handled in the state or federal courts located in Los Angeles County, California.
            </p>
          </div>

          <div className="legal-section">
            <h2>Contact</h2>
            <p>
              Questions about these Terms can be sent to: <a href="mailto:support@plyrzero.com">support@plyrzero.com</a>
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

