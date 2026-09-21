# Amazon Clone

A working rebuild of Amazon's core shopping loop, built in 24 hours with Next.js:

**Home → Search → Product → Cart → Checkout → Your Orders**

## What works

- **Home**: hero carousel, category cards, deal and best-seller rows.
- **Search** (`/s?k=`): autocomplete, department dropdown, filters for department,
  customer rating, brand, price band and deals, and five sort orders. Results are
  server-rendered from URL params, so every search is a shareable link.
- **Product** (`/dp/<id>`): image gallery, price with discount and list price, overview
  table, "About this item", buy box with quantity, Add to Cart and Buy Now, related
  products, and a rating histogram with reviews.
- **Cart**: quantity stepper, delete, subtotal. Persists across reloads.
- **Checkout**: validated address, payment (test card or pay on delivery), delivery speed,
  tax and total, then Place your order.
- **Your Orders**: confirmation banner and order history.

## Deliberately left out

Accounts, real payments, a backend database, wishlists and recommendations. Cart and orders
live in `localStorage`. The checkout takes no payment, so use the prefilled test card.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript. The catalog is 194
products from [DummyJSON](https://dummyjson.com), baked into `src/data/products.json`.
Home and product pages are static and revalidate hourly; search renders per request.

```bash
npm install
npm run dev
```

## Process

- `docs/PRODUCT-NOTES.md`: the teardown of amazon.com done before writing code.
- `.agent-logs/`: every prompt and final response from the AI coding sessions, captured
  automatically by hooks (see `CAPTURE-TEST.md`).

Not affiliated with Amazon.com, Inc.
