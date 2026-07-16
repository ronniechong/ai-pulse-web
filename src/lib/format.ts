/** Cosmetic display name for a model_permaslug like
 * "anthropic/claude-4.8-opus-20260528" -> "Claude 4.8 Opus". Provider
 * resolution (slug prefix -> human name) already happens server-side in
 * providers.py — this only cleans up the model portion for display. */
export function formatModelName(permaslug: string): string {
  const afterSlash = permaslug.includes('/') ? permaslug.split('/').slice(1).join('/') : permaslug
  const withoutFreeTag = afterSlash.replace(/:free$/, '')
  const withoutDateSuffix = withoutFreeTag.replace(/-\d{8}$/, '')
  return withoutDateSuffix
    .split('-')
    .map((word) => (word.length <= 3 && /[a-z]/i.test(word) ? word.toUpperCase() : word))
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Locale-sensitive number/percent/date/relative-time formatting lives in
// lib/useFormatters.ts (FormatJS) — this file only owns pure string
// transforms that aren't locale-dependent.
