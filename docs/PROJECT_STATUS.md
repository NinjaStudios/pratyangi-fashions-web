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

- Sticky header matched to the original proportions (emblem-only logo, 18px Shop label, 253×46 search pill, solid bag
  and account icons), with Shop menu and a search dialog (keyboard accessible)
- Hero showcase built in layers (empty stage plus seven separate model cut-outs), pinned behind the page while Shop by Category slides over it. Scroll-linked: the centre model fades out, the side models drift outward (left ones left, right ones right) and slip behind the section, the scene dims slightly, and the heading (no background) fades in with a soft blur only while it overlaps the hero
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
- Deployed to Vercel (2026-10-16): https://pratyangi-fashions-web.vercel.app, redeploys automatically from `main`;
  checked live at desktop and phone widths (no broken images, no overflow)

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
| More automated tests | Playwright covers pages, header, cart, carousel and hero scroll; add tests as features are added, and run them in GitHub Actions on every pull request |

## Decisions

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-16 | Keep Next.js (static export) for the storefront; no Vite or Tailwind | Already built and matched to Figma; rewriting adds cost and no benefit; static export is easy to host |
| 2026-10-16 | Backend: Node.js + Express, MySQL 8 with `mysql2`, plain SQL upgrade scripts | One language across the project, a friend can help support it, simple to maintain |
| 2026-10-16 | Production on a Linux VPS, not the shared cPanel account | Shared plan cannot run Express, and holds other unrelated live sites |
| 2026-10-16 | AI try-on postponed | Frontend work comes first |
| 2026-10-16 | Frontend hosted on Vercel for now (Root Directory `apps/web`) | Free, automatic deploys from GitHub, preview link per branch; the VPS is only needed once the backend exists |
| 2026-10-16 | Removed hosting-vendor files, the unused UI kit, the Postgres backend template and 77 unused images | Clean project that installs only what it uses (history is kept in git) |

## Known limitations

- The hero stage behind the models was rebuilt from the original artwork wherever a model used to cover it (wall pattern, plinths, central pedestal and carpet). It matches the approved hero to within about 5 out of 255 in colour; there is a tiny three-pixel notch at the top-right edge of the carpet, visible only when the centre model has faded and you zoom in.
- Hero pictures are at 1x (1440 px artboard): sharp on normal screens, a little soft on 4K and Retina. Exporting the hero at 2x from Figma and re-running the layer export would fix that.
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
- **Vercel account ownership:** the Vercel project currently lives under a personal account (`nstudio706-6425`).
  Move it to a company team before handover. Also check Vercel's terms: its free Hobby plan is meant for personal,
  non-commercial use, so a live store will likely need a paid plan.
- **Preview links are private:** Vercel Deployment Protection is on, so branch preview links ask for a Vercel login.
  Change this in the project settings if clients need to open previews.
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

## How the UI is checked

Automated: `pnpm test` runs 42 Playwright browser tests (21 at desktop size, 21 at phone size) against the production
build: page titles, broken images, console errors, horizontal overflow, header menu and search dialog keyboard
behaviour, add to cart, the category carousel, and the hero/category scroll layering including reduced motion.
Details and how to watch the tests run are in the README. A deliberate break of the hero pinning was used once to
confirm the tests fail when the behaviour regresses.

Not automated (checked by hand during development): layouts at eight widths from 320 px to 1920 px, page weight and
layout shift, and before/after screenshot comparison when images changed.

## Smooth scrolling

Mouse-wheel and trackpad scrolling is eased site-wide by Lenis (`apps/web/src/components/layout/SmoothScroll/SmoothScroll.tsx`, mounted in `app/layout.tsx`). It only eases the scroll position, so every scroll-linked animation follows it. Touch scrolling stays native, it is off when the visitor prefers reduced motion, and its frame loop sleeps when the page is idle. Tuning: `lerp` (lower = floatier, higher = snappier). Hero movement uses a soft ease-in-out curve (`soft` in `Hero.tsx`).

