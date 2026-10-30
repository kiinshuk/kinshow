const TVMAZE = 'https://api.tvmaze.com';
const TVMAZE_KEY = 'ef2igMeJwNOOzyXM_GPKpbMDpHgfXtat';
const OMDB_KEY = 'b90dd268';
const OMDB = 'https://www.omdbapi.com';
const PRE = 'lg_';
const TTL = 24 * 60 * 60 * 1000;

// Clear old OMDb search cache older than 1 hour
try {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PRE + 'omdb_s_')) {
      try {
        const d = JSON.parse(localStorage.getItem(key));
        if (d && Date.now() - d.t > 3600000) localStorage.removeItem(key);
      } catch { localStorage.removeItem(key); }
    }
  }
} catch {/* ignore */}

const cache = (k) => { try { const d = JSON.parse(localStorage.getItem(PRE + k)); if (!d || Date.now() - d.t > TTL) { localStorage.removeItem(PRE + k); return null; } return d.v; } catch { return null; } };
const save = (k, v) => { try { localStorage.setItem(PRE + k, JSON.stringify({ v, t: Date.now() })); } catch {/* ignore */} };

async function fetchJSON(url, ms = 12000) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    const u = new URL(url);
    if (u.hostname === 'api.tvmaze.com') u.searchParams.set('apikey', TVMAZE_KEY);
    const r = await fetch(u, { signal: c.signal }); clearTimeout(t);
    if (!r.ok) throw 0; return await r.json();
  } catch { clearTimeout(t); return null; }
}

function stripHtml(s) { return s ? s.replace(/<[^>]*>/g, '').trim() : ''; }

// OMDb API
async function omdbFetch(params) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 8000);
  try {
    const url = new URL(OMDB);
    Object.entries({ ...params, apikey: OMDB_KEY }).forEach(([k, v]) => url.searchParams.set(k, v));
    const r = await fetch(url, { signal: c.signal });
    clearTimeout(t);
    if (!r.ok) throw 0;
    return await r.json();
  } catch { clearTimeout(t); return null; }
}

export async function omdbByImdb(imdbId) {
  const ck = 'omdb_' + imdbId;
  const hit = cache(ck);
  if (hit) return hit;
  const d = await omdbFetch({ i: imdbId });
  if (!d || d.Response === 'False') return null;
  save(ck, d);
  return d;
}

const na = (v) => (v && v !== 'N/A' ? v : '');

export async function omdbMovieById(imdbId) {
  const d = await omdbByImdb(imdbId);
  if (!d) return null;
  const poster = na(d.Poster);
  return {
    id: d.imdbID, imdbID: d.imdbID,
    title: d.Title, name: d.Title,
    overview: na(d.Plot),
    poster, poster_path: poster || null,
    backdrop_path: null,
    vote_average: parseFloat(d.imdbRating) || 0,
    rating: parseFloat(d.imdbRating) || 0,
    year: na(d.Year), release_date: na(d.Released),
    runtime: parseInt(d.Runtime) || 0,
    genres: na(d.Genre).split(', ').filter(Boolean).map(name => ({ name })),
    genre_ids: [],
    director: na(d.Director), actors: na(d.Actors),
    language: na(d.Language), country: na(d.Country),
    rated: na(d.Rated), boxOffice: na(d.BoxOffice),
    awards: na(d.Awards), plot: na(d.Plot),
    media_type: 'movie', type: 'movie',
    cast: [], crew: []
  };
}

export async function omdbSearch(query) {
  if (!query?.trim()) return [];
  const ck = 'omdb_s_' + query;
  const hit = cache(ck);
  if (hit) return hit;
  const d = await omdbFetch({ s: query, type: 'movie' });
  if (!d || d.Response === 'False') return [];
  const results = (d.Search || []).map(m => ({
    id: m.imdbID, imdbID: m.imdbID,
    title: m.Title, name: m.Title,
    overview: '', poster_path: null, poster: null,
    vote_average: 0, rating: 0,
    year: m.Year || '', release_date: '',
    runtime: 0, genres: [], genre_ids: [],
    media_type: 'movie', type: 'movie',
    language: '', country: '', director: '', actors: '',
    rated: '', boxOffice: ''
  }));
  save(ck, results);
  return results;
}

export async function omdbSearchMulti(query) {
  if (!query?.trim()) return [];
  const ck = 'omdb_sm_' + query;
  const hit = cache(ck);
  if (hit) return hit;
  const d = await omdbFetch({ s: query });
  if (!d) return null;
  if (d.Response === 'False') return [];
  const results = (d.Search || []).filter(m => m.Type === 'movie').map(m => ({
    id: m.imdbID, imdbID: m.imdbID,
    title: m.Title, name: m.Title,
    overview: '', poster_path: m.Poster !== 'N/A' ? m.Poster : null,
    poster: m.Poster !== 'N/A' ? m.Poster : null,
    vote_average: 0, rating: 0,
    year: m.Year || '', release_date: '',
    runtime: 0, genres: [], genre_ids: [],
    media_type: 'movie', type: 'movie',
    language: '', country: '', director: '', actors: '',
    rated: '', boxOffice: ''
  }));
  save(ck, results);
  return results;
}

