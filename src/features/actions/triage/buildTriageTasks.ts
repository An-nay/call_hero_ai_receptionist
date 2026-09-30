import type { CallRecord, WeekendCallsData } from '../../../types/calls'

export type Urgency = 'now' | 'today' | 'week'

export interface TriageTask {
  id: string
  /** Masked for the front desk, for example "Peter Y." */
  name: string
  urgency: Urgency
  label: string
  detail: string
  /** Used only for the tel: link. Never rendered as text. */
  phone: string | null
  rank: number
}

export interface TriageResult {
  tasks: TriageTask[]
  totalCallers: number
  hiddenCallers: number
}

const urgencyOrder: Record<Urgency, number> = { now: 0, today: 1, week: 2 }

export function maskName(name: string | null | undefined): string {
  if (!name) return 'Unknown caller'
  const [first, ...rest] = name.trim().split(/\s+/)
  const last = rest.at(-1)
  return last ? `${first} ${last[0].toUpperCase()}.` : first
}

export function ageLabel(from: string, now: Date): string {
  const hours = Math.round((now.getTime() - new Date(from).getTime()) / 36e5)
  if (hours < 1) return 'under 1h ago'
  if (hours < 48) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * Turns the weekend calls into a short, ranked list of people to call.
 * Rules look at outcome and flags, never at call IDs, so a missing or
 * extra record cannot crash the panel. Callers are grouped by phone number,
 * and anyone whose latest call ended in a booking is treated as resolved.
 */
export function buildTriageTasks(
  data: WeekendCallsData,
  now: Date = new Date(data.period.to),
): TriageResult {
  const byCaller = new Map<string, CallRecord[]>()
  for (const call of data.calls) {
    const key = call.caller_number || call.id
    byCaller.set(key, [...(byCaller.get(key) ?? []), call])
  }

  const cancelledSlots = data.calls.filter(
    (call) => call.appointment?.action === 'cancelled',
  ).length

  const tasks: TriageTask[] = []

  for (const [key, group] of byCaller) {
    const calls = [...group].sort(
      (a, b) => Date.parse(a.started_at) - Date.parse(b.started_at),
    )
    const first = calls[0]
    const last = calls[calls.length - 1]
    const flags = new Set(calls.map((call) => call.flagged).filter(Boolean))
    const base = {
      id: key,
      name: maskName(calls.find((call) => call.caller_name)?.caller_name),
      phone: last.caller_number || null,
    }
    const add = (
      urgency: Urgency,
      rank: number,
      label: string,
      detail: string,
    ) => tasks.push({ ...base, urgency, rank, label, detail })

    if (flags.has('urgent') || last.outcome === 'urgent_flagged') {
      add(
        'now',
        1,
        'Urgent, call now',
        `rang ${ageLabel(first.started_at, now)}`,
      )
    } else if (flags.has('complaint') && last.outcome !== 'booked') {
      add(
        'now',
        2,
        'Complaint, no callback yet',
        `${plural(calls.length, 'call')}, first ${ageLabel(first.started_at, now)}`,
      )
    } else if (last.outcome === 'booked') {
      continue
    } else if (last.outcome === 'no_availability') {
      if (flags.has('waitlist_requested')) {
        add(
          'today',
          3,
          'On the waitlist, offer a slot',
          cancelledSlots > 0
            ? `${plural(cancelledSlots, 'cancelled slot')} to offer`
            : `${plural(calls.length, 'call')}, no slot found`,
        )
      } else {
        add(
          'today',
          4,
          'May book elsewhere, offer a slot',
          flags.has('lost_opportunity')
            ? 'said they would try elsewhere'
            : `${plural(calls.length, 'call')}, no slot found`,
        )
      }
    } else if (
      last.outcome === 'failed_callback_number' ||
      flags.has('bad_data')
    ) {
      add('today', 5, 'Bad number, use caller ID', 'new patient enquiry')
    } else if (flags.has('rebook_requested')) {
      add('week', 6, 'Call to rebook', 'cancelled and asked for a call')
    } else if (flags.has('service_not_offered')) {
      add('week', 7, 'Referral promised', 'asked for a service not offered')
    } else if (last.outcome === 'cancelled') {
      add('week', 8, 'Cancelled, not rebooked', 'their slot is now open')
    }
  }

  tasks.sort(
    (a, b) =>
      urgencyOrder[a.urgency] - urgencyOrder[b.urgency] || a.rank - b.rank,
  )

  return {
    tasks,
    totalCallers: byCaller.size,
    hiddenCallers: byCaller.size - tasks.length,
  }
}
