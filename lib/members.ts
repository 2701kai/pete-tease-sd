// Re-Pete, the scheme for people who come back for a second frame.
//
// There is deliberately no members table. Stripe already holds the only two
// facts the scheme needs — who someone is, and what they have already bought —
// so the Stripe Customer *is* the customer record. That also leaves the store
// choice in open item 4 free: nothing here pre-empts whichever database the
// edition counter eventually lands on.
//
// The entitlement is decided server side, from Stripe's own payment history.
// A browser can claim to be a returning buyer all it likes; it cannot invent a
// paid Checkout Session.

import type Stripe from "stripe";

/** Set on the Stripe Customer so a member is distinguishable from any buyer. */
export const REPETE_FLAG = "repete";

/** Roughly RFC-shaped. Stripe does the real validation; this rejects nonsense. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 320 = 64 local + @ + 255 domain, the practical maximum. */
export function normaliseEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length === 0 || email.length > 320 || !EMAIL.test(email)) return null;
  return email;
}

export type Membership = {
  /** The Stripe Customer id, so the Checkout Session can attach to it. */
  customer: string;
  /** Paid Checkout Sessions already against this customer. Capped, see below. */
  priorPurchases: number;
  /** The 15% starts on the second print, so this needs at least one. */
  entitled: boolean;
};

/**
 * Stripe puts no unique constraint on email, so a duplicate is always possible.
 * Take the oldest match: the purchase history is attached to that one, and it
 * stays stable rather than moving every time a newer record appears.
 */
export async function findCustomer(
  stripe: Stripe,
  email: string,
): Promise<Stripe.Customer | null> {
  const { data } = await stripe.customers.list({ email, limit: 100 });
  if (data.length === 0) return null;
  return data.reduce((oldest, c) => (c.created < oldest.created ? c : oldest));
}

/**
 * How many paid Checkout Sessions this customer already has.
 *
 * Capped at one page of 100. The entitlement only asks whether the number is
 * greater than zero, so paging further would buy nothing but latency.
 */
export async function countPaidOrders(stripe: Stripe, customer: string): Promise<number> {
  const { data } = await stripe.checkout.sessions.list({ customer, limit: 100 });
  return data.filter((s) => s.payment_status === "paid").length;
}

/**
 * What this email is entitled to. Returns null when Stripe has never heard of
 * them, which is the same outcome as a member with nothing bought yet: no
 * discount, because the 15% is off the *second* print.
 */
export async function membershipFor(
  stripe: Stripe,
  email: string,
): Promise<Membership | null> {
  const customer = await findCustomer(stripe, email);
  if (!customer) return null;

  const priorPurchases = await countPaidOrders(stripe, customer.id);
  return { customer: customer.id, priorPurchases, entitled: priorPurchases > 0 };
}

/**
 * Join, or quietly do nothing if they already have. Idempotent on purpose: the
 * form can be submitted twice and the second one is not an error.
 */
export async function joinRepete(stripe: Stripe, email: string): Promise<void> {
  const existing = await findCustomer(stripe, email);

  if (!existing) {
    await stripe.customers.create({
      email,
      metadata: { [REPETE_FLAG]: "joined", repete_joined: new Date().toISOString() },
    });
    return;
  }

  if (existing.metadata?.[REPETE_FLAG] === "joined") return;

  // Somebody who bought before joining. Keep whatever metadata is already
  // there; Stripe replaces the whole map rather than merging it.
  await stripe.customers.update(existing.id, {
    metadata: {
      ...existing.metadata,
      [REPETE_FLAG]: "joined",
      repete_joined: new Date().toISOString(),
    },
  });
}
