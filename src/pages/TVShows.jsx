import { useState, useEffect } from 'react';
import MediaCard from '../components/MediaCard';
import { tvmazeShowsByPage } from '../api';
import { SkeletonCards } from '../components/Skeletons';
import { SEO, StructuredData, breadcrumbSchema } from '../components/SEO';

const TABS = {
  popular: { label: 'Popular', pages: [1, 2, 3] },
  top_rated: { label: 'Top Rated', pages: [4, 5, 6] },
  on_the_air: { label: 'On The Air', pages: [7, 8, 9] },
  cult: { label: 'Cult Classics', pages: [10, 11, 12] },
};

export default function TVShows() {
  const [tab, setTab] = useState('popular');
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const config = TABS[tab];
    Promise.all(config.pages.map(p => tvmazeShowsByPage(p)))
      .then(results => {
        const shows = results.flat().map(s => ({ ...s, media_type: 'tv' }));
        setAllItems(shows);
        setLoading(false);
      })
      .catch(() => { setAllItems([]); setLoading(false); });
  }, [tab]);

  return (
    <main id="content" tabIndex={-1} className="page">
      <SEO title="TV Shows" description="Browse trending TV shows with episode guides, cast info, and streaming links. Find popular, top rated, and currently airing series on Kinshow." url="https://kinshow.vercel.app/tv" />
      <StructuredData data={breadcrumbSchema([
        { name: 'Home', url: 'https://kinshow.vercel.app/' },
        { name: 'TV Shows', url: 'https://kinshow.vercel.app/tv' }
      ])} />
      <div className="page-header">
        <h1 className="page-title">TV Shows</h1>
        <p className="page-subtitle">Series worth your time</p>
      </div>
      <div className="page-tabs">
        {Object.entries(TABS).map(([k, v]) => <button key={k} className={`tab ${tab === k ? 'tab--active' : ''}`} onClick={() => setTab(k)}>{v.label}</button>)}
      </div>
      <div className="grid">
        {loading ? <SkeletonCards count={12} /> : allItems.map((item, i) => <MediaCard key={`${item.id}-${i}`} item={item} mediaType="tv" />)}
      </div>
      {!loading && allItems.length === 0 && <div className="empty-state"><h3>No shows found</h3><p>Try again later</p></div>}
    </main>
  );
}
