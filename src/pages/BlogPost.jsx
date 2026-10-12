import Button from '../components/Button';
import { useParams, Link } from 'react-router-dom';
import { SEO, StructuredData, breadcrumbSchema } from '../components/SEO';
import { getBlogPost, getBlogPosts } from '../blogData';
import EmptyState from '../components/EmptyState';
export default function BlogPost() {
  const { slug } = useParams();
  const post = getBlogPost(slug);
 
  if (!post) {
    return (
      <main id="content" tabIndex={-1} className="page">
        <div className="empty-state">
        <EmptyState 
  title="No Results Found"
  description="We couldn't find the data you were looking for."
  action={<Button as={Link} to="/blog" variant="secondary">Back to Blog</Button>}
/>
        </div>
      </main>
    );
  }

  const allPosts = getBlogPosts();
  const relatedPosts = allPosts.filter(p => p.slug !== post.slug).slice(0, 3);
  const postUrl = `https://kinshow.vercel.app/blog/${post.slug}`;
  const dateModified = post.modified || post.date;
  const wordCount = post.content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;

  return (
    <main id="content" tabIndex={-1} className="page">
      <SEO
        title={post.title}
        description={post.excerpt}
        image={post.image}
        imageAlt={post.title}
        url={postUrl}
        type="article"
        article={{
          publishedTime: post.date,
          modifiedTime: dateModified,
          author: `https://kinshow.vercel.app/about`,
          section: post.category,
          tags: post.tags
        }}
      />
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        image: post.image ? [post.image] : undefined,
        datePublished: post.date,
        dateModified,
        author: { '@type': 'Organization', name: post.author, url: 'https://kinshow.vercel.app/about' },
        publisher: {
          '@type': 'Organization',
          name: 'Kinshow',
          url: 'https://kinshow.vercel.app',
          logo: { '@type': 'ImageObject', url: 'https://kinshow.vercel.app/og-default.png' }
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
        wordCount,
        articleSection: post.category,
        keywords: post.tags?.join(', '),
        inLanguage: 'en-us',
        url: postUrl
      }} />
      <StructuredData data={breadcrumbSchema([
        { name: 'Home', url: 'https://kinshow.vercel.app/' },
        { name: 'Blog', url: 'https://kinshow.vercel.app/blog' },
        { name: post.title, url: `https://kinshow.vercel.app/blog/${post.slug}` }
      ])} />
      <article className="blog-post">
        <div className="blog-post-header">
          <Link to="/blog" className="blog-post-back">← Back to Blog</Link>
          <span className="blog-post-category">{post.category}</span>
          <h1 className="blog-post-title">{post.title}</h1>
          <div className="blog-post-meta">
            <span>{post.author}</span>
            <span>·</span>
            <span>{post.date}</span>
            <span>·</span>
            <span>{post.readTime} read</span>
          </div>
        </div>
        {post.image && (
          <div className="blog-post-hero">
            <img src={post.image} alt={post.title} />
          </div>
        )}
        <div className="blog-post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
      {relatedPosts.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section-title">Related Articles</h2>
          <div className="blog-grid">
            {relatedPosts.map(rp => (
              <Link to={`/blog/${rp.slug}`} key={rp.slug} className="blog-card blog-card--small">
                <div className="blog-card-img">
                  <img src={rp.image} alt={rp.title} loading="lazy" />
                  <span className="blog-card-category">{rp.category}</span>
                </div>
                <div className="blog-card-content">
                  <div className="blog-card-meta">
                    <span>{rp.date}</span>
                    <span>·</span>
                    <span>{rp.readTime}</span>
                  </div>
                  <h3 className="blog-card-title">{rp.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
