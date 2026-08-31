"use client";

import Image from "next/image";
import { type Photo, thumb } from "@/lib/catalogue";

/**
 * The walk, ordered as it was walked, east to west. Picking a frame here drives
 * the buy panel, so the selected index and the setter stay with Store rather
 * than being duplicated in here.
 */
export default function FilmStrip({
  photos,
  selected,
  onPick,
}: {
  photos: Photo[];
  selected: number;
  onPick: (n: number) => void;
}) {
  return (
    <section id="walk" className="border-t border-teal-dim py-[clamp(3.5rem,8vw,6rem)]">
      <div className="mx-auto mb-7 flex w-[min(100%-2.5rem,1180px)] flex-wrap items-baseline justify-between gap-6">
        <h2 className="font-display text-[clamp(1.7rem,4.6vw,2.4rem)] italic">The walk</h2>
        <p className="text-[0.88rem] text-paper-dim">In the order it happened, inland to the coast.</p>
      </div>

      <div className="overflow-x-auto bg-[#0b0f0d] py-4 [scroll-snap-type:x_mandatory]">
        <div className="perf" role="presentation" />
        <div className="flex gap-2 px-4 py-2">
          {photos.map((p, n) => {
            const on = n === selected;
            return (
              <button
                key={p.slug}
                type="button"
                aria-pressed={on}
                onClick={() => onPick(n)}
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
  );
}
