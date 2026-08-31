import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { signedMasterUrl } from "@/lib/masters";
import { createOrder } from "@/lib/prodigi";
import { stripe } from "@/lib/stripe";

// Stripe signs the raw body. Any parsing before verification breaks it.
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: `Bad signature: ${err}` }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const m = session.metadata ?? {};
  // Stripe removed the top-level `shipping_details` from Checkout Sessions.
  // `collected_information` is the only place the address lives now.
  const ship = session.collected_information?.shipping_details;

  if (!ship?.address || !m.slug || !m.sku) {
    // Nothing to print. Return 200 so Stripe stops retrying a payload that
    // will never get better, and page yourself instead.
    console.error("Paid but unprintable", session.id, m);
    return NextResponse.json({ received: true });
  }

  try {
    const { order } = await createOrder({
      // Stripe retries. Without this key a retry prints and posts a second copy.
      idempotencyKey: session.id,
      merchantReference: `${m.slug}/${m.sheet}`,
      shippingMethod: "Standard",
      recipient: {
        name: ship.name,
        email: session.customer_details?.email ?? undefined,
        address: {
          line1: ship.address.line1 ?? "",
          line2: ship.address.line2 ?? undefined,
          townOrCity: ship.address.city ?? "",
          stateOrCounty: ship.address.state ?? undefined,
          postalOrZipCode: ship.address.postal_code ?? "",
          countryCode: ship.address.country ?? "NZ",
        },
      },
      items: [
        {
          sku: m.sku,
          copies: 1,
          // fitPrintArea when the sheet is a different shape to the frame.
          // See lib/pricing.ts — this is the line that stops the lab
          // silently recomposing Pete's photographs.
          sizing: (m.sizing as "fillPrintArea" | "fitPrintArea") ?? "fitPrintArea",
          assets: [{ printArea: "default", url: await signedMasterUrl(m.slug) }],
        },
      ],
    });

    console.log("Prodigi order", order.id, "for", session.id);
  } catch (err) {
    // 500 makes Stripe retry, which is what you want for a transient Prodigi
    // outage. The idempotency key keeps the retry safe.
    console.error("Prodigi order failed", err);
    return NextResponse.json({ error: "fulfilment failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
