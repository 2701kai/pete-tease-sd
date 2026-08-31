"use client";

import type { ReactNode } from "react";

export type Option = {
  id: string;
  /** The line that names the thing: "A3", "Baryta Satin 300". */
  label: ReactNode;
  /** The quieter line under it: dimensions, or what the paper is like. */
  note: ReactNode;
  /** Right-hand column: a price, a surcharge, "included". */
  aside: ReactNode;
};

/**
 * The size list and the paper list were the same twenty lines of markup twice
 * over, differing only in where the three strings came from. Selection is drawn
 * with the photograph's own `--accent`, so the control recolours per frame
 * without either list knowing which photograph is showing.
 *
 * Buttons rather than radios: these are already inside a labelled group, and
 * `aria-pressed` carries the state that a radio's checked would.
 */
export default function Choice<T extends Option>({
  legend,
  groupLabel,
  options,
  selectedId,
  onSelect,
}: {
  legend: string;
  groupLabel: string;
  options: T[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <fieldset className="mb-7 min-w-0 border-0 p-0">
      <legend className="mb-3 text-[0.82rem] text-teal">{legend}</legend>
      <div className="grid gap-1.5" role="group" aria-label={groupLabel}>
        {options.map((o) => {
          const on = o.id === selectedId;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(o.id)}
              className="flex w-full items-baseline justify-between gap-4 border px-3.5 py-3 text-left transition-colors"
              style={{
                borderColor: on ? "var(--accent)" : "var(--color-teal-dim)",
                background: on ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent",
              }}
            >
              <span className="text-[0.95rem]">
                {o.label}
                <span className="mt-0.5 block text-[0.78rem] text-paper-dim">{o.note}</span>
              </span>
              <span
                className="whitespace-nowrap text-[0.88rem] tabular-nums"
                style={{ color: on ? "var(--accent)" : undefined }}
              >
                {o.aside}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
