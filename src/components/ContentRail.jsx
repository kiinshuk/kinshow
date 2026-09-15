import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MediaCard from './MediaCard';

export default function ContentRail({ title, items = [], viewAll, loading }) {
  const ref = useRef(null);
  const [canScrollL, setCanScrollL] = useState(false);
  const [canScrollR, setCanScrollR] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => { setCanScrollL(el.scrollLeft > 10); setCanScrollR(el.scrollLeft < el.scrollWidth - el.clientWidth - 10); };
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check); };
  }, [items.length, loading]);

  const scroll = (dir) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: 'smooth' });
  };

  return (
    <section className="rail">
      <div className="rail-header">
        <h2 className="rail-title">{title}</h2>
        {viewAll && <Link to={viewAll} className="rail-viewall">View All <span>→</span></Link>}
      </div>
      <div className="rail-wrap">
        {canScrollL && <button className="rail-arrow rail-arrow--left" onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>}
        <div className="rail-track" ref={ref}>
          {loading ? Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card card--skeleton"><div className="card-poster skeleton-pulse" /><div className="card-meta"><div className="skeleton-line skeleton-line--title" /><div className="skeleton-line skeleton-line--year" /></div></div>
          )) : items.map((item, i) => <MediaCard key={`${item.id}-${i}`} item={item} />)}
        </div>
        {canScrollR && <button className="rail-arrow rail-arrow--right" onClick={() => scroll(1)} aria-label="Scroll right">›</button>}
      </div>
    </section>
  );
}
