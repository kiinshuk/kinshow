import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { BLOG_POSTS } from './src/blogData.js';
import { ABOUT_FAQ, CONTACT_FAQ } from './src/faqData.js';

// FAQPage JSON-LD shared with the React pages (src/faqData.js is the single source)
const faqPage = list => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: list.map(q => ({
    '@type': 'Question',
    name: q.question,
    acceptedAnswer: { '@type': 'Answer', text: q.answer }
  }))
});

const DIST = join(process.cwd(), 'dist');
const indexHtml = readFileSync(join(DIST, 'index.html'), 'utf-8');
const SITE = 'https://kinshow.vercel.app';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const blogRoutes = BLOG_POSTS.map(post => {
  const postUrl = `${SITE}/blog/${post.slug}`;
  const dateModified = post.modified || post.date;
  const wordCount = post.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.image ? [post.image] : undefined,
    datePublished: post.date,
    dateModified,
    author: { '@type': 'Organization', name: post.author, url: `${SITE}/about` },
    publisher: { '@type': 'Organization', name: 'Kinshow', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}/og-default.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    wordCount,
    articleSection: post.category,
    keywords: post.tags?.join(', '),
    inLanguage: 'en-us',
    url: postUrl
  });
  const breadcrumb = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl }
    ]
  });
  return {
    path: `/blog/${post.slug}`,
    title: `${post.title} | Kinshow`,
    description: post.excerpt,
    canonical: postUrl,
    type: 'article',
    ogImage: post.image,
    publishedTime: post.date,
    modifiedTime: dateModified,
    section: post.category,
    content: `
      <h1 style="position:absolute;left:-9999px">${esc(post.title)}</h1>
      <p style="position:absolute;left:-9999px">${esc(post.excerpt)}</p>
      <script type="application/ld+json">${schema}</script>
      <script type="application/ld+json">${breadcrumb}</script>`
  };
});

