# Pratyangi Fashions

Online storefront for Pratyangi Fashions (silk sarees), built from the supplied Figma prototype and screen recording.

**Phase:** frontend UI. The backend (orders, accounts, payments) is planned for a later phase.
Progress, decisions and open items are tracked in [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md).
The backend design is in [docs/BACKEND_PLAN.md](docs/BACKEND_PLAN.md).
**New to the project?** Every command is explained in plain English in [docs/COMMANDS.md](docs/COMMANDS.md).

## Technology stack (decided 2026-10-16)

| Layer | Choice | Status |
| --- | --- | --- |
| Frontend framework | Next.js 16 (App Router), static export | Built |
| Language | TypeScript | Built |
| UI library | React 19 | Built |
| Styling | CSS Modules + global CSS variables | Built |
| Animation | Framer Motion + CSS transitions | Built |
| Icons | Lucide React | Built |
| UI state / demo data | React hooks + browser `localStorage` | Built |
| Package manager | pnpm workspace | Built |
| Source control | Git + GitHub | In use |
| Preview deployments | Vercel (production site plus per-branch previews) | Live |
| Backend | Node.js + Express (TypeScript) | Planned |
| Database | MySQL 8 + `mysql2`, plain numbered SQL upgrade scripts | Planned |
| Production hosting | Linux VPS (Nginx + Express under a process manager, MySQL on the same server at first) | Planned |

Not used: Vite, Tailwind CSS. The storefront stays on Next.js with CSS Modules.
The existing shared cPanel hosting is not used for the store's backend (see the backend plan for why).

## Quick start

Requirements: **Node.js 20.9+** (developed on Node 24) and **pnpm 10**.

```bash
npm install -g pnpm@10          # once; or: corepack enable
git clone https://github.com/NinjaStudios/pratyangi-fashions-web.git
cd pratyangi-fashions-web
pnpm install
pnpm dev                        # http://localhost:3000
```

That is all: no accounts, API keys or environment files are needed to run the UI.

## Commands

