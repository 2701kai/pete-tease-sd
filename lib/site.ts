// Where this deployment thinks it lives.
//
// Stripe needs absolute URLs: it redirects the buyer to `success_url` after
// taking the money, and it fetches the line item image over the public
// internet. Getting this wrong is not a visual bug — a stale localhost
// fallback sends a paying customer to their own machine and shows Stripe a
// picture it cannot load.
//
// Vercel exposes the deployment's own hostnames as system environment
// variables, so a preview redirects back to that preview rather than to
// production. They arrive without a scheme, and only when "Enable access to
// System Environment Variables" is on for the project.
// https://vercel.com/docs/environment-variables/system-environment-variables

const strip = (url: string) => url.replace(/\/+$/, "");

export function siteUrl(): string {
  // Explicit wins. It is the canonical domain, and the only value that
  // survives Deployment Protection, which Vercel's own docs note breaks
  // VERCEL_URL.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return strip(explicit);

  const host =
    process.env.VERCEL_ENV === "production"
      ? // The shortest production custom domain, so the receipt links to
        // petenoir.nz rather than a deployment hash.
        process.env.VERCEL_PROJECT_PRODUCTION_URL
      : // A preview must point at itself. VERCEL_PROJECT_PRODUCTION_URL is set
        // even in previews, so reaching for it here would send a test purchase
        // back to the live site.
        (process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL);

  if (host) return `https://${strip(host)}`;

  // On Vercel with neither an explicit URL nor the system variables, there is
  // no value here that is ever right. Falling back to localhost would take the
  // money, print the photograph, and strand the buyer on a dead page. Fail the
  // checkout instead: it is louder, and it is one setting to fix.
  if (process.env.VERCEL) {
    throw new Error(
      "Cannot work out this deployment's URL. Set NEXT_PUBLIC_SITE_URL, or " +
        "switch on 'Enable access to System Environment Variables' in the " +
        "Vercel project settings.",
    );
  }

  return "http://localhost:3000";
}
