import type { ReactNode } from 'react'

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3.5 font-mono text-[11px] font-semibold tracking-[.06em] text-[var(--pulse-faint)]">
      {children}
    </div>
  )
}
