import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { tvmazeEpisodes, tvmazeLookupByImdb, tvmazeSeasons } from '../api';
import { SEO, StructuredData, videoSchema } from '../components/SEO';

const SERVERS = [
  { id: 'vidsrc', name: 'VidSrc', build: (type, imdbId, title, season, episode) => {
    if (!imdbId) return '';
    if (type === 'tv') return `https://vidsrc2.ru/embed/tv/${imdbId}/${season || 1}/${episode || 1}`;
    return `https://vidsrc2.ru/embed/movie/${imdbId}`;
  }},
  { id: 'vidsrcme', name: 'VidSrc2', build: (type, imdbId, title, season, episode) => {
    if (!imdbId) return '';
    if (type === 'tv') return `https://vidsrcme.su/embed/tv/${imdbId}/${season || 1}/${episode || 1}`;
    return `https://vidsrcme.su/embed/movie/${imdbId}`;
  }},
  { id: 'vidcore', name: 'VidCore', build: (type, imdbId, title, season, episode) => {
    if (!imdbId) return '';
    if (type === 'tv') return `https://vidcore.org/embed/tv/${imdbId}/${season || 1}/${episode || 1}`;
    return `https://vidcore.org/embed/movie/${imdbId}`;
  }},
  { id: 'peachify', name: 'Peachify', build: (type, imdbId, title, season, episode) => {
    if (!imdbId) return '';
    if (type === 'tv') return `https://peachify.top/embed/tv/${imdbId}/${season || 1}/${episode || 1}`;
    return `https://peachify.top/embed/movie/${imdbId}`;
  }},
  { id: 'vidfast', name: 'VidFast', build: (type, imdbId, title, season, episode) => {
    if (!imdbId) return '';
    if (type === 'tv') return `https://vidfast.vc/tv/${imdbId}/${season || 1}/${episode || 1}`;
    return `https://vidfast.vc/movie/${imdbId}`;
  }},
];

const SHORTCUTS = [
  { keys: '←', desc: 'Previous episode' },
  { keys: '→', desc: 'Next episode' },
  { keys: 'F', desc: 'Toggle fullscreen' },
  { keys: '1–5', desc: 'Switch server' },
  { keys: 'E', desc: 'Toggle episode picker' },
  { keys: '?', desc: 'Show keyboard shortcuts' },
  { keys: 'Esc', desc: 'Close panel / go back' },
];

const fmtEp = (sn, ep) => `S${String(sn).padStart(2, '0')}E${String(ep).padStart(2, '0')}`;

