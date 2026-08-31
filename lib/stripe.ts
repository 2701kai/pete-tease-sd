import Stripe from "stripe";

// Lazily constructed, and that is not a style preference. A module-scope
// `new Stripe()` blows up `next build`, which loads every route to collect page
// data long before any environment variable exists. Call this inside the
// handler instead.
//
// The SDK pins the API version it ships with; nothing here overrides it, so a
// version bump moves the API version too. See HANDOFF.
export const stripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!);
