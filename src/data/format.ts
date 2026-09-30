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

export const isValidPhone = (number: string) => /^\+61\d{9}$/.test(number)

/** "+61412887301" -> "•••• ••• 301" */
export const maskPhone = (number: string) => `•••• ••• ${number.slice(-3)}`

/** "+61412887301" -> "+61 412 887 301" */
export const formatPhone = (number: string) =>
  isValidPhone(number)
    ? `${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6, 9)} ${number.slice(9)}`
    : number

/** Wall-clock parts of an ISO timestamp, ignoring the viewer's timezone. */
export const wallClock = (iso: string) => ({
  date: iso.slice(0, 10),
  time: iso.slice(11, 16),
})