## Card reveal and customer marquee

- Home product cards fade up one after another as they scroll into view (`revealIndex` on `ProductCard`; plays once; instant with reduced motion).
- "Loved by our Customers" is an endless auto-scrolling row (CSS only: two identical groups, track slides by one group's width). Pauses on hover/focus; with reduced motion it becomes a plain swipe row. Speed: `48s` in `.reviewTrack` (page.module.css).

## Shop mega menu and checkout page

- **Shop menu** (`SiteHeader`): Women / Men / Jewellery columns from the Figma nav bar. The hamburger turns into a cross, the label and chevron turn gold, the panel wipes down and its columns fade up one by one. Esc or a click outside closes it. All links go to `/new-arrivals` until category pages exist.
- **Checkout** (`/checkout`, `apps/web/src/app/checkout/`): delivery address (select / add / delete, sample addresses from Figma), delivery options (Standard / Express), order summary with quantity, remove and coupon (`FIRST20`, `WELCOME10`), price details, "Proceed to Pay". Payment is a demo message only. Shared prices live in `src/lib/checkout.ts`; the bag's "Proceed to Checkout" now links here.
- **CSS approach:** every stylesheet is now mobile-first: the base rules are the phone layout and `@media (min-width: …)` blocks add the wider layouts. Keep new CSS in that style. (The conversion was checked by comparing screenshots of all six pages at 24 widths from 320px to 1920px before and after; they matched.)
- **Checkout steps:** Delivery → Payment (UPI / card / net banking / cash on delivery) → Review & Place Order. Standard delivery is always free, as in Figma. Placing the order is a demo message only.

## Section headings and menu hover

- Home-page section titles (New Arrivals, Wedding Collection, Festive Collections, Best Sellers, Loved by our Customers) all use `RevealHeading` (`components/motion/RevealHeading.tsx`): the title rises and sharpens from a soft blur, then "See all" follows. Cards or the reviews row ease in after it.
- Shop menu: the WOMEN / MEN / JEWELLERY titles draw a gold line in on hover and back out on leave; a hovered link slides a little to the right (10px); links stay lined up with their title otherwise.
- `e2e/hover-states.spec.ts` covers the hover effects (desktop only).

## Hero: gold stands travel with their models

The six gold plinths are no longer part of `stage.webp`; each is its own image (`public/images/hero/plinth-<model>.webp`) drawn inside its model's layer (`plinth` in `heroLayers.ts`), so it slides away with that model. The white podium under the centre model stays in the stage and stays put while that model fades. At rest the hero still matches the approved design.

## Search/menu filters, try-on slider, spacing and animations (polish round)

- **Fabric links:** every fabric in the search dialog (and the matching Shop menu links) opens `/new-arrivals?fabric=…` with that fabric ticked and only those sarees listed; occasions work the same (`?occasion=Wedding`). Search also understands everyday names (kanchipuram, soft silk, bridal…). Helpers: `catalogLink` and `fabricAliases` in `lib/catalog.ts`; the page reads the link in `FiltersFromLink` (`NewArrivalsView.tsx`).
- **Try-on slider:** both faces sit under the divider at the start (left half of the photo, right half of the result). `beforeFaceX` / `afterFaceX` on `CompareSlider` give the face middle of each picture.
- **Try-on access cards:** more room between the title, badge, text and button.
- **Join our world** text and the **Why Pratyangi Fashions** cards/icons now animate in as they are scrolled to.
- **Latest from our socials:** icons are drawn at their real Figma sizes (the Facebook "f" and YouTube logo were being stretched) in a 48px chip, with the Figma arrow.
- Tests: `e2e/polish.spec.ts`.

## Phone responsiveness round

- Header: bag, account and search icons have matching visual weight and 40px+ tap targets.
- Home: category carousel cards and the "Loved by our Customers" cards are smaller on phones; "Be a part of our story" stacks with gold bars.
- /bag: lighter item cards (smaller photo, compact quantity stepper, wishlist/remove on one line each).
- New Arrivals: filters start folded on phones (they stay open when you arrive from a search/menu fabric link).
- Account: recent-order rows no longer overlap; tab bar is tighter.
- `e2e/responsive.spec.ts` checks all six pages at ten widths (320–1280px) for anything wider than the screen.

## Landing entrance and replaying scroll animations

- **Landing animation:** on page load the stage settles in, then the models rise with their gold stands, centre first and outwards to the edges (`introDelay` and the entrance wrappers in `Hero.tsx`).
- **Scroll animations replay:** reveals are no longer "once" (`lib/motion/presets.ts` and the components that set their own viewport). A section eases in whenever it scrolls into view and eases out as it leaves, in both directions. The footer, Exclusive Offers cards, social cards, newsletter and the New Arrivals / bag product cards now animate too.
- Cards that animate with Framer Motion get their hover lift from `whileHover` (a plain CSS transform would be overridden).

## Reviews row you can scroll, and an exact-half try-on slider

- **Loved by our Customers** still drifts by itself, and now can also be scrolled by hand: trackpad / sideways wheel, touch swipe, mouse drag, or arrow keys. It pauses while the pointer is over it, a finger is down, it has focus or it is being dragged, and drifts on again about 2 seconds after you let go. The loop has no seam (three identical groups; see `lib/useMarquee.ts`). With reduced motion it does not move by itself but can still be scrolled.
- **Try-on slider:** the two pictures are scaled and placed so both faces are the same size, the eyes are level, and the middle of each face is exactly under the divider (left half of your photo, right half of the AI result). The previous version also had the seam in the wrong place (clip on the enlarged picture); the clip is now on a frame-sized wrapper. The face measurements live in `TryOnSection.tsx` (`beforeFace` / `afterFace`); when you replace the sample photos, measure the new faces the same way.

## Figma check: order dashboard, checkout, address dialog

- **Order dashboard** ("Pratyangi Fashions order dashboard", the green "39/40" banners above it are only labels): rebuilt to the frame. Heading row with search and sort at the right, 298px sidebar with 70px rows, 954px-wide order cards with 80px thumbnails, gold "View Details" buttons, and real page numbers (‹ 1 2 3 4 5 … 13 ›, 52 demo orders). Cards and sidebar rows animate in; pages slide when you change page.
- **Checkout:** checked against the frame. A coupon applied in the bag now carries over to checkout (the Figma frame shows a discount applied).
- **Address dialog:** built to the design supplied by the designer (two panes: "My Addresses" with radio choice, Default badge, Edit and a ⋮ menu for Set as default / Delete, and the "Add new Address" form with Home / Office / Other cards, +91 phone, Check Pincode (demo: a few known pincodes fill city and state), State list, optional label such as "PG", and Set as default). Opens from Add New Address and Edit; one column bottom sheet on phones. Component: `components/checkout/AddressDialog.tsx`.
- **Animations in Figma:** none are defined on these frames (the motion data is empty), so the motion follows the rest of the site.

## Sign in and create account

- New pages `/login` and `/signup` in the site's own look (brand panel with perks on desktop, one card on phones), with "Continue with Google", show/hide password, password strength meter and rules, field checks, neutral error for wrong password, success animation and `?next=` return (same-site only).
- The header account icon goes to `/login` when signed out and `/account` when signed in; the account page greets the signed-in name and Logout works.
- Behind it: `apps/web/src/lib/auth/` (`AuthClient` interface, demo implementation for now, API implementation ready; contract and the Google setup steps are in `docs/BACKEND_PLAN.md`). Settings go in `apps/web/.env.local` (see `.env.example`): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
- Not in the Figma file: these two screens follow the checkout/account look and should be shown to the designer.
- Still to build: password reset, email/phone verification, and the real API.
