import { createContext } from 'react'
import type { WeekendCallsData } from '../types/calls'
import type {
  ActionFilter,
  ActionItem,
  CalendarEvent,
} from '../types/dashboard'

export interface DashboardState {
  data: WeekendCallsData
  actions: ActionItem[]
  filteredActions: ActionItem[]
  calendarEvents: CalendarEvent[]
  filter: ActionFilter
  selectedAction: ActionItem | null
  setFilter: (filter: ActionFilter) => void
  selectAction: (id: string | null) => void
  completeAction: (id: string) => void
}

export const DashboardContext = createContext<DashboardState | null>(null)
