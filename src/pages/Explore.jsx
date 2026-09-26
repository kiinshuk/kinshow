import { useState, useEffect } from 'react';
import { tvmazeSearch, MOVIES } from '../api';
import MediaCard from '../components/MediaCard';
import EmptyState from '../components/EmptyState';
import { SkeletonCards } from '../components/Skeletons';
import { SEO, StructuredData, breadcrumbSchema } from '../components/SEO';

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Animation', 'Adventure', 'Crime', 'Fantasy', 'Mystery', 'War', 'Documentary'];

const TV_BY_GENRE = {
  Action: ['The Boys', 'Jack Reacher', 'Vikings', 'The Mandalorian', 'Peaky Blinders'],
  Comedy: ['The Office', 'Friends', 'Brooklyn Nine-Nine', 'Parks and Recreation', 'Schitt\'s Creek'],
  Drama: ['Breaking Bad', 'Game of Thrones', 'The Wire', 'Better Call Saul', 'Succession'],
  Horror: ['Stranger Things', 'The Haunting of Hill House', 'Archive 81', 'Midnight Mass', 'Chilling Adventures of Sabrina'],
  'Sci-Fi': ['Severance', 'Black Mirror', 'Westworld', 'The Expanse', 'Foundation'],
  Thriller: ['Money Heist', 'Dark', 'Ozark', 'You', 'Kaleidoscope'],
  Romance: ['Outlander', 'Bridgerton', 'Virgin River', 'The O.C.', 'Gossip Girl'],
  Animation: ['Arcane', 'Rick and Morty', 'Avatar The Last Airbender', 'Castlevania', 'Invincible'],
  Adventure: ['The Witcher', 'Shadow and Bone', 'The Dragon Prince', 'Lost', 'One Piece'],
  Crime: ['Dexter', 'Narcos', 'True Detective', 'Mindhunter', 'The Sopranos'],
  Fantasy: ['Game of Thrones', 'The Lord of the Rings: The Rings of Power', 'The Witcher', 'Wheel of Time', 'House of the Dragon'],
  Mystery: ['Sherlock', 'True Detective', 'The Night Of', 'Sharp Objects', 'Big Little Lies'],
  War: ['Band of Brothers', 'The Pacific', 'Chernobyl', 'Generation Kill', 'All Quiet on the Western Front'],
  Documentary: ['Planet Earth', 'Cosmos', 'Our Planet', 'The Last Dance', 'Tiger King'],
};

export default function Explore() {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [movieItems, setMovieItems] = useState({ items: [], loading: true });
  const [tvItems, setTvItems] = useState({ items: [], loading: true });

  useEffect(() => {
    setMovieItems({ items: [], loading: true });
    setTvItems({ items: [], loading: true });

    if (selectedGenre) {
      const filteredMovies = MOVIES.filter(m =>
        m.genres?.some(g => g.name === selectedGenre)
      ).map(m => ({ ...m, media_type: 'movie' }));
      setMovieItems({ items: filteredMovies, loading: false });

      const tvQueries = TV_BY_GENRE[selectedGenre] || [];
      Promise.all(tvQueries.map(q => tvmazeSearch(q).then(shows => shows[0] || null)))
        .then(results => setTvItems({ items: results.filter(Boolean).map(s => ({ ...s, media_type: 'tv' })), loading: false }));
    } else {
      setMovieItems({ items: MOVIES.slice(0, 12).map(m => ({ ...m, media_type: 'movie' })), loading: false });
      const tvQueries = ['Breaking Bad', 'Game of Thrones', 'Stranger Things', 'The Witcher', 'Chernobyl', 'Severance', 'Squid Game', 'The Mandalorian'];
      Promise.all(tvQueries.map(q => tvmazeSearch(q).then(shows => shows[0] || null)))
        .then(results => setTvItems({ items: results.filter(Boolean).map(s => ({ ...s, media_type: 'tv' })), loading: false }));
    }
  }, [selectedGenre]);

  const noResultsFound = !movieItems.loading && !tvItems.loading
    && movieItems.items.length === 0 && tvItems.items.length === 0;
  const movieHeading = selectedGenre ? `${selectedGenre} Movies` : 'Popular Films';
  const tvHeading = selectedGenre ? `${selectedGenre} TV Shows` : 'Popular Series';

  return (
    <main id="content" tabIndex={-1} className="page">
      <SEO title="Explore" description="Explore movies and TV shows by genre. Find Action, Comedy, Drama, Horror, Sci-Fi, Thriller, and more. Discover your next favorite title on Kinshow." url="https://kinshow.vercel.app/explore" />
      <StructuredData data={breadcrumbSchema([
        { name: 'Home', url: 'https://kinshow.vercel.app/' },
        { name: 'Explore', url: 'https://kinshow.vercel.app/explore' }
      ])} />
      <div className="page-header">
        <h1 className="page-title">Explore</h1>
        <p className="page-subtitle">Browse by genre and discover something new</p>
      </div>
      <section className="explore-section">
        <h2 className="explore-heading">Genres</h2>
        <div className="explore-grid">
          <button className={`genre-chip ${!selectedGenre ? 'genre-chip--active' : ''}`} onClick={() => setSelectedGenre(null)}>All</button>
          {GENRES.map(g => (
            <button key={g} className={`genre-chip ${selectedGenre === g ? 'genre-chip--active' : ''}`} onClick={() => setSelectedGenre(g)}>{g}</button>
          ))}
        </div>
      </section>
      <section className="detail-section">
        <h2 className="detail-section-title">
          {movieHeading}{!movieItems.loading && ` (${movieItems.items.length})`}
        </h2>
        <div className="grid">
          {movieItems.loading ? <SkeletonCards count={8} /> : movieItems.items.length > 0 ? movieItems.items.map((item, i) => <MediaCard key={i} item={item} mediaType="movie" />) : !noResultsFound && <p style={{color: 'var(--text-muted)', gridColumn: '1/-1'}}>No movies found for this genre</p>}
        </div>
      </section>
      <div className="explore-divider" aria-hidden="true" />
      <section className="detail-section">
        <h2 className="detail-section-title">
          {tvHeading}{!tvItems.loading && ` (${tvItems.items.length})`}
        </h2>
        <div className="grid">
          {tvItems.loading ? <SkeletonCards count={8} /> : tvItems.items.length > 0 ? tvItems.items.map((item, i) => <MediaCard key={i} item={item} mediaType="tv" />) : !noResultsFound && <p style={{color: 'var(--text-muted)', gridColumn: '1/-1'}}>No shows found for this genre</p>}
        </div>
      </section>
      {noResultsFound && (
        <EmptyState
          title="No results"
          description="No movies or TV shows were found. Try another genre or check back later."
        />
      )}
    </main>
  );
}
