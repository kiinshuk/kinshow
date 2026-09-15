import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SEO, StructuredData, videoSchema } from '../components/SEO';
import AdBlockGuard from '../components/AdBlockGuard';

const SERVERS = [
  { id: 'vidsrc', name: 'VidSrc', build: (type, imdbId, title, season, episode) => {
    if (type === 'tv') {
      if (imdbId && imdbId.startsWith('tt')) return `https://vidsrc.pm/embed/tv?imdb=${imdbId}&season=${season || 1}&episode=${episode || 1}`;
      return `https://vidsrc.pm/embed/tv?tmdb=${imdbId}&season=${season || 1}&episode=${episode || 1}`;
    }
    if (imdbId && imdbId.startsWith('tt')) return `https://vidsrc.pm/embed/movie?imdb=${imdbId}`;
    return `https://vidsrc.pm/embed/movie?tmdb=${imdbId}`;
  }},
  { id: 'vidcore', name: 'VidCore', build: (type, imdbId, title, season, episode) => {
    const id = imdbId || '';
    if (type === 'tv') return `https://vidcore.org/embed/tv/${id}/${season || 1}/${episode || 1}`;
    return `https://vidcore.org/embed/movie/${id}`;
  }},
  { id: 'peachify', name: 'Peachify', build: (type, imdbId, title, season, episode) => {
    const id = imdbId || '';
    if (type === 'tv') return `https://peachify.top/embed/tv/${id}/${season || 1}/${episode || 1}`;
    return `https://peachify.top/embed/movie/${id}`;
  }},
  { id: 'vidfast', name: 'VidFast', build: (type, imdbId, title, season, episode) => {
    const id = imdbId || '';
    if (type === 'tv') return `https://vidfast.vc/tv/${id}/${season || 1}/${episode || 1}`;
    return `https://vidfast.vc/movie/${id}`;
  }},
];

export default function Player() {
  const location = useLocation();
  const navigate = useNavigate();
  const [server, setServer] = useState(0);
  const [loc, setLoc] = useState(null);

  useEffect(() => {
    if (location.state) { setLoc(location.state); localStorage.setItem('lg_lastViewed', JSON.stringify(location.state)); }
    else { const saved = localStorage.getItem('lg_lastViewed'); if (saved) setLoc(JSON.parse(saved)); }
  }, [location.state?.type, location.state?.id, location.state?.season, location.state?.episode]);

  useEffect(() => { const h = (e) => { if (e.key === 'Escape') navigate(-1); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [navigate]);

  if (!loc) return <main className="page player-page"><div className="empty-state"><h3>No content selected</h3><p>Go back and select something to watch.</p></div></main>;

  const { type = 'movie', id, title, imdbId, tvmazeId, season = 1, episode = 1 } = loc;
  const effectiveId = (imdbId && imdbId.startsWith('tt')) ? imdbId : (id || imdbId || tvmazeId);
  const url = SERVERS[server].build(type, effectiveId, title, season, episode);

  const isTV = type === 'tv';
  const ep = parseInt(episode) || 1;
  const sn = parseInt(season) || 1;

  const goEp = (newEp, newSn) => {
    const next = { ...loc, season: newSn, episode: newEp };
    setLoc(next);
    localStorage.setItem('lg_lastViewed', JSON.stringify(next));
    setServer(0);
  };

  return (
    <main className="page player-page">
      <SEO
        title={`Watch ${title}${isTV ? ` S${String(sn).padStart(2, '0')}E${String(ep).padStart(2, '0')}` : ''}`}
        description={`Watch ${title} ${isTV ? `Season ${sn} Episode ${ep}` : 'full movie'} online for free. Stream now on Kinshow.`}
        url={`https://kinshow.vercel.app/player`}
        type="video.other"
      />
      <StructuredData data={videoSchema(title, type, effectiveId, sn, ep)} />
      <div className="player-header">
        <button className="btn btn--ghost" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="player-title">{title}{isTV ? ` — S${String(sn).padStart(2, '0')}E${String(ep).padStart(2, '0')}` : ''}</h2>
      </div>
      <div className="player-servers">
        {SERVERS.map((sv, i) => <button key={sv.id} className={`player-server-btn ${i === server ? 'player-server-btn--active' : ''}`} onClick={() => setServer(i)}>{sv.name}</button>)}
      </div>
      {isTV && (
        <div className="player-ep-nav">
          <button className="btn btn--ghost" disabled={sn <= 1 && ep <= 1} onClick={() => goEp(ep > 1 ? ep - 1 : 1, ep > 1 ? sn : Math.max(1, sn - 1))}>← Previous</button>
          <span className="player-ep-label">S{String(sn).padStart(2, '0')}E{String(ep).padStart(2, '0')}</span>
          <button className="btn btn--ghost" onClick={() => goEp(ep + 1, sn)}>Next →</button>
        </div>
      )}
      <div className="player-container">
        <AdBlockGuard>
          <iframe key={`${server}-${url}`} src={url} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="player-iframe" />
        </AdBlockGuard>
      </div>
    </main>
  );
}
