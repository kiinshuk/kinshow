import Button from "./Button";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { tvmazeMultipleShows, MOVIES, title as T, year as Y, rating as R, runtime as formatRuntime } from "../api";
import { useWatchlist } from "../store";

const TV_IDS = [2993, 44933, 38963, 53647];
const SLIDE_MS = 7000;
const MAX_SLIDES = 7;

const backdropUrl = (item) => {
  const p = item.backdrop || item.backdrop_path || item.poster ||
    item.poster_path || item.image?.original || item.image?.medium || "";
  if (typeof p === "string" && p.includes("m.media-amazon.com")) {
    if (/_V1_/i.test(p)) return p.replace(/_V1_[^]*?\.jpg/i, "_V1_SX1280_.jpg");
  }
  return p;
};

export default function Hero() {
  const [items, setItems] = useState([]);
  const [idx, setIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(null);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState({});
  const timerRef = useRef(null);
  const navigate = useNavigate();
  const { add, remove, has } = useWatchlist();
  const prefersReduced = useRef(
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  );

  useEffect(() => {
    const movieSlice = MOVIES.filter(m => m.vote_average >= 8.0).slice(0, 4);
    tvmazeMultipleShows(TV_IDS)
      .then(tvShows => {
        const combined = [
          ...movieSlice.map(m => ({ ...m, media_type: "movie" })),
          ...tvShows.map(s => ({ ...s, media_type: "tv" })),
        ];
        setItems(combined.sort(() => Math.random() - 0.5).slice(0, MAX_SLIDES));
      })
      .catch(() => setItems(movieSlice.map(m => ({ ...m, media_type: "movie" }))));
  }, []);

  const advance = useCallback((target) => {
    setIdx(current => {
      if (items.length === 0) return current;
      const next = typeof target === "number"
        ? ((target % items.length) + items.length) % items.length
        : (current + 1) % items.length;
      if (next === current) return current;
      setPrevIdx(current);
      return next;
    });
  }, [items.length]);

  const preload = useCallback((url) => {
    if (!url || loaded[url]) return;
    const img = new Image();
    img.onload = () => setLoaded(prev => (prev[url] ? prev : { ...prev, [url]: true }));
    img.onerror = () => {};
    img.src = url;
  }, [loaded]);

  useEffect(() => {
    if (!items.length) return;
    preload(backdropUrl(items[idx]));
    preload(backdropUrl(items[(idx + 1) % items.length]));
    preload(backdropUrl(items[(idx - 1 + items.length) % items.length]));
  }, [items, idx, preload]);

  useEffect(() => {
    if (items.length < 2 || paused || prefersReduced.current) return;
    timerRef.current = setInterval(() => advance(), SLIDE_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [items.length, paused, idx, advance]);

  const item = items.length ? items[idx] : null;

  if (!item) return <div className="hero-skeleton"><div className="skeleton-pulse" /></div>;

  const titleStr = T(item);
  const yearStr = Y(item);
  const ratingStr = R(item);
  const overview = item.overview || "";
  const genreStr = Array.isArray(item.genres)
    ? item.genres.map(g => (typeof g === "string" ? g : g.name)).join(" · ")
    : (item.genres || "");
  const rated = item.rated;
  const runtimeStr = formatRuntime(item.runtime);
  const type = item.media_type || "movie";
  const saved = has(item.id);
  const url = backdropUrl(item);

  const goTo = () => navigate(`/detail/${type}/${item.id}`);
  const jumpTo = (i) => advance(i);
  const toggleList = () => { if (saved) remove(item.id); else add({ ...item, media_type: type }); };

  const badgeLabel = type === "tv" ? "Series" : "Film";
  const prevUrl = prevIdx !== null ? backdropUrl(items[prevIdx]) : "";

  return (
    <section
      className={`hero ${paused ? "hero--paused" : ""}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured titles"
    >
      {prevIdx !== null && loaded[prevUrl] && (
        <div className="hero-bg hero-bg--out" style={{ backgroundImage: `url(${prevUrl})` }} aria-hidden="true" />
      )}
      {loaded[url] && (
        <div className="hero-bg hero-bg--in" key={`bg-${idx}`} style={{ backgroundImage: `url(${url})` }} aria-hidden="true" />
      )}
      <div className="hero-scrim-left" aria-hidden="true" />
      <div className="hero-scrim-bottom" aria-hidden="true" />
      <div className="hero-scrim-top" aria-hidden="true" />

      <div className="hero-inner">
        <div className="hero-info">
          <div className="hero-kicker">
            <span className="hero-badge hero-badge--accent">Trending</span>
            <span className="hero-badge">{badgeLabel}</span>
            {yearStr && yearStr !== "—" && <span className="hero-badge">{yearStr}</span>}
            {rated && <span className="hero-badge">{rated}</span>}
          </div>
          <h1 className="hero-title">{titleStr}</h1>
          <div className="hero-meta">
            <span className="hero-rating-star" aria-hidden="true">?</span>
            <span className="hero-rating">{ratingStr}</span>
            <span className="hero-rating-out"> / 10</span>
            {genreStr && (
              <>
                <span className="hero-meta-sep" aria-hidden="true">·</span>
                <span className="hero-genres-inline">{genreStr}</span>
              </>
            )}
            {runtimeStr && (
              <>
                <span className="hero-meta-sep" aria-hidden="true">·</span>
                <span className="hero-runtime">{runtimeStr}</span>
              </>
            )}
          </div>
          {overview && (
            <p className="hero-desc">
              {overview.slice(0, 240)}{overview.length > 240 ? "…" : ""}
            </p>
          )}
        </div>
        <div className="hero-actions">
          <Button variant="primary" onClick={goTo}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Watch Now
          </Button>
          <Button variant="ghost" onClick={goTo}>More Info</Button>
          <Button variant="ghost" onClick={toggleList}>{saved ? "? In My List" : "+ My List"}</Button>
        </div>
        {items.length > 1 && (
          <div className="hero-indicators" role="tablist" aria-label="Featured slides">
            {items.map((slide, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                className={`hero-progress-seg ${i < idx ? "hero-progress-seg--done" : ""} ${i === idx ? "hero-progress-seg--active" : ""}`}
                onClick={() => jumpTo(i)}
                aria-label={`Slide ${i + 1}: ${T(slide)}`}
                aria-selected={i === idx}
                aria-current={i === idx ? "true" : undefined}
              >
                <span className="hero-progress-fill" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="hero-rail" aria-hidden="true" />
    </section>
  );
}
