# Pratyangi Fashions

Online storefront for Pratyangi Fashions (silk sarees), built from the supplied Figma prototype and screen recording.

**Phase:** frontend UI. The backend (orders, accounts, payments) is planned for a later phase.
Progress, decisions and open items are tracked in [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md).
The backend design is in [docs/BACKEND_PLAN.md](docs/BACKEND_PLAN.md).

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
| Preview deployments | Vercel (per-branch preview links) | To set up |
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
    public/images/        Images used by the site
    reference/            Design reference screenshots (not shipped)
docs/                     Project status, decisions and the backend plan
```

The backend will be added later as `apps/api`.

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

**Vercel (for previews and, if wanted, production):**

1. Sign in at vercel.com with the GitHub account that can see the repository, choose **Add New → Project** and import it.
   (An owner of the `NinjaStudios` GitHub organisation may need to approve the Vercel GitHub app.)
2. Set **Root Directory** to `apps/web` and keep **Include source files outside of the Root Directory** enabled.
3. Framework preset: **Next.js**. Install command: `pnpm install`. Build command: `pnpm build`. Output is `out`.
4. Every pushed branch then gets its own preview link; `main` is the production deployment.

These steps follow Vercel's standard monorepo setup and have **not been tested on this project yet**.

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
