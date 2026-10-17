# Pratyangi store API

Express + TypeScript + MySQL 8. Customer accounts (email/password and Google), server-side sessions and saved delivery
addresses for the storefront in `apps/web`. The design, API contract and security notes are in
[docs/BACKEND_PLAN.md](../../docs/BACKEND_PLAN.md).

Products, stock and orders are **not** here: they stay in the PHP ERP (see "Source of truth" in that document).

## Run it on your machine

You need Node 24, pnpm (`npx pnpm@10 ...` works), and a MySQL 8 server you can create a database on.

```bash
# 1. Create the database and a user (in the MySQL shell, as an admin). Use your own password.
CREATE DATABASE pratyangi_shop CHARACTER SET utf8mb4;
CREATE DATABASE pratyangi_shop_test CHARACTER SET utf8mb4;
CREATE USER 'pratyangi'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT ALL ON pratyangi_shop.* TO 'pratyangi'@'localhost';
GRANT ALL ON pratyangi_shop_test.* TO 'pratyangi'@'localhost';

# 2. Settings
cd apps/api
cp .env.example .env          # then fill in DB_USER, DB_PASSWORD, DB_NAME
cp .env.test.example .env.test

# 3. Tables, then start
pnpm api:migrate              # from the repo root; creates the shop_* tables
pnpm api:dev                  # http://localhost:4000, restarts on changes
```

Point the website at it: in `apps/web/.env.local` set `NEXT_PUBLIC_API_URL=http://localhost:4000`, then `pnpm dev`. Sign up, sign in,
and add an address at checkout: all of it now goes through this API and MySQL. With no SMTP settings, the password-reset code is
printed in the API's console.

The tables are all named `shop_*`, so they can live in the same MySQL database as the ERP without touching the ERP's tables.

## Tests

```bash
pnpm api:test        # 29 tests against the _test database (the tests EMPTY its shop_ tables and refuse any DB name not ending in _test)
pnpm api:typecheck
```

Real end to end (the website in Chrome talking to this API and MySQL): set `DB_USER`, `DB_PASSWORD`, `DB_NAME` (a `_test` database) in
the shell, then `pnpm --filter pratyangi-web test:e2e:api`.

## Layout

```
sql/001_customers.sql     tables: shop_customers, shop_customer_identities, shop_sessions, shop_customer_addresses, shop_password_resets
src/config.ts             reads and checks the environment once, at start-up
src/db.ts, src/migrate.ts pool, transactions, numbered-script runner
src/validation.ts         every input rule, with the message the customer sees
src/auth/                 service (signup, login, Google, reset), sessions, Google token check
src/addresses/            address book service (every query scoped to the signed-in customer)
src/app.ts                routes, CORS, CSRF origin check, rate limits, error handler
src/server.ts             start-up
test/                     Vitest + Supertest against real MySQL
```

## Going live (not done yet, needs a server)

Run behind HTTPS (Nginx or the host's proxy) on a sub-domain of the website's domain, with `NODE_ENV=production`, `TRUST_PROXY=1`,
`WEB_ORIGIN` set to the live website, a least-privilege MySQL user, `GOOGLE_CLIENT_ID` and `SMTP_URL` set. `pnpm --filter pratyangi-api build`
then `pnpm --filter pratyangi-api start`. Keep it under PM2 or systemd, and back up the database daily.
