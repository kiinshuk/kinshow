import { Link } from "react-router-dom";
import {
  SEO,
  StructuredData,
  faqSchema,
  organizationSchema,
  breadcrumbSchema,
} from "../components/SEO";
import CONTRIBUTORS from "../data/contributors.json";

const FAQ_DATA = [
  {
    question: "What is Kinshow?",
    answer:
      "Kinshow is a free cinema discovery platform that helps you find movies and TV shows. We provide ratings, cast information, reviews, and streaming availability all in one place.",
  },
  {
    question: "Is Kinshow free to use?",
    answer:
      "Yes, Kinshow is completely free to use. We do not charge any fees for browsing movies, TV shows, or using features like the watchlist and viewing history.",
  },
  {
    question: "Does Kinshow host any content?",
    answer:
      "No, Kinshow does not host, stream, or distribute any copyrighted content. We aggregate data from third-party APIs (TVmaze, OMDb) and redirect to authorized streaming services.",
  },
  {
    question: "How do I create a watchlist on Kinshow?",
    answer:
      'Simply click the "+ Add to List" button on any movie or TV show detail page. Your watchlist is saved locally in your browser and accessible from the My List page.',
  },
  {
    question: "What data sources does Kinshow use?",
    answer:
      "Kinshow uses TVmaze API for TV show data, OMDb API for movie ratings and posters, and IMDb for identification. All data belongs to their respective owners.",
  },
  {
    question: "Is Kinshow available on mobile?",
    answer:
      "Yes, Kinshow is fully responsive and works on all devices including smartphones, tablets, and desktop browsers.",
  },
  {
    question: "How do I report a bug or suggest a feature?",
    answer:
      "You can contact us via email at kinshuksharma2024@gmail.com or open an issue on our GitHub repository at github.com/kiinshuk/kinshow.",
  },
];

const FEATURES = [
  {
    icon: "🎬",
    title: "Movie & TV Database",
    description:
      "Browse movies and TV shows with ratings, cast details, and synopses.",
  },
  {
    icon: "⌕",
    title: "Smart Search",
    description:
      "Find movies and shows quickly with a fast and responsive search.",
  },
  {
    icon: "🔖",
    title: "Personal Watchlist",
    description: "Save movies and shows you want to watch later.",
  },
  {
    icon: "◷",
    title: "Viewing History",
    description: "Keep track of the movies and shows you've already explored.",
  },
  {
    icon: "▣",
    title: "Episode Guide",
    description:
      "Explore complete season and episode information for TV series.",
  },
  {
    icon: "▶",
    title: "Streaming Links",
    description:
      "Find where your favorite movies and shows are available to watch.",
  },
  {
    icon: "⌘",
    title: "Responsive Design",
    description: "Enjoy Kinshow across desktop, tablet, and mobile devices.",
  },
];

const DATA_SOURCES = [
  {
    name: "TVmaze",
    description: "TV show data, episode guides, cast information, and images.",
  },
  {
    name: "OMDb API",
    description: "Movie ratings, posters, and supplementary movie information.",
  },
  {
    name: "IMDb",
    description: "Movie and show identification and ratings.",
  },
];

const TECHNOLOGIES = [
  "React 18",
  "Vite",
  "React Router",
  "TVmaze API",
  "OMDb API",
  "Vercel",
  "Vercel Analytics",
];

