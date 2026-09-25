// Regenerates src/data/contributors.json from the GitHub contributors API.
// Runs automatically: (1) before every build (npm prebuild), (2) hourly via
// .github/workflows/update-contributors.yml
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'kiinshuk/kinshow';
const OUT = new URL('../src/data/contributors.json', import.meta.url);
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

const headers = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'kinshow-contributors-script',
};
if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

async function getJson(url) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

async function fetchAll() {
  const contributors = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await getJson(
      `https://api.github.com/repos/${REPO}/contributors?per_page=100&page=${page}`
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    contributors.push(...batch);
    if (batch.length < 100) break;
  }

  const repo = await getJson(`https://api.github.com/repos/${REPO}`);
  const owner = repo.owner.login;

  const data = contributors
    .filter((c) => c && !c.login?.endsWith('[bot]'))
    .sort((a, b) => b.contributions - a.contributions)
    .map((c) => ({
      login: c.login,
      avatar: c.avatar_url,
      contributions: c.contributions,
      ...(c.login === owner ? { owner: true } : {}),
    }));

  if (data.length === 0) throw new Error('empty contributors list');
  return data;
}

async function main() {
  let data;
  try {
    data = await fetchAll();
  } catch (err) {
    console.warn(`fetch-contributors: network fetch failed, keeping existing file: ${err.message}`);
    process.exit(process.env.REQUIRE_FETCH === '1' ? 1 : 0);
  }

  await mkdir(dirname(fileURLToPath(OUT)), { recursive: true });
  await writeFile(OUT, JSON.stringify(data, null, 2) + '\n');
  console.log(`contributors.json updated: ${data.length} people`);
}

main().catch((err) => {
  console.error(`fetch-contributors: failed to write file: ${err.message}`);
  process.exit(1);
});
