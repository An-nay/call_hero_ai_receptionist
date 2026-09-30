import {
  callAbs,
  sameSlot,
  slotAbs,
  type CalendarModel,
  type Mood,
  type Slot,
} from './model'
import { CLOSE, OPEN, dlabel, hhmm, hm, isOpen, wd } from './time'

export type CatKey =
  | 'triage'
  | 'complaint'
  | 'confirm'
  | 'offer'
  | 'winback'
  | 'rebook'
  | 'referral'
  | 'datafix'
  | 'bookfix'
  | 'note'
  | 'release'
  | 'remind'

/** Minutes per task type: working estimates, not benchmarked averages. */
export const CATS: Record<CatKey, { label: string; min: number }> = {
  triage: { label: 'Urgent patient call', min: 5 },
  complaint: { label: 'Complaint callback', min: 6 },
  confirm: { label: 'Confirm booking', min: 3 },
  offer: { label: 'Slot / waitlist offer', min: 3 },
  winback: { label: 'Win-back call', min: 3 },
  rebook: { label: 'Rebooking call', min: 3 },
  referral: { label: 'Referral callback', min: 4 },
  datafix: { label: 'Fix contact details', min: 3 },
  bookfix: { label: 'Fix a booking', min: 3 },
  note: { label: 'Chart note', min: 2 },
  release: { label: 'Release a slot', min: 2 },
  remind: { label: 'Appointment reminder', min: 2 },
}

export type Priority = 1 | 2 | 3 | 4
export const PRI: Record<Priority, { name: string; k: string }> = {
  1: { name: 'Urgent', k: 'r' },
  2: { name: 'High', k: 'o' },
  3: { name: 'Normal', k: 'b' },
  4: { name: 'Low', k: 'n' },
}

export const MOOD: Record<Mood, { label: string; tip: string }> = {
  nicer: { label: 'Nicer', tip: 'Slow down, apologise, show empathy' },
  normal: { label: 'Normal', tip: 'Polite and professional' },
  casual: { label: 'Casual', tip: 'Friendly and relaxed' },
}

export interface Task {
  id: string
  who: string
  mood: Mood
  cat: CatKey
  pri: Priority
  /** Earliest day index the task is due. */
  due: number
  /** Full instructions, shown in the dialog. */
  text: string
  /** One line: what to do. */
  headline: string
  /** One line: why. */
  why: string
  call: string
  min: number
  ord: number
  /** Expires at this absolute minute (a reminder is pointless once the appointment starts). */
  exp?: number
  /** Not before this minute of the day. */
  after?: number
  /** The freed slot this task offers first, if any. */
  offer?: Slot
}

export interface PassEntry {
  fix: boolean
  /** Text with <b>name</b> markers. */
  d: string
}

/** What each "no availability" caller asked for, read from the call summaries. */
const WANT: Record<string, { label: string; from: number; to: number }> = {
  'David Miller': { label: 'any time this week', from: 0, to: 4 },
  'Chris Martin': { label: 'Monday or Tuesday', from: 0, to: 1 },
  'Grace Scott': {
    label: 'any time before the end of the month',
    from: 0,
    to: 13,
  },
}

export const slug = (name: string) => name.split(' ')[0].toLowerCase()

const prevOpen = (day: number) => {
  let d = day - 1
  while (d > 0 && !isOpen(d)) d--
  return Math.max(d, 0)
}

interface Wanted {
  prac: string
  time: string
  ref: number
  minDay: number
}
type Scored = Slot & { score: number }

/**
 * Re-reads the call log, finds Jade's mistakes and writes the corrected tasks.
 * `nowAbs` (absolute minutes from the start of day 0) hides slots that have gone.
 */
