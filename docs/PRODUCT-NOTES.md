# Amazon teardown: what we're rebuilding

Notes from exploring amazon.com (home, `/s?k=headphones`, `/dp/B0CHWRXH8B`). Most of the
site blocks automated fetches, so this comes from the raw HTML of those pages plus a
walk through the flows by hand.

## Core loop

Home → Search → Product → Cart → Checkout → Order placed. Everything else (Prime Video,
Alexa, seller central, lists, recommendations engine) is out of scope.

## Header (every page)

- Logo (goes home) · "Deliver to <location>" · search bar with a department dropdown
  ("All" by default) · "Hello, sign in / Account & Lists" · "Returns & Orders" · cart
  with item count.
- Dark sub-nav: "All" menu, then department shortcuts (Today's Deals, Electronics…).

## Home

- Hero banner, then a grid of 4-up cards ("Shop by category", "Top deals"…), each a
  2×2 set of images with a "See more" link. Then horizontal product rows.

## Search results (`/s?k=`)

- "1-48 of over N results for "query"" bar with a "Sort by" dropdown: Featured, Price
  low→high, Price high→low, Avg. Customer Review, Newest Arrivals.
- Left rail filter groups: Department, Customer Reviews (4★ & Up), Brands, Price,
  Deals & Discounts (and many category-specific ones we'll skip).
- Result card: badge ("Best Seller", "Amazon's Choice: Overall Pick"), title (clamped),
  stars + compact count "(74.8K)", "10K+ bought in past month", price with superscript
  cents, "List: $x" strike-through, delivery line, Add to cart button.

## Product page (`/dp/<id>`)

- Breadcrumbs, image gallery (thumbnails on the left, hover to switch).
- Title, "Visit the <Brand> Store", rating + count, badge.
- Price block: "-18%" in red, big price, "List Price: $x".
- Overview table (Brand, Color…), "About this item" bullets.
- Buy box: price, delivery date, "In Stock"/"Only 3 left", Quantity select,
  Add to Cart (yellow), Buy Now (orange), ships from / sold by / returns.
- Customer reviews below: rating histogram + review list.

## Cart (`/cart`)

- "Shopping Cart" list: image, title, "In Stock", quantity stepper, Delete.
- Subtotal (N items): $x and "Proceed to checkout" on the right.

## Checkout

- Single page with steps: 1 Delivery address, 2 Payment method, 3 Review items and
  shipping. Right-side order summary with "Place your order".
- Then "Order placed, thanks!" confirmation, and the order shows in Your Orders.

## Build decisions

- Next.js App Router, Tailwind. Catalog: 194 products from DummyJSON, seeded into
  Postgres from `src/data/products.json`.
- Search/filter/sort run on the server from URL params, so results are shareable links.
- First version kept cart and orders in `localStorage`. Replaced with a Postgres backend
  (Next.js Route Handlers, email/password accounts, server-side cart and transactional
  checkout), since the backend is the part that matters for an SWE submission. No real
  payments; the card is only Luhn-checked.
