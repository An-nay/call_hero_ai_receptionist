import type { ReactNode } from 'react'
import { useDashboard } from '../../state/useDashboard'

interface DashboardShellProps {
  summary: ReactNode
  calendar: ReactNode
}

export function DashboardShell({ summary, calendar }: DashboardShellProps) {
  const { data } = useDashboard()

  return (
    <main className="flex min-h-screen flex-col p-3 sm:p-6 lg:h-dvh lg:min-h-[720px]">
      <div className="mx-auto flex min-h-0 w-full max-w-[1460px] flex-1 flex-col">
        <header className="mb-4 flex shrink-0 items-center justify-between gap-4">
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
        <div className="shrink-0">{summary}</div>
        <div className="mt-4 flex min-h-0 flex-1 flex-col">{calendar}</div>
      </div>
    </main>
  )
}
