# Pratyangi Fashions

A responsive storefront recreation for Pratyangi Fashions, based on the supplied Figma prototype and screen recording.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Storefront: Next.js App Router, React, TypeScript, CSS Modules, global CSS variables, Framer Motion, Lucide React
- Current phase: frontend only; demo persistence may use browser `localStorage`
- Later phase: PHP/MySQL APIs, authentication, orders, and payments only after hosting compatibility is confirmed
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Product

- Recreate the Pratyangi Fashions storefront shown in the provided Figma reference and screen recording.
- Keep Next.js; do not replace it with Vite.
- The initial scope is the accessible frontend design, responsive layout, animations, carousels, and interactive components. Do not add backend, authentication, ordering, or payment flows in this phase.
- Static-export deployment is the initial approach, subject to confirming hosting compatibility.

## Architecture decisions

- The storefront uses Next.js App Router, TypeScript, CSS Modules, global CSS variables, Framer Motion, and Lucide React, as requested.
- Treat the supplied Figma prototype as the design source of truth. If an interaction, page, asset, or section is not visible in the accessible reference, identify the gap rather than inventing it.
- Keep demo-only persistence local to the browser until the later backend phase is explicitly started.

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
