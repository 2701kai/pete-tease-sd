/**
 * No state and no interactivity, so this stays out of the client bundle.
 */
export default function SiteFooter() {
  return (
    <footer id="about" className="border-t border-teal-dim py-[clamp(2.5rem,6vw,4rem)] text-[0.87rem]">
      <div className="mx-auto w-[min(100%-2.5rem,1180px)]">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <h3 className="mb-2 font-display text-[1.35rem] italic">For Pete&apos;s sake</h3>
            <p className="mb-3 max-w-[42ch] text-paper-dim">
              Pete Noir is Pete, a photographer who walks in first and sets up second. He shoots long, prints large,
              and answers his own email.
            </p>
            <p className="text-paper-dim">Aotearoa New Zealand</p>
          </div>
          <div>
            <h3 className="mb-2 font-display text-[1.35rem] italic">Prints</h3>
            <ul className="list-none p-0 text-paper-dim">
              {["Sizes and papers", "Editions and certificates", "Shipping and returns", "Framing"].map((t) => (
                <li key={t} className="py-1">
                  <a href="#buy" className="hover:text-paper">
                    {t}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-display text-[1.35rem] italic">Elsewhere</h3>
            <ul className="list-none p-0 text-paper-dim">
              {["Instagram", "Licensing and commissions", "Contact Pete"].map((t) => (
                <li key={t} className="py-1">
                  <a href="#about" className="hover:text-paper">
                    {t}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-teal-dim pt-5 text-[0.78rem] text-[#5e6660]">
          <span>© {new Date().getFullYear()} Pete Noir. Photographs may not be reproduced.</span>
          <span>Prices in NZD, GST included.</span>
        </div>
      </div>
    </footer>
  );
}
