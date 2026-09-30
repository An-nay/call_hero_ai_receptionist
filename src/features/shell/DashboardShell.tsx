import type { ReactNode } from 'react'
import { useDashboard } from '../../state/useDashboard'

interface DashboardShellProps {
  summary: ReactNode
  calendar: ReactNode
}

export function DashboardShell({ summary, calendar }: DashboardShellProps) {
  const { data } = useDashboard()

  return (
    <main className="min-h-screen p-3 sm:p-6">
      <div className="mx-auto max-w-[1460px]">
        <header className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand font-display text-lg font-semibold text-white shadow-sm">
              CH
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold leading-tight tracking-tight text-navy">
                Call Hero
              </h1>
              <p className="text-xs text-slate-500">
                {data.clinic.name} · Monday · 8:00 AM
              </p>
            </div>
          </div>
        </header>
        {summary}
        <div className="mt-5">{calendar}</div>
      </div>
    </main>
  )
}
