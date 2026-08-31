// The print-resolution files. These are the product; they never sit in
// /public, never go in git, and never get a permanent public URL.
//
// Prodigi pulls the asset over HTTP at production time, so the URL has to be
// reachable, but only for as long as that takes. A short-lived signed URL is
// the whole trick: minted inside the Stripe webhook, dead within the hour.

const TTL = Number(process.env.MASTER_URL_TTL_SECONDS ?? 1800);

/**
 * Swap the body for whatever storage you land on. Vercel Blob, R2 and S3 all
 * expose the same shape: given a key, hand back a URL that expires.
 *
 * Vercel Blob: store masters as private blobs and mint with
 * `getDownloadUrl(blob.url, { expiresIn: TTL })`.
 * S3 / R2: `getSignedUrl(client, new GetObjectCommand({...}), { expiresIn: TTL })`.
 */
export async function signedMasterUrl(slug: string): Promise<string> {
  const base = process.env.MASTERS_BASE_URL;
  if (!base) {
    throw new Error(
      "MASTERS_BASE_URL is not set. Point it at private storage holding " +
        "<slug>.tif — the files in /public are 1400px previews and printing " +
        "one of those at A2 will look exactly as bad as it sounds.",
    );
  }
  const expires = Math.floor(Date.now() / 1000) + TTL;
  // Replace with a real signature from your storage SDK.
  return `${base}/${slug}.tif?expires=${expires}`;
}
