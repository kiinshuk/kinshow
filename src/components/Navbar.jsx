import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { searchMulti, title as t, year as y } from '../api';
import { getSearchHistory, saveSearchTerm, removeSearchTerm } from '../store';

export default function Navbar({ watchlistCount }) {
  const [scrolled, setScrolled] = useState(false);
  const [themePreference, setThemePreference] = useState(() => localStorage.getItem('kinshow-theme'));
  const [systemTheme] = useState(() => window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchErr, setSearchErr] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const timerRef = useRef(null);
  const [shortcutHint] = useState(() => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || navigator.userAgent || '') ? '⌘K' : 'Ctrl+K';
    }
    return 'Ctrl+K';
  });

  const loadSearchHistory = useCallback(() => {
    setSearchHistory(getSearchHistory());
  }, []);

  const saveSearch = useCallback((value) => {
    setSearchHistory(saveSearchTerm(value));
  }, []);

  const removeSearch = useCallback((timestamp) => {
    setSearchHistory(removeSearchTerm(timestamp));
  }, []);

  const resetSearch = useCallback(() => {
    clearTimeout(timerRef.current);
    setQuery('');
    setResults([]);
    setSearchErr(null);
    setLoading(false);
  }, []);

  const theme = themePreference || systemTheme;

  useEffect(() => {
    if (themePreference) document.documentElement.dataset.theme = themePreference;
    else delete document.documentElement.dataset.theme;
  }, [themePreference]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('kinshow-theme', nextTheme);
    setThemePreference(nextTheme);
  };

  useEffect(() => { const h = () => setScrolled(window.scrollY > 30); window.addEventListener('scroll', h, { passive: true }); return () => window.removeEventListener('scroll', h); }, []);
  useEffect(() => { setSearchOpen(false); resetSearch(); }, [location, resetSearch]);
  useEffect(() => {
    if (searchOpen) {
      loadSearchHistory();
      if (inputRef.current) inputRef.current.focus();
    }
  }, [searchOpen, loadSearchHistory]);
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (e.repeat) return;
        e.preventDefault();
        if (searchOpen) {
          setSearchOpen(false);
          resetSearch();
        } else {
          setSearchOpen(true);
        }
        return;
      }
      if (e.key === '/' && !searchOpen && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        resetSearch();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [searchOpen, resetSearch]);

  const search = useCallback((q) => {
    setQuery(q);
    clearTimeout(timerRef.current);
    setSearchErr(null);
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      saveSearch(q);
      try {
        const d = await searchMulti(q);
        setResults(d?.results?.slice(0, 10) || []);
        setSearchErr(d?.omdbDown && d?.tvDown ? 'failed' : d?.omdbDown ? 'no-movies' : null);
      } catch {
        setResults([]);
        setSearchErr('failed');
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [saveSearch]);

  const go = (type, id) => { saveSearch(query); navigate(`/detail/${type}/${id}`); setSearchOpen(false); resetSearch(); };
  const applySearchHistory = (value) => { setQuery(value); search(value); };
  const isActive = (p) => location.pathname === p;

  return (
    <>
      <nav className={`nav ${scrolled ? 'nav--scrolled' : ''}`}>
        <div className="nav-inner">
          <Link to="/" className="nav-logo"><span className="nav-logo-mark">K</span><span className="nav-logo-text">Kinshow</span></Link>
          <div className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/') ? 'nav-link--active' : ''}`}>Home</Link>
            <Link to="/movies" className={`nav-link ${isActive('/movies') ? 'nav-link--active' : ''}`}>Movies</Link>
            <Link to="/tv" className={`nav-link ${isActive('/tv') ? 'nav-link--active' : ''}`}>TV Shows</Link>
            <Link to="/explore" className={`nav-link ${isActive('/explore') ? 'nav-link--active' : ''}`}>Explore</Link>
          </div>
          <div className="nav-actions">
            <button className="nav-search" onClick={() => setSearchOpen(true)} aria-label={`Search (${shortcutHint})`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span>Search…</span>
              <kbd>{shortcutHint}</kbd>
            </button>
            <button className="nav-icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <Link to="/watchlist" className="nav-icon-btn nav-watchlist" aria-label="My List">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              {watchlistCount > 0 && <span className="nav-badge">{watchlistCount}</span>}
            </Link>
          </div>
        </div>
      </nav>
      <div className="mobile-nav">
        <Link to="/" className={`mobile-nav-item ${isActive('/') ? 'mobile-nav-item--active' : ''}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg><span>Home</span></Link>
        <Link to="/movies" className={`mobile-nav-item ${isActive('/movies') ? 'mobile-nav-item--active' : ''}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><path d="m7 2 5 5-5 5"/><path d="M17 2l-5 5 5 5"/></svg><span>Movies</span></Link>
        <Link to="/tv" className={`mobile-nav-item ${isActive('/tv') ? 'mobile-nav-item--active' : ''}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><path d="M17 2l-5 5-5-5"/></svg><span>TV</span></Link>
        <button className="mobile-nav-item" onClick={() => setSearchOpen(true)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><span>Search</span></button>
        <Link to="/watchlist" className={`mobile-nav-item ${isActive('/watchlist') ? 'mobile-nav-item--active' : ''}`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg><span>My List</span></Link>
      </div>
      {searchOpen && (
        <div className="search-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) { setSearchOpen(false); resetSearch(); } }}>
          <div className="search-overlay-inner">
            <div className="search-overlay-input-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input ref={inputRef} type="text" className="search-overlay-input" placeholder="Search movies, TV shows..." value={query} onChange={e => search(e.target.value)} aria-label="Search" />
                {query && (
                <button
    className="search-overlay-clear"
    onClick={() => {
      resetSearch();
      inputRef.current?.focus();
    }}
    aria-label="Clear search"
  >
    ×
  </button>
                )}
              <button className="search-overlay-close" onClick={() => { setSearchOpen(false); resetSearch(); }} aria-label="Close search"><kbd>ESC</kbd></button>
            </div>
            {loading && <div className="search-overlay-status">Searching...</div>}
            {results.length > 0 && (
              <div className="search-results">
                {results.map(r => (
                  <button key={r.id} className="search-result" onClick={() => go(r.media_type, r.id)}>
                    {(r.poster || r.poster_path) ? <img src={r.poster || r.poster_path} alt="" className="search-result-img" loading="lazy" onError={e => { e.target.style.display = 'none'; }} /> : <div className="search-result-img search-result-img--empty" />}
                    <div className="search-result-info">
                      <span className="search-result-title">{t(r)}</span>
                      <span className="search-result-meta">{r.media_type === 'movie' ? 'Movie' : 'TV'} &middot; {y(r)} &middot; ★ {r.vote_average || r.rating || '—'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!loading && searchErr === 'failed' && (
              <div className="search-overlay-status">
                Couldn&rsquo;t reach the search servers.
                <br />
                <button className="search-overlay-retry" onClick={() => search(query)}>Try again</button>
              </div>
            )}
            {!loading && searchErr === 'no-movies' && (
              <div className="search-overlay-status">Movie results are temporarily unavailable — showing TV shows only.</div>
            )}
            {!loading && !searchErr && query && results.length === 0 && <div className="search-overlay-status">No results for "{query}"</div>}
            {!query && searchHistory.length > 0 && (
              <div className="search-history">
                <div className="search-history-title">Recent searches</div>
                {searchHistory.map(item => (
                  <div key={`${item.query}-${item.timestamp}`} className="search-history-item">
                    <button className="search-history-query" onClick={() => applySearchHistory(item.query)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
                      <span>{item.query}</span>
                    </button>
                    <button className="search-history-remove" onClick={() => removeSearch(item.timestamp)} aria-label={`Remove ${item.query} from recent searches`}>&times;</button>
                  </div>
                ))}
              </div>
            )}
            {!query && searchHistory.length === 0 && <div className="search-overlay-hint">Start typing to search... Press <kbd>{shortcutHint}</kbd> to close</div>}
          </div>
        </div>
      )}
    </>
  );
}
