# Amazon Clone

A working rebuild of Amazon's core shopping loop, built in 24 hours with Next.js:

**Home → Search → Product → Cart → Checkout → Your Orders**

## What works

- **Home**: hero carousel, category cards, deal and best-seller rows.
- **Search** (`/s?k=`): debounced suggestions, department dropdown, filters for department,
  customer rating, brand, price band and deals, five sort orders and pagination. Every
  search is a shareable URL.
- **Product** (`/dp/<id>`): image gallery, discount and list price, overview table, buy box
  with live stock, Add to Cart / Buy Now, related products, rating histogram and reviews.
- **Accounts**: register, sign in, sign out. A guest cart is merged into the account on sign-in.
- **Cart**: stored server-side per user or guest, with live prices and stock checks.
- **Checkout**: sign-in required; address, payment (Luhn-checked test card, or pay on
  delivery) and delivery speed. Totals are always computed on the server.
- **Orders**: history, order details and cancellation (which restocks the items).

## Backend

Next.js Route Handlers over Postgres (Neon in production), with Drizzle ORM.

| Method | Route | |
|---|---|---|
| GET | `/api/products` | Search: `k, i, brand, rating, min, max, deals, sort, page` → items, total, facets |
| GET | `/api/products/suggest?q=` | Autocomplete |
| GET | `/api/products/:id` | Product detail |
| GET | `/api/cart` | Current cart (user or guest) |
| POST | `/api/cart/items` | `{ productId, qty }` |
| PATCH / DELETE | `/api/cart/items/:productId` | Set quantity (`0` removes) / remove |
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | Session auth |
| GET | `/api/auth/me` | Current user |
| GET / POST | `/api/orders` | List orders / place an order from the cart |
| GET | `/api/orders/:id` | Order detail (owner only) |
| POST | `/api/orders/:id/cancel` | Cancel and restock |

Errors share one shape: `{ error: { code, message, fields? } }`, with 422 for validation,
401 when signed out, 404 for missing or unowned resources, and 409 for stock conflicts.

Design notes:

- **Stock can't oversell.** Checkout runs in one transaction and decrements stock with a
  conditional `UPDATE … WHERE stock >= qty`. Two buyers racing for the last unit get one
  order and one 409. There's a test for this.
- **Money is integer cents**, and pricing (`src/lib/pricing.ts`) is shared, so the checkout
  UI shows exactly what the server charges.
- **Order lines snapshot title and price**, so order history survives catalog changes.
- **Auth**: scrypt password hashes; random session tokens in an httpOnly cookie, stored
  only as SHA-256 hashes; the same error for a wrong email or password.
- **Only the card's last 4 digits are stored.** No payment is taken.
- Pages read the service layer (`src/server/*`) directly; the API exposes the same
  services to the client.

## Deliberately left out

Real payments, email, password reset, rate limiting, wishlists and recommendations.

## Stack

Next.js 16 (App Router) · React 19 · Postgres · Drizzle ORM · Zod · SWR · Tailwind CSS 4 ·
Vitest. The catalog is 194 products from [DummyJSON](https://dummyjson.com), seeded
from `src/data/products.json`.

## Running locally

```bash
docker run -d --name amazon-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=amazon -p 5433:5432 postgres:17-alpine
docker exec amazon-pg psql -U postgres -c "create database amazon_test"
echo "DATABASE_URL=postgres://postgres:postgres@localhost:5433/amazon" > .env.development.local
npm install
export $(cat .env.development.local) && npm run db:migrate && npm run db:seed
npm run dev
npm test   # unit + DB integration tests against amazon_test
```

On Vercel, `vercel-build` runs migrations and the seed before `next build`. The seed never
resets live stock.

## Process

- `docs/PRODUCT-NOTES.md`: the teardown of amazon.com done before writing code.
- `.agent-logs/`: every prompt and final response from the AI coding sessions, captured
  automatically by hooks (see `CAPTURE-TEST.md`).

Not affiliated with Amazon.com, Inc.
