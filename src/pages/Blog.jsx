import { Link } from 'react-router-dom';
import { SEO, StructuredData, breadcrumbSchema, websiteSchema } from '../components/SEO';
import { getBlogPosts } from '../blogData';

export default function Blog() {
  const posts = getBlogPosts();

  return (
    <main id="content" tabIndex={-1} className="page">
      <SEO
        title="Blog"
        description="Read the latest articles about movies, TV shows, and streaming on Kinshow. Guides, recommendations, lists, and tips for finding what to watch."
        url="https://kinshow.vercel.app/blog"
      />
      <StructuredData data={websiteSchema()} />
      <StructuredData data={breadcrumbSchema([
        { name: 'Home', url: 'https://kinshow.vercel.app/' },
        { name: 'Blog', url: 'https://kinshow.vercel.app/blog' }
      ])} />
      <div className="page-header">
        <h1 className="page-title">Blog</h1>
        <p className="page-subtitle">Articles about movies, TV shows, and cinema discovery</p>
      </div>
      <div className="blog-grid">
        {posts.map(post => (
          <Link to={`/blog/${post.slug}`} key={post.slug} className="blog-card">
            <div className="blog-card-img">
              <img src={post.image} alt={post.title} loading="lazy" />
              <span className="blog-card-category">{post.category}</span>
            </div>
            <div className="blog-card-content">
              <div className="blog-card-meta">
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="blog-card-title">{post.title}</h2>
              <p className="blog-card-excerpt">{post.excerpt}</p>
              <span className="blog-card-link">Read More →</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
