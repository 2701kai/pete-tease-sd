import { NextResponse } from "next/server";
import { joinRepete, normaliseEmail } from "@/lib/members";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  const email = normaliseEmail((body as { email?: unknown } | null)?.email);
  if (!email) {
    return NextResponse.json(
      { error: "That does not look like an email address." },
      { status: 400 },
    );
  }

  try {
    await joinRepete(stripe(), email);
  } catch (err) {
    // Stripe was reachable enough to take money five minutes ago, so this is
    // worth looking at rather than swallowing.
    console.error("Re-Pete signup failed", err);
    return NextResponse.json(
      { error: "Could not sign you up right now. Try again shortly." },
      { status: 502 },
    );
  }

  // Always the same answer whether the address was new or already on file.
  // Anything else turns this into an endpoint for testing whether a given
  // person has bought from Pete.
  return NextResponse.json({ ok: true });
}
