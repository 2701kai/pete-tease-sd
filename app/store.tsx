"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { preview, type Photo } from "@/lib/catalogue";
import { fitFor, nzd, papers, priceOf, sheetsFor } from "@/lib/pricing";
import Choice from "./_components/Choice";
import FilmStrip from "./_components/FilmStrip";
import RePete from "./_components/RePete";
import SiteFooter from "./_components/SiteFooter";

export default function Store({ photos }: { photos: Photo[] }) {
  const [i, setI] = useState(0);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [paperId, setPaperId] = useState(papers[0].id);
  const [busy, setBusy] = useState(false);
  // The address a returning buyer gives so the Re-Pete price can be looked up.
  // It is only a hint: the discount is decided server side from Stripe.
  const [buyerEmail, setBuyerEmail] = useState("");

  const photo = photos[i];
  const sheets = useMemo(() => sheetsFor(photo.ratio), [photo.ratio]);
  const sheet = sheets.find((s) => s.id === sheetId) ?? sheets[1] ?? sheets[0];
  const paper = papers.find((p) => p.id === paperId)!;
  const fit = fitFor(photo.ratio, sheet);

  function pick(n: number) {
    setI(n);
    setSheetId(null); // sheet ids differ between the 3:2 and 4:3 pools
  }

  async function checkout() {
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: photo.slug,
          sheetId: sheet.id,
          paperId: paper.id,
          email: buyerEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "Checkout is not available right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ ["--accent" as string]: photo.accent }}>
      {/* Establishing shot. The title card comes after, like a film. */}
      <div className="relative bg-black">
        <header className="absolute inset-x-0 top-0 z-10 py-5">
          <div className="mx-auto flex w-[min(100%-2.5rem,1180px)] items-baseline justify-between gap-4">
            <a href="#" className="font-display text-[1.05rem] tracking-[0.34em] indent-[0.34em] drop-shadow-[0_1px_14px_rgba(0,0,0,.9)]">
              PETE NOIR
            </a>
            <nav className="hidden gap-6 text-[0.82rem] md:flex" aria-label="Main">
              {[["#buy", "Prints"], ["#walk", "The walk"], ["#repete", "Re-Pete"], ["#about", "For Pete's sake"]].map(
                ([href, label]) => (
                  <a key={href} href={href} className="border-b border-transparent pb-0.5 opacity-80 hover:border-[var(--accent)] hover:opacity-100">
                    {label}
                  </a>
                ),
              )}
            </nav>
          </div>
        </header>

        <div className="relative aspect-[3/2] w-full">
          <Image src={preview(photo.slug)} alt={photo.note} fill priority sizes="100vw" className="object-cover" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,7,6,.78)_0%,rgba(4,7,6,0)_30%,rgba(4,7,6,.5)_60%,rgba(4,7,6,.97)_100%)]" />

        <div className="absolute inset-x-0 bottom-0 z-10 pb-4 md:pb-6">
          <div className="mx-auto flex w-[min(100%-2.5rem,1180px)] flex-col items-start gap-1 md:flex-row md:items-end md:justify-between md:gap-8">
            <div>
              <h1 className="font-display text-[clamp(1.35rem,5.4vw,2.4rem)] italic leading-tight">{photo.title}</h1>
              <p className="text-[0.78rem] text-paper-dim md:text-[0.82rem]">
                <span className="text-paper">{photo.place}</span>
              </p>
            </div>
            <p className="text-[0.78rem] text-paper-dim md:text-[0.82rem]">
              Edition of {photo.edition} · <span className="text-paper">{photo.remaining} remaining</span>
            </p>
          </div>
        </div>
      </div>

      {/* Title card */}
      <section className="mx-auto w-[min(100%-2.5rem,1180px)] pt-[clamp(4rem,11vw,7.5rem)] pb-[clamp(3rem,7vw,4.5rem)] text-center">
        <p className="font-display text-[clamp(2.7rem,13.5vw,8.5rem)] font-semibold leading-[0.86] tracking-[0.02em]">PETE NOIR</p>
        <div className="mx-auto my-[clamp(1.4rem,3vw,2rem)] h-px w-[min(100%,540px)] bg-[linear-gradient(90deg,transparent,var(--color-teal)_22%,var(--color-teal)_78%,transparent)]" />
        <p className="mx-auto max-w-[26ch] font-display text-[clamp(1.05rem,3.2vw,1.5rem)] italic">
          Every shot is a shot in the dark.
        </p>
        <p className="mx-auto mt-6 max-w-[52ch] text-[0.95rem] text-paper-dim">
          One track, coast to coast, in every weather it offered. The prints are made at the lab closest to you and
          arrive flat, signed and numbered.
        </p>
      </section>

      {/* Buy */}
      <section id="buy" className="mx-auto grid w-[min(100%-2.5rem,1180px)] gap-[clamp(2rem,5vw,4rem)] pb-[clamp(3.5rem,8vw,6rem)] lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div>
          <figure className="border border-teal-dim bg-shadow p-2">
            <div className="relative w-full" style={{ aspectRatio: String(photo.ratio) }}>
              <Image src={preview(photo.slug)} alt={photo.note} fill sizes="(min-width:1024px) 55vw, 100vw" className="object-cover" />
            </div>
          </figure>
          <p className="flex justify-between gap-4 px-0.5 pt-3 text-[0.78rem] text-paper-dim">
            <span>
              Frame {String(i + 1).padStart(2, "0")}A · {photo.ratio < 1.45 ? "4:3" : "3:2"}
            </span>
            <span>Signed on the reverse</span>
          </p>
        </div>

        <div>
          <h2 className="font-display text-[clamp(1.7rem,4.6vw,2.5rem)] italic leading-tight">{photo.title}</h2>
          <p className="mt-1 mb-7 text-[0.9rem] text-paper-dim">{photo.note}</p>

          <Choice
            legend="Size"
            groupLabel="Print size"
            selectedId={sheet.id}
            onSelect={setSheetId}
            options={sheets.map((s) => ({
              id: s.id,
              label: s.label,
              note: `${s.mm[0]} × ${s.mm[1]} mm`,
              aside: nzd(s.price),
            }))}
          />

          <Choice
            legend="Paper"
            groupLabel="Paper stock"
            selectedId={paper.id}
            onSelect={setPaperId}
            options={papers.map((p) => ({
              id: p.id,
              label: p.name,
              note: p.note,
              aside: p.surcharge === 0 ? "included" : `+ ${nzd(p.surcharge)}`,
            }))}
          />

          {fit.warning && (
            <p className="mb-5 border-l-2 py-1 pl-3 text-[0.85rem] text-paper-dim" style={{ borderColor: "var(--accent)" }}>
              {fit.warning}
            </p>
          )}

          <div className="mb-5 border-t border-teal-dim pt-5">
            <label htmlFor="buyer-email" className="mb-2 block text-[0.82rem] text-teal">
              Bought before?
            </label>
            <input
              id="buyer-email"
              type="email"
              autoComplete="email"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              placeholder="you@somewhere.nz"
              className="w-full border border-teal-dim bg-shadow px-3.5 py-3 text-[0.92rem] placeholder:text-[#5e6660] focus:border-[var(--accent)] focus:outline-none"
            />
            <p className="mt-2 text-[0.78rem] text-paper-dim">
              Optional. Your Re-Pete price is applied at checkout, no code needed.
            </p>
          </div>

          <div className="mb-4 flex items-baseline justify-between gap-4 border-t border-teal-dim pt-5">
            <span className="text-[0.78rem] text-paper-dim">Total, GST included</span>
            <span className="font-display text-[2rem] tabular-nums">{nzd(priceOf(sheet, paper))}</span>
          </div>

          <button
            type="button"
            onClick={checkout}
            disabled={busy || photo.remaining <= 0}
            className="block w-full py-4 text-[0.92rem] font-bold tracking-[0.06em] text-[#140a02] transition-[filter] hover:brightness-110 disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {photo.remaining <= 0 ? "Edition sold out" : busy ? "Taking you to checkout" : "Buy this print"}
          </button>

          <p className="mt-4 text-[0.82rem] leading-relaxed text-paper-dim">
            Printed and dispatched in 2 to 5 working days. New Zealand orders are made in New Zealand; everywhere else
            prints at the nearest lab, so nothing crosses the Pacific in a tube.
          </p>
        </div>
      </section>

      <FilmStrip photos={photos} selected={i} onPick={pick} />

      <RePete />

      <SiteFooter />
    </div>
  );
}
