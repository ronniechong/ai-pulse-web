/** Cosmetic display name for a model_permaslug like
 * "anthropic/claude-4.8-opus-20260528" -> "Claude 4.8 Opus". Provider
 * resolution (slug prefix -> human name) already happens server-side in
 * providers.py — this only cleans up the model portion for display.
 *
 * OpenRouter appends an endpoint-variant suffix (":free", ":extended",
 * ":online", etc.) to some permaslugs. The same base model can appear as
 * multiple rows on the same day — one per variant, each with its own
 * ranking/token stats — so the variant is kept as a "(Free)"-style tag
 * rather than dropped, or two distinct rows would render with identical
 * names. */
export function formatModelName(permaslug: string): string {
  const afterSlash = permaslug.includes('/') ? permaslug.split('/').slice(1).join('/') : permaslug
  const [base, variant] = splitVariant(afterSlash)
  const withoutDateSuffix = base.replace(/-\d{8}$/, '')
  const prettyBase = withoutDateSuffix
    .split('-')
    .map((word) => (word.length <= 3 && /[a-z]/i.test(word) ? word.toUpperCase() : word))
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return variant ? `${prettyBase} (${formatVariantLabel(variant)})` : prettyBase
}

function splitVariant(name: string): [string, string | null] {
  const i = name.lastIndexOf(':')
  return i === -1 ? [name, null] : [name.slice(0, i), name.slice(i + 1)]
}

function formatVariantLabel(variant: string): string {
  return variant
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Locale-sensitive number/percent/date/relative-time formatting lives in
// lib/useFormatters.ts (FormatJS) — this file only owns pure string
// transforms that aren't locale-dependent.
