"use client";

import { useState } from "react";

/**
 * The returning-buyer scheme. This owns its own form state: signing up has
 * nothing to do with which frame is selected, so none of it belongs in Store.
 *
 * The endpoint answers the same whether the address was new or already on file,
 * so there is no "you are already a member" branch to render here — that would
 * leak whether somebody has bought from Pete.
 */
export default function RePete() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/repete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setState("done");
      } else {
        setState("error");
        setError(data.error ?? "That did not go through.");
      }
    } catch {
      setState("error");
      setError("No connection. Try again in a moment.");
    }
  }

  return (
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
        {state === "done" ? (
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@somewhere.nz"
              aria-invalid={state === "error" || undefined}
              aria-describedby={error ? "repete-error" : undefined}
              className="min-w-0 flex-1 basis-60 border border-teal-dim bg-shadow px-3.5 py-3 text-[0.92rem] placeholder:text-[#5e6660] focus:border-[var(--accent)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={state === "sending"}
              className="border px-6 py-3 text-[0.88rem] tracking-[0.05em] transition-colors disabled:opacity-60"
              style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
            >
              {state === "sending" ? "Signing you up" : "Join Re-Pete"}
            </button>
          </form>
        )}
        {error && (
          <p id="repete-error" role="alert" className="mt-3 text-[0.85rem]" style={{ color: "var(--accent)" }}>
            {error}
          </p>
        )}
        <p className="mt-4 text-[0.8rem] text-paper-dim">Free. One email when new work lands, nothing else.</p>
      </div>
    </section>
  );
}
