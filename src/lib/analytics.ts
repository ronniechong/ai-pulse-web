// Thin wrapper around GoatCounter's custom-event API (see index.html for the
// tracking snippet). Every call is a no-op if the script hasn't loaded yet
// (ad blockers, offline) or during local dev without the snippet — never
// throws, never blocks the interaction it's attached to.

declare global {
  interface Window {
    goatcounter?: {
      count: (vars: { path: string; title?: string; event?: boolean }) => void
    }
  }
}

export function trackEvent(name: string, title?: string) {
  window.goatcounter?.count({ path: name, title: title ?? name, event: true })
}
