import { getCallbackTime } from './activity'
import type { ActionItem } from '../types/dashboard'

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/**
 * Earliest free front-desk slots for this action, spaced at least
 * `spacing` minutes apart. Other open actions occupy their planned time.
 */
export function suggestCallbackTimes(
  actions: ActionItem[],
  self: ActionItem,
  count = 3,
  spacing = 20,
): string[] {
  const busy = actions
    .filter((item) => item.id !== self.id && item.status === 'open')
    .map((item) => {
      const start = toMinutes(getCallbackTime(item) ?? item.suggestedTime)
      return [start, start + item.estimatedMinutes] as const
    })

  const picks: number[] = []
  for (
    let start = 8 * 60;
    start <= 12 * 60 && picks.length < count;
    start += 5
  ) {
    const end = start + self.estimatedMinutes
    const clash = busy.some(([from, to]) => start < to && end > from)
    const tooClose = picks.some((pick) => Math.abs(pick - start) < spacing)
    if (!clash && !tooClose) picks.push(start)
  }
  return picks.map(toTime)
}
