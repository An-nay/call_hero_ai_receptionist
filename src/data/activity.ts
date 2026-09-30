import type { WeekendCallsData } from '../types/calls'
import type {
  ActionItem,
  ActionProgress,
  ActivityEntry,
  OpeningSlot,
} from '../types/dashboard'

export const progressLabels: Record<ActionProgress, string> = {
  new: 'New',
  messaged: 'Messaged',
  called: 'Called',
  booked: 'Booked',
  resolved: 'Resolved',
}

/** Latest meaningful step; callback bookings keep the previous progress. */
export function getProgress(action: ActionItem): ActionProgress {
  const types = action.activity.map((entry) => entry.type)
  if (types.includes('resolved')) return 'resolved'
  if (types.includes('appointment-booked')) return 'booked'
  const last = [...types].reverse().find((t) => t !== 'callback-booked')
  if (last === 'called') return 'called'
  if (last === 'messaged') return 'messaged'
  return 'new'
}

export const isDone = (action: ActionItem) =>
  ['booked', 'resolved'].includes(getProgress(action))

/** Latest planned callback: a booked slot, or the time proposed in a sent text. */
export function getCallbackTime(action: ActionItem): string | undefined {
  return [...action.activity].reverse().find((entry) => entry.time)?.time
}

export function getOpenings(
  data: WeekendCallsData,
  actions: ActionItem[],
): OpeningSlot[] {
  const booked = new Map<string, string>()
  for (const action of actions) {
    for (const entry of action.activity) {
      if (entry.type === 'appointment-booked' && entry.slotId) {
        booked.set(entry.slotId, action.id)
      }
    }
  }
  return data.calls
    .filter((call) => call.appointment?.action === 'cancelled')
    .map((call) => ({
      id: `opening-${call.id}`,
      date: call.appointment!.date,
      time: call.appointment!.time,
      type: call.appointment!.type,
      practitioner: call.appointment!.practitioner,
      bookedByActionId: booked.get(`opening-${call.id}`),
    }))
}

export function withoutLastActivity(action: ActionItem): ActionItem {
  const activity: ActivityEntry[] = action.activity.slice(0, -1)
  return { ...action, activity, status: 'open' }
}

const priorityRank = { critical: 0, high: 1, normal: 2 } as const

export function sortByUrgency(actions: ActionItem[]) {
  return [...actions].sort(
    (a, b) =>
      priorityRank[a.priority] - priorityRank[b.priority] ||
      a.suggestedTime.localeCompare(b.suggestedTime),
  )
}
