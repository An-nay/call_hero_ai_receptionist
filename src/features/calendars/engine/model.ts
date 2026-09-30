import type { CallRecord, WeekendCallsData } from '../../../types/calls'
import { CLOSE, dayIdx, hm, isOpen } from './time'

export type Mood = 'nicer' | 'normal' | 'casual'

export interface Appt {
  cid: string
  who: string
  mood: Mood
  day: number
  time: string
  type: string
  prac: string
  cancelled: boolean
  madeAt: number
  note: string
  warn?: string
  /** True for a cancelled slot the owner has since filled from the dialog. */
  filled?: boolean
}

export interface Slot {
  day: number
  time: string
  prac: string
  cid?: string
  madeAt?: number
  derived?: boolean
}

export interface Block {
  start: number
  end: number
  label: string
  lunch?: boolean
}

/** A cancelled slot filled in the app: the cancelled call's id and the new patient. */
export interface Filled {
  cid: string
  who: string
}

const NICER_FLAGS = [
  'urgent',
  'complaint',
  'lost_opportunity',
  'note_for_practitioner',
  'rebook_requested',
  'waitlist_requested',
]

export const callAbs = (call: CallRecord) =>
  dayIdx(call.started_at) * 1440 +
  Number(call.started_at.slice(11, 13)) * 60 +
  Number(call.started_at.slice(14, 16))

export const shortPrac = (prac: string) => prac.replace(/^Dr \w+ /, 'Dr ')
export const sameSlot = (a: Slot, b: Slot) =>
  a.day === b.day && a.prac === b.prac && Math.abs(hm(a.time) - hm(b.time)) < 30
export const slotAbs = (slot: Slot) => slot.day * 1440 + hm(slot.time)

export function buildCalendarModel(
  data: WeekendCallsData,
  filled: Filled[] = [],
) {
  const calls = data.calls
  const callsOf = (name: string) =>
    calls.filter((call) => call.caller_name === name)
  const ids = (name: string) =>
    callsOf(name)
      .map((call) => call.id)
      .join(', ')

  const phones: Record<string, string> = {}
  for (const call of calls) {
    if (call.caller_name && !phones[call.caller_name])
      phones[call.caller_name] = call.caller_number
  }

  /** Nicer if anything negative or flagged sensitive, Casual if their latest call was positive. */
  const moodOf = (name: string): Mood => {
    const own = callsOf(name).sort((a, b) => callAbs(a) - callAbs(b))
    if (!own.length) return 'normal'
    if (
      own.some(
        (call) =>
          call.sentiment === 'negative' ||
          NICER_FLAGS.includes(call.flagged ?? ''),
      )
    )
      return 'nicer'
    return own[own.length - 1].sentiment === 'positive' ? 'casual' : 'normal'
  }

  const appts: Appt[] = calls
    .filter((call) => call.appointment)
    .map((call) => {
      const a = call.appointment!
      return {
        cid: call.id,
        who: call.caller_name ?? 'Unknown',
        mood: moodOf(call.caller_name ?? ''),
        day: dayIdx(a.date + 'T00:00:00'),
        time: a.time,
        type: a.type,
        prac: shortPrac(a.practitioner),
        cancelled: a.action === 'cancelled',
        madeAt: callAbs(call),
        note:
          call.flagged === 'note_for_practitioner'
            ? 'Note for practitioner'
            : '',
      }
    })

  // Slots filled from the dialog become ordinary bookings.
  for (const fill of filled) {
    const slot = appts.find((a) => a.cid === fill.cid && a.cancelled)
    if (!slot) continue
    appts.push({
      ...slot,
      cancelled: false,
      filled: true,
      who: fill.who,
      mood: moodOf(fill.who),
      madeAt: Number.MAX_SAFE_INTEGER,
      note: '',
    })
  }

  for (const appt of appts) {
    if (appt.cancelled) continue
    if (!isOpen(appt.day)) appt.warn = 'Clinic is closed on this day'
    else if (hm(appt.time) + 30 > CLOSE) appt.warn = 'Starts at closing time'
  }

  const booked = appts.filter((a) => !a.cancelled)
  /** Cancelled slots nobody has taken: the only openings the log can prove. */
  const freed = appts.filter(
    (a) => a.cancelled && !booked.some((b) => sameSlot(b, a)),
  )

  /** Front-desk time no task may use: lunch, the first patient, and check-in around each booking. */
  function blocksFor(day: number): Block[] {
    if (!isOpen(day)) return []
    const blocks: Block[] = booked
      .filter((a) => a.day === day)
      .map((a) => ({
        start: hm(a.time) - 5,
        end: hm(a.time) + 5,
        label: `Check-in: ${a.who}`,
      }))
    blocks.push({ start: 840, end: 885, label: 'Lunch break', lunch: true })
    if (day === 0)
      blocks.push({
        start: 510,
        end: 520,
        label: 'First patient arrives (8:30)',
      })
    return blocks.sort((x, y) => x.start - y.start)
  }

  return {
    calls,
    callsOf,
    ids,
    phones,
    moodOf,
    appts,
    booked,
    freed,
    blocksFor,
  }
}

export type CalendarModel = ReturnType<typeof buildCalendarModel>
