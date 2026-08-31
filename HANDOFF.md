# Handoff

State of the repo as of the first build. Everything below is either already
working or explicitly stubbed. Nothing is half-done and undocumented.

## What runs

`bun install && bun run build` passes on Next 16.3 / React 19.2 / Tailwind v4.3,
type-checked by TypeScript 7. `bun dev` gives the full storefront with all ten
frames. Node 20.9+ is required by Next 16.

## File map

| Path | What it is |
|---|---|
| `lib/catalogue.ts` | The ten photos. `ratio` and `accent` are **measured from the files**, not guessed. Titles, places, prices, edition counts are placeholders. |
| `lib/pricing.ts` | Sheets, papers, and `fitFor()` — the ratio logic that stops the lab cropping. Read this one first. |
| `lib/prodigi.ts` | Print API v4 client. `createOrder` takes an idempotency key. |
| `lib/masters.ts` | **Stub.** Needs wiring to real storage. |
| `app/store.tsx` | The whole UI, one client component. Per-photo accent via `--accent`. |
| `app/api/checkout/route.ts` | Prices server-side from the catalogue, never from the request body. |
| `app/api/webhooks/stripe/route.ts` | Verify → sign master URL → one Prodigi order. |
| `scripts/sync-skus.ts` | `bun run skus`. Verifies the SKU table against Prodigi. |

## Open, in the order they block launch

1. **`lib/masters.ts` returns a fake URL.** Wire it to Vercel Blob (private) or
   R2 and return a genuinely signed, expiring URL. Until this is real, no order
   can be fulfilled.
2. **SKUs are unverified.** The codes in `lib/pricing.ts` are the right shape
   (`GLOBAL-FAP-16X24`) but were not checked against the account catalogue.
   Run `bun run skus` with a sandbox key and fix what comes back with `✗`.
3. **`/thanks` does not exist.** Stripe's `success_url` points at it.
4. **Editions are static numbers in the catalogue file.** `remaining` never
   decrements. Needs a store (Postgres, KV, whatever) before two people can buy
   the last print of an edition of 25.
5. **Re-Pete is a form that does nothing.** No customer record, no 15%
   application at checkout, no early-access gate.
6. Pete has not confirmed titles, locations, prices or edition sizes.

## Decisions already made, don't undo by accident

- **Ratio before price.** Four frames are 4:3, six are 3:2. `fillPrintArea`
  crops silently and the lab won't query it. `fitFor()` drops to
  `fitPrintArea` when shapes disagree and the buy panel says so in words.
- **Stripe session id is the Prodigi idempotency key.** Stripe retries
  webhooks. Without it a retry prints and posts a second copy.
- **Stripe clients are lazily constructed.** Module-scope `new Stripe()` breaks
  `next build`, which loads every route before env vars exist.
- **`/public/photos` holds 1400px previews only.** Masters never go in git.
- **Accent is per photo, sampled from the image.** The shell stays near-black so
  a green forest frame and a frosted dawn frame each colour their own panel.
- **Sizes sort by price, not by ratio fit.** Fit is communicated by the warning,
  not by reordering the price list into an order nobody expects.
- **Turbopack builds, because Next 16 makes it the default.** There is no
  webpack config to migrate, so nothing opts out. `next build --webpack` is the
  escape hatch if that ever changes.
- **`typecheck` runs `next typegen` first.** Next generates route types into
  `.next/types`, and `next-env.d.ts` is gitignored. Without the typegen step a
  fresh checkout type-checks against types that aren't there yet.
- **The shipping address comes from `collected_information`.** Stripe removed
  the top-level `shipping_details` from Checkout Sessions, so the old fallback
  is gone rather than merely unused.
- **The Stripe SDK pins the API version it ships with** (`2026-08-26.dahlia`).
  Nothing in the code overrides it, so a future SDK bump moves the API version
  too. Re-read the webhook payload handling when that happens.

## House rules

No `CLAUDE.md`, no `.claude/` in this repo. Author is `2701kai`.

`next dev` writes an `AGENTS.md` (and a `CLAUDE.md` that just points at it)
on every run. Both are gitignored rather than committed, so the rule above
survives contact with Next 16. Delete them freely; they come back.
