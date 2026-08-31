# Handoff

State of the repo as of the first build. Everything below is either already
working or explicitly stubbed. Nothing is half-done and undocumented.

## What runs

`bun install && bun run build` passes on Next 16.3 / React 19.2 / Tailwind v4.3,
type-checked by TypeScript 7. `bun dev` gives the full storefront with all ten
frames. Node 20.9+ is required by Next 16.

Verified on bun 1.3.11 and 1.4.0. `bun.lock` is the text lockfile, which needs
bun 1.2 or newer; 1.4 leaves it byte for byte identical, so the two can share a
branch without fighting over it. Vercel picks its own bun from the lockfile and
documents no way to pin a minor, so nothing here should depend on one.

## File map

| Path | What it is |
|---|---|
| `lib/catalogue.ts` | The ten photos. `ratio` and `accent` are **measured from the files**, not guessed. Titles, places, prices, edition counts are placeholders. |
| `lib/pricing.ts` | Sheets, papers, and `fitFor()` — the ratio logic that stops the lab cropping. Read this one first. |
| `lib/prodigi.ts` | Print API v4 client. `createOrder` takes an idempotency key. |
| `lib/masters.ts` | **Stub.** Needs wiring to real storage. |
| `lib/members.ts` | Re-Pete. The Stripe Customer *is* the member record; there is no table. |
| `lib/site.ts` | This deployment's own origin. Read it before touching `success_url`. |
| `app/thanks/page.tsx` | Where Stripe's `success_url` lands. Reads the session, shows the order. |
| `app/api/repete/route.ts` | Signup. Same answer whether the address is new or known. |
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
   Prodigi's public reference does not list a fine art paper SKU to check them
   against — the examples it gives (`GLOBAL-CFPM-16X20`, `GLOBAL-CAN-10x10`)
   are canvas — so only the account catalogue settles this.
3. **Editions are static numbers in the catalogue file.** `remaining` never
   decrements. Needs a store (Postgres, KV, whatever) before two people can buy
   the last print of an edition of 25.
4. **Re-Pete's early access is still a promise, not a gate.** The 15% and the
   customer record are real; the 48-hour window is not, because nothing in the
   catalogue models a release date. The free NZ/AU shipping line is also not
   implemented — checkout charges no shipping to anyone, so it reads as true
   only by accident.
5. **`/api/repete` has no rate limit.** It is an unauthenticated endpoint that
   creates Stripe Customers. It cannot be used to read anything back, but it
   can be used to fill the account with junk. Put a limiter in front of it
   before launch.
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
- **The site URL is derived, not hardcoded.** Stripe redirects to
  `success_url` and fetches the line item image, so a wrong origin costs a real
  customer. On Vercel the deployment's own hostname is used unless
  `NEXT_PUBLIC_SITE_URL` overrides it, which keeps a preview checkout on the
  preview. Where nothing resolves on Vercel it throws, because `localhost` is
  never the right answer in a deployment.
- **Stripe is the Re-Pete member record.** It already knows who someone is and
  what they have bought, which is exactly what "15% off after your first"
  needs, so there is no members table. This deliberately leaves the store
  choice in open item 3 free.
- **The discount is decided server side, from Stripe's payment history.** The
  browser sends an email; it does not send a price or a claim to be a member.
- **Nothing tells the browser whether an address is a member.** The buy panel
  says the price is applied at checkout rather than previewing it, because an
  endpoint that answers "has this person bought from Pete?" is an enumeration
  oracle over his customer list.
- **`repetePrice` rounds down.** Rounding to nearest delivers 14.92% on the
  sheets that land on a half dollar, and the page promises 15%.
- **Checkout sets `customer_creation: "always"` when there is no customer.**
  Without a Customer attached, a purchase leaves no history, and Re-Pete never
  starts for anyone.
- **Turbopack builds, because Next 16 makes it the default.** There is no
  webpack config to migrate, so nothing opts out. `next build --webpack` is the
  escape hatch if that ever changes.
- **`typecheck` runs `next typegen` first.** Next generates route types into
  `.next/types`, and `next-env.d.ts` is gitignored. Without the typegen step a
  fresh checkout type-checks against types that aren't there yet.
- **TypeScript 7 works because Next shells out to `tsc`.** TS 7 ships no
  JavaScript compiler API (it is the Go binary; an API is promised for 7.1), so
  Next 16.3 runs the project-local CLI instead and documents `typescript@^7` as
  supported. Two consequences: `experimental.useTypeScriptCli: false` would
  fail with `E1467` against TS 7, and build diagnostics are plain `tsc` output
  without Next's route-aware code frames. `tsconfig` keeps `plugins: [next]`
  for editors, which is unrelated to the build.
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