export default function Player() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [server, setServer] = useState(0);
  const [loc, setLoc] = useState(null);
  const [armed, setArmed] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [watchedMap, setWatchedMap] = useState({});
  const [epsLoading, setEpsLoading] = useState(false);
  const playerRef = useRef(null);
  const resolveTvmazeId = useCallback(async (s) => {
    if (!s || s.type !== 'tv') return null;
    if (s.tvmazeId) return s.tvmazeId;
    const idStr = String(s.id || '');
    if (idStr && !idStr.startsWith('tt')) return idStr;
    const imdb = s.imdbId || (idStr.startsWith('tt') ? idStr : null);
    if (imdb) return await tvmazeLookupByImdb(imdb);
    return null;
  }, []);

  useEffect(() => {
    const qType = searchParams.get('type');
    const qId = searchParams.get('id');
    if (qType && qId) {
      const s = {
        type: qType, id: qId,
        title: searchParams.get('title') || '',
        imdbId: searchParams.get('imdb') || undefined,
        tvmazeId: searchParams.get('tv') ? Number(searchParams.get('tv')) : undefined,
        season: parseInt(searchParams.get('season')) || 1,
        episode: parseInt(searchParams.get('episode')) || 1,
      };
      setLoc(s);
      localStorage.setItem('lg_lastViewed', JSON.stringify(s));
      setResuming(false);
      return;
    }
    if (location.state) {
      setLoc(location.state);
      localStorage.setItem('lg_lastViewed', JSON.stringify(location.state));
      setResuming(false);
    } else {
      const saved = localStorage.getItem('lg_lastViewed');
      if (saved) { setLoc(JSON.parse(saved)); setResuming(true); }
    }
  }, [location.state, searchParams]);

  useEffect(() => {
    if (!loc || loc.type !== 'tv') { setEpisodes([]); return; }
    let cancelled = false;
    setEpsLoading(true);
    resolveTvmazeId(loc).then(tvId => {
      if (cancelled) return;
      if (!tvId) { setEpsLoading(false); return; }
      tvmazeEpisodes(tvId, parseInt(loc.season) || 1).then(eps => {
        if (cancelled) return;
        if (eps) setEpisodes(eps);
        setEpsLoading(false);
      });
      tvmazeSeasons(tvId).then(sea => {
        if (!cancelled && sea && sea.length > 0) setSeasons(sea);
      });
    });
    return () => { cancelled = true; };
  }, [loc?.type, loc?.id, loc?.season, loc?.imdbId, loc?.tvmazeId, resolveTvmazeId]);

  useEffect(() => {
    if (!loc) return;
    try {
      const all = JSON.parse(localStorage.getItem('lg_watched') || '{}');
      const key = String(loc.tvmazeId || loc.id);
      if (loc.type === 'tv') {
        if (!all[key]) all[key] = {};
        all[key][`s${loc.season || 1}e${loc.episode || 1}`] = Date.now();
        localStorage.setItem('lg_watched', JSON.stringify(all));
      }
      setWatchedMap(all[key] || {});
    } catch { /* ignore */ }
  }, [loc?.type, loc?.id, loc?.tvmazeId, loc?.season, loc?.episode]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) playerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  const goEp = useCallback((newEp, newSn) => {
    setLoc(prev => {
      const next = { ...prev, season: newSn, episode: newEp };
      localStorage.setItem('lg_lastViewed', JSON.stringify(next));
      return next;
    });
    setServer(0);
    setArmed(false);
    setPickerOpen(false);
  }, []);

  const switchServer = useCallback((i) => { setServer(i); setArmed(false); }, []);

  const shortcutRef = useRef({});
  shortcutRef.current = { loc, helpOpen, pickerOpen, toggleFullscreen, goEp, switchServer };

  useEffect(() => {
    const h = (e) => {
      const s = shortcutRef.current;
      if (e.key === 'Escape') {
        if (s.helpOpen) { setHelpOpen(false); return; }
        if (s.pickerOpen) { setPickerOpen(false); return; }
        navigate(-1);
        return;
      }
      if (e.key === '?') { e.preventDefault(); setHelpOpen(v => !v); return; }
      if (s.helpOpen) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'f' || e.key === 'F') { toggleFullscreen(); return; }
      if (e.key === 'e' || e.key === 'E') { if (s.loc?.type === 'tv') setPickerOpen(v => !v); return; }
      if (e.key >= '1' && e.key <= '5') { switchServer(parseInt(e.key) - 1); return; }
      if (s.loc?.type === 'tv') {
        const sn = parseInt(s.loc.season) || 1;
        const ep = parseInt(s.loc.episode) || 1;
        if (e.key === 'ArrowLeft') { e.preventDefault(); goEp(ep > 1 ? ep - 1 : 1, ep > 1 ? sn : Math.max(1, sn - 1)); }
        if (e.key === 'ArrowRight') { e.preventDefault(); goEp(ep + 1, sn); }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [navigate, toggleFullscreen, goEp, switchServer]);

  useEffect(() => {
    const originalOpen = window.open;
    window.open = () => null;
    const blockExternal = (e) => {
      const a = e.target.closest?.('a[target="_blank"]');
      if (a && a.hostname !== window.location.hostname) e.preventDefault();
    };
    document.addEventListener('click', blockExternal, true);
    return () => { window.open = originalOpen; document.removeEventListener('click', blockExternal, true); };
  }, []);

  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let lock = null;
    let cancelled = false;

    const request = async () => {
      if (cancelled || document.visibilityState !== 'visible') return;
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch { /* unsupported context (http, backgrounded, etc.) */ }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        request();
      } else if (lock) {
        lock.release().catch(() => {});
        lock = null;
      }
    };

    request();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (lock) lock.release().catch(() => {});
    };
  }, []);

  const armPlayer = () => { if (!armed) setArmed(true); };

  if (!loc) return <main id="content" tabIndex={-1} className="page player-page"><div className="empty-state"><h3>No content selected</h3><p>Go back and select something to watch.</p></div></main>;

  const { type = 'movie', id, title, imdbId, season = 1, episode = 1 } = loc;
  const effectiveId = (imdbId && imdbId.startsWith('tt')) ? imdbId : (id || imdbId || loc.tvmazeId);
  const url = SERVERS[server].build(type, effectiveId, title, season, episode);
  const isTV = type === 'tv';
  const ep = parseInt(episode) || 1;
  const sn = parseInt(season) || 1;

  const shareUrl = () => {
    const p = new URLSearchParams({ type, id: String(id), title: title || '' });
    if (imdbId) p.set('imdb', imdbId);
    if (loc.tvmazeId) p.set('tv', String(loc.tvmazeId));
    if (isTV) { p.set('season', String(sn)); p.set('episode', String(ep)); }
    return `${window.location.origin}/player?${p}`;
  };

  const copyShare = async () => {
    try { await navigator.clipboard.writeText(shareUrl()); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const nextEp = isTV && episodes.length > 0
    ? (episodes.find(e => e.number === ep + 1) || null)
    : null;
  const atSeasonEnd = isTV && episodes.length > 0 && !nextEp;

  const detailPath = isTV ? `/detail/tv/${loc.tvmazeId || id}` : `/detail/movie/${id}`;

  return (
    <main id="content" tabIndex={-1} className="page player-page">
      <SEO
        title={`Watch ${title}${isTV ? ` ${fmtEp(sn, ep)}` : ''}`}
        description={`Watch ${title} ${isTV ? `Season ${sn} Episode ${ep}` : 'full movie'} online for free. Stream now on Kinshow.`}
        url={`https://kinshow.vercel.app/player`}
        type="video.other"
      />
      <StructuredData data={videoSchema(title, type, effectiveId, sn, ep)} />

      {resuming && (
        <div className="player-resume">
          <span className="player-resume-text">Continue watching <strong>{title}{isTV ? ` — ${fmtEp(sn, ep)}` : ''}</strong></span>
          <Link className="btn btn--ghost" to={detailPath}>Details</Link>
          <button className="btn btn--ghost" onClick={() => setResuming(false)}>Dismiss</button>
        </div>
      )}

      <div className="player-header">
        <button className="btn btn--ghost" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="player-title">{title}{isTV ? ` — ${fmtEp(sn, ep)}` : ''}</h2>
        <div className="player-header-actions">
          <button className={`btn btn--ghost ${copied ? 'btn-copied' : ''}`} onClick={copyShare}>
            {copied ? '✓ Copied!' : 'Share'}
          </button>
          <button className="btn btn--ghost" onClick={() => setHelpOpen(true)} aria-label="Keyboard shortcuts">? Shortcuts</button>
        </div>
      </div>

      <div className="player-servers">
        {SERVERS.map((sv, i) => (
          <button key={sv.id} className={`player-server-btn ${i === server ? 'player-server-btn--active' : ''}`} onClick={() => switchServer(i)}>
            {sv.name}
          </button>
        ))}
      </div>

      {isTV && (
        <div className="player-ep-nav">
          {seasons.length > 1 && (
            <select
              className="player-season-select"
              value={seasons.some(s => s.number === sn) ? sn : ''}
              onChange={e => { const v = parseInt(e.target.value); if (v) goEp(1, v); }}
              aria-label="Select season"
            >
              {!seasons.some(s => s.number === sn) && <option value="" disabled>Season {sn}</option>}
              {seasons.map(s => (
                <option key={s.id} value={s.number}>
                  Season {s.number}{s.episodeOrder ? ` (${s.episodeOrder} eps)` : ''}
                </option>
              ))}
            </select>
          )}
          <button className="btn btn--ghost" disabled={sn <= 1 && ep <= 1} onClick={() => goEp(ep > 1 ? ep - 1 : 1, ep > 1 ? sn : Math.max(1, sn - 1))}>← Prev</button>
          <span className="player-ep-label">{fmtEp(sn, ep)}</span>
          <button className="btn btn--ghost" onClick={() => goEp(ep + 1, sn)}>Next →</button>
          <button className={`btn btn--ghost player-ep-toggle ${pickerOpen ? 'player-ep-toggle--active' : ''}`} onClick={() => setPickerOpen(v => !v)}>
            {pickerOpen ? 'Hide Episodes' : 'Episodes'}
          </button>
        </div>
      )}

      <div className="player-container" ref={playerRef}>
        {url ? (
          <>
            <iframe key={`${server}-${url}`} src={url} title={title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="player-iframe" />
            {!armed && <div className="player-click-shield" onClickCapture={armPlayer} title="Click to enable player" />}
          </>
        ) : (
          <div className="empty-state">
            <h3>Unable to load player</h3>
            <p>No streaming source available for this title. Try a different server.</p>
          </div>
        )}
      </div>

      {isTV && pickerOpen && (
        <div className="player-episodes-panel">
          {episodes.length > 0 ? (
            <div className="player-episodes-grid">
              {episodes.map(e => {
                const isCurrent = e.season === sn && e.number === ep;
                const isWatched = !!watchedMap[`s${e.season}e${e.number}`];
                return (
                  <button key={e.id} className={`ep-pick ${isCurrent ? 'ep-pick--active' : ''}`} onClick={() => goEp(e.number, e.season)}>
                    {e.image && <img className="ep-pick-thumb" src={e.image} alt="" loading="lazy" />}
                    <div className="ep-pick-info">
                      <span className="ep-pick-num">{fmtEp(e.season, e.number)}{isWatched && <span className="ep-pick-watched"> ✓</span>}</span>
                      <span className="ep-pick-title">{e.name}</span>
                      {e.airdate && <span className="ep-pick-date">{e.airdate}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="empty-state"><p>{epsLoading ? 'Loading episodes…' : 'No episodes available for this season.'}</p></div>
          )}
        </div>
      )}

      {isTV && (nextEp || atSeasonEnd) && (
        <div className="player-upnext">
          <span className="player-upnext-label">Up Next</span>
          <button
            className="player-upnext-card"
            onClick={() => goEp(nextEp ? ep + 1 : 1, nextEp ? sn : sn + 1)}
          >
            {nextEp?.image
              ? <img className="player-upnext-thumb" src={nextEp.image} alt="" loading="lazy" />
              : <div className="player-upnext-thumb player-upnext-thumb--empty">▶</div>}
            <div className="player-upnext-info">
              <span className="player-upnext-ep">{fmtEp(nextEp ? sn : sn + 1, nextEp ? ep + 1 : 1)}</span>
              <span className="player-upnext-title">{nextEp ? nextEp.name : `Season ${sn + 1} — Episode 1`}</span>
            </div>
            <span className="player-upnext-play">▶</span>
          </button>
        </div>
      )}

      {helpOpen && (
        <div className="player-help-overlay" onClick={() => setHelpOpen(false)}>
          <div className="player-help-modal" onClick={e => e.stopPropagation()}>
            <h3>Keyboard Shortcuts</h3>
            {SHORTCUTS.map(s => (
              <div className="player-help-row" key={s.keys}>
                <kbd>{s.keys}</kbd>
                <span>{s.desc}</span>
              </div>
            ))}
            <button className="btn btn--primary" onClick={() => setHelpOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </main>
  );
}
