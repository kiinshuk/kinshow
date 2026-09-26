import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ToastProvider } from './components/Toast';
import { useWatchlist } from './store';
import Navbar from './components/Navbar';
import CookieConsent from './components/CookieConsent';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Movies from './pages/Movies';
import TVShows from './pages/TVShows';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import BlogPost from './pages/BlogPost';
import ScrollButton from './components/ScrollButton';
import { SkeletonCards } from './components/Skeletons';
import NotFound from './pages/NotFound';

const Detail = lazy(() => import('./pages/Detail'));
const Player = lazy(() => import('./pages/Player'));
const Explore = lazy(() => import('./pages/Explore'));
const Blog = lazy(() => import('./pages/Blog'));

function RouteProgress() {
  const location = useLocation();
  const initialLocationKey = useRef(location.key);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    if (location.key === initialLocationKey.current) return undefined;

    setStatus('loading');
    const completeTimer = window.setTimeout(() => setStatus('complete'), 250);
    const hideTimer = window.setTimeout(() => setStatus('idle'), 500);

    return () => {
      window.clearTimeout(completeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [location.key]);

  return <div className={`route-progress route-progress--${status}`} role="progressbar" aria-label="Loading page" aria-valuemin="0" aria-valuemax="100" aria-valuenow={status === 'complete' ? 100 : 70} />;
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [pathname]);

  return null;
}

function AppInner() {
  const { list } = useWatchlist();

  return (
    <>
      <Navbar watchlistCount={list.length} />

      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="content-rail">
              <SkeletonCards count={6} />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/tv" element={<TVShows />} />
            <Route path="/detail/:type/:id" element={<Detail />} />
            <Route path="/player" element={<Player />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-brand"><span className="nav-logo-mark">KS</span> Kinshow</div>
              <p className="footer-desc">Your premium cinema discovery platform. Explore movies and TV shows, track your watchlist, and find where to stream.</p>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Browse</h4>
              <ul className="footer-links">
                <li><Link to="/movies">Movies</Link></li>
                <li><Link to="/tv">TV Shows</Link></li>
                <li><Link to="/explore">Explore</Link></li>
                <li><Link to="/watchlist">My List</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Company</h4>
              <ul className="footer-links">
                <li><Link to="/about">About</Link></li>
                <li><Link to="/blog">Blog</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Powered By</h4>
              <ul className="footer-links footer-links--muted">
                <li><a href="https://www.tvmaze.com/" target="_blank" rel="noopener noreferrer">TVmaze API</a></li>
                <li><a href="https://www.omdbapi.com/" target="_blank" rel="noopener noreferrer">OMDb API</a></li>
                <li><a href="https://www.imdb.com/" target="_blank" rel="noopener noreferrer">IMDb</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copy">© 2026 Kinshow. For educational purposes only. All product names, logos, and brands are property of their respective owners.</p>
          </div>
        </div>
      </footer>

      <CookieConsent />
      <ScrollButton />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteProgress />
      <ScrollToTop />
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </BrowserRouter>
  );
}