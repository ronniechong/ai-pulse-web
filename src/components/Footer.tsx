export function Footer() {
  return (
    <footer className="mx-auto max-w-[1200px] px-6 pb-10 pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="max-w-[560px] font-sans text-[11px] leading-[1.5] text-[var(--pulse-faint)]">
          Experimental portfolio project — not a source of truth. Source: OpenRouter (contractual
          attribution) · Adoption data © Anthropic Economic Index, CC-BY · ClickPy &amp; Hugging Face
          credits
        </span>
        <div className="flex gap-3.5">
          <a
            href="#about-methodology"
            className="font-sans text-[11px] text-[var(--pulse-accent)] underline"
            data-goatcounter-click="footer-about-methodology"
          >
            About &amp; methodology
          </a>
          <span className="font-sans text-[11px] text-[var(--pulse-faint)] opacity-60">
            Commentary archive — coming soon
          </span>
          <a
            href="https://github.com/ronniechong/ai-pulse-data"
            className="font-sans text-[11px] text-[var(--pulse-accent)] underline"
            data-goatcounter-click="footer-github-ai-pulse-data"
          >
            GitHub: ai-pulse-data
          </a>
        </div>
      </div>
    </footer>
  )
}
