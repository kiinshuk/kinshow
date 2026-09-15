import Hero from '../components/Hero';
import ContentRail from '../components/ContentRail';
import RecentlyViewed from '../components/RecentlyViewed';
import { useState, useEffect, useMemo } from 'react';
import { tvmazeMultipleShows, MOVIES } from '../api';
import { SEO, websiteSchema, StructuredData, organizationSchema } from '../components/SEO';

const TV_IDS = [2993, 44933, 38963, 53647, 43687, 17861, 28276, 46562];

function useTvShows(ids) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    tvmazeMultipleShows(ids)
      .then(results => { setItems(results); setLoading(false); })
      .catch(() => { setItems([]); setLoading(false); });
  }, [ids.join(',')]);
  return { items, loading };
}

export default function Home() {
  const trendingTv = useTvShows(TV_IDS);
  const [movieItems, setMovieItems] = useState({ items: [], loading: true });
  const [newMovies, setNewMovies] = useState({ items: [], loading: true });
  const [topMovies, setTopMovies] = useState({ items: [], loading: true });

  const trendingTvItems = useMemo(() => trendingTv.items.map(s => ({ ...s, media_type: 'tv' })), [trendingTv.items]);
  const webSchema = useMemo(() => websiteSchema(), []);
  const orgSchema = useMemo(() => organizationSchema(), []);

  useEffect(() => {
    setMovieItems({ items: MOVIES.slice(0, 12).map(m => ({ ...m, media_type: 'movie' })), loading: false });
    setNewMovies({ items: MOVIES.filter(m => parseInt(m.year) >= 2023).map(m => ({ ...m, media_type: 'movie' })), loading: false });
    setTopMovies({ items: [...MOVIES].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)).slice(0, 12).map(m => ({ ...m, media_type: 'movie' })), loading: false });
  }, []);

  return (
    <main className="page">
      <SEO title="Kinshow" description="Discover movies and TV shows on Kinshow. Browse ratings, cast, reviews, and find where to stream. Free cinema discovery with 80+ curated films and trending series." url="https://kinshow.vercel.app/" />
      <StructuredData data={webSchema} />
      <StructuredData data={orgSchema} />
      <Hero />
      <RecentlyViewed />
      <div className="rails">
        <ContentRail title="Popular Movies" items={movieItems.items} loading={movieItems.loading} />
        <ContentRail title="Trending TV Shows" items={trendingTvItems} loading={trendingTv.loading} />
        <ContentRail title="New Releases" items={newMovies.items} loading={newMovies.loading} />
        <ContentRail title="Top Rated Films" items={topMovies.items} loading={topMovies.loading} />
      </div>
    </main>
  );
}
