import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWatchlist } from '../store';
import { useToast } from '../components/Toast';
import { PosterImg } from '../utils/poster';
import { SEO } from '../components/SEO';

export default function Watchlist() {
  const { list, remove } = useWatchlist();
  const toast = useToast();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');
  const [removingId, setRemovingId] = useState(null);

  const filtered = list
    .filter(i => filter === 'all' || i.type === filter)
    .sort((a, b) => sort === 'title' ? (a.title || '').localeCompare(b.title || '') : (b.added || 0) - (a.added || 0));

  const removeItem = (item) => {
    setRemovingId(item.id);
    setTimeout(() => {
      remove(item.id); 
      toast(`${item.title} removed from My List`);
      setRemovingId(null);
    }, 300);
};

  if (list.length === 0) {
    return (
      <main id="content" tabIndex={-1} className="page">
        <SEO title="My List" description="Your personal watchlist. Save movies and shows to watch later." url="https://kinshow.vercel.app/watchlist" />
        <div className="empty-state">
          <div className="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></div>
          <h3>Your watchlist is waiting</h3>
          <p>Save movies and shows here so you never lose something you want to watch.</p>
          <Link to="/" className="btn btn--primary">Discover Something</Link>
        </div>
      </main>
    );
  }

  return (
    <main id="content" tabIndex={-1} className="page">
      <SEO title="My List" description="Your personal watchlist. Save movies and shows to watch later." url="https://kinshow.vercel.app/watchlist" />
      <div className="page-header">
        <h1 className="page-title">My List</h1>
        <p className="page-subtitle">{list.length} title{list.length !== 1 ? 's' : ''} saved</p>
      </div>
      <div className="filter-row">
        <div className="tab-group">
          {['all', 'movie', 'tv'].map(f => <button key={f} className={`tab ${filter === f ? 'tab--active' : ''}`} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f === 'movie' ? 'Movies' : 'TV Shows'}</button>)}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="filter-select" aria-label="Sort by">
          <option value="recent">Recently Added</option>
          <option value="title">Title</option>
        </select>
      </div>
      <div className="watchlist-grid">
        {filtered.map(item => {
          const type = item.type || item.media_type || 'movie';
          const isRemoving = removingId === item.id;
          return (

            <Link key={item.id} to={`/detail/${type}/${item.id}`} className={`watchlist-item ${isRemoving ? 'watchlist-item--removing' : ''}`} >
              <div className="watchlist-poster">
                <PosterImg src={item.poster_path} title={item.title} idx={item.title?.charCodeAt(0)} className="watchlist-poster-img" alt={item.title} />
              </div>
              <div className="watchlist-info">
                <span className="watchlist-title">{item.title}</span>
                <span className="watchlist-meta">{type === 'movie' ? 'Film' : 'Series'}</span>
              </div>
              <button className="watchlist-remove" onClick={e => { e.preventDefault(); removeItem(item); }} aria-label={`Remove ${item.title}`}>✕</button>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
