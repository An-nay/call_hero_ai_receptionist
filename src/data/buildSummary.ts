import { dayName, shortName } from './format'
import { getOpenings } from './activity'
import type { WeekendCallsData } from '../types/calls'
import type { ActionItem } from '../types/dashboard'

export function buildSummary(data: WeekendCallsData, actions: ActionItem[]) {
  const needCallIds = new Set(actions.flatMap((item) => item.callIds))
  const open = actions.filter((item) => item.status === 'open')
  const outOfHours = data.calls.filter(
    (call) =>
      call.outcome === 'booked' &&
      call.appointment &&
      ['Saturday', 'Sunday'].includes(dayName(call.appointment.date)),
  )
  const freeOpenings = getOpenings(data, actions).filter(
    (slot) => !slot.bookedByActionId,
  )
  const critical = open.filter((item) => item.priority === 'critical')

  const brief = [
    critical.length > 0
      ? `${critical.map((item) => shortName(item.callerName)).join(' and ')} need a human first.`
      : 'Nothing urgent is waiting.',
    freeOpenings.length > 0
      ? `${freeOpenings.length} cancelled slot${freeOpenings.length > 1 ? 's' : ''} can be recovered.`
      : 'All cancelled slots are filled.',
    `${open.length} follow-up${open.length === 1 ? '' : 's'} left, each with a reply drafted.`,
  ].join(' ')

  return {
    calls: data.calls.length,
    callers: new Set(data.calls.map((call) => call.caller_number)).size,
    handled: data.calls.filter((call) => !needCallIds.has(call.id)).length,
    needYou: open.length,
    outOfHours,
    brief,
  }
}
