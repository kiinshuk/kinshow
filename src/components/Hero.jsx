import Button from './Button';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tvmazeMultipleShows, MOVIES, title as t, year as y, rating as r } from '../api';
import { useWatchlist } from '../store';

const TV_IDS = [2993, 44933, 38963, 53647];
const SLIDE_MS = 7000;
const FADE_MS = 400;

export default function Hero() {
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [prefersReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false);
  const navigate = useNavigate();
  const { add, remove, has } = useWatchlist();

  useEffect(() => {
    const movieSlice = MOVIES.filter(m => m.vote_average >= 8.0).slice(0, 4);
    tvmazeMultipleShows(TV_IDS).then(tvShows => {
      const combined = [...movieSlice.map(m => ({ ...m, media_type: 'movie' })), ...tvShows.map(s => ({ ...s, media_type: 'tv' }))];
      setItems(combined.sort(() => Math.random() - 0.5).slice(0, 7));
    }).catch(() => setItems(movieSlice.map(m => ({ ...m, media_type: 'movie' }))));
  }, []);

  useEffect(() => {
    if (!paused) setEpoch(e => e + 1);
  }, [paused]);

  useEffect(() => {
    if (items.length < 2 || paused || prefersReduced) return;
    const timer = setInterval(() => {
      setFading(true);
      setTimeout(() => { setIdx(p => (p + 1) % items.length); setFading(false); }, FADE_MS);
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, [items.length, paused, prefersReduced, idx]);

  const item = items[idx];
  if (!item) return <div className="hero-skeleton"><div className="skeleton-pulse" /></div>;

  const title = t(item);
  const year = y(item);
  const rating = r(item);
  const overview = item.overview || '';
  const genres = item.genres?.map(g => g.name).join(' · ') || '';
  const type = item.media_type || 'movie';
  const saved = has(item.id);

  const poster = item.poster || item.poster_path || item.image?.original || item.image?.medium || '';

  const goTo = () => navigate(`/detail/${type}/${item.id}`);
  const jumpTo = (i) => {
    setFading(true);
    setTimeout(() => { setIdx(i); setFading(false); }, FADE_MS);
  };
  const toggleList = () => {
    if (saved) remove(item.id);
    else add({ ...item, media_type: type });
  };

  return (
    <section
      className={`hero ${fading ? 'hero--fading' : ''} ${paused ? 'hero--paused' : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="hero-inner">
        <div className="hero-info" key={idx}>
          <div className="hero-badges">
            <span className="hero-badge hero-badge--accent">Trending</span>
            <span className="hero-badge">{type === 'tv' ? 'Series' : 'Film'}</span>
            {year !== '—' && <span className="hero-badge">{year}</span>}
            {item.rated && <span className="hero-badge">{item.rated}</span>}
          </div>
          <h1 className="hero-title">{title}</h1>
          <div className="hero-meta">
            <span className="hero-rating-star" aria-hidden="true">★</span>
            <span className="hero-rating">{rating}</span>
            <span className="hero-rating-out"> / 10</span>
            {genres && (
              <>
                <span className="hero-meta-sep" aria-hidden="true">·</span>
                <span className="hero-genres-inline">{genres}</span>
              </>
            )}
          </div>
          {overview && <p className="hero-desc">{overview.slice(0, 220)}{overview.length > 220 ? '...' : ''}</p>}
        </div>
        <button className="hero-poster" onClick={goTo} aria-label={`View details for ${title}`}>
          {poster && <img src={poster} alt={`${title} poster`} className="hero-poster-img" />}
        </button>
        <div className="hero-cta" key={`cta-${idx}`}>
          <div className="hero-actions">
            <Button variant="primary" onClick={goTo}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Watch Now
            </Button>
            <Button variant="ghost" onClick={goTo}>
              More Info
            </Button>
            <Button variant="ghost" onClick={toggleList}>
              {saved ? '✓ In My List' : '+ My List'}
            </Button>
          </div>
          {items.length > 1 && (
            <div className="hero-progress">
              {items.map((_, i) => (
                <button
                  key={`${i}-${i === idx ? epoch : 'seg'}`}
                  className={`hero-progress-seg ${i < idx ? 'hero-progress-seg--done' : ''} ${i === idx ? 'hero-progress-seg--active' : ''}`}
                  onClick={() => jumpTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  aria-current={i === idx || undefined}
                >
                  <span className="hero-progress-fill" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
