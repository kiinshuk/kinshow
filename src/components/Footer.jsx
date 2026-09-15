import { Link } from "react-router-dom";
function Footer() {
  return (
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
              <li>
                <Link to="/movies">Movies</Link>
              </li>
              <li>
                <Link to="/tv">TV Shows</Link>
              </li>
              <li>
                <Link to="/explore">Explore</Link>
              </li>
              <li>
                <Link to="/watchlist">My List</Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-links">
              <li>
                <Link to="/about">About</Link>
              </li>
              <li>
                <Link to="/blog">Blog</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
              <li>
                <Link to="/privacy">Privacy Policy</Link>
              </li>
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
  );
}

export default Footer;
