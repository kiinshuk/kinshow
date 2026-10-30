import { useState, useEffect, useRef } from 'react';
import { title as t, year as y, rating as r } from '../api';
import { Link } from 'react-router-dom';
import { PosterImg } from '../utils/poster';

export default function MediaCard({ item, mediaType }) {
  const [isTouched, setIsTouched] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!isTouched) return;

    const handleOutsideClick = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setIsTouched(false);
      }
    };

    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isTouched]);

  const handleCardClick = (e) => {
    const isTouchDevice = window.matchMedia('(hover: none)').matches || 'ontouchstart' in window;
    if (isTouchDevice && !isTouched) {
      e.preventDefault();
      setIsTouched(true);
    }
  };

  const type = mediaType || item.media_type || item.type || 'movie';
  const p = item.poster || item.poster_path;
  const title = t(item);
  const year = y(item);
  const rating = r(item);
  const linkId = type === 'tv' ? (item.tvmazeId || item.id) : (item.imdbID || item.id);

  return (
    <Link
      to={`/detail/${type}/${linkId}`}
      ref={cardRef}
      className={`card ${isTouched ? 'card--touched' : ''}`}
      onClick={handleCardClick}
      aria-label={title}
    >
      <div className="card-poster">
        <PosterImg src={p} title={title} year={year} rating={rating} idx={title.charCodeAt(0)} className="card-poster-img" alt={title} />
        <div className={`card-overlay ${isTouched ? 'card-overlay--visible' : ''}`}>
          <div className="card-overlay-content">
            <span className="card-overlay-rating">★ {rating}</span>
            {item.overview && <p className="card-overlay-desc">{item.overview.slice(0, 100)}...</p>}
            <span className="card-overlay-cta">View Details →</span>
          </div>
        </div>
        <div className="card-badge">{type === 'tv' ? 'Series' : 'Film'}</div>
      </div>
      <div className="card-meta">
        <span className="card-title">{title}</span>
        <span className="card-year">{year}</span>
      </div>
    </Link>
  );
}
