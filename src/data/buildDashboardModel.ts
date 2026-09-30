import { buildCalendarModel } from '../features/calendars/engine/model'
import { plan } from '../features/calendars/engine/plan'
import {
  buildTasks,
  CATS,
  type CatKey,
  type Priority,
} from '../features/calendars/engine/tasks'
import { OPEN, dateOfDay, hhmm } from '../features/calendars/engine/time'
import type { WeekendCallsData } from '../types/calls'
import { shortName } from './format'
import { getCallbackTime, getOpenings, isDone } from './activity'
import type {
  ActionCategory,
  ActionItem,
  ActionPriority,
  CalendarEvent,
} from '../types/dashboard'

const categoryOf: Record<CatKey, ActionCategory> = {
  triage: 'urgent',
  complaint: 'complaint',
  offer: 'opening',
  winback: 'opening',
  rebook: 'follow-up',
  datafix: 'follow-up',
  confirm: 'follow-up',
  bookfix: 'follow-up',
  note: 'follow-up',
  remind: 'follow-up',
  release: 'follow-up',
  referral: 'referral',
}

const priorityOf: Record<Priority, ActionPriority> = {
  1: 'critical',
  2: 'high',
  3: 'normal',
  4: 'normal',
}

/**
 * One action per calendar task due today, taken from the 8:00 Monday plan.
 * The calendar engine is the single source of truth for what needs doing.
 */
export function buildActions(data: WeekendCallsData): ActionItem[] {
  const model = buildCalendarModel(data)
  const { tasks } = buildTasks(model, OPEN)
  const start: Record<string, number> = {}
  const planned = plan(model, tasks, {}, { day: 0, min: OPEN })
  for (const hour of Object.values(planned.hours[0] ?? {}))
    for (const placed of hour) start[placed.t.id] = placed.start

  return tasks
    .filter((task) => task.due <= 0)
    .map((task) => ({
      id: task.id,
      kind: task.cat,
      callIds: task.call.split(', ').filter(Boolean),
      callerName: task.who,
      title: CATS[task.cat].label,
      description: task.text,
      recommendedAction: task.headline,
      priority: priorityOf[task.pri],
      category: categoryOf[task.cat],
      status: 'open' as const,
      estimatedMinutes: task.min,
      suggestedTime: hhmm(start[task.id] ?? OPEN),
      relatedOpening: task.offer
        ? `${dateOfDay(task.offer.day)}T${task.offer.time}`
        : undefined,
      activity: [],
    }))
}

export function buildCalendarEvents(
  data: WeekendCallsData,
  actions: ActionItem[],
): CalendarEvent[] {
  const openings = getOpenings(data, actions).map<CalendarEvent>((slot) => {
    const booker = actions.find((item) => item.id === slot.bookedByActionId)
    return {
      id: slot.id,
      lane: 'patient',
      time: slot.time,
      title: booker ? shortName(booker.callerName) : 'Open appointment',
      subtitle: booker ? `Booked · ${slot.type}` : slot.type,
      tone: booker ? 'confirmed' : 'opening',
      date: slot.date,
      actionId: booker?.id,
    }
  })

  const tasks = actions.map<CalendarEvent>((item) => ({
    id: `task-${item.id}`,
    lane: 'front-desk',
    time: getCallbackTime(item) ?? item.suggestedTime,
    title: item.title,
    subtitle: `${item.estimatedMinutes} min · ${item.callerName}`,
    tone: isDone(item)
      ? 'completed'
      : item.priority === 'critical'
        ? 'critical'
        : 'task',
    actionId: item.id,
  }))

  return [...openings, ...tasks]
}
