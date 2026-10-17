# ERP integration report (Phase 1: inspect and plan)

Written after reading the ERP source on this machine (`Pratyangi_Backend_Portal/app`, PHP + MySQL, **not modified**) and the
storefront repository. It separates what was **verified in code** from what is **assumed or still unknown**. Nothing here has been
run against a live ERP, and no ERP code was changed.

## 1. What was verified

### Storefront repository (this repo)
- pnpm workspace with `apps/web` (Next.js 16, React 19, TypeScript, CSS Modules, Framer Motion, Lenis; static export) and, new, `apps/api`.
- No backend existed before `apps/api`. The only earlier server-side material is in the other repository (see "Competing PHP stub").

### ERP (read from source, `app/sql/database.sql` and `app/public`)
- **Stack:** plain PHP with PDO and MySQL; one MySQL database; pages such as `pos.php`, `products.php`, `online_orders.php`, `stock_transfer.php`.
- **Roles** (`users.role`): `super_admin`, `manager`, `cashier`, `godown`, `auditor`. Staff log in with username and password.
- **Products** (`products`): one row per SKU with `sku`, `product_barcode`, `product_name`, `product_image` (a path), `category_id`, `fabric`, `pattern_name`, `gender`, `season`, `color`, `size`, `design_model`, `mrp`, `retail_price`, `wholesale_price`, `dealer_price`, `offer_price`, `tax_rate`, `active`.
  - **There is no variant table.** Colour and size are columns on the product, so one SKU is one sellable variant. How the storefront groups SKUs into one product page (for example by `design_model` or `pattern_name`) is not defined anywhere and needs a business decision.
  - Categories (`categories`) are only `id`, `name`, `active`: no slug, image, ordering or hierarchy. The website's category pages, images and menu order are not in the ERP.
  - Money is `DECIMAL(12,2)` in rupees. No product description, gallery, or SEO fields exist.
- **Stock** (`inventory_balances`): quantity per product, per **batch**, per **location**, with `qty` and `reserved_qty`. Serial-tracked garments live in `product_serials`. `locations.online_fulfillment_enabled` marks which locations may fulfil online orders. Sellable stock for the website = `qty - reserved_qty` at those locations. Stock moves are recorded in `stock_ledger`.
- **Online orders:** `online_orders` (`order_no`, `source` ∈ WEBSITE / MARKETPLACE / MANUAL / API, `external_order_id`, `customer_name`, `customer_mobile`, `shipping_address` as one text field, `order_amount`, `payment_status` ∈ PAID / COD / PENDING / REFUNDED, `status` NEW → ALLOCATED → PICKING → PICKED → PACKING → PACKED → DISPATCHED → DELIVERED, plus RETURN_IN_TRANSIT / RETURNED / CANCELLED, `courier`, `awb`), `online_order_items` (`product_id`, `quantity` only, **no unit price**) and `online_order_allocations` (which batch, location and serial was reserved, with picked, packed and returned quantities).
- **An order-ingest API already exists:** `POST /api/order_create.php`.
  - Protected by a bearer key from the ERP's config (`api.order_ingest_key`); refuses to work if the key is shorter than 32 characters.
  - Body: `source` (WEBSITE / MARKETPLACE / API), `external_order_id`, `order_no`, `customer_name`, `customer_mobile`, `shipping_address`, `order_amount`, `payment_status`, `notes`, `items[{sku, quantity}]`, and optionally `warehouse` or `location_code`.
  - It is **idempotent** on (`source`, `external_order_id`): a repeated call returns the first order with `duplicate: true`.
  - In one database transaction it locks the products and batches, reserves stock first-in-first-out (and specific serials for serial-tracked items), fails with a plain message if stock is short ("Insufficient sellable stock for ..."), and returns `201 { order_id, order_no, status: "ALLOCATED" }`. It also writes an audit entry and notifies the manager and godown staff.
  - Quantities must be whole pieces. The ERP **does not check `order_amount`** and stores no per-item price, so price validation cannot be delegated to it.
- **Other API files in `app/public/api`:** `product_lookup.php` (needs a staff login and the `manage_products` permission, so it is not a public catalogue) and `notification_count.php` (staff).
- **Licensing:** `app/license_client.php` keeps an installation id and state (`license_client_state`, `license_client_log`) and pages `license_activate.php` / `license_status.php`. The mechanism is the ERP's own business; the storefront backend must not depend on it.
- **Portals:** the five hostnames you listed (superadmin, manager, cashier, godown, centrallicense) were **not contacted**. They are consistent with the roles above but that is all that can be said.

### Competing PHP stub (other repository)
`Pratyangi_Backend_Portal/backend` contains a 47-line PHP `index.php` and `shop_schema.sql` that creates `shop_categories`, `shop_products` and `shop_product_images`, and `docs/STACK.md` plans a PHP shop API. That duplicates the ERP's products and categories. **Recommendation: do not build on it.** `apps/api` is the single store backend (as you decided); products stay in the ERP. Its table names do not collide with ours (`shop_customers`, ...). Please confirm it can be retired, or tell us why it must stay.

## 2. What is NOT known (needs the ERP team, or access we do not have)

