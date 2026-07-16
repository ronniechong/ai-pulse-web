import { Component, type ReactNode } from 'react'

interface Props {
  label: string
  children: ReactNode
}

interface State {
  error: Error | null
}

/** One panel's render bug must not blank the whole dashboard — same
 * philosophy as the fetch layer (loadOptional in DashboardDataContext).
 * Wrap each independent section with this. */
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error(`[${this.props.label}] render error:`, error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-w-[380px] flex-1 rounded-lg border border-[var(--pulse-border)] bg-[var(--pulse-panel)] p-4 font-sans text-[13px] text-[var(--pulse-faint)]">
          {this.props.label} failed to render.
        </div>
      )
    }
    return this.props.children
  }
}
