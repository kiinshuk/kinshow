// Single source of truth for the FAQ content rendered on the About and Contact
// pages (visible UI + FAQPage JSON-LD) and injected into the prerendered static
// HTML by prerender.mjs. Keep all three in sync by editing only this file.

export const ABOUT_FAQ = [
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
  {
    question: "Where can I watch the movies and shows I find on Kinshow?",
    answer:
      'Every detail page has a "Watch Now" button that opens Kinshow\'s built-in player, which lists the available streaming servers for that title. If one server fails, switch to another.',
  },
  {
    question: "How accurate are the ratings on Kinshow?",
    answer:
      "Ratings come straight from IMDb via the OMDb API and are shown on a 10-point scale, while seasons, episodes, and air dates come from TVmaze. Scores update as IMDb users keep voting.",
  },
];

export const CONTACT_FAQ = [
  {
    question: "How do I contact Kinshow support?",
    answer:
      "You can reach us via email at kinshuksharma2024@gmail.com or by opening an issue on our GitHub repository at github.com/kiinshuk/kinshow.",
  },
  {
    question: "How do I report a bug on Kinshow?",
    answer:
      "Please email us with steps to reproduce the bug, expected behavior, and screenshots if possible. You can also open a GitHub issue for faster resolution.",
  },
  {
    question: "Can I suggest a new feature for Kinshow?",
    answer:
      "Absolutely! We welcome feature suggestions. Email us or create a GitHub issue describing the feature you'd like to see and why it would be useful.",
  },
  {
    question: "What is the response time for inquiries?",
    answer:
      "We aim to respond to all inquiries within 48 hours. For urgent issues, using GitHub Issues provides faster resolution.",
  },
  {
    question: "Who runs Kinshow?",
    answer:
      "Kinshow is an open-source project maintained by kiinshuk together with community contributors from around the world. The code, roadmap, and issue tracker are public on GitHub at github.com/kiinshuk/kinshow.",
  },
];
