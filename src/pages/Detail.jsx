import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { tvmazeShow, tvmazeSeasons, tvmazeEpisodes, omdbEpisodes, MOVIES, title as t, year as y, rating as r, runtime } from '../api';
import { useWatchlist, useHistory } from '../store';
import { useToast } from '../components/Toast';
import CastCard from '../components/CastCard';
import MediaCard from '../components/MediaCard';
import { SkeletonDetail } from '../components/Skeletons';
import { PosterImg, makePoster } from '../utils/poster';
import { SEO, StructuredData, movieSchema, tvSchema, breadcrumbSchema } from '../components/SEO';
import { addRecent } from '../utils/cookies';
import EmptyState from '../components/EmptyState';

export default function Detail() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [seasonNum, setSeasonNum] = useState(1);
  const [loading, setLoading] = useState(true);
  const castScrollRef = useRef(null);
  const [showCastLeftFade, setShowCastLeftFade] = useState(false);
  const [showCastRightFade, setShowCastRightFade] = useState(false);
  const { add, remove, has } = useWatchlist();
  const { add: addHistory } = useHistory();
  const toast = useToast();

  const updateCastScroll = () => {
    const el = castScrollRef.current;
    if (!el) return;

    setShowCastLeftFade(el.scrollLeft > 0);
    setShowCastRightFade(
      el.scrollLeft + el.clientWidth < el.scrollWidth - 1
    );
  };

  const handleCastKeydown = (e) => {
    const el = castScrollRef.current;
    if (!el) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      el.scrollBy({ left: -100, behavior: 'smooth' });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      el.scrollBy({ left: 100, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const el = castScrollRef.current;
    if (!el) return;

    const checkScroll = () => {
      updateCastScroll();
    };

    const handleWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    requestAnimationFrame(checkScroll);

    el.addEventListener('scroll', checkScroll);
    el.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', checkScroll);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', checkScroll);
    };
  }, [data?.cast]);

  useEffect(() => {
    setLoading(true); setData(null); setSeasons([]); setEpisodes([]);
    window.scrollTo(0, 0);

    if (type === 'tv') {
      tvmazeShow(id).then(d => {
        if (d) {
          setData(d);
          addRecent({ id: d.id, media_type: 'tv', title: d.title || d.name, poster: d.poster || d.poster_path });
          tvmazeSeasons(d.tvmazeId || id).then(sea => {
            setSeasons(sea);
            if (sea.length > 0) {
              setSeasonNum(sea[0].number);
            }
          });
        }
        setLoading(false);
      });
    } else {
      const movie = MOVIES.find(m => m.id === id || String(m.id) === String(id));
      if (movie) {
        setData({ ...movie, media_type: 'movie', cast: [], crew: [] });
        addRecent({ id: movie.id, media_type: 'movie', title: movie.title, poster: movie.poster_path });
      }
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    if (!data || type !== 'tv' || seasonNum < 1) return;
    setEpisodes([]);
    const tvmazeId = data.tvmazeId || id;
    tvmazeEpisodes(tvmazeId, seasonNum).then(eps => {
      if (eps && eps.length > 0) {
        setEpisodes(eps);
      } else if (data.imdbID) {
        omdbEpisodes(data.imdbID, seasonNum).then(setEpisodes);
      }
    });
  }, [data?.tvmazeId, data?.imdbID, seasonNum, type, id]);

  if (loading) return <main className="page detail"><SkeletonDetail /></main>;
  if (!data) return <main className="page detail"><div className="empty-state">
   <EmptyState 
  title="No Results Found"
  description="We couldn't find the data you were looking for."
  action={<Link to="/" className="btn btn--secondary">Go Home</Link>}
/></div></main>;

  const title = t(data);
  const imdbId = data.imdbID || null;
  const isTv = type === 'tv';
  const posterUrl = data.poster || data.poster_path;
  const fallbackPoster = makePoster(title, y(data), r(data), title.charCodeAt(0));
  const itemId = isTv ? String(id) : (imdbId || String(id));

  const toggleWatchlist = () => {
    if (has(itemId)) { remove(itemId); toast(`${title} removed from My List`); }
    else { add({ id: itemId, media_type: type, title, poster_path: posterUrl || fallbackPoster, runtime: data.runtime }); toast(`${title} added to My List`, 'success'); }
  };

  const playContent = () => {
    addHistory({ id: itemId, media_type: type, title, poster_path: posterUrl, runtime: data.runtime }, 0);
    navigate('/player', { state: { type, id: itemId, title, imdbId } });
  };

  const playEpisode = (ep) => {
    const itemId = imdbId || String(id);
    addHistory({ id: itemId, media_type: 'tv', title, poster_path: posterUrl, runtime: data.runtime, season: seasonNum, episode: ep.number }, 0);
    navigate('/player', { state: { type: 'tv', id: itemId, title, imdbId, season: seasonNum, episode: ep.number } });
  };

  return (
    <main className="page detail">
      <SEO
        title={`${title} (${y(data)})`}
        description={data.overview?.slice(0, 160) || `${title} - ${isTv ? 'TV Series' : 'Movie'}`}
        image={posterUrl}
        url={`https://kinshow.vercel.app/detail/${type}/${id}`}
        type={isTv ? 'video.tv_show' : 'video.movie'}
      />
      <StructuredData data={isTv ? tvSchema(data) : movieSchema(data)} />
      <StructuredData data={breadcrumbSchema([
        { name: 'Home', url: 'https://kinshow.vercel.app/' },
        { name: isTv ? 'TV Shows' : 'Movies', url: `https://kinshow.vercel.app/${isTv ? 'tv' : 'movies'}` },
        { name: title, url: `https://kinshow.vercel.app/detail/${type}/${id}` }
      ])} />
      <div className="detail-backdrop" style={{ background: 'linear-gradient(135deg, #12141c 0%, #1a1a2e 50%, #0f3460 100%)' }} />
      <div className="detail-backdrop-gradient" />
      <div className="detail-content">
        <div className="detail-left">
          <PosterImg src={posterUrl} title={title} year={y(data)} rating={r(data)} idx={title.charCodeAt(0)} className="detail-poster" alt={title} />
          <div className="detail-actions-mobile">
            <button className="btn btn--primary btn--block" onClick={playContent}>▶ Watch Now</button>
            <button className="btn btn--secondary btn--block" onClick={toggleWatchlist}>{has(itemId) ? '✓ In My List' : '+ Add to List'}</button>
          </div>
        </div>
        <div className="detail-right">
          <div className="detail-tags">
            <span className="detail-tag detail-tag--type">{isTv ? 'TV Series' : 'Film'}</span>
            {data.rating > 0 && <span className="detail-tag detail-tag--rating">★ {r(data)}</span>}
            {y(data) !== '—' && <span className="detail-tag">{y(data)}</span>}
            {data.rated && <span className="detail-tag">{data.rated}</span>}
            {data.runtime > 0 && <span className="detail-tag">{runtime(data.runtime)}</span>}
            {data.totalSeasons > 0 && <span className="detail-tag">{data.totalSeasons} Season{data.totalSeasons > 1 ? 's' : ''}</span>}
            {data.status && <span className="detail-tag">{data.status}</span>}
          </div>
          <h1 className="detail-title">{title}</h1>
          {data.genres?.length > 0 && <p className="detail-genres">{data.genres.map(g => g.name).join(', ')}</p>}
          {data.overview && <p className="detail-overview">{data.overview}</p>}
          <div className="detail-actions">
            <button className="btn btn--primary" onClick={playContent}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Watch Now
            </button>
            <button className="btn btn--ghost" onClick={toggleWatchlist}>
              {has(itemId) ? '✓ In My List' : '+ Add to List'}
            </button>
          </div>
          <div className="detail-meta">
            {data.director && data.director !== 'N/A' && <div className="detail-meta-row"><span className="detail-meta-label">Director</span><span className="detail-meta-value">{data.director}</span></div>}
            {data.actors && data.actors !== 'N/A' && <div className="detail-meta-row"><span className="detail-meta-label">Cast</span><span className="detail-meta-value">{data.actors}</span></div>}
            {data.language && <div className="detail-meta-row"><span className="detail-meta-label">Language</span><span className="detail-meta-value">{data.language}</span></div>}
            {data.country && <div className="detail-meta-row"><span className="detail-meta-label">Country</span><span className="detail-meta-value">{data.country}</span></div>}
            {data.network && <div className="detail-meta-row"><span className="detail-meta-label">Network</span><span className="detail-meta-value">{data.network}</span></div>}
            {isTv && data.ended && <div className="detail-meta-row"><span className="detail-meta-label">Ended</span><span className="detail-meta-value">{data.ended}</span></div>}
            {imdbId && <div className="detail-meta-row"><span className="detail-meta-label">IMDb</span><span className="detail-meta-value"><a href={`https://www.imdb.com/title/${imdbId}`} target="_blank" rel="noopener noreferrer">View on IMDb →</a></span></div>}
          </div>
        </div>
      </div>

      {data.cast?.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section-title">Cast</h2>
          <div className="cast-scroll-wrapper">
            {showCastLeftFade && (
              <div className="cast-scroll-fade cast-scroll-fade--left" />
            )}
            <div ref={castScrollRef} className="cast-scroll" tabIndex={0} role="list" onKeyDown={handleCastKeydown}>
              {data.cast.slice(0, 12).map((p, i) => (
                <CastCard key={i} person={p} />
              ))}
            </div>
            {showCastRightFade && (
              <div className="cast-scroll-fade cast-scroll-fade--right" />
            )}
          </div>
        </section>
      )}

      {isTv && seasons.length > 0 && (
        <section className="detail-section">
          <h2 className="detail-section-title">Seasons & Episodes</h2>
          <div className="season-tabs">
            {seasons.map(s => (
              <button key={s.number} className={`season-tab ${seasonNum === s.number ? 'season-tab--active' : ''}`} onClick={() => setSeasonNum(s.number)}>
                <span>Season {s.number}</span>
                <span className="season-tab-count">{s.episodeOrder || '?'} ep{s.episodeOrder !== 1 ? 's' : ''}</span>
              </button>
            ))}
          </div>
          {episodes.length > 0 ? (
            <div className="episodes">
              {episodes.map(ep => (
                <button key={ep.id} className="ep-card" onClick={() => playEpisode(ep)}>
                  <div className="ep-card-thumb">
                    {ep.image ? <img src={ep.image} alt="" loading="lazy" /> : <div className="ep-card-thumb-empty"><span>E{ep.number}</span></div>}
                    <div className="ep-card-play">▶</div>
                  </div>
                  <div className="ep-card-info">
                    <div className="ep-card-header">
                      <span className="ep-card-num">E{ep.number}</span>
                      <span className="ep-card-title">{ep.name}</span>
                    </div>
                    <div className="ep-card-meta">
                      {ep.airdate && <span className="ep-card-date">{ep.airdate}</span>}
                      {ep.rating > 0 && <span className="ep-card-rating">★ {ep.rating}</span>}
                    </div>
                    {ep.overview && <p className="ep-card-desc">{ep.overview}</p>}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px' }}><p>Loading episodes...</p></div>
          )}
        </section>
      )}
    </main>
  );
}