export async function omdbEpisodes(imdbId, season) {
  const ck = `omdb_ep_${imdbId}_${season}`;
  const hit = cache(ck);
  if (hit) return hit;
  const d = await omdbFetch({ i: imdbId, Season: season });
  if (!d || d.Response === 'False') return [];
  const eps = (d.Episodes || []).map(e => ({
    id: e.imdbID || '', number: parseInt(e.Episode) || 0, season,
    name: e.Title || `Episode ${e.Episode}`, airdate: e.Released || '',
    runtime: parseInt(e.Runtime) || 0, rating: parseFloat(e.imdbRating) || 0,
    overview: '', image: null
  }));
  save(ck, eps);
  return eps;
}

// TVmaze API
function _tvmazeToShow(d) {
  if (!d) return null;
  const s = d.show || d;
  return {
    id: s.id, imdbID: s.externals?.imdb || null,
    title: s.name, name: s.name,
    overview: stripHtml(s.summary),
    poster: s.image?.original || s.image?.medium || null,
    poster_path: s.image?.original || s.image?.medium || null,
    backdrop_path: null,
    vote_average: s.rating?.average || 0,
    rating: s.rating?.average || 0,
    release_date: s.premiered || '',
    first_air_date: s.premiered || '',
    year: (s.premiered || '').slice(0, 4),
    runtime: s.averageRuntime || s.runtime || 0,
    genres: (s.genres || []).map(g => ({ name: g })),
    genre_ids: [],
    media_type: 'tv', type: 'series',
    language: s.language || '',
    country: s.network?.country?.name || '',
    status: s.status || '',
    network: s.network?.name || s.webChannel?.name || '',
    totalSeasons: 0, ended: s.ended || '',
    tvmazeId: s.id, cast: [], crew: []
  };
}

export function tvmazeToShow(d) { return _tvmazeToShow(d); }

async function tvmazeSearchRaw(q) {
  if (!q?.trim()) return [];
  const ck = 'tv_s_' + q;
  const hit = cache(ck);
  if (hit) return hit;
  const d = await fetchJSON(`${TVMAZE}/search/shows?q=${encodeURIComponent(q)}`, 8000);
  if (!d) return null;
  const shows = d.map(r => _tvmazeToShow(r)).filter(Boolean);
  save(ck, shows);
  return shows;
}

export async function tvmazeSearch(q) {
  return (await tvmazeSearchRaw(q)) || [];
}

export async function tvmazeShow(id) {
  const ck = 'tv_i_' + id;
  const hit = cache(ck);
  if (hit) return hit;
  const d = await fetchJSON(`${TVMAZE}/shows/${id}?embed[]=seasons&embed[]=cast`, 8000);
  if (!d) return null;
  const show = _tvmazeToShow(d);
  if (d._embedded?.seasons) show.totalSeasons = d._embedded.seasons.filter(s => s.number > 0).length;
  if (d._embedded?.cast) show.cast = d._embedded.cast.map(c => ({ name: c.person?.name || '', character: c.character?.name || '', profile_path: null }));
  save(ck, show);
  return show;
}

export async function tvmazeSeasons(showId) {
  const ck = 'tv_sea_' + showId;
  const hit = cache(ck);
  if (hit) return hit;
  const d = await fetchJSON(`${TVMAZE}/shows/${showId}/seasons`, 8000);
  if (!d) return [];
  const seasons = d.filter(s => s.number > 0).map(s => ({
    id: s.id, number: s.number, name: s.name,
    premiereDate: s.premiereDate, endDate: s.endDate,
    episodeOrder: s.episodeOrder,
    image: s.image?.medium || null,
    summary: stripHtml(s.summary)
  }));
  save(ck, seasons);
  return seasons;
}

export async function tvmazeLookupByImdb(imdbId) {
  const ck = `tv_lookup_${imdbId}`;
  const hit = cache(ck);
  if (hit) return hit;
  const d = await fetchJSON(`${TVMAZE}/lookup?imdb=${imdbId}`, 8000);
  if (!d || !d.id) return null;
  save(ck, d.id);
  return d.id;
}

export async function tvmazeEpisodes(showId, seasonNum) {
  const ck = `tv_ep_${showId}_${seasonNum}`;
  const hit = cache(ck);
  if (hit) return hit;
  const d = await fetchJSON(`${TVMAZE}/shows/${showId}/episodes`, 8000);
  if (!d || !Array.isArray(d)) return [];
  const eps = d.filter(e => e.season === seasonNum).map(e => ({
    id: e.id, number: e.number, season: e.season,
    name: e.name || `Episode ${e.number}`,
    airdate: e.airdate || '', runtime: e.runtime || 0,
    rating: e.rating?.average || 0,
    overview: stripHtml(e.summary),
    image: e.image?.medium || null
  }));
  save(ck, eps);
  return eps;
}

export async function tvmazeShowsByPage(page = 1) {
  const ck = `tv_page_${page}`;
  const hit = cache(ck);
  if (hit) return hit;
  const d = await fetchJSON(`${TVMAZE}/shows?page=${page}`, 12000);
  if (!d || !Array.isArray(d)) return [];
  const shows = d.map(s => _tvmazeToShow(s)).filter(Boolean);
  save(ck, shows);
  return shows;
}

