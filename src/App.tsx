import { lazy, Suspense } from 'react'
import { DashboardDataProvider } from '@/lib/DashboardDataContext'
import { Header } from '@/components/Header'
import { TodaysPulse } from '@/components/TodaysPulse'
import { RankingsTable } from '@/components/RankingsTable'
import { GeoPanel } from '@/components/GeoPanel'
import { OccupationsPanel } from '@/components/OccupationsPanel'
import { AppsLeaderboard } from '@/components/AppsLeaderboard'
import { HFTrending } from '@/components/HFTrending'
import { RankVolatility } from '@/components/RankVolatility'
import { WeekdaySeasonality } from '@/components/WeekdaySeasonality'
import { About } from '@/components/About'
import { Footer } from '@/components/Footer'
import { SectionLabel } from '@/components/SectionLabel'
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary'
import { PanelSkeleton } from '@/components/PanelSkeleton'
import { TooltipProvider } from '@/components/ui/tooltip'

// Lazy-loaded: both pull in echarts, which would otherwise sit in the
// initial bundle for every visitor even before they scroll to these panels.
const ProviderShare = lazy(() => import('@/components/ProviderShare').then((m) => ({ default: m.ProviderShare })))
const RacingBar = lazy(() => import('@/components/RacingBar').then((m) => ({ default: m.RacingBar })))
const SdkGeoTrendPanel = lazy(() =>
  import('@/components/SdkGeoTrendPanel').then((m) => ({ default: m.SdkGeoTrendPanel })),
)

function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <DashboardDataProvider>
        <div className="min-h-screen bg-[var(--pulse-bg)] font-sans text-[var(--pulse-text)]">
          <Header />
          <SectionErrorBoundary label="Today's Pulse">
            <TodaysPulse />
          </SectionErrorBoundary>

          <section id="rankings" className="mx-auto max-w-[1200px] border-b border-[var(--pulse-border)] px-6 py-8">
            <SectionLabel>RANKINGS</SectionLabel>
            <div className="flex flex-wrap gap-5">
              <SectionErrorBoundary label="Rankings table">
                <RankingsTable />
              </SectionErrorBoundary>
              <SectionErrorBoundary label="Provider share">
                <Suspense fallback={<PanelSkeleton height={190} />}>
                  <ProviderShare />
                </Suspense>
              </SectionErrorBoundary>
            </div>
          </section>

          <section id="race" className="mx-auto max-w-[1200px] border-b border-[var(--pulse-border)] px-6 py-8">
            <SectionLabel>RANKINGS OVER TIME</SectionLabel>
            <SectionErrorBoundary label="Racing bar">
              <Suspense fallback={<PanelSkeleton height={280} />}>
                <RacingBar />
              </Suspense>
            </SectionErrorBoundary>
            {/* Stacked below, not squeezed alongside RacingBar — it's a
                wide hero chart that wants full width to show 8 animated
                bars clearly. RankVolatility and WeekdaySeasonality are
                similar-weight list panels, so they share a row together. */}
            <div className="mt-5 flex flex-wrap gap-5">
              <SectionErrorBoundary label="Rank volatility">
                <RankVolatility />
              </SectionErrorBoundary>
              <SectionErrorBoundary label="Weekday seasonality">
                <WeekdaySeasonality />
              </SectionErrorBoundary>
            </div>
          </section>

          <section id="geo" className="mx-auto max-w-[1200px] border-b border-[var(--pulse-border)] px-6 py-8">
            <SectionLabel>WHERE &amp; WHO</SectionLabel>
            <div className="flex flex-wrap gap-5">
              <SectionErrorBoundary label="Geo panel">
                <GeoPanel />
              </SectionErrorBoundary>
              <SectionErrorBoundary label="SDK downloads trend panel">
                <Suspense fallback={<PanelSkeleton height={160} />}>
                  <SdkGeoTrendPanel />
                </Suspense>
              </SectionErrorBoundary>
              <SectionErrorBoundary label="Occupations panel">
                <OccupationsPanel />
              </SectionErrorBoundary>
            </div>
          </section>

          <section id="ecosystem" className="mx-auto max-w-[1200px] border-b border-[var(--pulse-border)] px-6 py-8">
            <SectionLabel>ECOSYSTEM</SectionLabel>
            <div className="flex flex-wrap gap-5">
              <SectionErrorBoundary label="Apps leaderboard">
                <AppsLeaderboard />
              </SectionErrorBoundary>
              <SectionErrorBoundary label="HF trending">
                <HFTrending />
              </SectionErrorBoundary>
            </div>
          </section>

          <SectionErrorBoundary label="About & methodology">
            <About />
          </SectionErrorBoundary>

          <Footer />
        </div>
      </DashboardDataProvider>
    </TooltipProvider>
  )
}

export default App
