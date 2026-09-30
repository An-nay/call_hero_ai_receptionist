import type { CalendarModel } from './model'
import type { Task } from './tasks'
import { CLOSE, LAST, OPEN, isOpen } from './time'

export interface Placed {
  t: Task
  start: number
  end: number
}
export interface Plan {
  hours: Record<number, Record<number, Placed[]>>
  where: Record<string, { day: number; hour: number }>
}
export interface Clock {
  day: number
  min: number
}
export type DoneMap = Record<string, { day: number; at: number }>

/** Walk-ins can arrive any hour, so each hour keeps about 30 min free. */
const CEIL = { 1: 60, 2: 40, 3: 30, 4: 30 } as const

/**
 * Once every Urgent/High task due today is ticked, she is ahead: the walk-in
 * buffer lifts and Normal/Low tasks move up into what is left of the hour.
 */
export function highClear(tasks: Task[], done: DoneMap, clock: Clock) {
  const nowAbs = clock.day * 1440 + Math.floor(clock.min)
  return !tasks.some(
    (t) =>
      t.pri <= 2 &&
      !done[t.id] &&
      t.due <= clock.day &&
      (!t.exp || t.exp > nowAbs),
  )
}

/**
 * Fill each hour with the highest-priority pending task that still fits the
 * time left, the hour's budget and the front-desk blocks; whatever doesn't fit
 * rolls to the next hour, then the next open day.
 */
export function plan(
  model: CalendarModel,
  tasks: Task[],
  done: DoneMap,
  clock: Clock,
): Plan {
  const hours: Plan['hours'] = {}
  const where: Plan['where'] = {}
  const ahead = highClear(tasks, done, clock)
  let pool = tasks
    .filter((t) => !done[t.id])
    .sort((a, b) => a.pri - b.pri || a.due - b.due || a.ord - b.ord)
  const now = Math.floor(clock.min)

  for (let d = clock.day; d <= LAST && pool.length; d++) {
    if (!isOpen(d)) continue
    const start = d === clock.day ? Math.max(now, OPEN) : OPEN
    const blocks = model.blocksFor(d)
    pool = pool.filter((t) => !t.exp || t.exp > d * 1440 + start)
    hours[d] = {}
    const first = Math.floor(start / 60)
    const lowFrom = d === clock.day && ahead ? first : first + 1
    for (let h = first; h < CLOSE / 60; h++) {
      let cur = Math.max(start, h * 60)
      const end = (h + 1) * 60
      const list: Placed[] = (hours[d][h] = [])
      const hit = (s: number, e: number) =>
        blocks.some((b) => s < b.end && e > b.start)
      for (;;) {
        const used = list.reduce((n, x) => n + x.t.min, 0)
        const cap = (t: Task) =>
          t.pri >= 3 && d === clock.day && ahead && h === first
            ? 60
            : CEIL[t.pri]
        const i = pool.findIndex(
          (t) =>
            t.due <= d &&
            (t.pri <= 2 || h >= lowFrom) &&
            (t.after ?? 0) <= h * 60 &&
            cur + t.min <= end &&
            used + t.min <= cap(t) &&
            !hit(cur, cur + t.min),
        )
        if (i >= 0) {
          const [t] = pool.splice(i, 1)
          list.push({ t, start: cur, end: cur + t.min })
          where[t.id] = { day: d, hour: h }
          cur += t.min
          continue
        }
        const nb = blocks.find((b) => b.end > cur && b.start < end)
        if (!nb) break
        cur = Math.max(cur, nb.end)
        if (cur >= end) break
      }
    }
  }
  return { hours, where }
}
