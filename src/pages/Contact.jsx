import { SEO, StructuredData, faqSchema, breadcrumbSchema } from '../components/SEO';

const FAQ_DATA = [
  { question: 'How do I contact Kinshow support?', answer: 'You can reach us via email at kinshuksharma2024@gmail.com or by opening an issue on our GitHub repository at github.com/kiinshuk/kinshow.' },
  { question: 'How do I report a bug on Kinshow?', answer: 'Please email us with steps to reproduce the bug, expected behavior, and screenshots if possible. You can also open a GitHub issue for faster resolution.' },
  { question: 'Can I suggest a new feature for Kinshow?', answer: 'Absolutely! We welcome feature suggestions. Email us or create a GitHub issue describing the feature you\'d like to see and why it would be useful.' },
  { question: 'What is the response time for inquiries?', answer: 'We aim to respond to all inquiries within 48 hours. For urgent issues, using GitHub Issues provides faster resolution.' }
];

export default function Contact() {
  return (
    <main id="content" tabIndex={-1} className="page">
      <SEO
        title="Contact Us"
        description="Get in touch with the Kinshow team. Send feedback, report bugs, suggest features, or ask questions. We respond within 48 hours."
        url="https://kinshow.vercel.app/contact"
      />
      <StructuredData data={faqSchema(FAQ_DATA)} />
      <StructuredData data={breadcrumbSchema([
        { name: 'Home', url: 'https://kinshow.vercel.app/' },
        { name: 'Contact', url: 'https://kinshow.vercel.app/contact' }
      ])} />
      <div className="legal-page">
        <h1 className="legal-title">Contact Us</h1>

        <section className="legal-section">
          <h2>Get in Touch</h2>
          <p>We'd love to hear from you! Whether you have a question, feedback, bug report, or feature suggestion, feel free to reach out.</p>
        </section>

        <section className="legal-section">
          <h2>Email</h2>
          <p>For general inquiries, bug reports, or feedback:</p>
          <p><a href="mailto:kinshuksharma2024@gmail.com" className="contact-email">kinshuksharma2024@gmail.com</a></p>
        </section>

        <section className="legal-section">
          <h2>GitHub</h2>
          <p>Found a bug? Want to contribute? Check out our open-source repository:</p>
          <p><a href="https://github.com/kiinshuk/kinshow" target="_blank" rel="noopener noreferrer" className="contact-link">github.com/kiinshuk/kinshow</a></p>
          <p>You can open an issue or submit a pull request.</p>
        </section>

        <section className="legal-section">
          <h2>Social Media</h2>
          <p>Follow us for updates:</p>
          <div className="contact-socials">
            <a href="https://github.com/kiinshuk" target="_blank" rel="noopener noreferrer" className="btn btn--secondary">GitHub</a>
          </div>
        </section>

        <section className="legal-section">
          <h2>What to Include in Your Message</h2>
          <p>To help us respond quickly, please include:</p>
          <ul>
            <li><strong>Bug reports</strong> — Steps to reproduce, expected behavior, screenshots if possible</li>
            <li><strong>Feature requests</strong> — Describe the feature and why it would be useful</li>
            <li><strong>Content issues</strong> — Incorrect data, broken images, wrong information</li>
            <li><strong>General feedback</strong> — What you like, what could be improved</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>Response Time</h2>
          <p>We aim to respond to all inquiries within 48 hours. For urgent issues, please use GitHub Issues for faster resolution.</p>
        </section>

        <section className="legal-section">
          <h2>Frequently Asked Questions</h2>
          {FAQ_DATA.map((q, i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '4px' }}>{q.question}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{q.answer}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
