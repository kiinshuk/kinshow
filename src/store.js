import { useState, useCallback, useEffect } from 'react';

const SEARCH_HISTORY_KEY = 'lg_searchHistory';
const SEARCH_HISTORY_TTL = 7 * 24 * 60 * 60 * 1000;
const STORAGE_VERSION = '1';
const STORAGE_KEYS = ['lg_watchlist', 'lg_history', 'lg_ratings', SEARCH_HISTORY_KEY];

// Missing or unknown versions reset only store-owned data. Mark the version after
// every removal succeeds; blocked storage falls back to in-memory defaults.
function ensureStorageVersion() {
  try {
    if (localStorage.getItem('lg_version') !== STORAGE_VERSION) {
      STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
      localStorage.setItem('lg_version', STORAGE_VERSION);
    }
    return true;
  } catch {
    return false;
  }
}


function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try { if (!ensureStorageVersion()) return initial; const d = localStorage.getItem('lg_' + key); return d ? JSON.parse(d) : initial; } catch { return initial; }
  });
  useEffect(() => { try { if (!ensureStorageVersion()) return; localStorage.setItem('lg_' + key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

export function getSearchHistory() {
  try {
    if (!ensureStorageVersion()) return [];
    const stored = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
    const cutoff = Date.now() - SEARCH_HISTORY_TTL;
    const recent = Array.isArray(stored)
      ? stored
        .filter(item => item && item.query && item.timestamp > cutoff)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5)
      : [];

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(recent));
    return recent;
  } catch {
    return [];
  }
}

export function saveSearchTerm(value) {
  if (!ensureStorageVersion()) return [];
  const normalized = value.trim();
  if (!normalized) return getSearchHistory();

  try {
    const history = getSearchHistory();
    const withoutDuplicate = history.filter(item => item.query.toLowerCase() !== normalized.toLowerCase());
    const next = [{ query: normalized, timestamp: Date.now() }, ...withoutDuplicate].slice(0, 5);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function removeSearchTerm(timestamp) {
  try {
    if (!ensureStorageVersion()) return [];
    const next = getSearchHistory().filter(item => item.timestamp !== timestamp);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function useWatchlist() {
  const [list, setList] = useLocalStorage('watchlist', []);
  const add = useCallback((item) => setList(p => p.some(i => i.id === item.id) ? p : [...p, { id: item.id, type: item.media_type || (item.title ? 'movie' : 'tv'), title: item.title || item.name, poster_path: item.poster_path, runtime: Number(item.runtime) || 0, added: Date.now() }]), [setList]);
  const remove = useCallback((id) => setList(p => p.filter(i => i.id !== id)), [setList]);
  const restore = useCallback((item, index) => {
    if (!item || item.id == null) return;
    setList(p => {
      if (p.some(i => i.id === item.id)) return p;
      const next = [...p];
      const targetIndex = typeof index === 'number' && Number.isInteger(index) && index >= 0 && index <= next.length
        ? index
        : next.length;
      next.splice(targetIndex, 0, item);
      return next;
    });
  }, [setList]);
  const has = useCallback((id) => list.some(i => i.id === id), [list]);
  return { list, add, remove, restore, has };
}

export function useHistory() {
  const [list, setList] = useLocalStorage('history', []);
  const add = useCallback((item, progress = 0) => {
    setList(p => {
      const filtered = p.filter(i => !(i.id === item.id && i.type === (item.media_type || (item.title ? 'movie' : 'tv'))));
      return [{ id: item.id, type: item.media_type || (item.title ? 'movie' : 'tv'), title: item.title || item.name, poster_path: item.poster_path, backdrop_path: item.backdrop_path, runtime: Number(item.runtime) || 0, progress, season: item.season, episode: item.episode, watched: Date.now() }, ...filtered].slice(0, 50);
    });
  }, [setList]);
  const remove = useCallback((id, type) => setList(p => p.filter(i => !(i.id === id && i.type === type))), [setList]);
  return { list, add, remove };
}

export function useRatings() {
  const [map, setMap] = useLocalStorage('ratings', {});
  const rate = useCallback((id, score) => setMap(p => ({ ...p, [id]: score })), [setMap]);
  const get = useCallback((id) => map[id] || 0, [map]);
  return { rate, get };
}
