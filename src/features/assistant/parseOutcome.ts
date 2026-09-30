import { dayName } from '../../data/format'
import type { ActionItem, OpeningSlot } from '../../types/dashboard'

export type Intent =
  | { kind: 'book'; action: ActionItem; slot: OpeningSlot }
  | { kind: 'no-slot'; action: ActionItem; available: OpeningSlot[] }
  | { kind: 'called'; action: ActionItem; detail: 'Reached them' | 'No answer' }
  | { kind: 'callback'; action: ActionItem; time: string }
  | { kind: 'resolve'; action: ActionItem; detail: string }
  | { kind: 'ask-caller'; options: ActionItem[] }
  | { kind: 'unclear'; action: ActionItem }

const WEEKDAYS: [RegExp, string][] = [
  [/\bmon(day)?\b/, 'Monday'],
  [/\btue(s|sday)?\b/, 'Tuesday'],
  [/\bwed(nesday)?\b/, 'Wednesday'],
  [/\bthu(r|rs|rsday)?\b/, 'Thursday'],
  [/\bfri(day)?\b/, 'Friday'],
]

/** Finds the caller the message is about, by full name, first name or last name. */
export function findAction(text: string, actions: ActionItem[]) {
  const lower = text.toLowerCase()
  let best: { action: ActionItem; at: number } | undefined
  for (const action of actions) {
    const parts = action.callerName.toLowerCase().split(' ')
    for (const part of [action.callerName.toLowerCase(), ...parts]) {
      const at = lower.search(new RegExp(`\\b${part}\\b`))
      if (at >= 0 && (!best || at < best.at)) best = { action, at }
    }
  }
  return best?.action
}

/** 24-hour time mentioned in the text ("11", "11:00", "2pm", "at 9"), if any. */
function findTime(lower: string): string | undefined {
  const match = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/g)
  for (const raw of match ?? []) {
    const m = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)!
    const hasMarker = m[2] !== undefined || m[3] !== undefined
    const before = lower.slice(0, lower.indexOf(raw)).trimEnd()
    if (!hasMarker && !/(\bat|\bfor|\bthe)$/.test(before)) continue
    let hour = Number(m[1])
    if (m[3] === 'pm' && hour < 12) hour += 12
    if (m[3] === 'am' && hour === 12) hour = 0
    if (!m[3] && hour >= 1 && hour <= 7) hour += 12
    if (hour < 6 || hour > 20) continue
    return `${String(hour).padStart(2, '0')}:${m[2] ?? '00'}`
  }
  return undefined
}

function findDate(lower: string): number | undefined {
  const match = lower.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:nov|november|dec|december)\b/,
  )
  return match ? Number(match[1]) : undefined
}

function findSlot(text: string, action: ActionItem, free: OpeningSlot[]) {
  const lower = text.toLowerCase()
  const weekday = WEEKDAYS.find(([re]) => re.test(lower))?.[1]
  const time = findTime(lower)
  const date = findDate(lower)
  const wantsOffered = /\b(first|offered|that one|the offer)\b/.test(lower)

  if (weekday || time || date) {
    const hits = free.filter(
      (slot) =>
        (!weekday || dayName(slot.date) === weekday) &&
        (!time || slot.time === time) &&
        (!date || Number(slot.date.slice(8)) === date),
    )
    if (hits.length === 1) return { slot: hits[0], asked: true }
    return { slot: undefined, asked: true }
  }
  if (wantsOffered && action.relatedOpening) {
    const slot = free.find((s) =>
      action.relatedOpening!.startsWith(`${s.date}T${s.time}`),
    )
    if (slot) return { slot, asked: true }
  }
  return { slot: undefined, asked: false }
}

/** Turns "Peter chose Tue 18 Nov 11:00" into something the app can do. */
export function parseOutcome(
  text: string,
  actions: ActionItem[],
  openings: OpeningSlot[],
): Intent {
  const open = actions.filter((item) => item.status === 'open')
  const action = findAction(text, actions)
  if (!action) return { kind: 'ask-caller', options: open.slice(0, 4) }
  const lower = text.toLowerCase()
  const free = openings.filter((slot) => !slot.bookedByActionId)

  if (
    /(declin|not interested|no thanks|doesn'?t want|does not want|said no|refus)/.test(
      lower,
    )
  )
    return { kind: 'resolve', action, detail: 'Declined' }
  if (
    /(no answer|didn'?t answer|did not answer|voicemail|left a message|unreachable|straight to)/.test(
      lower,
    )
  )
    return { kind: 'called', action, detail: 'No answer' }

  const { slot, asked } = findSlot(text, action, free)
  if (slot) return { kind: 'book', action, slot }

  const callback = lower.match(
    /(?:call(?:ed)?(?: (?:him|her|them))? back|callback|ring(?: (?:him|her|them))? back)[^\d]*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/,
  )
  if (callback) {
    let hour = Number(callback[1])
    if (callback[3] === 'pm' && hour < 12) hour += 12
    if (!callback[3] && hour >= 1 && hour <= 7) hour += 12
    return {
      kind: 'callback',
      action,
      time: `${String(hour).padStart(2, '0')}:${callback[2] ?? '00'}`,
    }
  }

  if (asked) return { kind: 'no-slot', action, available: free }
  if (/(spoke|talked|reached|got through|answered|picked up)/.test(lower))
    return { kind: 'called', action, detail: 'Reached them' }
  if (/(\bdone\b|handled|resolved|sorted|all good|complete)/.test(lower))
    return { kind: 'resolve', action, detail: 'Resolved' }
  return { kind: 'unclear', action }
}
