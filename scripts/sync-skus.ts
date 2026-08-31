/**
 * Check every SKU in lib/pricing.ts against Prodigi's live catalogue before
 * anyone's money is involved. Prints the paper's real print dimensions so you
 * can see whether a 4:3 photograph is going to survive the sheet.
 *
 *   bun run skus
 */
import { sheets32, sheets43 } from "../lib/pricing";

const BASE = process.env.PRODIGI_BASE_URL ?? "https://api.sandbox.prodigi.com/v4.0";
const KEY = process.env.PRODIGI_API_KEY;

if (!KEY) {
  console.error("Set PRODIGI_API_KEY first.");
  process.exit(1);
}

for (const sheet of [...sheets32, ...sheets43]) {
  const res = await fetch(`${BASE}/products/${sheet.sku}`, {
    headers: { "X-API-Key": KEY },
  });

  if (!res.ok) {
    console.log(`✗ ${sheet.sku.padEnd(22)} ${res.status} — not in the catalogue`);
    continue;
  }

  const { product } = (await res.json()) as {
    product: {
      description: string;
      printAreas?: Record<string, { required: { horizontalResolution: number; verticalResolution: number } }>;
    };
  };

  const area = product.printAreas?.default?.required;
  const ratio = area ? (area.horizontalResolution / area.verticalResolution).toFixed(3) : "?";
  const drift = area ? Math.abs(Number(ratio) - sheet.ratio) : 1;

  console.log(
    `${drift < 0.02 ? "✓" : "!"} ${sheet.sku.padEnd(22)} ratio ${ratio} (we assumed ${sheet.ratio}) — ${product.description}`,
  );
}
