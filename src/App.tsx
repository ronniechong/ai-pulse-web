import { DashboardDataProvider } from '@/lib/DashboardDataContext'
import { Header } from '@/components/Header'
import { TodaysPulse } from '@/components/TodaysPulse'
import { RankingsTable } from '@/components/RankingsTable'
import { ProviderShare } from '@/components/ProviderShare'
import { RacingBar } from '@/components/RacingBar'
import { GeoPanel } from '@/components/GeoPanel'
import { OccupationsPanel } from '@/components/OccupationsPanel'
import { AppsLeaderboard } from '@/components/AppsLeaderboard'
import { HFTrending } from '@/components/HFTrending'
import { About } from '@/components/About'
import { Footer } from '@/components/Footer'
import { SectionLabel } from '@/components/SectionLabel'
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary'

function App() {
  return (
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
              <ProviderShare />
            </SectionErrorBoundary>
          </div>
        </section>

        <section id="race" className="mx-auto max-w-[1200px] border-b border-[var(--pulse-border)] px-6 py-8">
          <SectionLabel>RANKINGS OVER TIME</SectionLabel>
          <SectionErrorBoundary label="Racing bar">
            <RacingBar />
          </SectionErrorBoundary>
        </section>

        <section id="geo" className="mx-auto max-w-[1200px] border-b border-[var(--pulse-border)] px-6 py-8">
          <SectionLabel>WHERE &amp; WHO</SectionLabel>
          <div className="flex flex-wrap gap-5">
            <SectionErrorBoundary label="Geo panel">
              <GeoPanel />
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
  )
}

export default App