const routes = [
  {
    path: '/',
    title: 'Kinshow - Cinema Discovery | Movies & TV Shows',
    description: 'Discover movies and TV shows on Kinshow. Browse ratings, cast, reviews, and find where to stream. Free cinema discovery with 40+ curated films and trending series.',
    canonical: 'https://kinshow.vercel.app/',
    type: 'website',
    content: `
      <h1 style="position:absolute;left:-9999px">Kinshow - Discover Movies & TV Shows</h1>
      <p style="position:absolute;left:-9999px">Browse popular movies, trending TV series, new releases, and top rated films. Find cast, ratings, reviews, and streaming links for thousands of titles.</p>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"Kinshow","url":"https://kinshow.vercel.app","description":"Discover movies and TV shows on Kinshow","publisher":{"@type":"Organization","name":"Kinshow"},"potentialAction":{"@type":"SearchAction","target":"https://kinshow.vercel.app/explore?q={search_term_string}","query-input":"required name=search_term_string"}}</script>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Kinshow","url":"https://kinshow.vercel.app","logo":"https://kinshow.vercel.app/og-default.png","description":"Free cinema discovery platform","sameAs":["https://github.com/kiinshuk/kinshow"],"contactPoint":{"@type":"ContactPoint","email":"kinshuksharma2024@gmail.com","contactType":"customer service"}}</script>`
  },
  {
    path: '/movies',
    title: 'Movies - Kinshow',
    description: 'Browse 40+ curated movies with ratings, cast info, and streaming links. Find popular, top rated, and new releases. Free movie discovery on Kinshow.',
    canonical: 'https://kinshow.vercel.app/movies',
    type: 'website',
    content: `
      <h1 style="position:absolute;left:-9999px">Movies - Kinshow</h1>
      <p style="position:absolute;left:-9999px">Browse popular movies, top rated films, and new releases. Find your next favorite movie with ratings, cast info, and streaming links.</p>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://kinshow.vercel.app/"},{"@type":"ListItem","position":2,"name":"Movies","item":"https://kinshow.vercel.app/movies"}]}</script>`
  },
  {
    path: '/tv',
    title: 'TV Shows - Kinshow',
    description: 'Browse trending TV shows with episode guides, cast info, and streaming links. Find popular, top rated, and currently airing series on Kinshow.',
    canonical: 'https://kinshow.vercel.app/tv',
    type: 'website',
    content: `
      <h1 style="position:absolute;left:-9999px">TV Shows - Kinshow</h1>
      <p style="position:absolute;left:-9999px">Browse popular TV series, top rated shows, and currently airing episodes. Find cast, ratings, and streaming links for your favorite shows.</p>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://kinshow.vercel.app/"},{"@type":"ListItem","position":2,"name":"TV Shows","item":"https://kinshow.vercel.app/tv"}]}</script>`
  },
  {
    path: '/explore',
    title: 'Explore - Kinshow',
    description: 'Explore movies and TV shows by genre. Find Action, Comedy, Drama, Horror, Sci-Fi, Thriller, and more. Discover your next favorite title on Kinshow.',
    canonical: 'https://kinshow.vercel.app/explore',
    type: 'website',
    content: `
      <h1 style="position:absolute;left:-9999px">Explore Movies & TV Shows</h1>
      <p style="position:absolute;left:-9999px">Explore movies and TV shows by genre. Find action, comedy, drama, horror, sci-fi, thriller, and more.</p>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://kinshow.vercel.app/"},{"@type":"ListItem","position":2,"name":"Explore","item":"https://kinshow.vercel.app/explore"}]}</script>`
  },
  {
    path: '/about',
    title: 'About - Kinshow',
    description: 'Learn about Kinshow — a free cinema discovery platform for movies and TV shows. Browse ratings, cast, reviews, and find streaming links. No sign-up required.',
    canonical: 'https://kinshow.vercel.app/about',
    type: 'website',
    content: `
      <h1 style="position:absolute;left:-9999px">About Kinshow</h1>
      <p style="position:absolute;left:-9999px">Kinshow is a free cinema discovery platform designed to help you find your next favorite movie or TV show. Browse ratings, cast information, and streaming availability.</p>
      <script type="application/ld+json">${faqPage(ABOUT_FAQ)}</script>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://kinshow.vercel.app/"},{"@type":"ListItem","position":2,"name":"About","item":"https://kinshow.vercel.app/about"}]}</script>`
  },
  {
    path: '/contact',
    title: 'Contact Us - Kinshow',
    description: 'Get in touch with the Kinshow team. Send feedback, report bugs, suggest features, or ask questions. We respond within 48 hours.',
    canonical: 'https://kinshow.vercel.app/contact',
    type: 'website',
    content: `
      <h1 style="position:absolute;left:-9999px">Contact Us</h1>
      <p style="position:absolute;left:-9999px">Get in touch with the Kinshow team. Email us at kinshuksharma2024@gmail.com or visit our GitHub repository.</p>
      <script type="application/ld+json">${faqPage(CONTACT_FAQ)}</script>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://kinshow.vercel.app/"},{"@type":"ListItem","position":2,"name":"Contact","item":"https://kinshow.vercel.app/contact"}]}</script>`
  },
  {
    path: '/privacy',
    title: 'Privacy Policy - Kinshow',
    description: 'Kinshow privacy policy. Learn how we collect, use, and protect your data. Your privacy is important to us.',
    canonical: 'https://kinshow.vercel.app/privacy',
    type: 'website',
    content: `
      <h1 style="position:absolute;left:-9999px">Privacy Policy</h1>
      <p style="position:absolute;left:-9999px">Kinshow privacy policy. Learn how we collect, use, and protect your information when you visit our website.</p>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage","name":"Privacy Policy","url":"https://kinshow.vercel.app/privacy","description":"Kinshow privacy policy"}</script>`
  },
  {
    path: '/blog',
    title: 'Blog — Movie & TV Guides, Lists & Reviews | Kinshow',
    description: 'Read the latest articles about movies, TV shows, and streaming on Kinshow. Guides, recommendations, lists, and tips for finding what to watch.',
    canonical: 'https://kinshow.vercel.app/blog',
    type: 'website',
    content: `
      <h1 style="position:absolute;left:-9999px">Kinshow Blog - Movie & TV Articles</h1>
      <p style="position:absolute;left:-9999px">Read articles about movies, TV shows, ratings, and cinema discovery on Kinshow. Find guides, recommendations, and lists.</p>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://kinshow.vercel.app/"},{"@type":"ListItem","position":2,"name":"Blog","item":"https://kinshow.vercel.app/blog"}]}</script>`
  },
  ...blogRoutes
];

routes.forEach(route => {
  let html = indexHtml;

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(route.title)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${esc(route.description)}"`);
  html = html.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${route.canonical}"`);
  html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${esc(route.title)}"`);
  html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${esc(route.description)}"`);
  html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${route.canonical}"`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${esc(route.title)}"`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${esc(route.description)}"`);
  if (route.ogImage) {
    html = html.replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${route.ogImage}"`);
    html = html.replace(/<meta name="twitter:image" content="[^"]*"/, `<meta name="twitter:image" content="${route.ogImage}"`);
    html = html.replace(/<meta property="og:image:width" content="[^"]*"/, '<meta property="og:image:width" content="1200" />');
  }
  if (route.type === 'article') {
    html = html.replace(
      /<meta property="og:type" content="[^"]*"\s*\/>/,
      `<meta property="og:type" content="article" />\n    <meta property="article:published_time" content="${route.publishedTime}" />\n    <meta property="article:modified_time" content="${route.modifiedTime}" />\n    <meta property="article:section" content="${esc(route.section)}" />`
    );
  }
  html = html.replace('<div id="root"></div>', `<div id="root">${route.content}</div>`);

  const dir = route.path === '/' ? DIST : join(DIST, route.path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  console.log(`Prerendered: ${route.path}`);
});

console.log('Done prerendering static routes.');
