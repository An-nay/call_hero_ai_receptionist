import { type ReactNode, useMemo, useState } from 'react'
import { buildActions, buildCalendarEvents } from '../data/buildDashboardModel'
import { weekendCalls } from '../data/calls'
import type { ActionFilter } from '../types/dashboard'
import { DashboardContext, type DashboardState } from './dashboard-context'

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState(() => buildActions(weekendCalls))
  const [filter, setFilter] = useState<ActionFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filteredActions = actions.filter((item) => {
    if (filter === 'all') return item.status === 'open'
    if (filter === 'completed') return item.status === 'completed'
    return item.status === 'open' && item.category === filter
  })

  const selectedAction = actions.find((item) => item.id === selectedId) ?? null

  const completeAction = (id: string) => {
    setActions((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: 'completed' } : item,
      ),
    )
    setSelectedId(null)
  }

  const value = useMemo<DashboardState>(
    () => ({
      data: weekendCalls,
      actions,
      filteredActions,
      calendarEvents: buildCalendarEvents(weekendCalls, actions),
      filter,
      selectedAction,
      setFilter,
      selectAction: setSelectedId,
      completeAction,
    }),
    [actions, filter, filteredActions, selectedAction],
  )

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}
