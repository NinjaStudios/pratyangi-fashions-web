# Project status

Last updated: 2026-10-16

## Summary

The storefront UI is built and runs. All pages use demo data held in the browser. There is no backend yet.
The design source is the Figma prototype plus the supplied PDFs, screenshots and screen recording.

## Done

### Pages

- Home `/`
- New Arrivals `/new-arrivals` (filters, product grid)
- Bag `/bag` (quantities, totals, saved in `localStorage`)
- Account `/account` and Orders `/account/orders` (demo data)

### Home page sections

- Sticky header with Shop menu and a search dialog (keyboard accessible)
- Hero showcase pinned behind the page while Shop by Category slides over it, with a scroll-linked blur/dim
- Shop by Category carousel (arrows, swipe, snap, keyboard focus)
- New Arrivals, Wedding Collection, Festive Collections and Best Sellers rows
- Loved by our Customers (reviews)
- Try-on section (UI only; the AI call is switched off)
- Exclusive Offers
- Join Our World (social buttons and WhatsApp, with "pending configuration" states)
- Latest From Our Socials ("Coming Soon" cards)
- Newsletter sign-up (demo, nothing is sent)
- Footer, floating WhatsApp button, "Why Pratyangi Fashions" section

### Animation and responsiveness

- Scroll reveals, subtle parallax (join artwork, social cards), hover micro-interactions
- Respects `prefers-reduced-motion`
- Layouts checked from 320 px to 1920 px wide with no horizontal overflow
- Approved three-model mobile hero kept

### Quality work

- Images converted to right-sized WebP: home page transfer about 35 MB → 2.5 MB; built site 40 MB → 4.4 MB
- Search dialog closes on Esc, returns focus, keeps Tab inside; Shop menu closes on Esc
- Clean workspace: only the 5 runtime packages the app uses, no leftover template code or hosting-vendor files
- TypeScript check and production build pass; no console errors on any page

## Not done yet / next

| Item | Notes |
| --- | --- |
| Real WhatsApp number and social URLs | Owner must supply; set in `apps/web/src/lib/siteConfig.ts` |
| Real product catalog, prices, photos | Currently demo data and placeholder images |
| Product detail page, wishlist, addresses, checkout | Not built; confirm with the client whether they are needed and get designs |
| Account sign-in | Backend phase |
| Orders and payments | Backend phase; use a hosted payment gateway |
| AI try-on | Dormant. Needs the backend and an AI provider key |
| Legal pages (privacy, terms, shipping, GST) | Footer links exist, pages and copy do not |
| SEO metadata per page, sitemap, analytics | Not started |
| Automated UI tests (Playwright) | Recommended before launch |
| Vercel preview deployment | Not set up yet |

## Decisions

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-16 | Keep Next.js (static export) for the storefront; no Vite or Tailwind | Already built and matched to Figma; rewriting adds cost and no benefit; static export is easy to host |
| 2026-10-16 | Backend: Node.js + Express, MySQL 8 with `mysql2`, plain SQL upgrade scripts | One language across the project, a friend can help support it, simple to maintain |
| 2026-10-16 | Production on a Linux VPS, not the shared cPanel account | Shared plan cannot run Express, and holds other unrelated live sites |
| 2026-10-16 | AI try-on postponed | Frontend work comes first |
| 2026-10-16 | Removed hosting-vendor files, the unused UI kit, the Postgres backend template and 77 unused images | Clean project that installs only what it uses (history is kept in git) |

## Known limitations

- The hero is a single composite image, not separate layers; the earlier layer images were removed as unused.
- Design reference: the Figma design file could not be read directly during development, so layouts were matched from
  Figma frames, the PDFs, screenshots and the screen recording. Re-check against Figma before sign-off.
- Tested in headless Chrome only. Safari, Firefox and real phones have not been checked.
- Demo data is per browser; clearing site data resets the bag and account.
- The product button says "Add to cart" while the rest of the site says "Bag"; decide on one word.

## Risks and things the owner must handle

- **Hosting renewal:** the existing BigRock shared hosting plan was recently renewed for one month with auto-renew off.
  Confirm the renewal date and turn on auto-renew, because several live sites depend on it.
- **Shared hosting security:** all domains on one cPanel account share one user, so do not store customer or payment
  data there.
- **Credentials:** never paste passwords into chat, issues or commits. Use a password manager, and change any password
  that has been shared.
- **Single maintainer:** keep this file and the README current, and keep every account (GitHub, hosting, domain,
  Vercel) in the company's name with two-step login.

## Handover checklist (before giving the project to the CEO)

- [ ] GitHub repository owned by the company organisation; at least two people with admin access
- [ ] Hosting, domain and Vercel accounts in the company's name, with two-step login and recovery contacts
- [ ] Production site deployed; custom domain and HTTPS working
- [ ] Real WhatsApp number, social links, products and legal pages added
- [ ] Backups configured and a restore tested (backend phase)
- [ ] Uptime monitor set up
- [ ] README and this document current
- [ ] A named person responsible for renewals and updates

## How the UI was checked

During development the pages were opened in headless Chrome and driven by scripts: layouts at eight widths,
scroll positions, interactions (menus, search, carousel, add to cart), console errors, page weight and layout shift,
plus before/after screenshot comparison when images were changed. These scripts are not stored in the repository.
Adding Playwright would make the same checks repeatable by anyone with one command.
