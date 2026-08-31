import { NextResponse } from "next/server";
import Stripe from "stripe";
import { bySlug } from "@/lib/catalogue";
import { type Membership, membershipFor, normaliseEmail } from "@/lib/members";
import { fitFor, papers, priceOf, repetePrice, sheetsFor } from "@/lib/pricing";
import { siteUrl } from "@/lib/site";

// Lazy: constructing at module scope blows up `next build`, which loads
// every route to collect page data before any env vars exist.
const client = () => new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { slug, sheetId, paperId, email } = await req.json();

  // Price on the server from the catalogue, never from the request body.
  // Otherwise the A2 costs whatever the browser feels like today.
  const photo = bySlug(slug);
  const sheet = photo ? sheetsFor(photo.ratio).find((s) => s.id === sheetId) : undefined;
  const paper = papers.find((p) => p.id === paperId);

  if (!photo || !sheet || !paper) {
    return NextResponse.json({ error: "Unknown print" }, { status: 400 });
  }
  if (photo.remaining <= 0) {
    return NextResponse.json({ error: "Edition sold out" }, { status: 409 });
  }

  const stripe = client();
  const fit = fitFor(photo.ratio, sheet);
  const full = priceOf(sheet, paper);
  const site = siteUrl();

  // The Re-Pete price is decided here, from Stripe's payment history, and never
  // from anything the browser claims. An unknown address simply pays full price.
  const buyer = normaliseEmail(email);
  let member: Membership | null = null;
  if (buyer) {
    try {
      member = await membershipFor(stripe, buyer);
    } catch (err) {
      // A lookup failure must not cost someone their checkout. Full price is
      // the wrong answer, but it is a recoverable one.
      console.error("Re-Pete lookup failed, charging full price", err);
    }
  }

  const entitled = member?.entitled ?? false;
  const amount = entitled ? repetePrice(full) : full;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    // Prodigi needs a real address to route to a lab, and GST needs a country.
    shipping_address_collection: {
      allowed_countries: ["NZ", "AU", "GB", "US", "CA", "DE", "AT", "CH", "NL", "FR", "IE"],
    },
    automatic_tax: { enabled: true },
    // Attach to the known customer so this purchase counts towards their next
    // print. Where there is no record yet, make one: without a Customer the
    // payment history has nothing to hang off and Re-Pete never starts.
    ...(member
      ? { customer: member.customer }
      : { customer_creation: "always" as const, ...(buyer ? { customer_email: buyer } : {}) }),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "nzd",
          unit_amount: amount * 100,
          // Stripe Tax needs this to work out GST vs VAT vs nothing.
          tax_behavior: "inclusive",
          product_data: {
            name: `${photo.title} — ${sheet.label}`,
            description: entitled
              ? `${paper.name}. Edition of ${photo.edition}. Re-Pete price, 15% off ${full}.`
              : `${paper.name}. Edition of ${photo.edition}.`,
            images: [`${site}/photos/${photo.slug}-thumb.jpg`],
          },
        },
      },
    ],
    // Everything the webhook needs to place the print order, and nothing the
    // customer can tamper with, because Stripe echoes it back signed.
    metadata: {
      slug: photo.slug,
      sku: sheet.sku,
      sizing: fit.sizing,
      paper: paper.id,
      sheet: sheet.id,
      repete: entitled ? "applied" : "no",
    },
    success_url: `${site}/thanks?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/#${photo.slug}`,
  });

  return NextResponse.json({ url: session.url });
}