1. Whether the ERP's MySQL can be reached from another server (BigRock shared hosting usually allows MySQL only from `localhost`), so a read-only database user may not be possible.
2. Which price the website sells at (`retail_price`, `offer_price`, or `mrp` with a discount), and how the storefront's "compare at" price maps.
3. How SKUs group into one product page, and where product images, descriptions, extra photos, slugs and category images will be maintained (the ERP has one image path per SKU).
4. How the ERP serves product images publicly (`app/public/uploads`), and whether they are suitable for a storefront (size, format).
5. Which locations are enabled for online fulfilment in production, and the real stock-reservation rules (for example, how long an unpaid order may hold stock).
6. How cancellations, returns and refunds should flow: the ERP has `RETURNED` / `CANCELLED` / `REFUNDED` states and return pages (`online_return_receive.php`, `sale_return.php`) but **no API** to cancel or refund from outside, and no payment-gateway integration.
7. How customer-facing order status will reach the website: there is **no API to read an order back** (status, courier, AWB).
8. The ERP's deployment (hosting, PHP version, HTTPS, backups) and how its config key `api.order_ingest_key` is generated and rotated.
9. Whether ERP `customers` (POS customers with a ledger) should ever be linked to website accounts.

## 3. Proposed source of truth

| Data | Owner | Website's access | Rule |
| --- | --- | --- | --- |
| Website customer account, sessions, saved addresses | Store API (`shop_*`) | Direct | The ERP never reads or writes these |
| Products, variants (SKU rows), categories | **ERP** | Read-only through an adapter | Never edited by the website; any website-only content (slug, extra photos, copy) lives in a separate `shop_*` content table keyed by SKU, and is clearly not ERP data |
| Prices and discounts | **ERP** | Read-only | The store API reads the price at checkout from the ERP; the browser's price is ignored |
| Inventory and stock movements | **ERP only** | Read availability; reserve only through the ERP's order API | The website never changes stock. A stock count shown in the browser is a hint; the ERP's reservation is the truth |
| Customer orders | **ERP** (`online_orders`) | Create through the order API; read status back (needs ERP change) | The store API keeps a thin link table (`shop_orders`: our order number, `customer_id`, ERP order id, status copy, address snapshot) so a customer can see their orders. The ERP's status wins on any difference |
| Order status, dispatch, returns, refunds | **ERP** | Read back; request cancellation/return through an agreed endpoint (needs ERP change) | The website shows status; it never decides it |
| Payments | The payment provider, recorded on the order | Provider webhook to the store API, which updates `payment_status` through the ERP | Not designed until a provider is chosen |

**One-writer rule:** every record has exactly one writer. Stock and orders are written only by the ERP; the website asks the ERP to do it. A copy kept on our side is a cache or a link, labelled as such, and is overwritten by the ERP's value.

## 4. Integration options (decide after the ERP team answers section 2)

| Option | What changes | Pros | Cons |
| --- | --- | --- | --- |
| **A. Small read-only JSON API added to the ERP** (catalogue, availability, order status), plus the existing order API | A few new PHP files in the ERP, reviewed by the ERP team | One source of truth, no copies, ERP stays in charge of its data | Touches the ERP (needs their approval); ERP must be reachable over HTTPS |
| **B. Read-only database access** to the ERP's MySQL | A read-only DB user (or views) | No ERP code change | Only works if the databases can reach each other; couples us to the ERP's table layout |
| **C. One-way sync into a read model** (`shop_catalog`, `shop_stock` filled from the ERP on a schedule) | A sync job | Fast storefront; works if only exports are possible | A copy that can be stale; oversell risk unless the ERP's reservation is final (it is); more to maintain |

Recommendation: **A**, with **C** as a fallback if the ERP can only export. In every option the ERP's `order_create.php` reservation is the final stock check, so a stale copy can slow the customer down but cannot oversell.

## 5. Order flow once connected (design, not built)

1. Browser sends only SKUs and quantities. The store API loads each price and availability from the ERP (never from the browser) and recomputes the total, shipping and any coupon.
2. In one database transaction the store API writes `shop_orders` (status `PENDING_PAYMENT`, address snapshot) and calls the ERP's `order_create.php` with `external_order_id` = our order number. A retry returns the same ERP order (idempotent).
3. If the ERP answers "Insufficient sellable stock", nothing is charged and the customer is told which item is short.
4. Payment: after a provider is chosen, a verified webhook marks the order paid; until then cash on delivery is the only honest option. **No fake payment success exists or will be built.**
5. The website shows status read back from the ERP.

## 6. Dependencies and next actions

| Needed | From | For |
| --- | --- | --- |
| Answers to section 2 | ERP team | Choosing option A, B or C |
| Approval (and review) to add read-only endpoints to the ERP | ERP owner | Option A |
| A decision on the PHP stub in `backend/` | Project owner | Avoid two shop backends |
| Price rule and SKU grouping rule | Business | Catalogue API |
| Payment provider and credentials | Business | Payments |
| Email service credentials (SMTP) | Business | Verification and reset emails |
| Google OAuth client ID | Account owner | Google sign-in |
| A host for the API and database | Business (budget approval) | Going live |

Until these arrive, the products, cart and orders endpoints are **not built**. What exists and works locally: accounts, sessions, email verification, password reset, Google sign-in (needs a client ID), and saved addresses.
