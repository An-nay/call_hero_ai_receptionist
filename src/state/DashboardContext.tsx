import { type ReactNode, useMemo, useState } from 'react'
import { getOpenings, isDone, withoutLastActivity } from '../data/activity'
import { buildActions, buildCalendarEvents } from '../data/buildDashboardModel'
import { weekendCalls } from '../data/calls'
import type { ActionFilter, ActivityEntry } from '../types/dashboard'
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

  const logActivity = (id: string, entry: Omit<ActivityEntry, 'id' | 'at'>) => {
    setActions((current) =>
      current.map((item) => {
        if (item.id !== id) return item
        const activity = [
          ...item.activity,
          {
            ...entry,
            id: `${id}-${item.activity.length}`,
            at: new Date().toISOString(),
          },
        ]
        const next = { ...item, activity }
        return { ...next, status: isDone(next) ? 'completed' : 'open' }
      }),
    )
  }

  const undoLastActivity = (id: string) => {
    setActions((current) =>
      current.map((item) => {
        if (item.id !== id) return item
        const next = withoutLastActivity(item)
        return { ...next, status: isDone(next) ? 'completed' : 'open' }
      }),
    )
  }

  const completeAction = (id: string) => {
    logActivity(id, { type: 'resolved' })
    setSelectedId(null)
  }

  const value = useMemo<DashboardState>(
    () => ({
      data: weekendCalls,
      actions,
      filteredActions,
      calendarEvents: buildCalendarEvents(weekendCalls, actions),
      openings: getOpenings(weekendCalls, actions),
      filter,
      selectedAction,
      setFilter,
      selectAction: setSelectedId,
      completeAction,
      logActivity,
      undoLastActivity,
    }),
    [actions, filter, filteredActions, selectedAction],
  )

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}
