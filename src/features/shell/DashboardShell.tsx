import type { ReactNode } from 'react'
import { isDone } from '../../data/activity'
import { useDashboard } from '../../state/useDashboard'

interface DashboardShellProps {
  summary: ReactNode
  calendar: ReactNode
  actions: ReactNode
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold">
      {children}
    </span>
  )
}

export function DashboardShell({
  summary,
  calendar,
  actions,
}: DashboardShellProps) {
  const { data, actions: all } = useDashboard()
  const cleared = all.filter(isDone).length

  return (
    <main className="min-h-screen p-3 sm:p-6">
      <div className="mx-auto max-w-[1460px]">
        <header className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-navy font-extrabold text-white">
              CH
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Call Hero</h1>
              <p className="text-xs text-slate-500">
                {data.clinic.name} · Monday · 8:00 AM
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Pill>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Jade online
            </Pill>
            <Pill>
              {cleared} / {all.length} cleared
            </Pill>
            <Pill>First patient 8:30</Pill>
            <a
              href="./src/features/calendars/prototype/dashboard.html"
              className="inline-flex items-center rounded-full bg-navy px-3 py-2 text-xs font-bold text-white hover:bg-navy-2"
            >
              Full calendar ↗
            </a>
          </div>
        </header>
        {summary}
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.8fr)]">
          {calendar}
          {actions}
        </div>
      </div>
    </main>
  )
}
