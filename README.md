# pete-tease-sd

Pete Noir. Night and weather photographs from one walk across Kahurangi
National Park, sold as limited edition prints and fulfilled by a print lab near
whoever bought them.

## Running it

```bash
bun install
cp .env.example .env.local   # fill it in
bun dev
```

Node 20.9+, per Next 16. `bun run typecheck` runs `next typegen` before `tsc`,
because the generated route types are not in git.

## How a print actually gets made

1. Someone picks a frame, a sheet and a paper. The browser sends only ids.
2. `app/api/checkout/route.ts` looks the price up **server side** from
   `lib/pricing.ts` and opens a Stripe Checkout session. The chosen SKU and the
   `sizing` decision ride along in session metadata.
3. Stripe takes the money and collects a shipping address.
4. `app/api/webhooks/stripe/route.ts` verifies the signature, mints a
   short-lived signed URL to the print master, and posts one order to Prodigi.
   The Stripe session id is the idempotency key, so a webhook retry cannot
   print a second copy.
5. Prodigi routes to the nearest lab and ships white-label.

## The thing that will bite you

Four of the ten frames are 4:3 and six are 3:2. Prodigi's default `sizing` is
`fillPrintArea`, which crops whatever does not fit. A 4:3 photograph on a 3:2
sheet loses about 11% off two edges, the lab will not query it, and the
customer receives a differently composed photograph.

`lib/pricing.ts` therefore offers sheets by ratio family and falls back to
`fitPrintArea` when the shapes disagree, and the buy panel says so out loud.
Run `bun run skus` to verify the SKU table against Prodigi's real catalogue
before going live.

## Re-Pete

The returning-buyer scheme. There is no members table: the Stripe Customer is
the member record, because Stripe already holds both facts the scheme needs —
who someone is, and what they have already bought.

Signing up (`/api/repete`) creates or flags a Stripe Customer. At checkout the
buyer may give that address; `app/api/checkout/route.ts` looks up their paid
Checkout Sessions and applies 15% **server side** if there is at least one. The
browser never sends a price or a claim to membership, and the site never tells
the browser whether an address is known — that would be an enumeration oracle
over Pete's customer list.

## Masters

`/public/photos` holds 1400px previews only. The print-resolution files live in
private storage and are handed to Prodigi as expiring signed URLs, minted
inside the webhook. See `lib/masters.ts` — it needs wiring to whichever bucket
you pick.

## Placeholders

Titles, locations, prices, edition sizes and remaining counts are invented.
The locations are inferred from a DOC sign in one frame that points to Perry
Saddle and Saxon huts, which puts the set on the Heaphy Track. Pete confirms
all of it before launch.
