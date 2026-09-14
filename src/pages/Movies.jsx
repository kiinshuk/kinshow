import { useState, useEffect } from 'react';
import MediaCard from '../components/MediaCard';
import { MOVIES } from '../api';
import { SkeletonCards } from '../components/Skeletons';
import { SEO, StructuredData, breadcrumbSchema } from '../components/SEO';

const TABS = { popular: 'Popular', top_rated: 'Top Rated', new: 'New Releases (2023+)' };

function getMoviesForTab(tab) {
  let result = [...MOVIES]; 
  if (tab === 'top_rated') result.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  else if (tab === 'new') result = result.filter(m => parseInt(m.year) >= 2023);
  else result.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  return result.map(m => ({ ...m, media_type: 'movie' }));
}

export default function Movies() {
  const [tab, setTab] = useState('popular');
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    requestAnimationFrame(() => {
      setAllItems(getMoviesForTab(tab));
      setLoading(false);
    });
  }, [tab]);

  return (
    <main className="page">
      <SEO title="Movies" description="Browse 80+ curated movies with ratings, cast info, and streaming links. Find popular, top rated, and new releases. Free movie discovery on Kinshow." url="https://kinshow.vercel.app/movies" />
      <StructuredData data={breadcrumbSchema([
        { name: 'Home', url: 'https://kinshow.vercel.app/' },
        { name: 'Movies', url: 'https://kinshow.vercel.app/movies' }
      ])} />
      <div className="page-header">
        <h1 className="page-title">Movies</h1>
        <p className="page-subtitle">Discover films across every genre and era</p>
      </div>
      <div className="page-tabs">
        {Object.entries(TABS).map(([k, v]) => <button key={k} className={`tab ${tab === k ? 'tab--active' : ''}`} onClick={() => setTab(k)}>{v}</button>)}
      </div>
      <div className="grid">
        {loading ? <SkeletonCards count={12} /> : allItems.map((item, i) => <MediaCard key={`${item.id}-${i}`} item={item} mediaType="movie" />)}
      </div>
      {!loading && allItems.length === 0 && <div className="empty-state"><h3>No movies found</h3><p>Try another tab</p></div>}
    </main>
  );
}