Run from the repository root (PowerShell, Command Prompt and bash all work).

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server at http://localhost:3000 |
| `pnpm typecheck` | Check all TypeScript |
| `pnpm build` | Production build; writes the static site to `apps/web/out` |
| `pnpm preview` | Serve the built site at http://localhost:3000 (run `pnpm build` first) |
| `pnpm test` | Build the site and run the automated browser tests (see [Testing](#testing)) |
| `pnpm test:headed` | Same, in a visible browser window so you can watch |
| `pnpm test:ui` | Same, in Playwright's interactive viewer (pick tests, replay steps, see each screenshot) |
| `pnpm --filter pratyangi-web add <package>` | Add a dependency to the storefront |

Notes:

- `next start` does not work with a static export; use `pnpm preview`.
- To try the dev site on a phone on the same Wi-Fi, open `http://<your-PC-IP>:3000`. This has not been tested; if
  scripts do not load, add that address to `allowedDevOrigins` in `apps/web/next.config.ts`.
- `pnpm install` also fixes "module not found" errors. Run it again after pulling changes.
- New package versions must be at least one day old (`minimumReleaseAge` in `pnpm-workspace.yaml`; a supply-chain safety setting).

## Project structure

```
apps/
  web/                    The storefront (Next.js)
    src/app/              Routes: /, /new-arrivals, /bag, /account, /account/orders
    src/components/       home, layout, sections, account, motion, ui/ProductCard
    src/lib/              catalog data, bag and account (localStorage), siteConfig, tryOn
    e2e/                  Playwright browser tests
    public/images/        Images used by the site
    reference/            Design reference screenshots (not shipped)
docs/                     Project status, decisions and the backend plan
```

The backend will be added later as `apps/api`.

## Testing

Browser tests use [Playwright](https://playwright.dev) and run against the production build, the same files Vercel serves.
Each test runs twice: at desktop size (1440 × 900) and phone size (375 × 812).

```bash
pnpm --filter pratyangi-web exec playwright install chromium   # once per computer: downloads the test browser
pnpm test                                                      # builds, then runs everything (about a minute)
```

What is checked (42 test runs):

- **Every page** (`/`, `/new-arrivals`, `/bag`, `/account`, `/account/orders`) has the right title, no broken images, no
  console errors or failed requests, and no sideways scrolling.
- **Header:** the Shop menu and search dialog open and close with Esc, Tab stays inside the dialog, focus returns to the Search button.
- **Add to cart** raises the bag count.
- **Category carousel:** arrows move it, both arrows disable at the ends, and there is no blank space after the last card.
- **Hero and Shop by Category:** the category cards sit directly under the hero at rest; the hero stays pinned while the
  category section slides over it; the centre model fades out and the left and right models drift outward (outer ones
  further, never crossing); the "Shop by Category" heading has no background, appears only while scrolling and is softly
  blurred only while it overlaps the hero; everything reverses when scrolling back up, and nothing moves with "reduce
  motion" on. Also checked: no sideways scrolling at 320, 375 and 425 px.

In plain words:

- **`pnpm test`** builds the website, then a robot opens it in an invisible browser, clicks around like a visitor and
  checks that everything works. Success ends with `24 passed`; a failure shows a red `x` and what went wrong.
- **`pnpm test:headed`** does the same in a visible browser window, so you can watch the robot work.
- **`pnpm test:ui`** opens Playwright's viewer: choose a test, run it, and step back and forward to see the page at every step.
- **`pnpm --filter pratyangi-web run test:e2e:report`** opens the report of the last run in your browser. Failed tests
  include a screenshot and a video. Press Ctrl + C in the terminal to close it.
- **`pnpm --filter pratyangi-web exec playwright install chromium`** downloads the test browser. Run it once per computer.
- To rerun without rebuilding: `pnpm --filter pratyangi-web exec playwright test` (the last build in `apps/web/out` is used).
- To run one file or one size: `pnpm --filter pratyangi-web exec playwright test hero-scroll --project=desktop`.

Every command in this project, including Git and Vercel, is explained step by step in
[docs/COMMANDS.md](docs/COMMANDS.md).

If a test fails after you change the design on purpose, update the test in `apps/web/e2e` to match.

## Configuration

- **WhatsApp number and social links:** `apps/web/src/lib/siteConfig.ts`. An empty value shows a disabled
  "pending configuration" state instead of a broken link. These still need the real values from the business.
- **Environment variables:** none are needed to run the UI. `NEXT_PUBLIC_API_URL` is only read by the AI try-on
  feature, which is switched off until the backend phase. Keep secrets in local `.env*` files; they are git-ignored.

## Images

Static export serves images exactly as stored, so file size is page weight. Before adding an image to
`apps/web/public/images`:

- Save it as **WebP**, at most **2× the size it is displayed** (a 250 px wide card needs about 500–640 px).
- Aim for **under 150 KB** for a card or product photo; a full-width banner can be larger.
- Reference it by path, e.g. `/images/reference/product-1.webp`.

Example conversion: `ffmpeg -i in.png -vf "scale=640:-2" -c:v libwebp -quality 82 out.webp`.

## Deploying the frontend

The build output is plain static files in `apps/web/out`, so any static host works.

**Vercel (set up and working):**

- Project: `pratyangi-fashions-web` (account `nstudio706-6425`), connected to this GitHub repository.
- Production site: <https://pratyangi-fashions-web.vercel.app> — redeployed automatically on every push to `main`.
- Every other branch gets its own preview deployment.
- Project settings that matter: **Framework** Next.js, **Root Directory** `apps/web`, **Include source files outside of
  the Root Directory** on. Build and install commands are left at Vercel's defaults (pnpm is detected from the lockfile).
- Preview deployment links (the long `...-nstudio706-6425.vercel.app` addresses) are protected by Vercel login. To show
  one to a client, turn off Deployment Protection for previews in the project settings, or share a protected link
  from the Vercel dashboard.
- Command line (optional): `npm install --global vercel@latest`, then `vercel login`, `vercel whoami`,
  `vercel ls pratyangi-fashions-web`.

If a build fails with `The specified Root Directory ... does not exist`, the Root Directory setting does not match the
folder layout. Set it to `apps/web` under Project Settings → General.

**Nginx on a Linux server (example):** upload the contents of `apps/web/out` and serve them with
`try_files $uri $uri.html $uri/ =404;`.

On plain static servers the browser console can show 404s for `__next.*.txt` prefetch files. They are harmless;
navigation falls back to a normal page load.

## Git workflow

- `main` is the stable version. Do each piece of work on a branch (for example `ui/<short-description>`),
  push it, then open a pull request into `main`.
- Commit small, clearly described changes. Never commit passwords, API keys or `.env` files.

## Troubleshooting

- **`Use pnpm instead`** — you ran `npm install` or `yarn install`. Use `pnpm install`.
- **Port 3000 is busy** — stop the other process, or run `pnpm --filter pratyangi-web exec next dev --port 3001`.
- **Stale build errors after moving or deleting files** — delete `apps/web/.next` and run the command again.
- **The folder cannot be renamed or deleted on Windows** — close editors and terminals that have it open, then retry.
