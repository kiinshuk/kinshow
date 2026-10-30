import { useState, useEffect, useRef } from 'react';

export function useInfiniteScroll(allItems, batchSize = 12) {
  const [visible, setVisible] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef(null);
  const pageRef = useRef(1);

  useEffect(() => {
    const next = allItems.slice(0, batchSize);
    setVisible(next);
    setHasMore(allItems.length > batchSize);
    pageRef.current = 1;
  }, [allItems, batchSize]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el || !hasMore) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const nextPage = pageRef.current + 1;
        const end = nextPage * batchSize;
        const next = allItems.slice(0, end);
        setVisible(next);
        pageRef.current = nextPage;
        setHasMore(end < allItems.length);
      }
    }, { rootMargin: '600px' });

    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, allItems, batchSize]);

  return { visible, hasMore, loaderRef };
}
