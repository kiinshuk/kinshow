import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { useWatchlist } from './store';
import Navbar from './components/Navbar';
import CookieConsent from './components/CookieConsent';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Movies from './pages/Movies';
import TVShows from './pages/TVShows';
import Detail from './pages/Detail';
import Player from './pages/Player';
import Watchlist from './pages/Watchlist';
import Profile from './pages/Profile';
import Explore from './pages/Explore';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import { useEffect } from 'react';

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
      </Routes>
      </ErrorBoundary>
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-brand">
                <span className="nav-logo-mark">KS</span> Kinshow
              </div>
              <p className="footer-desc">
                Your premium cinema discovery platform. Explore movies and TV
                shows, track your watchlist, and find where to stream.
              </p>
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
                <li>
                  <a
                    href="https://www.tvmaze.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    TVmaze API
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.omdbapi.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OMDb API
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.imdb.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    IMDb
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copy">
              © 2026 Kinshow. For educational purposes only. All product names,
              logos, and brands are property of their respective owners.
            </p>
          </div>
        </div>
      </footer>
      <CookieConsent />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </BrowserRouter>
  );
}