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
} catch {}

const cache = (k) => { try { const d = JSON.parse(localStorage.getItem(PRE + k)); if (!d || Date.now() - d.t > TTL) { localStorage.removeItem(PRE + k); return null; } return d.v; } catch { return null; } };
const save = (k, v) => { try { localStorage.setItem(PRE + k, JSON.stringify({ v, t: Date.now() })); } catch {} };

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
  if (!d || d.Response === 'False') return [];
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

export async function tvmazeSearch(q) {
  if (!q?.trim()) return [];
  const ck = 'tv_s_' + q;
  const hit = cache(ck);
  if (hit) return hit;
  const d = await fetchJSON(`${TVMAZE}/search/shows?q=${encodeURIComponent(q)}`, 8000);
  if (!d) return [];
  const shows = d.map(r => _tvmazeToShow(r)).filter(Boolean);
  save(ck, shows);
  return shows;
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
  if (!q?.trim()) return { results: [] };
  const [tvResults, omdbResults] = await Promise.all([tvmazeSearch(q), omdbSearchMulti(q)]);
  const localMovies = MOVIES.filter(m => m.title.toLowerCase().includes(q.toLowerCase())).map(m => ({ ...m, media_type: 'movie' }));
  const seenIds = new Set(localMovies.map(m => m.id));
  const extraMovies = omdbResults.filter(m => !seenIds.has(m.id));
  const items = [...localMovies, ...extraMovies, ...tvResults.map(s => ({ ...s, media_type: 'tv' }))];
  return { results: items };
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
  { id: 'tt15239678', title: 'Dune: Part Two', overview: 'Paul Atreides unites with the Fremen while on a warpath of revenge against the conspirators who destroyed his family.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNTc0YmQxMjEtODI5MC00NjFiLTlkMWUtOGQ5NjFmYWUyZGJhXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.3, year: '2024', runtime: 166, genres: [{ name: 'Sci-Fi' }, { name: 'Adventure' }], director: 'Denis Villeneuve', actors: 'Timothée Chalamet, Zendaya, Austin Butler', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$282M' },
  { id: 'tt15398776', title: 'Oppenheimer', overview: 'The story of American physicist J. Robert Oppenheimer and his role in the development of the atomic bomb.', poster_path: 'https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZjg3YS00NmFiLWIyZmQtZTJmNTM5MjVmYTQ4XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.3, year: '2023', runtime: 180, genres: [{ name: 'Drama' }, { name: 'History' }], director: 'Christopher Nolan', actors: 'Cillian Murphy, Emily Blunt, Matt Damon', language: 'English', country: 'USA', rated: 'R', boxOffice: '$325M' },
  { id: 'tt1185834', title: 'Guardians of the Galaxy Vol. 3', overview: 'The Guardians must protect one of their own from a mysterious new opponent.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYjExN2YwZmYtODlkNy00MTMzLWIwOTMtNDZlYWEzNjMxODBmXkEyXkFqcGc@._V1_SX300.jpg', vote_average: 7.9, year: '2023', runtime: 150, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'James Gunn', actors: 'Chris Pratt, Zoe Saldaña, Dave Bautista', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$358M' },
  { id: 'tt14230458', title: 'Poor Things', overview: 'Bella Baxter is brought back to life by an unorthodox scientist, eager to learn about the world.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYWU2MjRjZTYtMjVkMS00MTBjLWFiMTAtYmZlYTk1YjkyMWFkXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.9, year: '2023', runtime: 141, genres: [{ name: 'Sci-Fi' }, { name: 'Comedy' }], director: 'Yorgos Lanthimos', actors: 'Emma Stone, Mark Ruffalo, Willem Dafoe', language: 'English', country: 'UK/Ireland', rated: 'R', boxOffice: '$64M' },
  { id: 'tt17526714', title: 'The Brutalist', overview: 'A visionary architect and his wife flee post-war Europe for a new life in America.', poster_path: 'https://m.media-amazon.com/images/M/MV5BN2JkMDc5MGQtZjg3YS00NmFiLWIyZmQtZTJmNTM5MjVmYTQ4XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.5, year: '2024', runtime: 215, genres: [{ name: 'Drama' }], director: 'Brady Corbet', actors: 'Adrien Brody, Felicity Jones, Guy Pearce', language: 'English', country: 'USA', rated: 'R', boxOffice: '$12M' },
  { id: 'tt9362722', title: 'Spider-Man: Across the Spider-Verse', overview: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNThiZjA3MjItZGY5Ni00ZmJhLWEwN2EtOTBlYTA4Y2E0M2ZmXkEyXkFqcGc@._V1_SX300.jpg', vote_average: 8.4, year: '2023', runtime: 140, genres: [{ name: 'Animation' }, { name: 'Action' }], director: 'Joaquim Dos Santos', actors: 'Shameik Moore, Hailee Steinfeld, Oscar Isaac', language: 'English', country: 'USA', rated: 'PG', boxOffice: '$381M' },
  { id: 'tt14539740', title: 'Godzilla x Kong: The New Empire', overview: 'Two ancient titans, Godzilla and Kong, team up against a colossal undiscovered threat.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTY0N2MzODctY2ExYy00OWYxLTkyNDItMTVhZGIxZjliZjU5XkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg', vote_average: 7.0, year: '2024', runtime: 115, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Adam Wingard', actors: 'Rebecca Hall, Brian Tyree Henry, Dan Stevens', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$196M' },
  { id: 'tt22022452', title: 'Inside Out 2', overview: 'Riley enters puberty and experiences brand new, more complex emotions.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYWY3MDE2Y2UtOTE3Zi00MGUzLTg2MTItZjE1ZWVkMGVlODRmXkEyXkFqcGc@._V1_SX300.jpg', vote_average: 7.6, year: '2024', runtime: 100, genres: [{ name: 'Animation' }, { name: 'Comedy' }], director: 'Kelsey Mann', actors: 'Amy Poehler, Maya Hawke, Ayo Edebiri', language: 'English', country: 'USA', rated: 'PG', boxOffice: '$653M' },
  { id: 'tt0111161', title: 'The Shawshank Redemption', overview: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMDAyY2FhYjctNDc5OS00MDNlLThiMGUtY2UxYWVkNGY2ZjljXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg', vote_average: 8.7, year: '1994', runtime: 142, genres: [{ name: 'Drama' }], director: 'Frank Darabont', actors: 'Tim Robbins, Morgan Freeman', language: 'English', country: 'USA', rated: 'R' },
  { id: 'tt0068646', title: 'The Godfather', overview: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNGEwYjgwOGQtYjg5ZS00Njc1LTk2ZGEtM2QwZWQ2NjdhZTE5XkEyXkFqcGc@._V1_QL75_UY562_CR8,0,380,562_.jpg', vote_average: 8.7, year: '1972', runtime: 175, genres: [{ name: 'Drama' }, { name: 'Crime' }], director: 'Francis Ford Coppola', actors: 'Marlon Brando, Al Pacino, James Caan', language: 'English', country: 'USA', rated: 'R' },
  { id: 'tt0468569', title: 'The Dark Knight', overview: 'Batman faces the Joker, a criminal mastermind who wants to plunge Gotham City into anarchy.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.5, year: '2008', runtime: 152, genres: [{ name: 'Action' }, { name: 'Crime' }], director: 'Christopher Nolan', actors: 'Christian Bale, Heath Ledger, Aaron Eckhart', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$534M' },
  { id: 'tt1375666', title: 'Inception', overview: 'A thief who steals corporate secrets through dream-sharing technology is given the task of planting an idea.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.4, year: '2010', runtime: 148, genres: [{ name: 'Sci-Fi' }, { name: 'Action' }], director: 'Christopher Nolan', actors: 'Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$293M' },
  { id: 'tt0816692', title: 'Interstellar', overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYzdjMDAxZGItMjI2My00ODA1LTlkNzItOWFjMDU5ZDJlYWY3XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.4, year: '2014', runtime: 169, genres: [{ name: 'Sci-Fi' }, { name: 'Drama' }], director: 'Christopher Nolan', actors: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain', language: 'English', country: 'USA/UK', rated: 'PG-13', boxOffice: '$188M' },
  { id: 'tt0167260', title: 'The Lord of the Rings: The Return of the King', overview: 'Gandalf and Aragorn lead the World of Men against Sauron\'s army to draw his gaze from Frodo and Sam.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTZkMjBjNWMtZGI5OC00MGU0LTk4ZTItODg2NWM3NTVmNWQ4XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.5, year: '2003', runtime: 201, genres: [{ name: 'Fantasy' }, { name: 'Adventure' }], director: 'Peter Jackson', actors: 'Elijah Wood, Viggo Mortensen, Ian McKellen', language: 'English', country: 'New Zealand', rated: 'PG-13', boxOffice: '$377M' },
  { id: 'tt0120737', title: 'The Lord of the Rings: The Fellowship of the Ring', overview: 'A young hobbit sets out on a journey to destroy the One Ring and save Middle-earth.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNzIxMDQ2YTctNDY4MC00ZTRhLTk4ODQtMTVlOWY4NTdiYmMwXkEyXkFqcGc@._V1_QL75_UX380_CR0,1,380,562_.jpg', vote_average: 8.4, year: '2001', runtime: 178, genres: [{ name: 'Fantasy' }, { name: 'Adventure' }], director: 'Peter Jackson', actors: 'Elijah Wood, Ian McKellen, Orlando Bloom', language: 'English', country: 'New Zealand', rated: 'PG-13' },
  { id: 'tt1675434', title: 'The Intouchables', overview: 'A wealthy quadriplegic hires a young man from the projects to be his caregiver.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTYxNDA3MDQwNl5BMl5BanBnXkFtZTcwNTU4Mzc1Nw@@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.5, year: '2011', runtime: 112, genres: [{ name: 'Drama' }, { name: 'Comedy' }], director: 'Olivier Nakache', actors: 'François Cluzet, Omar Sy', language: 'French', country: 'France', rated: 'R' },
  { id: 'tt0137523', title: 'Fight Club', overview: 'An insomniac office worker and a devil-may-care soap maker form an underground fight club.', poster_path: 'https://m.media-amazon.com/images/M/MV5BOTgyOGQ1NDItNGU3Ny00MjU3LTg2YWEtNmEyYjBiMjI1Y2M5XkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg', vote_average: 8.4, year: '1999', runtime: 139, genres: [{ name: 'Drama' }, { name: 'Thriller' }], director: 'David Fincher', actors: 'Brad Pitt, Edward Norton, Helena Bonham Carter', language: 'English', country: 'USA/Germany', rated: 'R' },
  { id: 'tt0109830', title: 'Forrest Gump', overview: 'The presidencies of Kennedy and Johnson, the Vietnam War, and other historical events from the perspective of an Alabama man.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNDYwNzVjMTItZmU5YS00YjQ5LTljYjgtMjY2NDVmYWMyNWFmXkEyXkFqcGc@._V1_QL75_UY562_CR4,0,380,562_.jpg', vote_average: 8.5, year: '1994', runtime: 142, genres: [{ name: 'Drama' }, { name: 'Romance' }], director: 'Robert Zemeckis', actors: 'Tom Hanks, Robin Wright, Gary Sinise', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$677M' },
  { id: 'tt0110912', title: 'Pulp Fiction', overview: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYTViYTE3ZGQtNDBlMC00ZTAyLTkyODMtZGRiZDg0MjA2YThkXkEyXkFqcGc@._V1_QL75_UY562_CR3,0,380,562_.jpg', vote_average: 8.5, year: '1994', runtime: 154, genres: [{ name: 'Crime' }, { name: 'Drama' }], director: 'Quentin Tarantino', actors: 'John Travolta, Uma Thurman, Samuel L. Jackson', language: 'English', country: 'USA', rated: 'R' },
  { id: 'tt0167261', title: 'The Lord of the Rings: The Two Towers', overview: 'The Fellowship splinters as Frodo and Sam continue the quest to destroy the One Ring.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMGQxMDdiOWUtYjc1Ni00YzM1LWE2NjMtZTg3Y2JkMjEzMTJjXkEyXkFqcGc@._V1_QL75_UX380_CR0,14,380,562_.jpg', vote_average: 8.4, year: '2002', runtime: 179, genres: [{ name: 'Fantasy' }, { name: 'Adventure' }], director: 'Peter Jackson', actors: 'Elijah Wood, Viggo Mortensen, Ian McKellen', language: 'English', country: 'New Zealand', rated: 'PG-13' },
  { id: 'tt1201607', title: 'Harry Potter and the Deathly Hallows: Part 2', overview: 'Harry, Ron, and Hermione search for Voldemort\'s remaining Horcruxes in their final battle.', poster_path: 'https://m.media-amazon.com/images/M/MV5BOTA1Mzc2N2ItZWRiNS00MjQzLTlmZDQtMjU0NmY1YWRkMGQ4XkEyXkFqcGc@._V1_SX300.jpg', vote_average: 8.1, year: '2011', runtime: 130, genres: [{ name: 'Fantasy' }, { name: 'Adventure' }], director: 'David Yates', actors: 'Daniel Radcliffe, Emma Watson, Rupert Grint', language: 'English', country: 'UK/USA', rated: 'PG-13', boxOffice: '$1.34B' },
  { id: 'tt0114709', title: 'Toy Story', overview: 'A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him as top toy.', poster_path: 'https://m.media-amazon.com/images/M/MV5BZTA3OWVjOWItNjE1NS00NzZiLWE1MjgtZDZhMWI1ZTlkNzYwXkEyXkFqcGc@._V1_SX300.jpg', vote_average: 8.1, year: '1995', runtime: 81, genres: [{ name: 'Animation' }, { name: 'Comedy' }], director: 'John Lasseter', actors: 'Tom Hanks, Tim Allen', language: 'English', country: 'USA', rated: 'G', boxOffice: '$373M' },
  { id: 'tt0102926', title: 'The Silence of the Lambs', overview: 'A young FBI cadet must receive the help of an incarcerated and manipulative cannibal killer.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNDdhOGJhYzctYzYwZC00YmI2LWI0MjctYjg4ODdlMDExYjBlXkEyXkFqcGc@._V1_QL75_UY562_CR1,0,380,562_.jpg', vote_average: 8.3, year: '1991', runtime: 118, genres: [{ name: 'Crime' }, { name: 'Thriller' }], director: 'Jonathan Demme', actors: 'Jodie Foster, Anthony Hopkins', language: 'English', country: 'USA', rated: 'R' },
  { id: 'tt0120815', title: 'Saving Private Ryan', overview: 'Following the Normandy Landings, a group of U.S. soldiers go behind enemy lines to retrieve a paratrooper.', poster_path: 'https://m.media-amazon.com/images/M/MV5BZGZhZGQ1ZWUtZTZjYS00MDJhLWFkYjctN2ZlYjE5NWYwZDM2XkEyXkFqcGc@._V1_QL75_UY562_CR1,0,380,562_.jpg', vote_average: 8.2, year: '1998', runtime: 169, genres: [{ name: 'Drama' }, { name: 'War' }], director: 'Steven Spielberg', actors: 'Tom Hanks, Matt Damon, Tom Sizemore', language: 'English', country: 'USA', rated: 'R', boxOffice: '$482M' },
  { id: 'tt1285016', title: 'The Social Network', overview: 'As Harvard student Mark Zuckerberg creates the social networking site that would become known as Facebook.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMjlkNTE5ZTUtNGEwNy00MGVhLThmZjMtZjU1NDE5Zjk1NDZkXkEyXkFqcGc@._V1_SX300.jpg', vote_average: 7.4, year: '2010', runtime: 120, genres: [{ name: 'Drama' }, { name: 'Biography' }], director: 'David Fincher', actors: 'Jesse Eisenberg, Andrew Garfield, Justin Timberlake', language: 'English', country: 'USA', rated: 'PG-13' },
  { id: 'tt1049413', title: 'Up', overview: 'An unlikely elderly hero sets out to fulfill his lifelong dream of adventure by lifting his house with balloons.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNmI1ZTc5MWMtMDYyOS00ZDc2LTkzOTAtNjQ4NWIxNjYyNDgzXkEyXkFqcGc@._V1_SX300.jpg', vote_average: 8.0, year: '2009', runtime: 96, genres: [{ name: 'Animation' }, { name: 'Comedy' }], director: 'Pete Docter', actors: 'Edward Asner, Jordan Nagai, John Ratzenberger', language: 'English', country: 'USA', rated: 'PG', boxOffice: '$293M' },
  { id: 'tt0245429', title: 'Spirited Away', overview: 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods and witches.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNTEyNmEwOWUtYzkyOC00ZTQ4LTllZmUtMjk0Y2YwOGUzYjRiXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.6, year: '2001', runtime: 125, genres: [{ name: 'Animation' }, { name: 'Fantasy' }], director: 'Hayao Miyazaki', actors: 'Rumi Hiiragi, Miyu Irino', language: 'Japanese', country: 'Japan', rated: 'PG' },
  { id: 'tt0114814', title: 'The Usual Suspects', overview: 'A sole survivor tells of the twisty events leading up to a horrific gun battle on a boat.', poster_path: 'https://m.media-amazon.com/images/M/MV5BOTE5MDUxZDUtZWZmZC00NDVmLWFhOGQtNWI2YTc4NzY3MGQ0XkEyXkFqcGc@._V1_QL75_UX380_CR0,2,380,562_.jpg', vote_average: 8.2, year: '1995', runtime: 106, genres: [{ name: 'Crime' }, { name: 'Mystery' }], director: 'Bryan Singer', actors: 'Kevin Spacey, Gabriel Byrne, Chazz Palminteri', language: 'English', country: 'USA', rated: 'R' },
  { id: 'tt0266697', title: 'Parasite', overview: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.', poster_path: 'https://m.media-amazon.com/images/M/MV5BZmMyYzJlZmYtY2I3NC00NjAyLTkyZWItZjdjZDI1YTYyYTEwXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg', vote_average: 8.5, year: '2019', runtime: 132, genres: [{ name: 'Thriller' }, { name: 'Drama' }], director: 'Bong Joon-ho', actors: 'Song Kang-ho, Lee Sun-kyun, Cho Yeo-jeong', language: 'Korean', country: 'South Korea', rated: 'R', boxOffice: '$53M' },
  { id: 'tt0120689', title: 'The Green Mile', overview: 'A prison guard encounters a mysterious inmate.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTUxMzQyNjA5MF5BMl5BanBnXkFtZTYwOTU2NTY3._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.5, year: '1999', runtime: 189, genres: [{ name: 'Drama' }, { name: 'Fantasy' }], director: 'Frank Darabont', actors: 'Tom Hanks, Michael Clarke Duncan', language: 'English', country: 'USA', rated: 'R' },
  { id: 'tt0118799', title: 'Life Is Beautiful', overview: 'A father uses humor to protect his son in a concentration camp.', poster_path: 'https://m.media-amazon.com/images/M/MV5BZTBhOGYzZjQtYzE0Mi00MGIwLWE0MWYtNzMxNTM2OTFkM2NjXkEyXkFqcGc@._V1_QL75_UX380_CR0,2,380,562_.jpg', vote_average: 8.6, year: '1997', runtime: 116, genres: [{ name: 'Drama' }, { name: 'Comedy' }], director: 'Roberto Benigni', actors: 'Roberto Benigni, Nicoletta Braschi', language: 'Italian', country: 'Italy', rated: 'PG-13' },
  { id: 'tt0169547', title: 'One Flew Over the Cuckoo\'s Nest', overview: 'A man feigns insanity to avoid prison labor.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMDI1MDE0OTMtMmI2MS00Yjc2LTg2MTItMWExYTg5NzA1OGUzXkEyXkFqcGc@._V1_SX300.jpg', vote_average: 8.7, year: '1975', runtime: 133, genres: [{ name: 'Drama' }, { name: 'Comedy' }], director: 'Milos Forman', actors: 'Jack Nicholson, Louise Fletcher', language: 'English', country: 'USA', rated: 'R' },
  { id: 'tt0071562', title: 'The Godfather Part II', overview: 'The early life and career of Vito Corleone.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMDIxMzBlZDktZjMxNy00ZGI4LTgxNDEtYWRlNzRjMjJmOGQ1XkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg', vote_average: 9.0, year: '1974', runtime: 202, genres: [{ name: 'Drama' }, { name: 'Crime' }], director: 'Francis Ford Coppola', actors: 'Al Pacino, Robert De Niro', language: 'English', country: 'USA', rated: 'R' },
  { id: 'tt0050087', title: '12 Angry Men', overview: 'A jury deliberates the fate of a young man.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNTVkMTUyNjYtMjNjMC00MzYyLTk5YjYtMTA1MTUxMTg5ZDQ1XkEyXkFqcGc@._V1_SX300.jpg', vote_average: 9.0, year: '1957', runtime: 96, genres: [{ name: 'Drama' }, { name: 'Crime' }], director: 'Sidney Lumet', actors: 'Henry Fonda, Lee J. Cobb', language: 'English', country: 'USA', rated: 'NR' },
  { id: 'tt0034583', title: 'Casablanca', overview: 'A love story set during World War II.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNWEzN2U1YTYtYTQyMS00NTVkLWE2NGQtZWFlMmM0MDNjMmRiXkEyXkFqcGc@._V1_QL75_UX380_CR0,5,380,562_.jpg', vote_average: 8.5, year: '1942', runtime: 102, genres: [{ name: 'Drama' }, { name: 'Romance' }], director: 'Michael Curtiz', actors: 'Humphrey Bogart, Ingrid Bergman', language: 'English', country: 'USA', rated: 'PG' },
  { id: 'tt0062622', title: '2001: A Space Odyssey', overview: 'A journey to Jupiter with the sentient computer HAL 9000.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNjU0NDFkMTQtZWY5OS00MmZhLTg3Y2QtZmJhMzMzMWYyYjc2XkEyXkFqcGc@._V1_SX300.jpg', vote_average: 8.3, year: '1968', runtime: 149, genres: [{ name: 'Sci-Fi' }, { name: 'Adventure' }], director: 'Stanley Kubrick', actors: 'Keir Dullea, Gary Lockwood', language: 'English', country: 'USA/UK', rated: 'G' },
  { id: 'tt0078748', title: 'Alien', overview: 'The crew of a commercial spacecraft encounters a deadly alien.', poster_path: 'https://m.media-amazon.com/images/M/MV5BN2NhMDk2MmEtZDQzOC00MmY5LThhYzAtMDdjZGFjOGZjMjdjXkEyXkFqcGc@._V1_QL75_UX380_CR0,6,380,562_.jpg', vote_average: 8.5, year: '1979', runtime: 117, genres: [{ name: 'Sci-Fi' }, { name: 'Horror' }], director: 'Ridley Scott', actors: 'Sigourney Weaver, Tom Skerritt', language: 'English', country: 'USA/UK', rated: 'R' },
  { id: 'tt0080684', title: 'Star Wars: The Empire Strikes Back', overview: 'The rebels face attack from the Empire on ice planet Hoth.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTkxNGFlNDktZmJkNC00MDdhLTg0MTEtZjZiYWI3MGE5NWIwXkEyXkFqcGc@._V1_SX300.jpg', vote_average: 8.7, year: '1980', runtime: 124, genres: [{ name: 'Sci-Fi' }, { name: 'Adventure' }], director: 'Irvin Kershner', actors: 'Mark Hamill, Harrison Ford', language: 'English', country: 'USA', rated: 'PG', boxOffice: '$538M' },
  { id: 'tt0076759', title: 'Star Wars: A New Hope', overview: 'Luke Skywalker joins the fight against the Empire.', poster_path: 'https://m.media-amazon.com/images/M/MV5BOGUwMDk0Y2MtNjBlNi00NmRiLTk2MWYtMGMyMDlhYmI4ZDBjXkEyXkFqcGc@._V1_SX300.jpg', vote_average: 8.6, year: '1977', runtime: 121, genres: [{ name: 'Sci-Fi' }, { name: 'Adventure' }], director: 'George Lucas', actors: 'Mark Hamill, Harrison Ford', language: 'English', country: 'USA', rated: 'PG', boxOffice: '$775M' },
  { id: 'tt0121765', title: 'Star Wars: Revenge of the Sith', overview: 'Anakin Skywalker turns to the dark side.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNTgxMjY2YzUtZmVmNC00YjAwLWJlODMtNDBhNzllNzIzMjgxXkEyXkFqcGc@._V1_SX300.jpg', vote_average: 7.6, year: '2005', runtime: 140, genres: [{ name: 'Sci-Fi' }, { name: 'Action' }], director: 'George Lucas', actors: 'Ewan McGregor, Natalie Portman', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$380M' },
  { id: 'tt0107290', title: 'Jurassic Park', overview: 'A theme park showcases genetically engineered dinosaurs.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMjM2MDgxMDg0Nl5BMl5BanBnXkFtZTgwNTM2OTM5NDE@._V1_SX300.jpg', vote_average: 8.2, year: '1993', runtime: 127, genres: [{ name: 'Sci-Fi' }, { name: 'Adventure' }], director: 'Steven Spielberg', actors: 'Sam Neill, Laura Dern', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$357M' },
  { id: 'tt0108052', title: 'Schindler\'s List', overview: 'In German-occupied Poland during World War II, Oskar Schindler gradually becomes concerned for his Jewish workforce.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNjM1ZDQxYWUtMzQyZS00MTE1LWJmZGYtNGUyNTdlYjM3ZmVmXkEyXkFqcGc@._V1_QL75_UX380_CR0,4,380,562_.jpg', vote_average: 9.0, year: '1993', runtime: 195, genres: [{ name: 'Drama' }, { name: 'History' }], director: 'Steven Spielberg', actors: 'Liam Neeson, Ralph Fiennes', language: 'English', country: 'USA', rated: 'R', boxOffice: '$321M' },
  { id: 'tt0114369', title: 'Se7en', overview: 'Two detectives hunt a serial killer who uses the seven deadly sins.', poster_path: 'https://m.media-amazon.com/images/M/MV5BY2IzNzMxZjctZjUxZi00YzAxLTk3ZjMtODFjODdhMDU5NDM1XkEyXkFqcGc@._V1_QL75_UX380_CR0,16,380,562_.jpg', vote_average: 8.6, year: '1995', runtime: 127, genres: [{ name: 'Crime' }, { name: 'Thriller' }], director: 'David Fincher', actors: 'Brad Pitt, Morgan Freeman', language: 'English', country: 'USA', rated: 'R' },
  { id: 'tt0361748', title: 'Inglourious Basterds', overview: 'A group of Jewish soldiers plan to assassinate Nazi leaders.', poster_path: 'https://m.media-amazon.com/images/M/MV5BODZhMWJlNjYtNDExNC00MTIzLTllM2ItOGQ2NGVjNDQ3MzkzXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.3, year: '2009', runtime: 153, genres: [{ name: 'Drama' }, { name: 'War' }], director: 'Quentin Tarantino', actors: 'Brad Pitt, Mélanie Laurent', language: 'English', country: 'USA/Germany', rated: 'R', boxOffice: '$321M' },
  { id: 'tt1853728', title: 'Django Unchained', overview: 'A freed slave teams up with a bounty hunter.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMjIyNTQ5NjQ1OV5BMl5BanBnXkFtZTcwODg1MDU4OA@@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.4, year: '2012', runtime: 165, genres: [{ name: 'Drama' }, { name: 'Western' }], director: 'Quentin Tarantino', actors: 'Jamie Foxx, Christoph Waltz', language: 'English', country: 'USA', rated: 'R', boxOffice: '$425M' },
  { id: 'tt0993845', title: 'The Wolf of Wall Street', overview: 'The true story of Jordan Belfort.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTk4ODQzNDY3Ml5BMl5BanBnXkFtZTcwODA0NTM4Nw@@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.2, year: '2013', runtime: 180, genres: [{ name: 'Drama' }, { name: 'Biography' }], director: 'Martin Scorsese', actors: 'Leonardo DiCaprio, Jonah Hill', language: 'English', country: 'USA', rated: 'R', boxOffice: '$392M' },
  { id: 'tt1345836', title: 'The Dark Knight Rises', overview: 'Batman faces the masked villain Bane.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTk4ODQzNDY3Ml5BMl5BanBnXkFtZTcwODA0NTM4Nw@@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.4, year: '2012', runtime: 164, genres: [{ name: 'Action' }, { name: 'Drama' }], director: 'Christopher Nolan', actors: 'Christian Bale, Tom Hardy', language: 'English', country: 'USA/UK', rated: 'PG-13', boxOffice: '$1.08B' },
  { id: 'tt0482571', title: 'The Pianist', overview: 'A Polish musician struggles to survive the Holocaust.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTM3MzQ5MjQ5OF5BMl5BanBnXkFtZTcwMTQ3NzMzMw@@._V1_QL75_UY562_CR0,0,380,562_.jpg', vote_average: 8.5, year: '2002', runtime: 150, genres: [{ name: 'Drama' }, { name: 'Biography' }], director: 'Roman Polanski', actors: 'Adrien Brody, Thomas Kretschmann', language: 'English', country: 'France/Germany/UK/Poland', rated: 'R' },
  { id: 'tt0110413', title: 'Léon: The Professional', overview: 'A hitman takes in a young girl after her family is killed.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNGRkYTNhOWQtYmI0Ni00MjZhLWJmMzAtMTA2Mjg4NGNiNDU0XkEyXkFqcGc@._V1_QL75_UX380_CR0,2,380,562_.jpg', vote_average: 8.5, year: '1994', runtime: 110, genres: [{ name: 'Drama' }, { name: 'Action' }], director: 'Luc Besson', actors: 'Jean Reno, Natalie Portman', language: 'English', country: 'France', rated: 'R' },
  { id: 'tt0099685', title: 'Goodfellas', overview: 'The story of Henry Hill and the mob.', poster_path: 'https://m.media-amazon.com/images/M/MV5BN2E5NzI2ZGMtY2VjNi00YTRjLWI1MDUtZGY5OWU1MWJjZjRjXkEyXkFqcGc@._V1_QL75_UX380_CR0,3,380,562_.jpg', vote_average: 8.7, year: '1990', runtime: 145, genres: [{ name: 'Drama' }, { name: 'Crime' }], director: 'Martin Scorsese', actors: 'Robert De Niro, Ray Liotta', language: 'English', country: 'USA', rated: 'R' },
  { id: 'tt0407887', title: 'The Departed', overview: 'An undercover cop and a mole try to identify each other.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTI1MTY2OTIxNV5BMl5BanBnXkFtZTYwNjQ4NjY3._V1_QL75_UY562_CR0,0,380,562_.jpg', vote_average: 8.5, year: '2006', runtime: 151, genres: [{ name: 'Drama' }, { name: 'Crime' }], director: 'Martin Scorsese', actors: 'Leonardo DiCaprio, Matt Damon', language: 'English', country: 'USA', rated: 'R', boxOffice: '$132M' },
  { id: 'tt0119217', title: 'Good Will Hunting', overview: 'A janitor at MIT has a gift for mathematics.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNDdjZGQ5YzEtNTc2My00Mjc0LWFlMTctYzkwMzZlNzdiZWYzXkEyXkFqcGc@._V1_QL75_UX380_CR0,9,380,562_.jpg', vote_average: 8.3, year: '1997', runtime: 126, genres: [{ name: 'Drama' }, { name: 'Romance' }], director: 'Gus Van Sant', actors: 'Matt Damon, Robin Williams', language: 'English', country: 'USA', rated: 'R' },
  { id: 'tt0082971', title: 'Indiana Jones: Raiders of the Lost Ark', overview: 'Indiana Jones races against Nazis to find the Ark.', poster_path: 'https://m.media-amazon.com/images/M/MV5BOGNhMjg2ZjgtYzk4Ni00MTViLTg1MmUtYzM2MDZiYjZlMmU3XkEyXkFqcGc@._V1_SX300.jpg', vote_average: 8.4, year: '1981', runtime: 115, genres: [{ name: 'Action' }, { name: 'Adventure' }], director: 'Steven Spielberg', actors: 'Harrison Ford, Karen Allen', language: 'English', country: 'USA', rated: 'PG', boxOffice: '$389M' },
  { id: 'tt0120812', title: 'Gladiator', overview: 'A former Roman General seeks vengeance against the emperor.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMGZiMzViNmEtNTNlZi00MzFmLTk5NTEtNDE2OTUzNmNlMTY4XkEyXkFqcGc@._V1_SX300.jpg', vote_average: 8.5, year: '2000', runtime: 155, genres: [{ name: 'Drama' }, { name: 'Action' }], director: 'Ridley Scott', actors: 'Russell Crowe, Joaquin Phoenix', language: 'English', country: 'USA/UK', rated: 'R', boxOffice: '$460M' },
  { id: 'tt0317248', title: 'City of God', overview: 'Two boys grow up in a violent Rio de Janeiro favela.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYjY4NGI5OTUtY2ZlZS00Zjk4LTk5N2MtN2JmYWVjNGNmMGRlXkEyXkFqcGc@._V1_QL75_UY562_CR1,0,380,562_.jpg', vote_average: 8.6, year: '2002', runtime: 130, genres: [{ name: 'Drama' }, { name: 'Crime' }], director: 'Fernando Meirelles', actors: 'Alexandre Rodrigues, Leandro Firmino', language: 'Portuguese', country: 'Brazil', rated: 'R' },
  { id: 'tt0110357', title: 'The Lion King', overview: 'A young lion prince flees his kingdom.', poster_path: 'https://m.media-amazon.com/images/M/MV5BZGRiZDZhZjItM2M3ZC00Y2IyLTk3Y2MtMWY5YjliNDFkZTJlXkEyXkFqcGc@._V1_SX300.jpg', vote_average: 8.5, year: '1994', runtime: 88, genres: [{ name: 'Animation' }, { name: 'Drama' }], director: 'Roger Allers, Rob Minkoff', actors: 'Matthew Broderick, James Earl Jones', language: 'English', country: 'USA', rated: 'G', boxOffice: '$968M' },
  { id: 'tt2294629', title: 'Frozen', overview: 'A princess sets out on a journey to find her sister.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTQ1MjQwMTE5OF5BMl5BanBnXkFtZTgwNjk3MTcyMDE@._V1_SX300.jpg', vote_average: 7.4, year: '2013', runtime: 102, genres: [{ name: 'Animation' }, { name: 'Comedy' }], director: 'Chris Buck, Jennifer Lee', actors: 'Kristen Bell, Idina Menzel', language: 'English', country: 'USA', rated: 'PG', boxOffice: '$1.28B' },
  { id: 'tt0382932', title: 'Ratatouille', overview: 'A rat dreams of becoming a French chef.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTMzODU0NTkxMF5BMl5BanBnXkFtZTcwMjQ4MzMzMw@@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.1, year: '2007', runtime: 111, genres: [{ name: 'Animation' }, { name: 'Comedy' }], director: 'Brad Bird', actors: 'Patton Oswalt, Ian Holm', language: 'English', country: 'USA', rated: 'G', boxOffice: '$623M' },
  { id: 'tt0435761', title: 'Toy Story 3', overview: 'The toys are donated to a daycare center.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTgxOTY4Mjc0MF5BMl5BanBnXkFtZTcwNTA4MDQyMw@@._V1_SX300.jpg', vote_average: 8.3, year: '2010', runtime: 103, genres: [{ name: 'Animation' }, { name: 'Comedy' }], director: 'Lee Unkrich', actors: 'Tom Hanks, Tim Allen', language: 'English', country: 'USA', rated: 'G', boxOffice: '$1.06B' },
  { id: 'tt0266543', title: 'Finding Nemo', overview: 'A clownfish searches for his missing son.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTc5NjExNTA5OV5BMl5BanBnXkFtZTYwMTQ0ODY2._V1_SX300.jpg', vote_average: 8.2, year: '2003', runtime: 100, genres: [{ name: 'Animation' }, { name: 'Comedy' }], director: 'Andrew Stanton', actors: 'Albert Brooks, Ellen DeGeneres', language: 'English', country: 'USA/Australia', rated: 'G', boxOffice: '$940M' },
  { id: 'tt1517268', title: 'Barbie', overview: 'Barbie and Ken leave Barbieland.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYjI3NDU0ZGYtYjA2YS00Y2RlLTgwZDAtYTE2YTM5ZjE1M2JlXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.0, year: '2023', runtime: 114, genres: [{ name: 'Comedy' }, { name: 'Adventure' }], director: 'Greta Gerwig', actors: 'Margot Robbie, Ryan Gosling', language: 'English', country: 'USA/UK', rated: 'PG-13', boxOffice: '$1.44B' },
  { id: 'tt0848228', title: 'The Avengers', overview: "Earth's mightiest heroes must come together to stop an alien invasion.", poster_path: 'https://m.media-amazon.com/images/M/MV5BNGE0YTVjNzUtNzJjOS00NGNlLTgxMzctZTY4YTE1Y2Y1ZTU4XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.0, year: '2012', runtime: 143, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Joss Whedon', actors: 'Robert Downey Jr., Chris Evans, Scarlett Johansson', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$1.52B' },
  { id: 'tt2395427', title: 'Avengers: Age of Ultron', overview: "The Avengers must reassemble to fight Ultron, a sentient robot intent on human extinction.", poster_path: 'https://m.media-amazon.com/images/M/MV5BODBhYTg1NGQtNGVmNS00ZTdiLThjYTYtZDFkNzRiNTZmNDZjXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.3, year: '2015', runtime: 141, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Joss Whedon', actors: 'Robert Downey Jr., Chris Evans, Scarlett Johansson', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$1.40B' },
  { id: 'tt4154796', title: 'Avengers: Infinity War', overview: 'The Avengers and their allies must be willing to sacrifice everything to defeat Thanos.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMWEyNDM2ZmQtMmFkNi00MTQ1LTk1MjItMzdlZGJlYmIyYzZlXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 8.3, year: '2018', runtime: 149, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Anthony Russo, Joe Russo', actors: 'Robert Downey Jr., Chris Hemsworth, Scarlett Johansson', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$2.05B' },
  { id: 'tt4154664', title: 'Avengers: Endgame', overview: 'After the devastating events of Infinity War, the Avengers assemble once more to reverse Thanos actions.', poster_path: 'https://m.media-amazon.com/images/M/MV5BN2E5NzI2ZGMtY2VjNi00YTRjLWI1MDUtZGY5OWU1MWJjZjRjXkEyXkFqcGc@._V1_QL75_UX380_CR0,3,380,562_.jpg', vote_average: 8.2, year: '2019', runtime: 181, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Anthony Russo, Joe Russo', actors: 'Robert Downey Jr., Chris Evans, Mark Ruffalo', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$2.80B' },
  { id: 'tt0371746', title: 'Iron Man', overview: 'A wealthy industrialist builds a high-tech suit of armor and becomes the superhero Iron Man.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTczNTI2ODUwOF5BMl5BanBnXkFtZTcwMTU0NTIzMw@@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.6, year: '2008', runtime: 126, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Jon Favreau', actors: 'Robert Downey Jr., Gwyneth Paltrow, Jeff Bridges', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$585M' },
  { id: 'tt1228705', title: 'Iron Man 2', overview: 'Tony Stark faces a new enemy and must suit up once again as Iron Man.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYWYyOGQzOGYtMGQ1My00ZWYxLTgzZjktZWYzN2IwYjkxYzM0XkEyXkFqcGc@._V1_QL75_UY562_CR1,0,380,562_.jpg', vote_average: 7.0, year: '2010', runtime: 124, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Jon Favreau', actors: 'Robert Downey Jr., Scarlett Johansson, Mickey Rourke', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$624M' },
  { id: 'tt1300854', title: 'Iron Man 3', overview: 'Tony Stark battles a new nemesis called the Mandarin.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMjIzMzAzMjQyM15BMl5BanBnXkFtZTcwNzM2NjcyOQ@@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.1, year: '2013', runtime: 130, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Shane Black', actors: 'Robert Downey Jr., Gwyneth Paltrow, Don Cheadle', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$1.21B' },
  { id: 'tt0499549', title: 'Thor', overview: 'The powerful but arrogant warrior Thor is cast out of Asgard to live among humans.', poster_path: 'https://m.media-amazon.com/images/M/MV5BOGE4ZDcxNjktMjJhNS00MTM1LTIwNmQtYjgwM2NlOGJlYjEyXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.0, year: '2011', runtime: 115, genres: [{ name: 'Action' }, { name: 'Fantasy' }], director: 'Kenneth Branagh', actors: 'Chris Hemsworth, Natalie Portman, Tom Hiddleston', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$449M' },
  { id: 'tt1981115', title: 'Thor: The Dark World', overview: 'Thor must travel to the Dark World to fight an ancient race led by Malekith.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMTQyNzAwOTUxOF5BMl5BanBnXkFtZTcwMTE0OTc5OQ@@._V1_QL75_UY562_CR7,0,380,562_.jpg', vote_average: 6.9, year: '2013', runtime: 112, genres: [{ name: 'Action' }, { name: 'Fantasy' }], director: 'Alan Taylor', actors: 'Chris Hemsworth, Natalie Portman, Tom Hiddleston', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$644M' },
  { id: 'tt3501632', title: 'Thor: Ragnarok', overview: 'Thor must escape the alien planet Sakaar and stop Ragnarok, the destruction of Asgard.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMjMyNDkzMzI1OF5BMl5BanBnXkFtZTgwODcxODg5MjI@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.9, year: '2017', runtime: 130, genres: [{ name: 'Action' }, { name: 'Comedy' }], director: 'Taika Waititi', actors: 'Chris Hemsworth, Tom Hiddleston, Cate Blanchett', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$854M' },
  { id: 'tt10648342', title: 'Thor: Love and Thunder', overview: 'Thor embarks on a journey of self-discovery, but must return to stop Gorr the God Butcher.', poster_path: 'https://m.media-amazon.com/images/M/MV5BZjRiMDhiZjQtNjk5Yi00ZDcwLTkyYTEtMDc1NjdmNjFhNGIzXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 6.3, year: '2022', runtime: 119, genres: [{ name: 'Action' }, { name: 'Comedy' }], director: 'Taika Waititi', actors: 'Chris Hemsworth, Natalie Portman, Christian Bale', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$760M' },
  { id: 'tt0458339', title: 'Captain America: The First Avenger', overview: 'Steve Rogers becomes Captain America and fights HYDRA during World War II.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNzUyM2YyY2MtNzNlMS00MWU5LTgxNjAtNzZlNmI2NjU2NDZlXkEyXkFqcGc@._V1_QL75_UY562_CR8,0,380,562_.jpg', vote_average: 6.9, year: '2011', runtime: 124, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Joe Johnston', actors: 'Chris Evans, Hugo Weaving, Samuel L. Jackson', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$371M' },
  { id: 'tt1843866', title: 'Captain America: The Winter Soldier', overview: 'Captain America uncovers a conspiracy within SHIELD.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNWY1NjFmNDItZDhmOC00NjI1LWE0ZDItMTM0MjBjZThiOTQ2XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.8, year: '2014', runtime: 136, genres: [{ name: 'Action' }, { name: 'Thriller' }], director: 'Anthony Russo, Joe Russo', actors: 'Chris Evans, Scarlett Johansson, Samuel L. Jackson', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$714M' },
  { id: 'tt3498820', title: 'Captain America: Civil War', overview: 'Political pressure divides the Avengers into two factions.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMjQ0MTgyNjAxMV5BMl5BanBnXkFtZTgwNjUzMDkyODE@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.8, year: '2016', runtime: 147, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Anthony Russo, Joe Russo', actors: 'Chris Evans, Robert Downey Jr., Scarlett Johansson', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$1.15B' },
  { id: 'tt1825683', title: 'Black Panther', overview: "T'Challa returns home to Wakanda to claim the throne but faces a challenger.", poster_path: 'https://m.media-amazon.com/images/M/MV5BMTg1MTY2MjYzNV5BMl5BanBnXkFtZTgwMTc4NTMwNDI@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.4, year: '2018', runtime: 134, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Ryan Coogler', actors: "Chadwick Boseman, Michael B. Jordan, Lupita Nyong'o", language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$1.35B' },
  { id: 'tt9376612', title: 'Black Panther: Wakanda Forever', overview: "The nation of Wakanda fights to protect their kingdom after the death of T'Challa.", poster_path: 'https://m.media-amazon.com/images/M/MV5BYWY5NDY1ZjItZDQxMy00MTAzLTgyOGQtNTQxYjFiMzZjMjUyXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 6.7, year: '2022', runtime: 161, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Ryan Coogler', actors: 'Letitia Wright, Angela Bassett, Martin Freeman', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$859M' },
  { id: 'tt1211837', title: 'Doctor Strange', overview: 'A neurosurgeon discovers the hidden world of magic and alternate dimensions.', poster_path: 'https://m.media-amazon.com/images/M/MV5BNjgwNzAzNjk1Nl5BMl5BanBnXkFtZTgwMzQ2NjI1OTE@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.5, year: '2016', runtime: 115, genres: [{ name: 'Action' }, { name: 'Fantasy' }], director: 'Scott Derrickson', actors: 'Benedict Cumberbatch, Chiwetel Ejiofor, Tilda Swinton', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$678M' },
  { id: 'tt9419884', title: 'Doctor Strange in the Multiverse of Madness', overview: 'Doctor Strange explores the multiverse with the help of new allies.', poster_path: 'https://m.media-amazon.com/images/M/MV5BN2YxZGRjMzYtZjE1ZC00MDI0LThjZmQtZTZmMzVmMmQ2NzBmXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 6.7, year: '2022', runtime: 126, genres: [{ name: 'Action' }, { name: 'Fantasy' }], director: 'Sam Raimi', actors: 'Benedict Cumberbatch, Elizabeth Olsen, Xochitl Gomez', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$952M' },
  { id: 'tt0478970', title: 'Ant-Man', overview: 'A thief gains the ability to shrink and must help protect the Ant-Man suit.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMjM2NTQ5Mzc2M15BMl5BanBnXkFtZTgwNTcxMDI2NTE@._V1_QL75_UX380_CR0,1,380,562_.jpg', vote_average: 7.2, year: '2015', runtime: 117, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Peyton Reed', actors: 'Paul Rudd, Evangeline Lilly, Michael Douglas', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$519M' },
  { id: 'tt10954600', title: 'Ant-Man and the Wasp: Quantumania', overview: 'The family explores the Quantum Realm, facing a new enemy.', poster_path: 'https://m.media-amazon.com/images/M/MV5BMThkYWY5ZjQtYjJlMS00MDFmLWFkYzEtODEzZjg5YWFmMGY4XkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 6.1, year: '2023', runtime: 125, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Peyton Reed', actors: 'Paul Rudd, Evangeline Lilly, Michael Douglas', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$476M' },
  { id: 'tt5109280', title: 'Black Widow', overview: 'Natasha Romanoff confronts the dark parts of her ledger.', poster_path: 'https://m.media-amazon.com/images/M/MV5BZTMyZTA0ZTItYjY3Yi00ODNjLWExYTgtYzgxZTk0NTg0Y2FlXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 6.6, year: '2021', runtime: 134, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Cate Shortland', actors: 'Scarlett Johansson, Florence Pugh, David Harbour', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$379M' },
  { id: 'tt10676048', title: 'The Marvels', overview: 'Carol Danvers, Monica Rambeau, and Kamala Khan team up.', poster_path: 'https://m.media-amazon.com/images/M/MV5BYzczOWM4MzItMWMyOS00ZDczLWIxMzctNzBmYTgzOTI1MzI3XkEyXkFqcGc@._V1_SX300.jpg', vote_average: 5.8, year: '2023', runtime: 105, genres: [{ name: 'Action' }, { name: 'Sci-Fi' }], director: 'Nia DaCosta', actors: 'Brie Larson, Teyonah Parris, Iman Vellani', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$206M' },
  { id: 'tt6475714', title: 'Shang-Chi and the Legend of the Ten Rings', overview: 'Shang-Chi must confront his past when drawn into the Ten Rings organization.', poster_path: 'https://m.media-amazon.com/images/M/MV5BZmY5MDcyNzAtYzg3MC00MGNlLTg3OGItNmRjYThkZGVlNzAyXkEyXkFqcGc@._V1_QL75_UX380_CR0,0,380,562_.jpg', vote_average: 7.3, year: '2021', runtime: 132, genres: [{ name: 'Action' }, { name: 'Fantasy' }], director: 'Destin Daniel Cretton', actors: 'Simu Liu, Awkwafina, Tony Leung', language: 'English', country: 'USA', rated: 'PG-13', boxOffice: '$432M' },
];

export function year(item) { return item.year || (item.release_date || item.first_air_date || '').slice(0, 4) || '—'; }
export function rating(item) { const v = item.vote_average || item.rating; return v ? (typeof v === 'number' ? v.toFixed(1) : String(v)) : '—'; }
export function title(item) { return item.title || item.name || 'Untitled'; }
export function runtime(min) { if (!min) return ''; const n = typeof min === 'string' ? parseInt(min) : min; if (isNaN(n)) return ''; const h = ~~(n / 60), m = n % 60; return h ? `${h}h ${m}m` : `${m}m`; }

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
