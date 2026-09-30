import type { ReactNode } from 'react'
import type { Appt, Block, Mood } from './engine/model'
import { CATS, MOOD, PRI, type Task } from './engine/tasks'
import { dlabel, fmt } from './engine/time'

export function MoodFace({ mood }: { mood: Mood }) {
  const m = MOOD[mood]
  return (
    <span className="mood" title={`${m.label}: ${m.tip}`} aria-label={m.label}>
      {m.e}
    </span>
  )
}

/** Renders "<b>name</b>" markers without injecting HTML. */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(<b>.*?<\/b>)/g)
        .map((part, i) =>
          part.startsWith('<b>') ? <b key={i}>{part.slice(3, -4)}</b> : part,
        )}
    </>
  )
}

function Tel({ who, phones }: { who: string; phones: Record<string, string> }) {
  const phone = phones[who]
  if (!phone) return null
  const local = '0' + phone.slice(3)
  return (
    <a
      className="tel"
      href={`tel:${phone}`}
      title={`Call ${who}`}
      onClick={(event) => event.stopPropagation()}
    >
      📞 {local.slice(0, 4)} {local.slice(4, 7)} {local.slice(7)}
    </a>
  )
}

export function TaskCard({
  task,
  phones,
  start,
  end,
  doneAt,
  next,
  optional,
  carriedFrom,
  moved,
  locked,
  onToggle,
  onOpen,
}: {
  task: Task
  phones: Record<string, string>
  start?: number
  end?: number
  doneAt?: number
  next?: boolean
  optional?: boolean
  carriedFrom?: number
  moved?: 'up' | 'dn'
  locked?: boolean
  onToggle: (checked: boolean) => void
  onOpen?: () => void
}) {
  const c = PRI[task.pri]
  const cat = CATS[task.cat]
  const done = doneAt !== undefined
  return (
    <div
      className={`card task k-${c.k}${done ? ' isdone' : ''}${next ? ' next' : ''}${moved && !done ? ' flash' : ''}${onOpen ? ' open' : ''}`}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-label={onOpen ? `Open ${task.who}: ${task.headline}` : undefined}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (
          onOpen &&
          event.target === event.currentTarget &&
          event.key === 'Enter'
        )
          onOpen()
      }}
    >
      <label className="cb" onClick={(event) => event.stopPropagation()}>
        <input
          type="checkbox"
          checked={done}
          disabled={locked}
          onChange={(e) => onToggle(e.target.checked)}
          aria-label={`Mark done: ${task.who}, ${cat.label}`}
        />
        <span className="box"></span>
      </label>
      <span className="tx">
        <span className="ln1">
          <b>{task.who}</b> <MoodFace mood={task.mood} />{' '}
          <span className="pill p">{c.name}</span>{' '}
          <Tel who={task.who} phones={phones} />
          {next && <span className="tag">next</span>}
          {moved && !done && (
            <span className={`tag ${moved === 'up' ? 'up' : 'dn'}`}>
              {moved === 'up' ? 'pulled forward' : 'pushed back'}
            </span>
          )}
          {carriedFrom !== undefined && !done && (
            <span className="tag carry">
              carried from {dlabel(carriedFrom)}
            </span>
          )}
          {optional && <span className="tag carry">if she has time</span>}
        </span>
        <span className="ln2">
          <b>{task.headline}</b>
          {task.why && <span className="why"> · {task.why}</span>}
        </span>
        <span className="ln3">
          <span className="time">
            {done ? `done ${fmt(doneAt)}` : `${fmt(start!)}–${fmt(end!)}`}
          </span>{' '}
          · {cat.label} · {task.min} min
        </span>
      </span>
    </div>
  )
}

export function ApptCard({
  appt,
  phones,
}: {
  appt: Appt
  phones: Record<string, string>
}) {
  const showMood = appt.mood !== 'casual' && !appt.cancelled
  return (
    <div className={`card appt k-g${appt.cancelled ? ' cancelled' : ''}`}>
      <span className="tx">
        <span className="ln1">
          <b>{appt.who}</b> {showMood && <MoodFace mood={appt.mood} />}
          {appt.cancelled ? (
            <span className="tag carry">cancelled, slot free</span>
          ) : (
            <span className="pill p">
              {appt.filled ? 'Booked today' : 'Booking'}
            </span>
          )}{' '}
          <Tel who={appt.who} phones={phones} />
          {appt.warn && <span className="warn">⚠ {appt.warn}</span>}
        </span>
        <span className="ln3">
          <span className="time">{appt.time}</span> · {appt.type} · {appt.prac}
          {appt.note ? ` · ${appt.note}` : ''}
        </span>
      </span>
    </div>
  )
}

export function BlockCard({ block }: { block: Block }): ReactNode {
  return (
    <div className="card block">
      <span className="tx">
        <span className="ln1">
          <b>{block.label}</b>
        </span>
        <span className="ln3">
          <span className="time">
            {fmt(block.start)}–{fmt(block.end)}
          </span>{' '}
          · {block.lunch ? 'no tasks' : 'front desk, no tasks here'}
        </span>
      </span>
    </div>
  )
}
