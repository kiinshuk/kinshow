import { Link } from 'react-router-dom';
import { useWatchlist, useHistory } from '../store';
import { PosterImg } from '../utils/poster';
import { SEO } from '../components/SEO';

export default function Profile() {
  const { list } = useWatchlist();
  const { list: history } = useHistory();
  const movies = list.filter(i => (i.type || i.media_type) === 'movie').length;
  const tv = list.filter(i => (i.type || i.media_type) === 'tv').length;
  const recent = history.slice(0, 6);
  const totalRuntime = [...list, ...history].reduce((total, item) => total + (Number(item.runtime) || 0), 0);
  const runtimeHours = Math.floor(totalRuntime / 60);
  const runtimeMinutes = totalRuntime % 60;

  return (
    <main id="content" tabIndex={-1} className="page">
      <SEO title="Profile" description="Your Kinshow profile. Track your watchlist and viewing history." url="https://kinshow.vercel.app/profile" />
      <div className="profile-header">
        <div className="profile-avatar"><span>L</span></div>
        <div className="profile-info">
          <h1 className="profile-name">Member</h1>
          <p className="profile-since">Kinshow Cinema Explorer</p>
        </div>
      </div>
      <div className="profile-stats">
        <div className="profile-stat"><span className="profile-stat-value">{list.length}</span><span className="profile-stat-label">Saved</span></div>
        <div className="profile-stat"><span className="profile-stat-value">{movies}</span><span className="profile-stat-label">Films</span></div>
        <div className="profile-stat"><span className="profile-stat-value">{tv}</span><span className="profile-stat-label">Series</span></div>
        <div className="profile-stat"><span className="profile-stat-value">{history.length}</span><span className="profile-stat-label">Watched</span></div>
        <div className="profile-stat"><span className="profile-stat-value">{runtimeHours}h {runtimeMinutes}m</span><span className="profile-stat-label">Watch Time</span></div>
      </div>
      {recent.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section-title">Recently Watched</h2>
          <div className="similar-scroll">
            {recent.map((item, i) => (
              <Link key={`${item.id}-${i}`} to={`/detail/${item.type || 'movie'}/${item.id}`} className="similar-item">
                <div className="card">
                  <div className="card-poster">
                    <PosterImg src={item.poster_path} title={item.title} idx={item.title?.charCodeAt(0)} className="card-poster-img" alt={item.title} />
                  </div>
                  <div className="card-meta">
                    <span className="card-title">{item.title}</span>
                    {item.season && <span className="card-year">S{item.season}E{item.episode || 1}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      <div className="profile-empty-cta">
        <h3>Explore & Discover</h3>
        <p>Find your next favorite film or series</p>
        <div className="profile-links">
          <Link to="/movies" className="btn btn--secondary">Browse Films</Link>
          <Link to="/tv" className="btn btn--secondary">Browse Series</Link>
          <Link to="/explore" className="btn btn--secondary">Explore</Link>
        </div>
      </div>
    </main>
  );
}
