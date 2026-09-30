import { useEffect, useMemo, useRef, useState } from 'react'
import { isDone } from '../../data/activity'
import { useDashboard } from '../../state/useDashboard'
import './calendar.css'
import { ApptCard, BlockCard, RichText, TaskCard } from './calendarParts'
import { type Privacy } from './privacy'
import { EveryCaller } from './EveryCaller'
import { buildCalendarModel } from './engine/model'
import { highClear, plan, type DoneMap } from './engine/plan'
import { buildTasks, MOOD, PRI, type Task } from './engine/tasks'
import {
  CLOSE,
  DAYS,
  OPEN,
  dlabel,
  dnum,
  fmt,
  hm,
  isOpen,
  liveMinutes,
  wd,
} from './engine/time'

interface ClockState {
  mode: 'live' | 'demo'
  day: number
  min: number
  speed: number
}

/** The Monday-8:00 scene is the default; "Back to live" follows the real clinic clock. */
const START: ClockState = { mode: 'demo', day: 0, min: OPEN, speed: 0 }

export function OperationsCalendar() {
  const {
    data,
    actions,
    openings,
    selectAction,
    logActivity,
    undoLastActivity,
    setClinicMinute,
  } = useDashboard()
  const [tab, setTab] = useState<'cal' | 'tbl'>('cal')
  const [clock, setClock] = useState<ClockState>(START)
  const [showClock, setShowClock] = useState(false)
  const [reveal, setReveal] = useState(false)
  const [sel, setSel] = useState(0)
  const [localDone, setLocalDone] = useState<DoneMap>({})
  const [tags, setTags] = useState<Record<string, 'up' | 'dn'>>({})
  const preciseMin = useRef(clock.min)

  const actionById = useMemo(
    () => new Map(actions.map((item) => [item.id, item])),
    [actions],
  )
  const filled = useMemo(
    () =>
      openings
        .filter((slot) => slot.bookedByActionId)
        .map((slot) => ({
          cid: slot.id.replace('opening-', ''),
          who: actionById.get(slot.bookedByActionId!)?.callerName ?? 'Booked',
        })),
    [openings, actionById],
  )
  const model = useMemo(() => buildCalendarModel(data, filled), [data, filled])
  const { tasks, log } = useMemo(() => buildTasks(model, OPEN), [model])

  // The clock: live follows the clinic's real time, demo can be played or jumped.
  useEffect(() => {
    const id = setInterval(() => {
      setClinicMinute(Math.floor(preciseMin.current))
      setClock((c) => {
        if (c.mode === 'live') {
          const min = Math.floor(liveMinutes())
          return min === Math.floor(c.min) ? c : { ...c, min }
        }
        if (c.speed && preciseMin.current < CLOSE) {
          preciseMin.current = Math.min(
            CLOSE,
            preciseMin.current + c.speed * 0.25,
          )
          const min = Math.floor(preciseMin.current)
          const speed = preciseMin.current >= CLOSE ? 0 : c.speed
          return min === c.min && speed === c.speed ? c : { ...c, min, speed }
        }
        return c
      })
    }, 250)
    return () => clearInterval(id)
  }, [setClinicMinute])

  const setClockTo = (next: Partial<ClockState>) =>
    setClock((c) => {
      const merged = { ...c, ...next }
      preciseMin.current = merged.min
      setClinicMinute(Math.floor(merged.min))
      return merged
    })

  // A task is done when its action is (booked, resolved), or ticked here if it has no action.
  const done: DoneMap = useMemo(() => {
    const map: DoneMap = { ...localDone }
    for (const item of actions) {
      if (!isDone(item)) continue
      const last = item.activity[item.activity.length - 1]
      map[item.id] = { day: 0, at: last?.minute ?? OPEN }
    }
    return map
  }, [localDone, actions])

  const planned = useMemo(
    () => plan(model, tasks, done, { day: clock.day, min: clock.min }),
    [model, tasks, done, clock.day, clock.min],
  )

  // "Pulled forward / pushed back" flashes when a task changes hour.
  const [prevWhere, setPrevWhere] = useState(planned.where)
  if (prevWhere !== planned.where) {
    setPrevWhere(planned.where)
    const next: Record<string, 'up' | 'dn'> = {}
    for (const id in planned.where) {
      const w = planned.where[id]
      const p = prevWhere[id]
      if (p && (p.day !== w.day || p.hour !== w.hour))
        next[id] = w.day * 100 + w.hour < p.day * 100 + p.hour ? 'up' : 'dn'
    }
    setTags(next)
  }
  useEffect(() => {
    if (!Object.keys(tags).length) return
    const id = setTimeout(() => setTags({}), 9000)
    return () => clearTimeout(id)
  }, [tags])

  const toggle = (task: Task, checked: boolean) => {
    if (actionById.has(task.id)) {
      if (checked) logActivity(task.id, { type: 'resolved' })
      else undoLastActivity(task.id)
      return
    }
    setLocalDone((current) => {
      const next = { ...current }
      if (checked) next[task.id] = { day: clock.day, at: Math.floor(clock.min) }
      else delete next[task.id]
      return next
    })
  }

  const privacy: Privacy = { reveal, phones: model.phones }
  const names = Object.keys(model.phones)
  const now = Math.floor(clock.min)
  const ahead = highClear(tasks, done, clock)
  const d = sel
  const today = d === clock.day

  const todayTasks = tasks.filter(
    (t) =>
      (done[t.id] && done[t.id].day === clock.day) ||
      planned.where[t.id]?.day === clock.day,
  )
  const doneToday = tasks.filter((t) => done[t.id]?.day === clock.day).length
  const pending = Object.values(planned.hours[clock.day] ?? {}).flat()
  const left = pending.reduce((sum, x) => sum + x.t.min, 0)
  const finish = pending.length ? Math.max(...pending.map((x) => x.end)) : null
  const urgentLeft = pending.filter((x) => x.t.pri <= 2).length
  const rolled = tasks.filter(
    (t) =>
      !done[t.id] &&
      planned.where[t.id] &&
      planned.where[t.id].day > clock.day &&
      t.due <= clock.day,
  ).length
  const stats: [string | number, string][] = [
    [`${doneToday} / ${todayTasks.length}`, 'tasks done today'],
    [urgentLeft, 'urgent + high tasks left'],
    [`${left} min`, 'work left today'],
    [finish ? fmt(finish) : '—', 'projected finish'],
    [rolled, 'rolled to a later day'],
  ]

  const dayFirst = Object.values(planned.hours[d] ?? {})
    .flat()
    .sort((a, b) => a.start - b.start)[0]?.t
  const blocks = model.blocksFor(d)
  const nFix = log.filter((x) => x.fix).length

  const hours: React.ReactNode[] = []
  for (let h = 8; h <= 17; h++) {
    const items: { k: number; node: React.ReactNode }[] = []
    tasks
      .filter(
        (t) => done[t.id]?.day === d && Math.floor(done[t.id].at / 60) === h,
      )
      .forEach((t) =>
        items.push({
          k: done[t.id].at,
          node: (
            <TaskCard
              key={`done-${t.id}`}
              task={t}
              privacy={privacy}
              doneAt={done[t.id].at}
              locked={d !== clock.day}
              onToggle={(c) => toggle(t, c)}
              onDetails={
                actionById.has(t.id) ? () => selectAction(t.id) : undefined
              }
            />
          ),
        }),
      )
    const placed = planned.hours[d]?.[h] ?? []
    placed.forEach((x) =>
      items.push({
        k: x.start,
        node: (
          <TaskCard
            key={x.t.id}
            task={x.t}
            privacy={privacy}
            start={x.start}
            end={x.end}
            next={today && x.t === dayFirst}
            optional={today && x.t.pri >= 3 && !ahead}
            carriedFrom={d > x.t.due ? x.t.due : undefined}
            moved={tags[x.t.id]}
            locked={d !== clock.day}
            onToggle={(c) => toggle(x.t, c)}
            onDetails={
              actionById.has(x.t.id) ? () => selectAction(x.t.id) : undefined
            }
          />
        ),
      }),
    )
    blocks
      .filter((b) => Math.floor(Math.max(b.start, OPEN) / 60) === h)
      .forEach((b) =>
        items.push({ k: b.start, node: <BlockCard key={b.label} block={b} /> }),
      )
    if (h === 17 && !items.length) continue
    if (!isOpen(d) && !items.length) continue
    const isNow = today && h === Math.floor(now / 60)
    const past = d < clock.day || (today && h < Math.floor(now / 60))
    const from = isNow ? now : h * 60
    const cap = Math.max(0, (h + 1) * 60 - from)
    const used = placed.reduce((sum, x) => sum + x.t.min, 0)
    const capTxt =
      h === 17
        ? 'closing time'
        : !isOpen(d)
          ? ''
          : past
            ? 'past'
            : (() => {
                const lunch = blocks
                  .filter((b) => b.lunch)
                  .reduce(
                    (n, b) =>
                      n +
                      Math.max(
                        0,
                        Math.min(b.end, (h + 1) * 60) - Math.max(b.start, from),
                      ),
                    0,
                  )
                return `${used} min planned · ${Math.max(0, cap - used - lunch)} min free for walk-ins${lunch ? ` · ${lunch} min lunch` : ''}`
              })()
    items.sort((a, b) => a.k - b.k)
    hours.push(
      <div className={`hr${isNow ? ' now' : ''}${past ? ' past' : ''}`} key={h}>
        <div className="hl">
          <b>{h}:00</b>
          <span className="cap">{capTxt}</span>
          {h < 17 && isOpen(d) && !past && (
            <div className="bar">
              {placed.map((x) => (
                <i
                  key={x.t.id}
                  className={`k-${PRI[x.t.pri].k}`}
                  style={{ width: `${(x.t.min / 60) * 100}%` }}
                />
              ))}
            </div>
          )}
        </div>
        <div className="hb">
          {items.length ? (
            items.map((i) => i.node)
          ) : (
            <span className="empty">Nothing planned</span>
          )}
        </div>
      </div>,
    )
  }

  const staticHours: React.ReactNode[] = []
  if (!isOpen(d) && !model.appts.some((a) => a.day === d)) {
    staticHours.push(
      <div className="closedmsg" key="closed">
        Clinic closed. No bookings.
      </div>,
    )
  } else {
    for (let h = 8; h <= 17; h++) {
      const list = model.appts
        .filter((a) => a.day === d && Math.floor(hm(a.time) / 60) === h)
        .sort((a, b) => hm(a.time) - hm(b.time))
      if (h === 17 && !list.length) continue
      staticHours.push(
        <div className="hr" key={h}>
          <div className="hl">
            <b>{h}:00</b>
          </div>
          <div className="hb">
            {list.length ? (
              list.map((a) => (
                <ApptCard
                  key={`${a.cid}-${a.filled ? 'f' : 'o'}`}
                  appt={a}
                  privacy={privacy}
                />
              ))
            ) : (
              <span className="empty">No bookings</span>
            )}
          </div>
        </div>,
      )
    }
  }

  const dayStrip = Array.from({ length: DAYS }, (_, i) => {
    const appts = model.appts.filter((a) => a.day === i && !a.cancelled).length
    const dayTasks = [
      ...Object.values(planned.hours[i] ?? {})
        .flat()
        .map((x) => x.t),
      ...tasks.filter((t) => done[t.id]?.day === i),
    ]
    const top = dayTasks
      .filter((t) => !done[t.id])
      .reduce<number>((m, t) => Math.min(m, t.pri), 9)
    return (
      <button
        key={i}
        type="button"
        className={`day k-${top < 9 ? PRI[top as 1 | 2 | 3 | 4].k : 'n'}${isOpen(i) ? '' : ' closed'}${i === sel ? ' sel' : ''}${i === clock.day ? ' today' : ''}`}
        role="tab"
        aria-selected={i === sel}
        onClick={() => setSel(i)}
      >
        <small>{wd(i)}</small>
        <b>{dnum(i)}</b>
        <span className="ct">
          {top < 9 && (
            <span className={`dot k-${PRI[top as 1 | 2 | 3 | 4].k}`}></span>
          )}
          {dayTasks.length} task{dayTasks.length === 1 ? '' : 's'}
          {appts ? ` · ${appts} appt` : ''}
        </span>
      </button>
    )
  })

  return (
    <section className="cal-root rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(20,33,61,.08)]">
      <div className="tabs" role="tablist">
        <button
          type="button"
          className="tab"
          role="tab"
          aria-selected={tab === 'cal'}
          onClick={() => setTab('cal')}
        >
          Calendar
        </button>
        <button
          type="button"
          className="tab"
          role="tab"
          aria-selected={tab === 'tbl'}
          onClick={() => setTab('tbl')}
        >
          Every caller
        </button>
        <span className="sp"></span>
        <button
          type="button"
          className="btn"
          aria-pressed={reveal}
          onClick={() => setReveal((v) => !v)}
        >
          {reveal ? 'Hide names and numbers' : 'Show names and numbers'}
        </button>
      </div>

      {tab === 'tbl' ? (
        <EveryCaller reveal={reveal} />
      ) : (
        <div className="main">
          <div className="toprow">
            <button
              type="button"
              className="btn"
              aria-expanded={showClock}
              onClick={() => setShowClock((v) => !v)}
            >
              Demo controls
            </button>
          </div>
          {showClock && (
            <div className="clock">
              <span className="t">
                {dlabel(clock.day)} {fmt(now)}
              </span>
              <span className="lbl">
                {clock.mode === 'live'
                  ? 'Live clinic clock'
                  : 'Demo clock (simulated)'}
              </span>
              <span className="sp"></span>
              <button
                type="button"
                className="btn"
                aria-pressed={clock.speed > 0}
                onClick={() =>
                  setClockTo({ mode: 'demo', speed: clock.speed ? 0 : 5 })
                }
              >
                {clock.speed ? 'Pause' : 'Play'}
              </button>
              {[1, 5, 15].map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`btn${clock.speed === s ? ' on' : ''}`}
                  onClick={() => setClockTo({ mode: 'demo', speed: s })}
                >
                  {s} min/s
                </button>
              ))}
              {[15, 60].map((m) => (
                <button
                  type="button"
                  key={m}
                  className="btn"
                  onClick={() =>
                    setClockTo({
                      mode: 'demo',
                      min: Math.min(CLOSE, clock.min + m),
                    })
                  }
                >
                  +{m === 60 ? '1 hour' : `${m} min`}
                </button>
              ))}
              <button
                type="button"
                className="btn"
                onClick={() => {
                  let next = clock.day + 1
                  while (!isOpen(next)) next++
                  if (next >= DAYS) return
                  setSel(next)
                  setClockTo({ mode: 'demo', day: next, min: OPEN, speed: 0 })
                }}
              >
                Next day
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setSel(0)
                  setClockTo({
                    mode: 'live',
                    day: 0,
                    min: Math.floor(liveMinutes()),
                    speed: 0,
                  })
                }}
              >
                Back to live
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setSel(0)
                  setLocalDone({})
                  setClockTo(START)
                }}
              >
                Monday 8:00
              </button>
            </div>
          )}

          <div className="stats">
            {stats.map(([value, label]) => (
              <div className="st" key={label}>
                <b>{value}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <details className="pass">
            <summary>
              Final pass, ran before opening: {nFix} correction
              {nFix === 1 ? '' : 's'} to Jade's work
            </summary>
            <div>
              <ul>
                {log.map((entry, i) => (
                  <li key={i} className={entry.fix ? '' : 'ok'}>
                    <RichText text={entry.d} reveal={reveal} names={names} />
                  </li>
                ))}
              </ul>
            </div>
          </details>

          <div className="legend">
            {Object.entries(PRI).map(([n, p]) => (
              <span key={n} className={`lg k-${p.k}`}>
                P{n} {p.name}
              </span>
            ))}
            <span className="lg k-g">Booking (fixed)</span>
            {Object.values(MOOD).map((m) => (
              <span className="mlg" key={m.label}>
                {m.e} <b>{m.label}</b>: {m.tip}
              </span>
            ))}
          </div>

          <div className="days" role="tablist" aria-label="Days">
            {dayStrip}
          </div>

          <div className="twocal">
            <div className="col">
              <h2 className="ch">
                Bookings<small>fixed, never moves</small>
              </h2>
              <div className="grid">{staticHours}</div>
            </div>
            <div className="col">
              <h2 className="ch">
                Task plan<small>live, reshuffles as she works</small>
              </h2>
              <div className="grid">
                {!isOpen(d) && (
                  <div className="closedmsg">
                    Clinic closed. No tasks are scheduled on {wd(d)}.
                  </div>
                )}
                {hours}
              </div>
            </div>
          </div>

          <div className="rules">
            <b>How the day reshuffles.</b> Urgent and High tasks take the first
            hour. Normal and Low tasks wait in the hours after it and are marked
            "if she has time". Walk-ins can arrive at any hour, so each hour
            keeps about 30 minutes free. Once every Urgent and High task is
            done, she is ahead: the buffer lifts and Normal and Low tasks move
            up, one by one, as far as they fit. Let an hour pass and whatever is
            left moves to the next hour with room, still in priority order.
            Anything that won't fit before close rolls to the next open day.
            Tasks skip front-desk blocks (lunch 14:00 to 14:45, the first
            patient arriving, check-in around each booking). Bookings are fixed.{' '}
            <b>Final pass.</b> Before opening, a second layer re-reads the call
            log, corrects Jade's mistakes and writes the suggestions on the task
            cards. Anything you do in an action (a text, a call, a booking)
            updates this calendar. Task times are working estimates, not
            benchmarked averages.
          </div>
        </div>
      )}
    </section>
  )
}
