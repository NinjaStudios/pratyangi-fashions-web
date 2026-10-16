# Pratyangi Fashions

Storefront for Pratyangi Fashions, built from the supplied Figma prototype and screen recording.

**Current phase: frontend UI only** — design system, responsive layouts, hero and scroll animations, carousels and
interactive components. Demo data (bag, account, orders) lives in the browser's `localStorage`.
The backend (Express + MySQL) is planned for a later phase; see [Backend phase](#backend-phase-planned).

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router), static export (`output: "export"`) |
| Language | TypeScript |
| UI | React 19 |
| Styling | CSS Modules + global CSS variables (`src/app/globals.css`) |
| Animation | Framer Motion + CSS transitions/keyframes |
| Icons | Lucide React |
| Package manager | pnpm workspace |
| Source control | Git + GitHub |

The storefront stays on Next.js (it is not being replaced by Vite).

### Packages the storefront needs

Only five runtime packages, all declared in `artifacts/pratyangi-fashions/package.json`:

| Package | Used for |
| --- | --- |
| `next` | Routing, build and static export |
| `react`, `react-dom` | UI |
| `framer-motion` | Scroll-linked and entrance animations |
| `lucide-react` | Icons |

Dev-only: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`.

## Repository layout

```
artifacts/
  pratyangi-fashions/   Next.js storefront (the app you run)
    src/app/            Routes: /, /new-arrivals, /bag, /account, /account/orders
    src/components/     home, layout, sections, account, motion, ui/ProductCard
    src/lib/            catalog data, bag and account (localStorage), siteConfig
    public/images/      Images used by the site
    reference/          Design reference screenshots (not shipped)
  api-server/           Express API skeleton for the backend phase (not needed to run the UI)
lib/                    Shared packages used by api-server (database/API layers; to be reworked for MySQL)
```

## Prerequisites

- **Node.js 20.9 or newer** (developed on Node 24) — <https://nodejs.org>
- **pnpm 10** — this repo refuses `npm install` / `yarn install` on purpose.

```bash
npm install -g pnpm@10
# or, if you prefer not to install globally:
corepack enable
```

## Setup

```bash
git clone https://github.com/NinjaStudios/pratyangi-fashions-web.git
cd pratyangi-fashions-web
pnpm install
```

`pnpm install` also fixes "module not found" errors — run it again after pulling changes or switching branches.

## Run

All commands run from the repository root (works the same in PowerShell, Command Prompt and bash).

| Task | Command |
| --- | --- |
| Start the dev server (http://localhost:3000) | `pnpm --filter @workspace/pratyangi-fashions run dev` |
| Type-check everything | `pnpm run typecheck` |
| Production build (writes the static site to `artifacts/pratyangi-fashions/out`) | `pnpm --filter @workspace/pratyangi-fashions run build` |
| Preview the built site (http://localhost:3000) | `pnpm --filter @workspace/pratyangi-fashions run preview` |

Notes:

- The dev server listens on all interfaces, so you can open `http://<your-PC-IP>:3000` on a phone on the same Wi-Fi.
- `next start` does not work with a static export. Use the `preview` command instead (it runs `npx serve out`).
- Run `build` before `preview`.

### Adding a package

```bash
pnpm --filter @workspace/pratyangi-fashions add <package-name>
```

New package versions must be at least one day old (`minimumReleaseAge` in `pnpm-workspace.yaml`, a supply-chain safety setting).

## Configuration

- **WhatsApp number and social links:** `artifacts/pratyangi-fashions/src/lib/siteConfig.ts`.
  Leave a value empty and the site shows a disabled "pending configuration" state instead of a broken link.
- **Environment variables:** none are needed to run the UI. `NEXT_PUBLIC_API_URL` is only read by the AI try-on
  feature, which is switched off until the backend phase. Copy secrets into a local `.env*` file — those files are git-ignored.

## Deploying the frontend

The build output is plain static files in `artifacts/pratyangi-fashions/out`, so any static host works
(Vercel, Netlify, Cloudflare Pages, or Nginx on a Linux VPS).

- **Vercel / Netlify / Cloudflare Pages:** set the root directory to `artifacts/pratyangi-fashions`,
  the install command to `pnpm install` run from the repository root, the build command to `pnpm build`,
  and the output directory to `out`.
- **Nginx on a VPS (example):** upload the contents of `out/` and serve them with
  `try_files $uri $uri.html $uri/ =404;`.

On plain static servers the browser console may show 404s for `__next.*.txt` prefetch files. They are harmless —
navigation falls back to a normal page load.

## Git workflow

- `main` holds the stable version. Do work on a branch, for example `ui/<short-description>`.
- Commit small, descriptive changes, push the branch, then open a pull request into `main`.

## Backend phase (planned)

Not part of the current work. The intended stack:

- Express API (`artifacts/api-server` is the starting point), Node.js
- MySQL 8 with `mysql2`
- Plain numbered SQL upgrade scripts, applied in order and recorded in the database
- Linux VPS hosting (Nginx in front, Express under a process manager, MySQL on the same server at first)

Keep the database connection in a single `DATABASE_URL` setting and all SQL in one data layer so the database can be
moved to a managed service later. The existing `lib/db` package (PostgreSQL/Drizzle) is a leftover that will be replaced.

## Troubleshooting

- **`Use pnpm instead`** — you ran `npm install` or `yarn install`. Use `pnpm install`.
- **Port 3000 in use** — stop the other process, or run `pnpm --filter @workspace/pratyangi-fashions exec next dev --port 3001`.
- **macOS:** `pnpm-workspace.yaml` excludes macOS build binaries (`@esbuild/darwin-*`, `@rollup/rollup-darwin-*`,
  `lightningcss-darwin-*`) because the project was first set up on Linux. This only matters for `api-server` builds;
  remove those `overrides` entries if you need them on a Mac.
- **Stale build errors after deleting files** — delete `artifacts/pratyangi-fashions/.next` and run the command again.
