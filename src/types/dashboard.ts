export type ActionPriority = 'critical' | 'high' | 'normal'
export type ActionStatus = 'open' | 'completed'
export type ActionCategory =
  'urgent' | 'complaint' | 'opening' | 'follow-up' | 'referral'

export type ActivityType =
  'messaged' | 'called' | 'callback-booked' | 'appointment-booked' | 'resolved'

export type ActionProgress =
  'new' | 'messaged' | 'called' | 'booked' | 'resolved'

export type ActionFilter = 'all' | ActionCategory | 'completed'

export interface ActivityEntry {
  id: string
  type: ActivityType
  at: string
  /** Callback time (HH:MM) for 'callback-booked' or a 'messaged' proposal. */
  time?: string
  /** Opening id for 'appointment-booked'. */
  slotId?: string
  detail?: string
}

export interface OpeningSlot {
  id: string
  date: string
  time: string
  type: string
  practitioner: string
  bookedByActionId?: string
}

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
  activity: ActivityEntry[]
}

export interface CalendarEvent {
  id: string
  lane: 'patient' | 'front-desk'
  time: string
  date?: string
  title: string
  subtitle?: string
  tone: 'confirmed' | 'opening' | 'critical' | 'task' | 'completed'
  actionId?: string
}
