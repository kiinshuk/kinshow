# Contributing to Kinshow

Thanks for your interest in contributing! Here's how to get started.

## Getting Started

1. ⭐ Star the repo first — it helps others find the project
2. Fork the repository
3. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/kinshow.git
   cd kinshow
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```
   The app runs at `http://localhost:5173` — no environment variables needed.

**Prerequisites:** Node.js 18+ and npm.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run build` | Production build: fetches contributors → Vite bundle → prerenders SEO HTML |
| `npm run preview` | Serve the production build (port 4173) |
| `npm run contributors` | Refresh `src/data/contributors.json` manually |

> There is currently **no lint script** — ESLint is tracked in [#157](https://github.com/kiinshuk/kinshow/issues/157). Your verification gate is: **`npm run build` passes.**

## Before Your First PR

Run a full build and make sure it succeeds:

```bash
npm run build
```

- If the build modifies `src/data/contributors.json` and you didn't intend to change the roster, restore it:
  ```bash
  git checkout -- src/data/contributors.json
  ```
- Preview your change: `npm run preview` → http://localhost:4173

## Tech Stack

- React 18
- Vite 5
- React Router 6
- Plain CSS (no framework) — design system tokens live in `src/index.css`

## Project Structure

```
src/
├── api.js          # API functions (TVmaze, OMDb) + caching
├── store.js        # localStorage hooks (watchlist, history)
├── blogData.js     # Blog articles data
├── components/     # Reusable components
├── pages/          # Route pages
├── hooks/          # Custom hooks
├── utils/          # Utility functions
└── index.css       # Global styles + design tokens
```

## How to Contribute

### Pick an Issue
- Check [open issues](https://github.com/kiinshuk/kinshow/issues) for bugs or features
- Issues tagged `good first issue` are great for newcomers — there are hundreds
- Comment on the issue so it gets assigned to you

### Submit a PR
1. Create a branch: `git checkout -b fix/issue-123`
2. Make your changes
3. Run `npm run build` — it must pass
4. Commit: `git commit -m "fix: description"`
5. Push: `git push origin fix/issue-123`
6. Open a Pull Request and reference the issue (`Fixes #123`)

### PR Guidelines
- Keep PRs focused on one change
- Reference the issue: `Fixes #123`
- Follow existing code style
- Test your changes locally (`npm run dev` + `npm run preview`)

### Label Glossary

Issue labels tell you what kind of task something is and how urgently it's
being tracked. This list matches the live label set on the repo:

| Label | Meaning | When it's used |
|---|---|---|
| `good first issue` | Good for newcomers | Self-contained, low-context tasks for first-time contributors |
| `help wanted` | Extra attention is needed | The maintainer wants community help on this one specifically |
| `bug` | Something isn't working | Confirmed defect in existing behavior |
| `enhancement` | New feature or request | New functionality or a change to existing behavior |
| `documentation` | Improvements or additions to documentation | README, CONTRIBUTING, code comments, or in-app copy |
| `accessibility` | Barrier affecting people with disabilities | Keyboard nav, screen reader, contrast, and similar a11y fixes |
| `performance` | Performance improvements | Load time, bundle size, runtime speed |
| `seo` | Search engine optimization | Meta tags, prerendering, sitemap, and similar |
| `pwa` | Progressive Web App features | Service worker, manifest, offline support, installability |
| `high-priority` | Important and urgent | Jump the queue — maintainer wants this addressed soon |
| `question` | Further information is requested | The report needs clarification before it's actionable |
| `invalid` | This doesn't seem right | Not a real bug, or not reproducible as described |
| `duplicate` | This issue or pull request already exists | Already covered by another open issue/PR |
| `wontfix` | This will not be worked on | Acknowledged but intentionally out of scope |

If you're picking your first issue, start with `good first issue`; add a
comment on the issue so it doesn't get picked up twice.

## Code Style

- Use functional components with hooks
- Prefer `const` over `let`
- Use CSS variables from `index.css` (`--accent`, `--surface`, `--text-muted`, …)
- Keep components small and focused
- Sharp corners everywhere (`border-radius: 0`) except cast avatars
- Accent color is red (`#c8102e`) — never introduce the old blue

## Local Gotchas

- **TMDB is blocked on some networks** — the app only needs TVmaze + OMDb; both are reachable without extra setup.
- **`src/data/contributors.json` gets regenerated on every build** — restore it before committing unless roster changes are intentional.
- **Ports:** dev = 5173, preview = 4173. If a port is busy, kill the stale process first.
- **PowerShell users:** chain commands with `;` instead of `&&`.

## Questions?

Open a [discussion](https://github.com/kiinshuk/kinshow/discussions) or comment on an issue.