export function buildTasks(model: CalendarModel, nowAbs: number) {
  const { calls, callsOf, ids, moodOf, appts, booked, freed } = model
  const out: Omit<Task, 'min' | 'ord'>[] = []
  const fixes: string[] = []
  const checks: string[] = []
  const taken = new Set<string>()
  const claims: Record<string, string> = {}

  const short = (s: Slot) => `${wd(s.day)} ${s.time} with ${s.prac}`
  const slotTxt = (s: Slot) => `${dlabel(s.day)} ${s.time} with ${s.prac}`
  const key = (s: Slot) => `${s.day}|${s.time}|${s.prac}`
  const free = freed
    .filter((s) => slotAbs(s) > nowAbs)
    .sort((a, b) => slotAbs(a) - slotAbs(b))

  const claim = <S extends Slot | undefined>(s: S, who: string): S => {
    if (s && !s.derived) {
      taken.add(key(s))
      claims[key(s)] = who
    }
    return s
  }
  const tag = (s: Slot, me: string) =>
    s.derived
      ? ' (not in the booked list, check the diary first)'
      : claims[key(s)] && claims[key(s)] !== me
        ? ` (first offered to ${claims[key(s)].split(' ')[0]})`
        : ' (freed by a cancellation)'
  const say = (me: string, f?: Slot, b?: Slot) =>
    f
      ? `Offer ${slotTxt(f)}${tag(f, me)}.${b ? ` If that doesn't suit: ${slotTxt(b)}${tag(b, me)}.` : ''}`
      : 'No free slot is known right now, so add them to the waitlist and check the diary.'

  const T = (
    id: string,
    who: string,
    cat: CatKey,
    pri: Priority,
    due: number,
    text: string,
    headline: string,
    why: string,
    extra: Partial<Task> = {},
  ) =>
    out.push({
      id,
      who,
      mood: moodOf(who),
      cat,
      pri,
      due,
      text,
      headline,
      why,
      call: ids(who),
      ...extra,
    })

  /** Unconfirmed openings around a preferred time, same practitioner and time of day. */
  const nearby = (o: Wanted): Scored[] => {
    const t0 = hm(o.time)
    const t = Math.min(Math.max(t0, OPEN), CLOSE - 30)
    const r: Scored[] = []
    for (let d = o.minDay; d <= o.ref + 10; d++) {
      if (!isOpen(d)) continue
      const s: Slot = { day: d, time: hhmm(t), prac: o.prac, derived: true }
      if (
        slotAbs(s) <= nowAbs ||
        booked.some((b) => sameSlot(b, s)) ||
        freed.some((f) => sameSlot(f, s))
      )
        continue
      r.push({ ...s, score: Math.abs(d - o.ref) + Math.abs(t - t0) / 120 })
    }
    return r
  }
  const best = (o: Wanted): Scored[] => {
    const c = nearby(o)
    free
      .filter((s) => s.day >= o.minDay && !taken.has(key(s)))
      .forEach((s) =>
        c.push({
          ...s,
          score:
            Math.abs(s.day - o.ref) +
            Math.abs(hm(s.time) - hm(o.time)) / 120 +
            (s.prac === o.prac ? 0 : 1.5) -
            0.75,
        }),
      )
    return c.sort((a, b) => a.score - b.score || a.day - b.day).slice(0, 2)
  }

  // 1. Urgent call that was never booked: first in line for the earliest slot.
  const urgentNoBooking = calls.filter(
    (c) => c.outcome === 'urgent_flagged' && !c.appointment,
  )
  urgentNoBooking.forEach((c) => {
    const n = c.caller_name!
    const f = claim(
      free.find((s) => !taken.has(key(s))),
      n,
    )
    const b =
      free.find((s) => s !== f && !taken.has(key(s))) ||
      free.find((s) => s !== f)
    T(
      slug(n),
      n,
      'triage',
      1,
      0,
      `Urgent overnight call and nobody has rung back yet. ${say(n, f, b)}`,
      f
        ? `Offer ${short(f)}${b ? ` or ${short(b)}` : ''}`
        : 'Check the diary for the earliest slot',
      'Urgent overnight call, nobody has rung back',
    )
    fixes.push(
      `<b>${n}</b> had an urgent call but was never booked. First in line for ${f ? slotTxt(f) : 'the earliest slot (none known, check the diary)'}.`,
    )
  })

  // 2. Jade's "priority" flag on a booking whose own note shows no urgency,
  //    while a real urgent call had no booking.
  const overTriaged = calls.filter(
    (c) => c.flagged === 'priority' && /not painful/i.test(c.summary),
  )
  overTriaged.forEach((c) => {
    const n = c.caller_name!
    const b = booked.find((a) => a.who === n)
    if (!b) return
    const down = urgentNoBooking.length > 0
    T(
      slug(n),
      n,
      'confirm',
      down ? 3 : 1,
      0,
      `Confirm ${dlabel(b.day)} ${b.time} with ${b.prac}.${down ? " The final pass removed Jade's priority flag: nothing in the call suggests urgency, and the urgent call outranks it." : ''}`,
      `Confirm ${wd(b.day)} ${b.time} with ${b.prac}`,
      down ? 'Priority flag removed, not urgent' : 'Booking to confirm',
      { exp: slotAbs(b) },
    )
    if (down)
      fixes.push(
        `<b>${n}</b> was flagged priority ahead of the urgent call. Priority flag removed, booking kept.`,
      )
  })

  // 3. Told "no availability" while cancelled slots were open.
  const missed = calls.filter((c) => c.outcome === 'no_availability')
  const names = [...new Set(missed.map((c) => c.caller_name!))].sort(
    (a, b) =>
      Number(booked.some((x) => x.who === a)) -
      Number(booked.some((x) => x.who === b)),
  )
  const assigns: string[] = []
  names.forEach((n) => {
    const w = WANT[n] ?? { label: 'as soon as possible', from: 0, to: 13 }
    const me = booked.find((a) => a.who === n)
    const cand = free.filter((s) => s.day >= w.from && s.day <= w.to)
    const f = cand.find((s) => !taken.has(key(s)))
    const b =
      cand.find((s) => s !== f && !taken.has(key(s))) ||
      cand.find((s) => s !== f)
    const lost = callsOf(n).some((c) => c.flagged === 'lost_opportunity')
    assigns.push(`${n.split(' ')[0]}: ${f ? slotTxt(f) : 'waitlist'}`)
    if (!me) {
      const first = claim(f, n)
      T(
        slug(n),
        n,
        lost ? 'winback' : 'offer',
        2,
        0,
        `Asked for ${w.label}. ` +
          (f
            ? say(n, first, b)
            : cand.length
              ? `Every open slot in that window is already offered to someone else (${cand.map(slotTxt).join(', ')}). Add them to the waitlist and check the diary.`
              : 'No free slot is known in that window. Add them to the waitlist and check the diary.'),
        f
          ? `Offer ${short(first!)}${b ? ` or ${short(b)}` : ''}`
          : 'Add to the waitlist',
        `Wants ${w.label}`,
        { offer: first },
      )
    } else {
      const first = claim(f, n)
      T(
        slug(n),
        n,
        'offer',
        3,
        0,
        `Asked for ${w.label} ${callsOf(n).length} times before settling on ${dlabel(me.day)} ${me.time}. Apologise and confirm it. ` +
          (f
            ? `Offer ${slotTxt(first!)}${tag(f, n)} if they still want an earlier slot.`
            : 'The earlier openings are already offered to others.'),
        f
          ? `Apologise, confirm, offer ${short(first!)}`
          : 'Apologise and confirm the booking',
        `Asked ${callsOf(n).length}x for ${w.label}, booked ${wd(me.day)} ${me.time}`,
        { offer: first },
      )
    }
  })
  if (missed.length) {
    const open = missed.map(
      (c) =>
        freed.filter((s) => s.madeAt! < callAbs(c) && slotAbs(s) > callAbs(c))
          .length,
    )
    fixes.push(
      `<b>${names.length} callers</b> (${missed.length} calls) were told there was no availability while up to ${Math.max(...open)} cancelled slots were open. Offers now: ${assigns.join('; ')}.`,
    )
  }

  // 4. Bookings on a closed day or at closing time.
  booked
    .filter((a) => a.warn)
    .forEach((a) => {
      const closed = a.warn!.includes('closed')
      const [x, y] = best({ prac: a.prac, time: a.time, ref: a.day, minDay: 0 })
      claim(x, a.who)
      claim(y, a.who)
      T(
        slug(a.who),
        a.who,
        'bookfix',
        closed ? 2 : 4,
        0,
        `Booked ${dlabel(a.day)} ${a.time}, ${closed ? 'a day the clinic is closed' : 'right at closing time'}. ${say(a.who, x, y)}`,
        x
          ? `Move to ${short(x)}${y ? ` or ${short(y)}` : ''}`
          : 'Find another time',
        `Booked ${wd(a.day)} ${a.time}, ${closed ? 'clinic closed' : 'at closing time'}`,
      )
      fixes.push(
        `<b>${a.who}</b> was booked ${closed ? 'on a closed day' : 'at closing time'} (${dlabel(a.day)} ${a.time}). Two alternatives ready${closed ? '' : ', low priority'}.`,
      )
    })

  // 5. Cancellations that want to rebook; anyone who already rebooked is left alone.
  calls
    .filter((c) => c.appointment && c.appointment.action === 'cancelled')
    .forEach((c) => {
      const n = c.caller_name!
      const a = appts.find((x) => x.cid === c.id && x.cancelled)!
      if (booked.some((b) => b.who === n && b.madeAt > a.madeAt)) {
        checks.push(`${n.split(' ')[0]} cancelled and already rebooked`)
        return
      }
      if (!(
        c.flagged === 'rebook_requested' || /call back.*rebook/i.test(c.summary)
      ))
        return
      const due = /next week/i.test(c.summary) ? 7 : 0
      const orig =
        due === 0
          ? free.find((s) => s.cid === a.cid && !taken.has(key(s)))
          : undefined
      let f: Slot | undefined
      let b: Slot | undefined
      if (orig) {
        f = claim(orig, n)
        b = best({ prac: a.prac, time: a.time, ref: a.day, minDay: 0 })[0]
      } else {
        ;[f, b] = best({
          prac: a.prac,
          time: a.time,
          ref: due || a.day,
          minDay: due,
        })
        claim(f, n)
      }
      const t = say(n, f, b)
      T(
        slug(n),
        n,
        'rebook',
        4,
        due,
        `Cancelled ${dlabel(a.day)} ${a.time} and wants to rebook${due ? ', and asked for a call next week' : ''}. ` +
          (orig ? t.replace('Offer ', 'Offer their original slot, ') : t),
        f
          ? `Offer ${orig ? 'their original slot, ' : ''}${short(f)}`
          : 'Call to rebook',
        `Cancelled ${wd(a.day)} ${a.time}${due ? ', asked for a call next week' : ''}`,
        { offer: f && !f.derived ? f : undefined },
      )
      fixes.push(
        `<b>${n}</b> cancelled and wants to rebook. Low-priority callback${due ? ' next week, as they asked,' : ''} with ${orig ? 'their original slot first' : 'two alternatives'}.`,
      )
    })

  // 6. Referral Jade promised for a service the clinic doesn't offer.
  calls
    .filter((c) => c.flagged === 'service_not_offered')
    .forEach((c) => {
      const n = c.caller_name!
      const first = n.split(' ')[0]
      T(
        slug(n),
        n,
        'referral',
        4,
        0,
        `Jade told ${first} the practice would call back with a referral, but the clinic doesn't offer this. Later today, ring a local specialist clinic, ask if they take referrals, and ask them to call ${first} back.`,
        'Ring a specialist clinic and ask them to call back',
        'Referral promised, clinic does not offer this',
        { after: 14 * 60 },
      )
      fixes.push(
        `<b>${n}</b> was promised a referral callback. Now a low-priority task after 14:00: call a specialist clinic and ask them to ring back.`,
      )
    })

  // Everything else from the flags.
  ;[
    ...new Set(
      calls.filter((c) => c.flagged === 'complaint').map((c) => c.caller_name!),
    ),
  ].forEach((n) =>
    T(
      slug(n),
      n,
      'complaint',
      1,
      0,
      `Call back about the invoice dispute. ${callsOf(n).length} calls so far and no callback since Friday evening. Apologise first and say when they will hear back.`,
      'Apologise first, say when they will hear back',
      `${callsOf(n).length} calls, no callback since Friday`,
    ),
  )
  calls
    .filter((c) => c.flagged === 'bad_data')
    .forEach((c) => {
      const n = c.caller_name!
      T(
        slug(n),
        n,
        'datafix',
        2,
        0,
        'The callback number Jade captured is too short and was never read back. Call or text the number they rang from, confirm it, and book their first visit.',
        'Call the number they rang from and book their visit',
        'Callback number was a digit short',
      )
    })
  calls
    .filter((c) => c.flagged === 'note_for_practitioner')
    .forEach((c) => {
      const n = c.caller_name!
      const b = booked.find((a) => a.who === n)
      if (!b) return
      T(
        slug(n),
        n,
        'note',
        3,
        0,
        `Add the practitioner note to their chart before ${dlabel(b.day)} ${b.time} with ${b.prac}.`,
        `Add the note to their chart before ${wd(b.day)} ${b.time}`,
        'Note for the practitioner',
      )
    })
  booked
    .filter((a) => !a.warn && !overTriaged.some((c) => c.caller_name === a.who))
    .forEach((a) =>
      T(
        'rem-' + slug(a.who),
        a.who,
        'remind',
        4,
        prevOpen(a.day),
        `Send a reminder for ${a.time} ${a.type} on ${dlabel(a.day)} (${a.prac}).`,
        `Send reminder for ${wd(a.day)} ${a.time}`,
        a.type,
        { call: '', exp: slotAbs(a) },
      ),
    )

  let doubleBooked = 0
  booked.forEach((a, i) =>
    booked.slice(i + 1).forEach((b) => {
      if (sameSlot(a, b)) doubleBooked++
    }),
  )
  const log: PassEntry[] = fixes.map((d) => ({ fix: true, d }))
  log.push({
    fix: false,
    d: `<b>Checked, nothing to fix:</b> ${doubleBooked} double-bookings; ${checks.length ? checks.join('; ') + '; ' : ''}no other bookings outside opening hours.`,
  })

  const tasks: Task[] = out.map((t, i) => ({
    ...t,
    min: CATS[t.cat].min,
    ord: i,
  }))
  return { tasks, log }
}
