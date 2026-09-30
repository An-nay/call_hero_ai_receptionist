import type { CallRecord, WeekendCallsData } from '../types/calls'
import type { ActionItem, CalendarEvent } from '../types/dashboard'

const getCall = (calls: CallRecord[], id: string) => {
  const call = calls.find((item) => item.id === id)
  if (!call) throw new Error(`Missing call ${id}`)
  return call
}

export function buildActions(data: WeekendCallsData): ActionItem[] {
  const calls = data.calls
  const action = (
    item: Omit<ActionItem, 'callerName' | 'status'> & { primaryCallId: string },
  ): ActionItem => ({
    ...item,
    callerName:
      getCall(calls, item.primaryCallId).caller_name ?? 'Unknown caller',
    status: 'open',
  })

  return [
    action({
      id: 'urgent-peter',
      primaryCallId: 'c019',
      callIds: ['c019'],
      title: 'Urgent overnight call',
      description: 'Called at 2:14 am and was flagged for first thing Monday.',
      recommendedAction: 'Call now',
      priority: 'critical',
      category: 'urgent',
      estimatedMinutes: 5,
      suggestedTime: '08:00',
    }),
    action({
      id: 'complaint-michael',
      primaryCallId: 'c031',
      callIds: ['c005', 'c031'],
      title: 'Escalating billing complaint',
      description:
        'Called twice and is increasingly frustrated about an invoice dispute.',
      recommendedAction: 'Assign to practice manager',
      priority: 'critical',
      category: 'complaint',
      estimatedMinutes: 15,
      suggestedTime: '08:10',
    }),
    action({
      id: 'opening-grace',
      primaryCallId: 'c026',
      callIds: ['c024', 'c026'],
      title: 'Offer an open appointment',
      description: 'Called twice and explicitly requested the waiting list.',
      recommendedAction: 'Offer the 09:00 opening',
      priority: 'high',
      category: 'opening',
      estimatedMinutes: 5,
      suggestedTime: '08:25',
      relatedOpening: '2026-11-17T09:00:00+11:00',
    }),
    action({
      id: 'callback-james',
      primaryCallId: 'c009',
      callIds: ['c009'],
      title: 'Recover new-patient enquiry',
      description:
        'The supplied callback number was incomplete, but caller ID is available.',
      recommendedAction: 'Call using caller ID',
      priority: 'high',
      category: 'follow-up',
      estimatedMinutes: 5,
      suggestedTime: '09:20',
    }),
    action({
      id: 'rebook-rachel',
      primaryCallId: 'c015',
      callIds: ['c015'],
      title: 'Rebooking requested',
      description:
        'Cancelled an appointment and asked the practice to call next week.',
      recommendedAction: 'Call to rebook',
      priority: 'normal',
      category: 'follow-up',
      estimatedMinutes: 5,
      suggestedTime: '09:30',
    }),
    action({
      id: 'recover-david',
      primaryCallId: 'c007',
      callIds: ['c007'],
      title: 'Potential lost opportunity',
      description:
        'Could not find availability and said he would try somewhere else.',
      recommendedAction: 'Offer a cancelled slot',
      priority: 'normal',
      category: 'opening',
      estimatedMinutes: 5,
      suggestedTime: '10:00',
    }),
    action({
      id: 'referral-daniel',
      primaryCallId: 'c014',
      callIds: ['c014'],
      title: 'Referral promised',
      description:
        'The clinic does not offer orthodontics; Jade promised a referral callback.',
      recommendedAction: 'Provide referral options',
      priority: 'normal',
      category: 'referral',
      estimatedMinutes: 5,
      suggestedTime: '10:30',
    }),
  ]
}

export function buildCalendarEvents(
  data: WeekendCallsData,
  actions: ActionItem[],
): CalendarEvent[] {
  const openings = data.calls
    .filter((call) => call.appointment?.action === 'cancelled')
    .map<CalendarEvent>((call) => ({
      id: `opening-${call.id}`,
      lane: 'patient',
      time: call.appointment!.time,
      title: 'Open appointment',
      subtitle: call.appointment!.type,
      tone: 'opening',
    }))

  const tasks = actions.map<CalendarEvent>((item) => ({
    id: `task-${item.id}`,
    lane: 'front-desk',
    time: item.suggestedTime,
    title: item.title,
    subtitle: `${item.estimatedMinutes} min · ${item.callerName}`,
    tone: item.priority === 'critical' ? 'critical' : 'task',
    actionId: item.id,
  }))

  return [...openings, ...tasks]
}
