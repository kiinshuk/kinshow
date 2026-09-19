import { useParams, Link } from 'react-router-dom';
import { SEO, StructuredData, breadcrumbSchema } from '../components/SEO';
import { getBlogPost, getBlogPosts } from '../blogData';
import EmptyState from '../components/EmptyState';
export default function BlogPost() {
  const { slug } = useParams();
  const post = getBlogPost(slug);
 
  if (!post) {
    return (
      <main className="page">
        <EmptyState title="Article Not Found" description="This blog post could not be found." action={<Link to="/blog" className="btn btn--secondary">Back to Blog</Link>} />
      </main>
    );
  }

  const allPosts = getBlogPosts();
  const relatedPosts = allPosts.filter(p => p.slug !== post.slug).slice(0, 3);

  return (
    <main className="page">
      <SEO
        title={post.title}
        description={post.excerpt}
        image={post.image}
        url={`https://kinshow.vercel.app/blog/${post.slug}`}
        type="article"
      />
      <StructuredData data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date,
        author: { '@type': 'Organization', name: 'Kinshow' },
        publisher: { '@type': 'Organization', name: 'Kinshow', url: 'https://kinshow.vercel.app' },
        image: post.image,
        url: `https://kinshow.vercel.app/blog/${post.slug}`
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
