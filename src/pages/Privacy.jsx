import { SEO } from '../components/SEO';

export default function Privacy() {
  return (
    <main id="content" tabIndex={-1} className="page">
      <SEO title="Privacy Policy" description="Kinshow privacy policy. Learn how we collect, use, and protect your data." url="https://kinshow.vercel.app/privacy" />
      <div className="legal-page">
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-updated">Last updated: September 6, 2026</p>

        <section className="legal-section">
          <h2>1. Introduction</h2>
          <p>Welcome to Kinshow ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at kinshow.vercel.app.</p>
          <p>By using our website, you agree to the collection and use of information in accordance with this policy. If you do not agree, please discontinue use of our website.</p>
        </section>

        <section className="legal-section">
          <h2>2. Information We Collect</h2>
          <h3>Automatically Collected Information</h3>
          <p>When you visit our website, we may automatically collect certain information, including:</p>
          <ul>
            <li>Device type and browser information</li>
            <li>IP address (anonymized)</li>
            <li>Pages visited and time spent on pages</li>
            <li>Referring website or source</li>
            <li>Date and time of access</li>
          </ul>

          <h3>Locally Stored Data</h3>
          <p>We use browser localStorage to save your preferences, including:</p>
          <ul>
            <li>Watchlist (movies and shows you save)</li>
            <li>Viewing history</li>
            <li>Ratings you provide</li>
          </ul>
          <p>This data is stored entirely on your device and is never transmitted to our servers.</p>
        </section>

        <section className="legal-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information to:</p>
          <ul>
            <li>Improve and maintain our website</li>
            <li>Analyze usage trends and optimize performance</li>
            <li>Prevent fraud and enhance security</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Third-Party Services</h2>
          <p>Our website uses the following third-party services that may collect information:</p>
          <ul>
            <li><strong>Vercel Analytics</strong> — tracks anonymous page views and visitor statistics</li>
            <li><strong>Google Search Console</strong> — monitors search performance and site health</li>
          </ul>
          <p>These services have their own privacy policies governing how they handle data.</p>
        </section>

        <section className="legal-section">
          <h2>5. Cookies</h2>
          <p>We do not use cookies directly. However, third-party services listed above may use cookies for analytics purposes. You can manage cookie preferences through your browser settings.</p>
        </section>

        <section className="legal-section">
          <h2>6. Data Security</h2>
          <p>We implement appropriate security measures to protect your information. However, no method of electronic transmission or storage is 100% secure, and we cannot guarantee absolute security.</p>
        </section>

        <section className="legal-section">
          <h2>7. Children's Privacy</h2>
          <p>Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.</p>
        </section>

        <section className="legal-section">
          <h2>8. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated "Last updated" date.</p>
        </section>

        <section className="legal-section">
          <h2>9. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us through our <a href="/contact">Contact page</a>.</p>
        </section>
      </div>
    </main>
  );
}
