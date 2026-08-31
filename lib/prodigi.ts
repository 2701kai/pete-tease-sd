// Prodigi Print API v4. Docs: https://www.prodigi.com/print-api/docs/reference/
// Sandbox: https://api.sandbox.prodigi.com/v4.0  Live: https://api.prodigi.com/v4.0

const BASE = process.env.PRODIGI_BASE_URL ?? "https://api.sandbox.prodigi.com/v4.0";

export type Recipient = {
  name: string;
  email?: string;
  address: {
    line1: string;
    line2?: string;
    townOrCity: string;
    stateOrCounty?: string;
    postalOrZipCode: string;
    /** ISO-3166 alpha-2. Prodigi routes to the nearest lab from this. */
    countryCode: string;
  };
};

export type OrderItem = {
  sku: string;
  copies: number;
  sizing: "fillPrintArea" | "fitPrintArea";
  assets: { printArea: "default"; url: string; md5Hash?: string }[];
};

export type CreatedOrder = { order: { id: string; status: { stage: string } } };

async function call<T>(path: string, body: unknown): Promise<T> {
  const key = process.env.PRODIGI_API_KEY;
  if (!key) throw new Error("PRODIGI_API_KEY is not set");

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "X-API-Key": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    // Prodigi tells you what was wrong with the payload. Keep it in the log,
    // it is the difference between a five minute fix and an afternoon.
    throw new Error(`Prodigi ${res.status} on ${path}: ${text}`);
  }
  return JSON.parse(text) as T;
}

/** Price and lab allocation without committing to anything. */
export function quote(input: {
  destinationCountryCode: string;
  items: Pick<OrderItem, "sku" | "copies">[];
  shippingMethod?: "Budget" | "Standard" | "Express" | "Overnight";
}) {
  return call<unknown>("/quotes", {
    shippingMethod: input.shippingMethod ?? "Standard",
    destinationCountryCode: input.destinationCountryCode,
    items: input.items.map((i) => ({ ...i, assets: [{ printArea: "default" }] })),
  });
}

/**
 * One call creates and submits. There is no basket to amend afterwards, so
 * only reach here once Stripe says the money actually arrived.
 *
 * `idempotencyKey` should be the Stripe session id: Stripe retries webhooks,
 * and without this a retry prints and ships the photograph twice.
 */
export function createOrder(input: {
  recipient: Recipient;
  items: OrderItem[];
  shippingMethod?: "Budget" | "Standard" | "Express" | "Overnight";
  idempotencyKey: string;
  merchantReference?: string;
}) {
  return call<CreatedOrder>("/Orders", {
    shippingMethod: input.shippingMethod ?? "Standard",
    idempotencyKey: input.idempotencyKey,
    merchantReference: input.merchantReference,
    recipient: input.recipient,
    items: input.items,
  });
}
