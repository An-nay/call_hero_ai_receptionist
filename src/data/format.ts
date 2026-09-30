const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

/** "Grace Scott" -> "Grace S." Keeps full names off a shared front-desk screen. */
export function shortName(name: string) {
  const [first, last] = name.split(' ')
  return last ? `${first} ${last[0]}.` : first
}

export const firstName = (name: string) => name.split(' ')[0]

/**
 * The scenario's Monday is 17 Nov, but the JSON year (2026) makes that a
 * Tuesday, so weekday names are anchored to the scenario instead.
 */
export function dayName(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  const diff = Math.round(
    (Date.UTC(y, m - 1, d) - Date.UTC(2026, 10, 17)) / 864e5,
  )
  return days[((diff % 7) + 7) % 7]
}
