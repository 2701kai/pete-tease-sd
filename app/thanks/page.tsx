import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Stripe from "stripe";
import { bySlug, thumb } from "@/lib/catalogue";
import { nzd, papers, sheetsFor } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Thank you — Pete Noir",
  // Nothing here should ever turn up in a search result.
  robots: { index: false, follow: false },
};

// Stripe is only reachable at request time, and the session id arrives in the
// query string. Never try to prerender this.
export const dynamic = "force-dynamic";

// Lazy: constructing at module scope blows up `next build`, which loads
// every route to collect page data before any env vars exist.
const client = () => new Stripe(process.env.STRIPE_SECRET_KEY!);

function Shell({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <main
      className="mx-auto flex min-h-dvh w-[min(100%-2.5rem,720px)] flex-col justify-center py-[clamp(3rem,10vw,6rem)]"
      style={accent ? ({ "--accent": accent } as CSSProperties) : undefined}
    >
      {children}
    </main>
  );
}

function Quiet({ heading, body }: { heading: string; body: string }) {
  return (
    <Shell>
      <h1 className="font-display text-[clamp(2rem,6vw,3rem)] italic leading-tight">{heading}</h1>
      <p className="mt-4 max-w-[52ch] text-paper-dim">{body}</p>
      <p className="mt-8">
        <Link href="/#buy" className="border-b pb-0.5 text-[0.92rem]" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
          Back to the prints
        </Link>
      </p>
    </Shell>
  );
}

export default async function Thanks({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return (
      <Quiet
        heading="Nothing to show here"
        body="This page is where Stripe sends you after a purchase. Arriving without an order means there is nothing to confirm."
      />
    );
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await client().checkout.sessions.retrieve(session_id);
  } catch (err) {
    // A stale or invented session id lands here. Say so plainly rather than
    // rendering a 500 at somebody who has very likely just paid.
    console.error("Could not retrieve session", session_id, err);
    return (
      <Quiet
        heading="We could not find that order"
        body="The link may have expired. If you have a receipt from Stripe the order is safe — reply to it and Pete will pick it up."
      />
    );
  }

  if (session.payment_status !== "paid") {
    return (
      <Quiet
        heading="That payment has not completed"
        body="Stripe has not marked this order as paid. Nothing has been charged and nothing has been sent to the lab."
      />
    );
  }

  const m = session.metadata ?? {};
  const photo = m.slug ? bySlug(m.slug) : undefined;
  const sheet = photo && m.sheet ? sheetsFor(photo.ratio).find((s) => s.id === m.sheet) : undefined;
  const paper = papers.find((p) => p.id === m.paper);
  const paid = (session.amount_total ?? 0) / 100;
  const ship = session.collected_information?.shipping_details;

  const rows: { k: string; v: string }[] = [];
  if (sheet) rows.push({ k: "Size", v: sheet.label });
  if (paper) rows.push({ k: "Paper", v: paper.name });
  if (photo) rows.push({ k: "Edition", v: `One of ${photo.edition}` });
  if (m.repete === "applied") rows.push({ k: "Re-Pete", v: "15% collector price applied" });
  if (ship?.address?.city) {
    rows.push({
      k: "Shipping to",
      v: [ship.address.city, ship.address.country].filter(Boolean).join(", "),
    });
  }
  if (session.customer_details?.email) {
    rows.push({ k: "Receipt to", v: session.customer_details.email });
  }

  return (
    <Shell accent={photo?.accent}>
      <p className="text-[0.82rem] tracking-[0.14em] text-teal uppercase">Order confirmed</p>
      <h1 className="mt-3 font-display text-[clamp(2.2rem,7vw,3.4rem)] italic leading-[1.05]">
        Thank you.
      </h1>
      <p className="mt-4 max-w-[54ch] text-paper-dim">
        {photo
          ? `${photo.title} is going to the lab nearest you. Printed and dispatched in 2 to 5 working days.`
          : "Your print is going to the lab nearest you. Printed and dispatched in 2 to 5 working days."}
      </p>

      <div className="mt-9 border border-teal-dim bg-shadow">
        {photo && (
          <div className="flex items-center gap-4 border-b border-teal-dim p-4">
            <div className="relative h-16 w-24 flex-none overflow-hidden">
              <Image src={thumb(photo.slug)} alt={photo.note} fill sizes="96px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-[1.2rem] italic leading-tight">{photo.title}</p>
              <p className="mt-0.5 truncate text-[0.82rem] text-paper-dim">{photo.place}</p>
            </div>
          </div>
        )}

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 p-4 text-[0.9rem]">
          {rows.map(({ k, v }) => (
            <div key={k} className="col-span-2 grid grid-cols-subgrid border-b border-teal-dim/60 py-2 last:border-0">
              <dt className="text-paper-dim">{k}</dt>
              <dd className="text-right tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="flex items-baseline justify-between gap-4 border-t border-teal-dim px-4 py-3">
          <span className="text-[0.78rem] text-paper-dim">Paid, GST included</span>
          <span className="font-display text-[1.5rem] tabular-nums">{nzd(paid)}</span>
        </div>
      </div>

      <p className="mt-6 max-w-[54ch] text-[0.85rem] leading-relaxed text-paper-dim">
        Stripe has emailed your receipt. Pete signs the reverse before it ships, so if you want it
        inscribed to somebody, reply to that receipt in the next day or so.
      </p>

      <p className="mt-8">
        <Link href="/#buy" className="border-b pb-0.5 text-[0.92rem]" style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
          Back to the prints
        </Link>
      </p>
    </Shell>
  );
}