export async function tvmazeMultipleShows(ids) {
  const uncached = ids.filter(id => !cache('tv_i_' + id));
  if (uncached.length > 0) {
    await Promise.all(uncached.map(id => tvmazeShow(id)));
  }
  return ids.map(id => cache('tv_i_' + id)).filter(Boolean);
}

export async function searchMulti(q) {
  if (!q?.trim()) return { results: [], omdbDown: false, tvDown: false };
  const [tvRaw, omdbRaw] = await Promise.all([tvmazeSearchRaw(q), omdbSearchMulti(q)]);
  const tvResults = tvRaw || [];
  const omdbResults = omdbRaw || [];
  const localMovies = MOVIES.filter(m => m.title.toLowerCase().includes(q.toLowerCase())).map(m => ({ ...m, media_type: 'movie' }));
  const seenIds = new Set(localMovies.map(m => m.id));
  const extraMovies = omdbResults.filter(m => !seenIds.has(m.id));
  const items = [...localMovies, ...extraMovies, ...tvResults.map(s => ({ ...s, media_type: 'tv' }))];
  return { results: items, omdbDown: omdbRaw === null, tvDown: tvRaw === null };
}

export function getMovies(category = 'popular') {
  let items = [...MOVIES];
  if (category === 'top_rated') items.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  else if (category === 'new') items = items.filter(m => parseInt(m.year) >= 2023);
  else items.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  return items;
}

