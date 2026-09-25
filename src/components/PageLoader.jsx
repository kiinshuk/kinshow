import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageLoader() {
  const { pathname } = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isLoading) return null;

  return <div className="top-progress-bar" />;
}
