/**
 * Day index 0 is Monday 17 Nov 2026 ("today"). Weekday names follow the call
 * data's own labels (its summaries say 17 Nov is a Monday), not the real 2026
 * calendar.
 */
export const DAY0 = Date.UTC(2026, 10, 17)
export const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const OPEN = 480
export const CLOSE = 1020
export const DAYS = 16
export const LAST = 40

export const wd = (i: number) => WD[((i % 7) + 7) % 7]
export const isOpen = (i: number) => ((i % 7) + 7) % 7 < 5
export const dnum = (i: number) => new Date(DAY0 + i * 864e5).getUTCDate()
export const mon = (i: number) =>
  new Date(DAY0 + i * 864e5).toLocaleString('en-AU', {
    month: 'short',
    timeZone: 'UTC',
  })
export const dlabel = (i: number) => `${wd(i)} ${dnum(i)} ${mon(i)}`

export const fmt = (minutes: number) => {
  const m = Math.floor(minutes)
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`
}
export const hm = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
export const hhmm = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export const dayIdx = (iso: string) =>
  Math.round(
    (Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) -
      DAY0) /
      864e5,
  )

/** Inverse of dayIdx: 0 -> "2026-11-17". */
export const dateOfDay = (i: number) =>
  new Date(DAY0 + i * 864e5).toISOString().slice(0, 10)

/** Real time of day in the clinic's timezone, held between opening and closing. */
export function liveMinutes(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value)
  const minutes = get('hour') * 60 + get('minute') + get('second') / 60
  return Math.min(CLOSE, Math.max(OPEN, minutes))
}