// Movie data with hardcoded poster URLs
export const MOVIES = [
  { id: 'tt33764258', title: 'The Odyssey', overview: 'After the Trojan War, Odysseus faces a dangerous voyage back to Ithaca, meeting creatures like the Cyclops Polyphemus, Sirens, and Calypso along the way.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNTcyNmJlZmQtNDUwYy00NDBjLTg1NGQtYTY2Y2UxMWM3NmI1XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.4, year: '2026', runtime: 172, genres: [{ name: 'Action' }, { name: 'Adventure' }, { name: 'Fantasy' }], director: 'Christopher Nolan', actors: 'Matt Damon, Tom Holland, Anne Hathaway', language: 'English, Greek', country: 'United Kingdom, United States, Canada, New Zealand, Iceland', rated: 'R', boxOffice: '$589M' },
  { id: 'tt22084616', title: 'Spider-Man: Brand New Day', overview: 'A forgotten Peter Parker lives alone as a full-time Spider-Man until mounting pressure triggers a dangerous change and a powerful new enemy emerges.', poster_path: 'https://m.media-amazon.com/images/M/MV5BOWNjYWM3NWItOGE0ZS00MWRjLThiZWEtYjc4ZmNmMmU5ZTVmXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8, year: '2026', runtime: 145, genres: [{ name: 'Action' }, { name: 'Adventure' }], director: 'Destin Daniel Cretton', actors: 'Tom Holland, Zendaya, Mark Ruffalo', language: 'English', country: 'United States, Canada, United Kingdom, Germany', rated: 'PG-13', boxOffice: '$955M' },
  { id: 'tt37287335', title: 'Obsession', overview: 'After breaking the mysterious "One Wish Willow" to win his crush\'s heart, a hopeless romantic finds himself getting exactly what he asked for but soon discovers that some desires come at a dark, sinister price.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYzc1NWUwMDgtNGZlMS00ZmYzLWIzMzktNmMxMmY1MTUzNWExXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.8, year: '2026', runtime: 109, genres: [{ name: 'Horror' }, { name: 'Thriller' }], director: 'Curry Barker', actors: 'Michael Johnston, Inde Navarrette, Cooper Tomlinson', language: 'English', country: 'United States', rated: 'R', boxOffice: '$263M' },
  { id: 'tt45368240', title: 'You Can See Everything', overview: 'Thirty-four days before she\'s sent to prison, notorious Theranos founder Elizabeth Holmes invites a skeptical film crew to document her every move. What begins as an intimate portrait becomes a mind-bending three-year journey.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMDkwNGRiNjYtZTQ4MC00MWFhLWI3MjYtNzk1MDY2ZTNiY2Q4XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.9, year: '2026', runtime: 174, genres: [{ name: 'Documentary' }, { name: 'Biography' }], director: 'Nathan Fielder, Lance Oppenheim', actors: 'Billy Evans, Nathan Fielder, Elizabeth Holmes', language: 'English', country: 'United States', rated: 'R' },
  { id: 'tt23572848', title: 'The SpongeBob Movie: Search for SquarePants', overview: 'Desperate to be a big guy, SpongeBob sets out to prove his bravery to Mr. Krabs by following the Flying Dutchman, a mysterious swashbuckling ghost pirate, to the deepest depths of the deep sea.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYzdlYmM2YmEtMmQ3Zi00ZjAxLTg2ZjctNzU3NDVkY2RiOTBjXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 5.7, year: '2026', runtime: 88, genres: [{ name: 'Animation' }, { name: 'Adventure' }, { name: 'Comedy' }], director: 'Derek Drymon', actors: 'Tom Kenny, Clancy Brown, Rodger Bumpass', language: 'English', country: 'United States, Canada', rated: 'PG', boxOffice: '$71M' },
  { id: 'tt1757678', title: 'Avatar: Fire and Ash', overview: 'Jake and Neytiri\'s family grapples with grief, encountering a new, aggressive Na\'vi tribe, the Ash People, who are led by the fiery Varang, as the conflict on Pandora escalates and a new moral focus emerges.', poster_path: 'https://m.media-amazon.com/images/M/MV5BZDYxY2I1OGMtN2Y4MS00ZmU1LTgyNDAtODA0MzAyYjI0N2Y2XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.2, year: '2025', runtime: 197, genres: [{ name: 'Action' }, { name: 'Adventure' }, { name: 'Drama' }], director: 'James Cameron', actors: 'Sam Worthington, Zoe Saldaña, Sigourney Weaver', language: 'English', country: 'United States, Canada', rated: 'PG-13', boxOffice: '$404M' },
  { id: 'tt26443597', title: 'Zootopia 2', overview: 'Brave rabbit cop Judy Hopps and her friend, the fox Nick Wilde, team up again to crack a new case, the most perilous and intricate of their careers.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYjg1Mjc3MjQtMTZjNy00YWVlLWFhMWEtMWI3ZTgxYjJmNmRlXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.3, year: '2025', runtime: 108, genres: [{ name: 'Animation' }, { name: 'Adventure' }, { name: 'Comedy' }], director: 'Jared Bush, Byron Howard', actors: 'Ginnifer Goodwin, Jason Bateman, Ke Huy Quan', language: 'English', country: 'United States, Australia, Canada, Japan, United Kingdom', rated: 'PG', boxOffice: '$428M' },
  { id: 'tt31193180', title: 'Sinners', overview: 'Trying to leave their troubled lives behind, twin brothers return to their hometown to start again, only to discover that an even greater evil is waiting to welcome them back.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNjIwZWY4ZDEtMmIxZS00NDA4LTg4ZGMtMzUwZTYyNzgxMzk5XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.5, year: '2025', runtime: 137, genres: [{ name: 'Horror' }], director: 'Ryan Coogler', actors: 'Michael B. Jordan, Jack O&apos;Connell, Hailee Steinfeld', language: 'English, Chinese', country: 'United States', rated: 'R', boxOffice: '$280M' },
  { id: 'tt30144839', title: 'One Battle After Another', overview: 'When their enemy resurfaces after 16 years, a group of ex-revolutionaries reunite to rescue the daughter of one of their own.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMzBkZmQ0NjMtNTZlMy00ZjdlLTg5ODUtYWFlNGM0YzE3MTg0XkEyXkFqcGc@._V1_QL75_UY562_CR35,0,380,562_.jpg', vote_average: 7.6, year: '2025', runtime: 161, genres: [{ name: 'Crime' }, { name: 'Thriller' }], director: 'Paul Thomas Anderson', actors: 'Leonardo DiCaprio, Sean Penn, Benicio Del Toro', language: 'English, Spanish', country: 'United States', rated: 'R', boxOffice: '$73M' },
  { id: 'tt16311594', title: 'F1: The Movie', overview: 'A Formula One driver comes out of retirement to mentor and team up with a younger driver.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNGI0MDI4NjEtOWU3ZS00ODQyLWFhYTgtNGYxM2ZkM2Q2YjE3XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.6, year: '2025', runtime: 155, genres: [{ name: 'Drama' }, { name: 'Sport' }], director: 'Joseph Kosinski', actors: 'Brad Pitt, Damson Idris, Javier Bardem', language: 'English, Spanish, German, Italian', country: 'United States', rated: 'PG-13', boxOffice: '$190M' },
  { id: 'tt5950044', title: 'Superman', overview: 'Superman must reconcile his alien Kryptonian heritage with his human upbringing as reporter Clark Kent. As the embodiment of truth, justice and the American way he soon finds himself in a world that views these as old-fashioned.', poster_path: 'https://m.media-amazon.com/images/M/MV5BOGMwZGJiM2EtMzEwZC00YTYzLWIxNzYtMmJmZWNlZjgxZTMwXkEyXkFqcGc@._V1_QL75_UY562_CR35,0,380,562_.jpg', vote_average: 7, year: '2025', runtime: 129, genres: [{ name: 'Action' }, { name: 'Adventure' }, { name: 'Sci-Fi' }], director: 'James Gunn', actors: 'David Corenswet, Rachel Brosnahan, Nicholas Hoult', language: 'English', country: 'United States', rated: 'PG-13', boxOffice: '$354M' },
  { id: 'tt10676052', title: 'The Fantastic Four: First Steps', overview: 'Forced to balance their roles as heroes with the strength of their family bond, the Fantastic Four must defend Earth from a ravenous space god called Galactus and his enigmatic herald, the Silver Surfer.', poster_path: 'https://m.media-amazon.com/images/M/MV5BOGM5MzA3MDAtYmEwMi00ZDNiLTg4MDgtMTZjOTc0ZGMyNTIwXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 6.8, year: '2025', runtime: 115, genres: [{ name: 'Action' }, { name: 'Adventure' }, { name: 'Sci-Fi' }], director: 'Matt Shakman', actors: 'Pedro Pascal, Vanessa Kirby, Ebon Moss-Bachrach', language: 'English', country: 'United Kingdom, United States, Canada, New Zealand', rated: 'PG-13', boxOffice: '$274M' },
  { id: 'tt20969586', title: 'Thunderbolts*', overview: 'After finding themselves ensnared in a death trap, an unconventional team of antiheroes must go on a dangerous mission that will force them to confront the darkest corners of their pasts.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNDIzNGUwZmYtODM0Yy00NjA3LTgxOGUtOTY0ZGM5MjBkM2I3XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.1, year: '2025', runtime: 127, genres: [{ name: 'Action' }, { name: 'Adventure' }, { name: 'Crime' }], director: 'Jake Schreier', actors: 'Florence Pugh, Sebastian Stan, Julia Louis-Dreyfus', language: 'English, Russian, Italian', country: 'United States, Australia, Canada', rated: 'PG-13', boxOffice: '$190M' },
  { id: 'tt19847976', title: 'Wicked: For Good', overview: 'Elphaba, the future Wicked Witch of the West and her relationship with Glinda, the Good Witch of the North. The second of a two-part feature film adaptation of the Broadway musical.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNzRhNTE4ZTYtNTM0Mi00MzU3LTk4MTktYWE3MzQ2NTU0MDNlXkEyXkFqcGc@._V1_QL75_UX380_CR0,20,380,562_.jpg', vote_average: 6.6, year: '2025', runtime: 137, genres: [{ name: 'Drama' }, { name: 'Family' }, { name: 'Fantasy' }], director: 'Jon M. Chu', actors: 'Cynthia Erivo, Ariana Grande, Jeff Goldblum', language: 'English', country: 'United States, Canada, Australia, Japan', rated: 'PG', boxOffice: '$343M' },
  { id: 'tt26581740', title: 'Weapons', overview: 'When all but one child from the same class mysteriously vanish on the same night at exactly the same time, a community is left questioning who or what is behind their disappearance.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNTBhNWJjZWItYzY3NS00M2NkLThmOWYtYTlmNzBmN2UxZWFjXkEyXkFqcGc@._V1_QL75_UY562_CR35,0,380,562_.jpg', vote_average: 7.4, year: '2025', runtime: 128, genres: [{ name: 'Horror' }, { name: 'Mystery' }], director: 'Zach Cregger', actors: 'Julia Garner, Josh Brolin, Alden Ehrenreich', language: 'English', country: 'United States', rated: 'R', boxOffice: '$152M' },
  { id: 'tt31036941', title: 'Jurassic World: Rebirth', overview: 'Five years post-Jurassic World: Dominion (2022), an expedition braves isolated equatorial regions to extract DNA from three massive prehistoric creatures for a groundbreaking medical breakthrough.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNjg2NTcwYWQtYzk4NS00MTJhLWEzZjItMzIxNjk3YzlkYzU0XkEyXkFqcGc@._V1_QL75_UY562_CR0,0,380,562_.jpg', vote_average: 5.8, year: '2025', runtime: 133, genres: [{ name: 'Action' }, { name: 'Adventure' }, { name: 'Sci-Fi' }], director: 'Gareth Edwards', actors: 'Scarlett Johansson, Mahershala Ali, Jonathan Bailey', language: 'English, French, Spanish', country: 'United States, United Kingdom, Malta, India, Taiwan, Japan', rated: 'PG-13', boxOffice: '$340M' },
  { id: 'tt9603208', title: 'Mission: Impossible - The Final Reckoning', overview: 'Hunt and the IMF pursue a dangerous AI called the Entity that\'s infiltrated global intelligence. With governments and a figure from his past in pursuit, Hunt races to stop it from forever changing the world.', poster_path: 'https://m.media-amazon.com/images/M/MV5BZGQ5NGEyYTItMjNiMi00Y2EwLTkzOWItMjc5YjJiMjMyNTI0XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.1, year: '2025', runtime: 169, genres: [{ name: 'Action' }, { name: 'Adventure' }, { name: 'Thriller' }], director: 'Christopher McQuarrie', actors: 'Tom Cruise, Hayley Atwell, Ving Rhames', language: 'English, French, Russian, Inuktitut', country: 'United States, Norway, Canada', rated: 'PG-13', boxOffice: '$197M' },
  { id: 'tt3566834', title: 'A Minecraft Movie', overview: 'Four misfits are suddenly pulled through a mysterious portal into a bizarre cubic wonderland that thrives on imagination. To get back home they\'ll have to master this world while embarking on a quest with an unexpected expert craf...', poster_path: 'https://m.media-amazon.com/images/M/MV5BYzFjMzNjOTktNDBlNy00YWZhLWExYTctZDcxNDA4OWVhOTJjXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 5.6, year: '2025', runtime: 101, genres: [{ name: 'Action' }, { name: 'Adventure' }, { name: 'Comedy' }], director: 'Jared Hess', actors: 'Jason Momoa, Jack Black, Sebastian Hansen', language: 'English, Spanish', country: 'United States, Sweden, New Zealand, Canada, United Kingdom', rated: 'PG', boxOffice: '$424M' },
  { id: 'tt9619824', title: 'Final Destination: Bloodlines', overview: 'Plagued by a recurring violent nightmare, a college student returns home to find the one person who can break the cycle and save her family from the horrific fate that inevitably awaits them.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMzc3OWFhZWItMTE2Yy00N2NmLTg1YTktNGVlNDY0ODQ5YjNlXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 6.7, year: '2025', runtime: 110, genres: [{ name: 'Horror' }, { name: 'Thriller' }], director: 'Zach Lipovsky, Adam B. Stein', actors: 'Kaitlyn Santa Juana, Teo Briones, Rya Kihlstedt', language: 'English', country: 'United States', rated: 'R', boxOffice: '$138M' },
  { id: 'tt22898462', title: 'The Conjuring: Last Rites', overview: 'Paranormal investigators Ed and Lorraine Warren take on one last terrifying case involving mysterious entities they must confront.', poster_path: 'https://m.media-amazon.com/images/M/MV5BM2VmMzRkYzgtMzg2ZC00OTFkLTkwMTYtNTMxNjM2YzI1MjgyXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 6.2, year: '2025', runtime: 135, genres: [{ name: 'Horror' }, { name: 'Mystery' }, { name: 'Thriller' }], director: 'Michael Chaves', actors: 'Patrick Wilson, Vera Farmiga, Mia Tomlinson', language: 'English, Latin', country: 'Canada, United States', rated: 'R', boxOffice: '$178M' },
  { id: 'tt31868189', title: 'Happy Gilmore 2', overview: 'To provide for his family, a retired Happy Gilmore must pick up the golf clubs once more and reconnect with the sport he once dominated.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYTQyNTRmYjItMDBjYi00YWNhLWEwMmQtNzJhODNiNjEzOWJlXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 6.1, year: '2025', runtime: 114, genres: [{ name: 'Comedy' }, { name: 'Sport' }], director: 'Kyle Newacheck', actors: 'Adam Sandler, Julie Bowen, Christopher McDonald', language: 'English', country: 'United States', rated: 'PG-13' },
  { id: 'tt6604188', title: 'Tron: Ares', overview: 'A highly sophisticated program, Ares, is sent from the digital world into the real world on a dangerous mission.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYzNlY2RiYWEtMDA0YS00MTZkLWI5YmUtMDNiZDZlN2E4MTVlXkEyXkFqcGc@._V1_QL75_UY562_CR0,0,380,562_.jpg', vote_average: 6.1, year: '2025', runtime: 119, genres: [{ name: 'Action' }, { name: 'Adventure' }, { name: 'Sci-Fi' }], director: 'Joachim Rønning', actors: 'Jared Leto, Greta Lee, Jeff Bridges', language: 'English', country: 'United States, Canada, New Zealand, United Kingdom', rated: 'PG-13', boxOffice: '$73M' },
  { id: 'tt29644189', title: 'Black Phone 2', overview: 'As Finn, now 17, struggles with life after his captivity, his sister begins receiving calls in her dreams from the black phone and seeing disturbing visions of three boys being stalked at a winter camp known as Alpine Lake.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTVjMzNmZGYtOWU5NS00NDYzLThhZTktZGNlODIwYWVhMDRmXkEyXkFqcGc@._V1_QL75_UX380_CR0,20,380,562_.jpg', vote_average: 6, year: '2025', runtime: 114, genres: [{ name: 'Horror' }], director: 'Scott Derrickson', actors: 'Ethan Hawke, Mason Thames, Madeleine McGraw', language: 'English, Spanish', country: 'United States, Canada', rated: 'R', boxOffice: '$77M' },
  { id: 'tt27543632', title: 'The Housemaid', overview: 'Millie a struggling young woman becomes live-in maid for a wealthy couple Nina and Andrew. She enters a mansion of secrets, manipulation, and escalating psychological games that pull her into a dangerous relationship dynamic.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNjZiYjg3YzEtZTkwOS00MWYzLTgxODctNmNhMWU2MTI2YmVjXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg', vote_average: 6.7, year: '2025', runtime: 131, genres: [{ name: 'Drama' }, { name: 'Mystery' }, { name: 'Thriller' }], director: 'Paul Feig', actors: 'Sydney Sweeney, Amanda Seyfried, Brandon Sklenar', language: 'English, Italian', country: 'United States, Canada', rated: 'R', boxOffice: '$126M' },
  { id: 'tt11655566', title: 'Lilo & Stitch', overview: 'A lonely Hawaiian girl befriends a runaway alien, helping to mend her fragmented family.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYmFmZjM1ZTEtYzQ5ZS00MTRmLTkzMDktYWMxNTg2NGE3YjY4XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 6.7, year: '2025', runtime: 108, genres: [{ name: 'Action' }, { name: 'Adventure' }, { name: 'Comedy' }], director: 'Dean Fleischer Camp', actors: 'Maia Kealoha, Sydney Agudong, Chris Sanders', language: 'English, Hawaiian', country: 'United States, Australia, Canada', rated: 'PG', boxOffice: '$424M' },
  { id: 'tt5040012', title: 'Nosferatu', overview: 'A gothic tale of obsession between a haunted young woman and the terrifying vampire infatuated with her, causing untold horror in its wake.', poster_path: 'https://m.media-amazon.com/images/M/MV5BY2FhZGE3NmEtNWJjOC00NDI1LWFhMTQtMjcxNmQzZmEwNGIzXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.1, year: '2024', runtime: 132, genres: [{ name: 'Fantasy' }, { name: 'Horror' }, { name: 'Mystery' }], director: 'Robert Eggers', actors: 'Lily-Rose Depp, Nicholas Hoult, Bill Skarsgård', language: 'English, Romanian, Romany, Russian, Latin, German', country: 'United States', rated: 'R', boxOffice: '$96M' },
  { id: 'tt11563598', title: 'A Complete Unknown', overview: 'In 1961, an unknown 19-year-old Bob Dylan arrives in New York City with his guitar and forges relationships with musical icons on his meteoric rise, culminating in a groundbreaking performance that reverberates around the world.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYTA2NTA5NDYtMzlkOC00MTQxLWI0NDQtMzk2M2YzMGE4MTkxXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg', vote_average: 7.3, year: '2024', runtime: 141, genres: [{ name: 'Biography' }, { name: 'Drama' }, { name: 'Music' }], director: 'James Mangold', actors: 'Timothée Chalamet, Edward Norton, Elle Fanning', language: 'English', country: 'United States', rated: 'R', boxOffice: '$75M' },
  { id: 'tt13622970', title: 'Moana 2', overview: 'After receiving an unexpected call from her wayfinding ancestors, Moana must journey to the far seas of Oceania and into dangerous, long-lost waters for an adventure unlike anything she\'s ever faced.', poster_path: 'https://m.media-amazon.com/images/M/MV5BZDUxNThhYTUtYjgxNy00MGQ4LTgzOTEtZjg1YTU5NTcwNThlXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 6.3, year: '2024', runtime: 100, genres: [{ name: 'Animation' }, { name: 'Adventure' }, { name: 'Comedy' }], director: 'David G. Derrick Jr., Jason Hand, Dana Ledoux Miller', actors: 'Auli&apos;i Cravalho, Dwayne Johnson, Hualalai Chung', language: 'English, Samoan', country: 'United States, Canada', rated: 'PG', boxOffice: '$460M' },
  { id: 'tt18259086', title: 'Sonic the Hedgehog 3', overview: 'Sonic, Knuckles, and Tails reunite against a powerful new adversary, Shadow, a mysterious villain with powers unlike anything they have faced before. With their abilities outmatched, Team Sonic must seek out an unlikely alliance.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMjZjNjE5NDEtOWJjYS00Mjk2LWI1ZDYtOWI1ZWI3MzRjM2UzXkEyXkFqcGc@._V1_QL75_UX380_CR0,8,380,562_.jpg', vote_average: 6.9, year: '2024', runtime: 110, genres: [{ name: 'Action' }, { name: 'Adventure' }, { name: 'Comedy' }], director: 'Jeff Fowler', actors: 'Jim Carrey, Ben Schwartz, Keanu Reeves', language: 'English, Spanish, Japanese, French', country: 'United States, Japan', rated: 'PG', boxOffice: '$236M' },
  { id: 'tt22022452', title: 'Inside Out 2', overview: 'A sequel that features Riley entering puberty and experiencing brand new, more complex emotions as a result. As Riley tries to adapt to her teenage years, her old emotions try to adapt to the possibility of being replaced.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYWY3MDE2Y2UtOTE3Zi00MGUzLTg2MTItZjE1ZWVkMGVlODRmXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.5, year: '2024', runtime: 96, genres: [{ name: 'Animation' }, { name: 'Adventure' }, { name: 'Comedy' }], director: 'Kelsey Mann', actors: 'Amy Poehler, Maya Hawke, Kensington Tallman', language: 'English, French, Spanish', country: 'United States', rated: 'PG', boxOffice: '$653M' },
  { id: 'tt6263850', title: 'Deadpool & Wolverine', overview: 'Deadpool is offered a place in the Marvel Cinematic Universe by the Time Variance Authority, but instead recruits a variant of Wolverine to save his universe from extinction.', poster_path: 'https://m.media-amazon.com/images/M/MV5BZTk5ODY0MmQtMzA3Ni00NGY1LThiYzItZThiNjFiNDM4MTM3XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.5, year: '2024', runtime: 128, genres: [{ name: 'Action' }, { name: 'Adventure' }, { name: 'Comedy' }], director: 'Shawn Levy', actors: 'Ryan Reynolds, Hugh Jackman, Emma Corrin', language: 'English, French, Spanish', country: 'United States, Canada', rated: 'R', boxOffice: '$637M' },
  { id: 'tt13186482', title: 'Mufasa: The Lion King', overview: 'Mufasa, a cub lost and alone, meets a sympathetic lion named Taka, the heir to a royal bloodline. The chance meeting sets in motion an expansive journey of a group of misfits searching for their destiny.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYjBkOWUwODYtYWI3YS00N2I0LWEyYTktOTJjM2YzOTc3ZDNlXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 6.6, year: '2024', runtime: 118, genres: [{ name: 'Animation' }, { name: 'Adventure' }, { name: 'Drama' }], director: 'Barry Jenkins', actors: 'Aaron Pierre, Kelvin Harrison Jr., Tiffany Boone', language: 'English, Swahili', country: 'United States, Canada, Japan', rated: 'PG', boxOffice: '$255M' },
  { id: 'tt15239678', title: 'Dune: Part Two', overview: 'Paul Atreides unites with the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible fu...', poster_path: 'https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.4, year: '2024', runtime: 166, genres: [{ name: 'Action' }, { name: 'Adventure' }, { name: 'Drama' }], director: 'Denis Villeneuve', actors: 'Timothée Chalamet, Zendaya, Rebecca Ferguson', language: 'English, American Sign Language', country: 'United States, Canada, United Arab Emirates, Hungary, Italy, New Zealand, Jordan', rated: 'PG-13', boxOffice: '$282M' },
  { id: 'tt15398776', title: 'Oppenheimer', overview: 'A dramatization of the life story of J. Robert Oppenheimer, the physicist who had a large hand in the development of the atomic bombs that brought an end to World War II.', poster_path: 'https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZjg3YS00NmFiLWIyZmQtZTJmNTM5MjVmYTQ4XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.2, year: '2023', runtime: 180, genres: [{ name: 'Biography' }, { name: 'Drama' }, { name: 'History' }], director: 'Christopher Nolan', actors: 'Cillian Murphy, Emily Blunt, Matt Damon', language: 'English, German, Italian, Dutch', country: 'United States, United Kingdom', rated: 'R', boxOffice: '$330M' },
  { id: 'tt0816692', title: 'Interstellar', overview: 'In a dystopian future where Earth has become near-uninhabitable, a team of astronauts embark on a mission to find a new home for humanity.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.7, year: '2014', runtime: 169, genres: [{ name: 'Adventure' }, { name: 'Sci-Fi' }], director: 'Christopher Nolan', actors: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain', language: 'English', country: 'United States, United Kingdom, Canada', rated: 'PG-13', boxOffice: '$203M' },
  { id: 'tt0468569', title: 'The Dark Knight', overview: 'When a menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman, James Gordon and Harvey Dent must work together to put an end to the madness.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 9.1, year: '2008', runtime: 152, genres: [{ name: 'Crime' }, { name: 'Thriller' }], director: 'Christopher Nolan', actors: 'Christian Bale, Heath Ledger, Aaron Eckhart', language: 'English, Mandarin', country: 'United States, United Kingdom', rated: 'PG-13', boxOffice: '$535M' },
  { id: 'tt0111161', title: 'The Shawshank Redemption', overview: 'After a banker is sentenced to life in Shawshank Prison, he forms an unlikely friendship with a seasoned inmate and clings to hope amid cruelty and corruption.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMDAyY2FhYjctNDc5OS00MDNlLThiMGUtY2UxYWVkNGY2ZjljXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg', vote_average: 9.3, year: '1994', runtime: 142, genres: [{ name: 'Drama' }], director: 'Frank Darabont', actors: 'Tim Robbins, Morgan Freeman, Bob Gunton', language: 'English', country: 'United States', rated: 'R', boxOffice: '$29M' },
  { id: 'tt1375666', title: 'Inception', overview: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO, but his tragic past may doom the project and his team to disaster.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.8, year: '2010', runtime: 148, genres: [{ name: 'Adventure' }, { name: 'Sci-Fi' }, { name: 'Thriller' }], director: 'Christopher Nolan', actors: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page', language: 'English, Japanese, French', country: 'United Kingdom, United States', rated: 'PG-13', boxOffice: '$293M' },
  { id: 'tt9362722', title: 'Spider-Man: Across the Spider-Verse', overview: 'Traveling across the multiverse, Miles Morales meets a new team of Spider-People, made up of heroes from different dimensions. But when the heroes clash over how to deal with a new threat, Miles finds himself at a crossroads.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNThiZjA3MjItZGY5Ni00ZmJhLWEwN2EtOTBlYTA4Y2E0M2ZmXkEyXkFqcGc@._V1_QL75_UX380_CR0,1,380,562_.jpg', vote_average: 8.5, year: '2023', runtime: 140, genres: [{ name: 'Animation' }, { name: 'Action' }, { name: 'Adventure' }], director: 'Joaquim Dos Santos, Kemp Powers, Justin K. Thompson', actors: 'Shameik Moore, Hailee Steinfeld, Brian Tyree Henry', language: 'English', country: 'United States', rated: 'PG', boxOffice: '$382M' },
  { id: 'tt6751668', title: 'Parasite', overview: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYjk1Y2U4MjQtY2ZiNS00OWQyLWI3MmYtZWUwNmRjYWRiNWNhXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.5, year: '2019', runtime: 132, genres: [{ name: 'Drama' }, { name: 'Thriller' }], director: 'Bong Joon Ho', actors: 'Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong', language: 'Korean, English', country: 'South Korea', rated: 'R', boxOffice: '$54M' },
];

export function year(item) { return item.year || (item.release_date || item.first_air_date || '').slice(0, 4) || '—'; }
export function rating(item) { const v = item.vote_average || item.rating; return v ? (typeof v === 'number' ? v.toFixed(1) : String(v)) : '—'; }
export function title(item) { return item.title || item.name || 'Untitled'; }
export function runtime(min) {
  if (!min) return '';
  const n = typeof min === 'string' ? parseInt(min) : min;
  if (isNaN(n)) return '';
  const h = Math.floor(n / 60);
  const m = n % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

// Fetch movie poster from OMDb by IMDb ID
export async function getMoviePoster(imdbId, existingPoster) {
  if (existingPoster) return existingPoster;
  const ck = 'poster_' + imdbId;
  const hit = cache(ck);
  if (hit !== undefined) return hit;
  const d = await omdbFetch({ i: imdbId });
  const poster = d?.Poster && d.Poster !== 'N/A' ? d.Poster : null;
  save(ck, poster);
  return poster;
}
