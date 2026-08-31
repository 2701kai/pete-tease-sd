"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { preview, thumb, type Photo } from "@/lib/catalogue";
import { fitFor, nzd, papers, priceOf, sheetsFor } from "@/lib/pricing";

export default function Store({ photos }: { photos: Photo[] }) {
  const [i, setI] = useState(0);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [paperId, setPaperId] = useState(papers[0].id);
  const [busy, setBusy] = useState(false);
  // The address a returning buyer gives so the Re-Pete price can be looked up.
  // It is only a hint: the discount is decided server side from Stripe.
  const [buyerEmail, setBuyerEmail] = useState("");
  const [joinEmail, setJoinEmail] = useState("");
  const [joinState, setJoinState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [joinError, setJoinError] = useState<string | null>(null);

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

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setJoinState("sending");
    setJoinError(null);
    try {
      const res = await fetch("/api/repete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: joinEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setJoinState("done");
      } else {
        setJoinState("error");
        setJoinError(data.error ?? "That did not go through.");
      }
    } catch {
      setJoinState("error");
      setJoinError("No connection. Try again in a moment.");
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

          <fieldset className="mb-7 min-w-0 border-0 p-0">
            <legend className="mb-3 text-[0.82rem] text-teal">Size</legend>
            <div className="grid gap-1.5" role="group" aria-label="Print size">
              {sheets.map((s) => {
                const on = s.id === sheet.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSheetId(s.id)}
                    className="flex w-full items-baseline justify-between gap-4 border px-3.5 py-3 text-left transition-colors"
                    style={{
                      borderColor: on ? "var(--accent)" : "var(--color-teal-dim)",
                      background: on ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent",
                    }}
                  >
                    <span className="text-[0.95rem]">
                      {s.label}
                      <span className="mt-0.5 block text-[0.78rem] text-paper-dim">
                        {s.mm[0]} × {s.mm[1]} mm
                      </span>
                    </span>
                    <span className="whitespace-nowrap text-[0.88rem] tabular-nums" style={{ color: on ? "var(--accent)" : undefined }}>
                      {nzd(s.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mb-7 min-w-0 border-0 p-0">
            <legend className="mb-3 text-[0.82rem] text-teal">Paper</legend>
            <div className="grid gap-1.5" role="group" aria-label="Paper stock">
              {papers.map((p) => {
                const on = p.id === paper.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPaperId(p.id)}
                    className="flex w-full items-baseline justify-between gap-4 border px-3.5 py-3 text-left transition-colors"
                    style={{
                      borderColor: on ? "var(--accent)" : "var(--color-teal-dim)",
                      background: on ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent",
                    }}
                  >
                    <span className="text-[0.95rem]">
                      {p.name}
                      <span className="mt-0.5 block text-[0.78rem] text-paper-dim">{p.note}</span>
                    </span>
                    <span className="whitespace-nowrap text-[0.88rem] tabular-nums" style={{ color: on ? "var(--accent)" : undefined }}>
                      {p.surcharge === 0 ? "included" : `+ ${nzd(p.surcharge)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

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

      {/* The walk. Ordered as it was walked, east to west. */}
      <section id="walk" className="border-t border-teal-dim py-[clamp(3.5rem,8vw,6rem)]">
        <div className="mx-auto mb-7 flex w-[min(100%-2.5rem,1180px)] flex-wrap items-baseline justify-between gap-6">
          <h2 className="font-display text-[clamp(1.7rem,4.6vw,2.4rem)] italic">The walk</h2>
          <p className="text-[0.88rem] text-paper-dim">In the order it happened, inland to the coast.</p>
        </div>

        <div className="overflow-x-auto bg-[#0b0f0d] py-4 [scroll-snap-type:x_mandatory]">
          <div className="perf" role="presentation" />
          <div className="flex gap-2 px-4 py-2">
            {photos.map((p, n) => {
              const on = n === i;
              return (
                <button
                  key={p.slug}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pick(n)}
                  className="relative w-[min(74vw,278px)] flex-none bg-black text-left [scroll-snap-align:center]"
                >
                  <div className="relative aspect-[3/2] w-full">
                    <Image
                      src={thumb(p.slug)}
                      alt={p.title}
                      fill
                      sizes="278px"
                      className="object-cover transition-opacity"
                      style={{ opacity: on ? 1 : 0.62 }}
                    />
                  </div>
                  <svg
                    className="pointer-events-none absolute -inset-[7px] grease"
                    viewBox="0 0 300 210"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    style={{ opacity: on ? 1 : 0, ["--accent" as string]: p.accent }}
                  >
                    <path d="M14 22 C 60 6, 240 4, 288 20 C 297 60, 296 156, 287 190 C 232 205, 62 206, 12 189 C 4 150, 5 58, 15 21" />
                  </svg>
                  <span className="flex items-baseline justify-between gap-3 px-0.5 pt-2 text-[0.76rem] text-paper-dim">
                    <span className={on ? "text-paper" : undefined}>{p.title}</span>
                    <span className="text-teal tabular-nums">{String(n + 1).padStart(2, "0")}A</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="perf" role="presentation" />
        </div>
      </section>

      {/* Re-Pete */}
      <section id="repete" className="mx-auto grid w-[min(100%-2.5rem,1180px)] gap-[clamp(1.8rem,4vw,3.5rem)] border-t border-teal-dim py-[clamp(3.5rem,8vw,6rem)] lg:grid-cols-[auto_1fr] lg:items-start">
        <p className="font-display text-[clamp(2.6rem,9vw,4.6rem)] font-semibold leading-[0.9] whitespace-nowrap">
          Re<span className="text-paper/60">-</span>Pete
        </p>
        <div>
          <h2 className="mb-3 text-[1.06rem] font-semibold">For anyone who comes back for a second frame</h2>
          <p className="mb-5 max-w-[64ch] text-paper-dim">
            These were shot as one walk, so they hang as one walk. Buy a second and the collector price applies to that
            one and every one after it.
          </p>
          <ul className="mb-7 max-w-[64ch] list-none p-0">
            {[
              ["15%", "off every print after your first, forever, no code needed"],
              ["48 h", "early access to new work before it goes public"],
              ["Free", "shipping within New Zealand and Australia"],
              ["Match", "Pete keeps your paper and size on file so a pair actually hangs as a pair"],
            ].map(([k, v]) => (
              <li key={k} className="flex gap-4 border-t border-teal-dim py-2.5 text-[0.94rem]">
                <b className="w-[4.2rem] flex-none font-medium tabular-nums" style={{ color: "var(--accent)" }}>
                  {k}
                </b>
                <span>{v}</span>
              </li>
            ))}
          </ul>
          {joinState === "done" ? (
            <p
              className="max-w-[64ch] border-l-2 py-1 pl-3 text-[0.94rem]"
              style={{ borderColor: "var(--accent)" }}
              role="status"
            >
              You&apos;re in. Use that address at checkout and the collector price applies from your
              second print onward.
            </p>
          ) : (
            <form className="flex max-w-[64ch] flex-wrap gap-2" onSubmit={join}>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={joinEmail}
                onChange={(e) => setJoinEmail(e.target.value)}
                placeholder="you@somewhere.nz"
                aria-invalid={joinState === "error" || undefined}
                aria-describedby={joinError ? "repete-error" : undefined}
                className="min-w-0 flex-1 basis-60 border border-teal-dim bg-shadow px-3.5 py-3 text-[0.92rem] placeholder:text-[#5e6660] focus:border-[var(--accent)] focus:outline-none"
              />
              <button
                type="submit"
                disabled={joinState === "sending"}
                className="border px-6 py-3 text-[0.88rem] tracking-[0.05em] transition-colors disabled:opacity-60"
                style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
              >
                {joinState === "sending" ? "Signing you up" : "Join Re-Pete"}
              </button>
            </form>
          )}
          {joinError && (
            <p id="repete-error" role="alert" className="mt-3 text-[0.85rem]" style={{ color: "var(--accent)" }}>
              {joinError}
            </p>
          )}
          <p className="mt-4 text-[0.8rem] text-paper-dim">Free. One email when new work lands, nothing else.</p>
        </div>
      </section>

      <footer id="about" className="border-t border-teal-dim py-[clamp(2.5rem,6vw,4rem)] text-[0.87rem]">
        <div className="mx-auto w-[min(100%-2.5rem,1180px)]">
          <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <h3 className="mb-2 font-display text-[1.35rem] italic">For Pete&apos;s sake</h3>
              <p className="mb-3 max-w-[42ch] text-paper-dim">
                Pete Noir is Pete, a photographer who walks in first and sets up second. He shoots long, prints large,
                and answers his own email.
              </p>
              <p className="text-paper-dim">Aotearoa New Zealand</p>
            </div>
            <div>
              <h3 className="mb-2 font-display text-[1.35rem] italic">Prints</h3>
              <ul className="list-none p-0 text-paper-dim">
                {["Sizes and papers", "Editions and certificates", "Shipping and returns", "Framing"].map((t) => (
                  <li key={t} className="py-1">
                    <a href="#buy" className="hover:text-paper">
                      {t}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-display text-[1.35rem] italic">Elsewhere</h3>
              <ul className="list-none p-0 text-paper-dim">
                {["Instagram", "Licensing and commissions", "Contact Pete"].map((t) => (
                  <li key={t} className="py-1">
                    <a href="#about" className="hover:text-paper">
                      {t}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-teal-dim pt-5 text-[0.78rem] text-[#5e6660]">
            <span>© {new Date().getFullYear()} Pete Noir. Photographs may not be reproduced.</span>
            <span>Prices in NZD, GST included.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