export default function About() {
  return (
    <main id="content" tabIndex={-1} className="page">
      <SEO
        title="About"
        description="Learn about Kinshow — a free cinema discovery platform for movies and TV shows. Browse ratings, cast, reviews, and find streaming links. No sign-up required."
        url="https://kinshow.vercel.app/about"
      />

      <StructuredData data={faqSchema(FAQ_DATA)} />
      <StructuredData data={organizationSchema()} />

      <StructuredData
        data={breadcrumbSchema([
          { name: "Home", url: "https://kinshow.vercel.app/" },
          { name: "About", url: "https://kinshow.vercel.app/about" },
        ])}
      />

      <div className="about-page">
        {/* HERO */}
        <section className="about-hero">
          <div className="about-eyebrow">
            <span className="about-eyebrow-dot" />
            About Kinshow
          </div>

          <h1 className="about-hero-title">
            Discover your next <span>favorite.</span>
          </h1>

          <p className="about-hero-description">
            A free cinema discovery platform for finding movies and TV shows,
            exploring ratings and cast information, and keeping track of what
            you want to watch.
          </p>
        </section>

        {/* ABOUT KINSHOW */}
        <section className="about-section">
          <div className="about-section-heading">
            <h2 className="about-section-title">About Kinshow</h2>
            <span className="about-section-label">01</span>
          </div>

          <div className="about-copy">
            <p>
              Kinshow is a free cinema discovery platform designed to help you
              find your next favorite movie or TV show. We aggregate data from
              multiple sources to give you ratings, cast information, reviews,
              and streaming availability — all in one clean, easy-to-use
              interface.
            </p>

            <p>
              Whether you're looking for the latest trending series or a hidden
              gem from the past, Kinshow helps you discover, track, and organize
              your watchlist.
            </p>
          </div>
        </section>

        {/* FEATURES */}
        <section className="about-section">
          <div className="about-section-heading">
            <h2 className="about-section-title">Features</h2>
            <span className="about-section-label">02</span>
          </div>

          <p className="about-section-description">
            Everything you need to discover, organize, and keep track of what
            you want to watch.
          </p>

          <div className="about-feature-list">
            {FEATURES.map((feature) => (
              <article className="about-feature" key={feature.title}>
                <span className="about-feature-icon" aria-hidden="true">
                  {feature.icon}
                </span>

                <div>
                  <h3 className="about-feature-title">{feature.title}</h3>

                  <p className="about-feature-description">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* DATA SOURCES */}
        <section className="about-section">
          <div className="about-section-heading">
            <h2 className="about-section-title">Data Sources</h2>
            <span className="about-section-label">03</span>
          </div>

          <p className="about-section-description">
            Kinshow uses third-party services to provide movie and TV
            information.
          </p>

          <div className="about-source-list">
            {DATA_SOURCES.map((source) => (
              <div className="about-source" key={source.name}>
                <div className="about-source-name">{source.name}</div>

                <div className="about-source-description">
                  {source.description}
                </div>
              </div>
            ))}
          </div>

          <p className="about-data-note">
            All movie and TV show data, images, and trademarks are the property
            of their respective owners. Kinshow does not host any content
            directly.
          </p>
        </section>

        {/* TECHNOLOGY */}
        <section className="about-section">
          <div className="about-section-heading">
            <h2 className="about-section-title">Technology</h2>
            <span className="about-section-label">04</span>
          </div>

          <p className="about-section-description">
            Kinshow is built with modern web technologies and deployed on
            Vercel.
          </p>

          <div className="about-tech-list">
            {TECHNOLOGIES.map((technology) => (
              <span className="about-tech-badge" key={technology}>
                {technology}
              </span>
            ))}
          </div>
        </section>

        {/* CONTRIBUTORS */}
        <section className="about-section">
          <div className="about-section-heading">
            <h2 className="about-section-title">Contributors</h2>
            <span className="about-section-label">05</span>
          </div>

          <p className="about-section-description">
            Kinshow is built by the community. A huge thank you to our{" "}
            {CONTRIBUTORS.length} contributors who have shipped fixes, features,
            and improvements.
          </p>

          <div className="about-contributor-list">
            {CONTRIBUTORS.map((c) => (
              <a
                className="about-contributor"
                key={c.login}
                href={`https://github.com/${c.login}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  className="about-contributor-avatar"
                  src={c.avatar}
                  alt={`${c.login} avatar`}
                  width="48"
                  height="48"
                  loading="lazy"
                />

                <div className="about-contributor-info">
                  <span className="about-contributor-name">
                    {c.login}
                    {c.owner && (
                      <span className="about-contributor-badge">Owner</span>
                    )}
                  </span>

                  <span className="about-contributor-count">
                    {c.contributions}{" "}
                    {c.contributions === 1
                      ? "contribution"
                      : "contributions"}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* CONTRIBUTING */}
        <section className="about-section">
          <div className="about-contribute">
            <div className="about-contribute-content">
              <h2 className="about-contribute-title">Contributing</h2>

              <p className="about-contribute-description">
                Kinshow is an open-source project. Found a bug, have an idea, or
                want to help improve the project? Check out the repository and
                contribute to its development.
              </p>
            </div>

            <a
              href="https://github.com/kiinshuk/kinshow"
              target="_blank"
              rel="noopener noreferrer"
              className="about-github-link"
            >
              View on GitHub →
            </a>
          </div>
        </section>

        {/* DISCLAIMER */}
        <section className="about-section">
          <div className="about-disclaimer">
            <h2 className="about-disclaimer-title">Disclaimer</h2>

            <p>
              Kinshow is an educational project built for demonstration
              purposes. We do not host, stream, or distribute any copyrighted
              content. All streaming links redirect to third-party services that
              hold the rights to distribute content. Users are responsible for
              ensuring they access content through legal and authorized
              channels.
            </p>
          </div>
        </section>

        {/* CONTACT */}
        <section className="about-section">
          <div className="about-contact">
            <h2 className="about-contact-title">Get in Touch</h2>

            <p>
              Have questions, suggestions, or feedback? Visit our Contact page
              to reach out.
            </p>

            <Link to="/contact" className="about-contact-link">
              Visit Contact Page →
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="about-section">
          <div className="about-section-heading">
            <h2 className="about-section-title">Frequently Asked Questions</h2>
            <span className="about-section-label">06</span>
          </div>

          <div className="about-faq">
            {FAQ_DATA.map((q) => (
              <details className="about-faq-item" key={q.question}>
                <summary className="about-faq-question">
                  <span>{q.question}</span>
                  <span className="about-faq-icon" aria-hidden="true">
                    +
                  </span>
                </summary>

                <p className="about-faq-answer">{q.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
