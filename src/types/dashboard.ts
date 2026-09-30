export type ActionPriority = 'critical' | 'high' | 'normal'
export type ActionStatus = 'open' | 'completed'
export type ActionCategory =
  'urgent' | 'complaint' | 'opening' | 'follow-up' | 'referral'

export type ActionFilter = 'all' | ActionCategory | 'completed'

export interface ActionItem {
  id: string
  callIds: string[]
  callerName: string
  title: string
  description: string
  recommendedAction: string
  priority: ActionPriority
  category: ActionCategory
  status: ActionStatus
  estimatedMinutes: number
  suggestedTime: string
  relatedOpening?: string
}

export interface CalendarEvent {
  id: string
  lane: 'patient' | 'front-desk'
  time: string
  title: string
  subtitle?: string
  tone: 'confirmed' | 'opening' | 'critical' | 'task' | 'completed'
  actionId?: string
}
