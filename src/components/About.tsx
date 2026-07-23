import { SectionLabel } from '@/components/SectionLabel'
import { AiTransparencyPanel } from '@/components/AiTransparencyPanel'

const CAVEATS = [
  'Token counts come from each provider’s own tokenizer — not directly comparable across rows.',
  'OpenRouter is one (large) routing platform, not the whole AI market — rankings carry a selection bias toward API developers, not end consumers.',
  'Hugging Face downloads measure open-weights pulls, not inference usage.',
  'PyPI SDK-download counts (ClickPy) measure package installs — CI/CD inflation is possible — not actual API usage.',
  'Geographic adoption and SDK-download panels use different upstream country-code standards (ISO alpha-3 vs alpha-2) and are aggregated into the same 8 regions via a hand-authored crosswalk — there is no Oceania/Pacific bucket in that grouping.',
  'Anthropic Economic Index panels (geographic adoption, occupations) reflect Claude usage specifically, not AI adoption or automation across the industry.',
  'The provider-concentration index (HHI) excludes the "other" aggregate bucket, same as the provider-share treemap it sits above.',
  'App category tags (Coding / CLI agent) only cover a subset of apps on a given day — untagged apps only surface under the "All" tab.',
  '"New entrant" (Today\'s Pulse, rankings history) means newly in the top 50, not newly released — OpenRouter\'s API has no visibility below rank 50, so a returning model looks identical to a genuinely new one.',
  'The AI-engineering transparency panel\'s "success rate" is per LLM call attempt, not per day — a day with a retried attempt after a rejected response contributes more than one attempt to the denominator.',
]

export function About() {
  return (
    <section id="about-methodology" className="mx-auto max-w-[1200px] border-b border-[var(--pulse-border)] px-6 py-8">
      <SectionLabel>ABOUT &amp; METHODOLOGY</SectionLabel>

      <div className="mb-5 rounded-lg border-l-2 border-[var(--pulse-amber)] bg-[var(--pulse-amber-soft)] p-3.5">
        <p className="font-sans text-[13px] leading-[1.6] text-[var(--pulse-text)]">
          <span className="font-semibold">Experimental portfolio project, not a source of truth.</span>{' '}
          AI Pulse is a solo-built showcase of a data pipeline + AI-narration stack, not a
          maintained analytics product. The underlying data pipeline is young (live since
          2026-07-15) and every metric below carries real methodology caveats — see &quot;Known
          caveats&quot; underneath. Don&apos;t cite this dashboard for research, investment, or
          reporting decisions.
        </p>
      </div>

      <div className="flex flex-wrap gap-5">
        <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
          <div className="mb-2 font-sans text-[13px] font-semibold text-[var(--pulse-text)]">
            AI-generated commentary
          </div>
          <p className="mb-2 font-sans text-[13px] leading-[1.6] text-[var(--pulse-muted)]">
            The daily headline and summary in Today&apos;s Pulse are written by an LLM (OpenRouter,
            Claude Haiku) from a facts payload computed deterministically in code — the model
            never sees raw data, only the pre-computed movers, entrants, dropouts, records, and
            provider-share numbers for the day.
          </p>
          <p className="mb-2 font-sans text-[13px] leading-[1.6] text-[var(--pulse-muted)]">
            Every entity and number the LLM writes is validated against that same facts payload
            before publishing — if it names a model or figure that doesn&apos;t appear in the
            facts, generation is retried once, then falls back to a deterministic template.
            AI-written and template commentary are visually identical and both carry the
            &quot;AI-generated&quot; label; the tone badge (quiet / notable / big day) is always
            rule-based, never the LLM&apos;s judgment.
          </p>
        </div>

        <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
          <div className="mb-2 font-sans text-[13px] font-semibold text-[var(--pulse-text)]">
            Data sources &amp; licences
          </div>
          <ul className="space-y-1.5 font-sans text-[13px] leading-[1.5] text-[var(--pulse-muted)]">
            <li>
              <span className="text-[var(--pulse-text)]">OpenRouter</span> — model rankings, app
              rankings, historical rankings window (contractual attribution).
            </li>
            <li>
              <span className="text-[var(--pulse-text)]">Hugging Face</span> — trending open-weight
              models (Hub API, public).
            </li>
            <li>
              <span className="text-[var(--pulse-text)]">ClickPy</span> — PyPI SDK downloads by
              country (public ClickHouse dataset).
            </li>
            <li>
              <span className="text-[var(--pulse-text)]">Anthropic Economic Index</span> —
              Claude usage geographic adoption and occupation usage/automation split, © Anthropic,
              CC-BY.
            </li>
          </ul>
        </div>

        <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4">
          <div className="mb-2 font-sans text-[13px] font-semibold text-[var(--pulse-text)]">
            Known caveats
          </div>
          <ul className="list-disc space-y-1.5 pl-4 font-sans text-[12.5px] leading-[1.5] text-[var(--pulse-muted)]">
            {CAVEATS.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <AiTransparencyPanel />
      </div>
    </section>
  )
}
