// Sizes, papers, and the bit that actually matters: matching a photo's aspect
// ratio to a sheet so Prodigi doesn't crop the picture to make it fit.
//
// Four of Pete's ten frames are 4:3 and six are 3:2. Sending a 4:3 file to a
// 3:2 sheet with sizing "fillPrintArea" silently eats ~11% off two edges. The
// lab will not query it, the customer will just get a differently composed
// photograph. So we pick the sheet by ratio, and where the ratio can't match we
// fall back to "fitPrintArea" (image whole, paper border) and say so in the UI.

export type Paper = {
  id: string;
  name: string;
  note: string;
  /** surcharge in NZD over the base size price */
  surcharge: number;
  /** the SKU family prefix this paper maps to in Prodigi's catalogue */
  skuFamily: string;
};

export type Sheet = {
  id: string;
  label: string;
  /** short side x long side in mm */
  mm: [number, number];
  ratio: number;
  price: number;
  /**
   * Prodigi SKU. Run `bun run skus` to check these against the live product
   * catalogue before taking real money. The shape is right; the exact codes
   * must come from Prodigi's Product Details endpoint for your account.
   */
  sku: string;
};

export const papers: Paper[] = [
  {
    id: "photo-rag",
    name: "Hahnemühle Photo Rag 308",
    note: "Cotton rag, matte. Deepest black, no reflections.",
    surcharge: 0,
    skuFamily: "GLOBAL-FAP",
  },
  {
    id: "baryta",
    name: "Baryta Satin 300",
    note: "Silver-gelatin surface. More bite in stars and water.",
    surcharge: 60,
    skuFamily: "GLOBAL-FAP",
  },
];

/** 3:2 sheets, for the six frames shot 3:2. */
export const sheets32: Sheet[] = [
  { id: "s32-a3", label: "A3", mm: [297, 420], ratio: 1.414, price: 145, sku: "GLOBAL-FAP-A3" },
  { id: "s32-12x18", label: "12 × 18 in", mm: [305, 457], ratio: 1.5, price: 245, sku: "GLOBAL-FAP-12X18" },
  { id: "s32-16x24", label: "16 × 24 in", mm: [406, 610], ratio: 1.5, price: 395, sku: "GLOBAL-FAP-16X24" },
  { id: "s32-24x36", label: "24 × 36 in", mm: [610, 914], ratio: 1.5, price: 590, sku: "GLOBAL-FAP-24X36" },
];

/** 4:3 sheets, for the four frames shot 4:3. */
export const sheets43: Sheet[] = [
  { id: "s43-a3", label: "A3", mm: [297, 420], ratio: 1.414, price: 145, sku: "GLOBAL-FAP-A3" },
  { id: "s43-12x16", label: "12 × 16 in", mm: [305, 406], ratio: 1.333, price: 245, sku: "GLOBAL-FAP-12X16" },
  { id: "s43-18x24", label: "18 × 24 in", mm: [457, 610], ratio: 1.333, price: 395, sku: "GLOBAL-FAP-18X24" },
  { id: "s43-24x32", label: "24 × 32 in", mm: [610, 813], ratio: 1.333, price: 590, sku: "GLOBAL-FAP-24X32" },
];

/**
 * Sheets on offer for a given photo, cheapest first because that is how people
 * read a price list. The ratio work happens in fitFor, not by reordering the
 * options into an order nobody expects.
 */
export function sheetsFor(photoRatio: number): Sheet[] {
  const pool = photoRatio < 1.45 ? sheets43 : sheets32;
  return [...pool].sort((a, b) => a.price - b.price);
}

export type Fit = {
  /** what we send Prodigi as `sizing` */
  sizing: "fillPrintArea" | "fitPrintArea";
  /** fraction of the image lost if we filled, 0 to 1 */
  cropped: number;
  /** plain sentence for the buy panel, or null when there's nothing to say */
  warning: string | null;
};

const CROP_TOLERANCE = 0.015; // ~1.5% off an edge is inside trimming anyway

export function fitFor(photoRatio: number, sheet: Sheet): Fit {
  const wide = Math.max(photoRatio, sheet.ratio);
  const narrow = Math.min(photoRatio, sheet.ratio);
  const cropped = 1 - narrow / wide;

  if (cropped <= CROP_TOLERANCE) {
    return { sizing: "fillPrintArea", cropped, warning: null };
  }

  const pct = Math.round(cropped * 100);
  return {
    sizing: "fitPrintArea",
    cropped,
    warning:
      `This sheet is a different shape to the photograph. Printed whole with a ` +
      `border rather than cropping ${pct}% off the frame.`,
  };
}

export function priceOf(sheet: Sheet, paper: Paper): number {
  return sheet.price + paper.surcharge;
}

/** Re-Pete: 15% off every print after the first. See lib/members.ts. */
export const REPETE_RATE = 0.15;

/**
 * Whole dollars, because every other price in the catalogue is one and a
 * checkout line reading NZ$335.75 would look like a mistake rather than a
 * discount.
 *
 * Rounds down, not to nearest. The page promises 15% off, and rounding to
 * nearest quietly delivers 14.92% on the sheets that land on a half dollar —
 * charging NZ$502 where the promise is NZ$501.50. Down is always at least the
 * 15% advertised, and costs Pete at most a dollar a print.
 */
export function repetePrice(full: number): number {
  return Math.floor(full * (1 - REPETE_RATE));
}

/** Explicitly NZ$, not $. Half the customers are not in New Zealand. */
export const nzd = (n: number) =>
  "NZ$" + new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 0 }).format(n);
