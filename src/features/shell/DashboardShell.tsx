import type { ReactNode } from 'react'

interface DashboardShellProps {
  summary: ReactNode
  calendar: ReactNode
  actions: ReactNode
}

export function DashboardShell({
  summary,
  calendar,
  actions,
}: DashboardShellProps) {
  return (
    <main className="min-h-screen p-4 lg:p-6">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-5">
          <p className="text-sm font-semibold text-teal-700">
            Harbourside Dental
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Monday morning brief
          </h1>
        </header>
        {summary}
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
          {calendar}
          {actions}
        </div>
      </div>
    </main>
  )
}
