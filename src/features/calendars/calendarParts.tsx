import type { ReactNode } from 'react'
import { shortName } from '../../data/format'
import { nameOf, type Privacy } from './privacy'
import type { Appt } from './engine/model'
import { CATS, MOOD, PRI, type Task } from './engine/tasks'
import { dlabel, fmt } from './engine/time'
import type { Mood } from './engine/model'
import type { Block } from './engine/model'

export function MoodFace({ mood }: { mood: Mood }) {
  const m = MOOD[mood]
  return (
    <span className="mood" title={`${m.label}: ${m.tip}`} aria-label={m.label}>
      {m.e}
    </span>
  )
}

/** Renders "<b>name</b>" markers without injecting HTML, masking names unless revealed. */
export function RichText({
  text,
  reveal,
  names,
}: {
  text: string
  reveal: boolean
  names: string[]
}) {
  let out = text
  if (!reveal)
    for (const name of names) out = out.split(name).join(shortName(name))
  return (
    <>
      {out
        .split(/(<b>.*?<\/b>)/g)
        .map((part, i) =>
          part.startsWith('<b>') ? <b key={i}>{part.slice(3, -4)}</b> : part,
        )}
    </>
  )
}

function Tel({ who, privacy }: { who: string; privacy: Privacy }) {
  const phone = privacy.phones[who]
  if (!phone) return null
  const local = '0' + phone.slice(3)
  const label = privacy.reveal
    ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
    : `•••• ••• ${local.slice(7)}`
  return (
    <a
      className="tel"
      href={`tel:${phone}`}
      title={`Call ${nameOf(who, privacy.reveal)}`}
    >
      📞 {label}
    </a>
  )
}

export function TaskCard({
  task,
  privacy,
  start,
  end,
  doneAt,
  next,
  optional,
  carriedFrom,
  moved,
  locked,
  onToggle,
  onDetails,
}: {
  task: Task
  privacy: Privacy
  start?: number
  end?: number
  doneAt?: number
  next?: boolean
  optional?: boolean
  carriedFrom?: number
  moved?: 'up' | 'dn'
  locked?: boolean
  onToggle: (checked: boolean) => void
  onDetails?: () => void
}) {
  const c = PRI[task.pri]
  const cat = CATS[task.cat]
  const done = doneAt !== undefined
  const who = nameOf(task.who, privacy.reveal)
  return (
    <div
      className={`card task k-${c.k}${done ? ' isdone' : ''}${next ? ' next' : ''}${moved && !done ? ' flash' : ''}`}
    >
      <label className="cb">
        <input
          type="checkbox"
          checked={done}
          disabled={locked}
          onChange={(e) => onToggle(e.target.checked)}
          aria-label={`Mark done: ${who}, ${cat.label}`}
        />
        <span className="box"></span>
      </label>
      <span className="tx">
        <span className="ln1">
          <b>{who}</b> <MoodFace mood={task.mood} />{' '}
          <span className="pill p">{c.name}</span>{' '}
          <Tel who={task.who} privacy={privacy} />
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
          {onDetails && (
            <button type="button" className="btn" onClick={onDetails}>
              Details
            </button>
          )}
        </span>
        <span className="ln2">{task.text}</span>
        <span className="ln3">
          <span className="time">
            {done ? `done ${fmt(doneAt)}` : `${fmt(start!)}–${fmt(end!)}`}
          </span>{' '}
          · {cat.label} · {task.min} min
          {task.call ? ` · call ${task.call}` : ''}
        </span>
      </span>
    </div>
  )
}

export function ApptCard({ appt, privacy }: { appt: Appt; privacy: Privacy }) {
  const showMood = appt.mood !== 'casual' && !appt.cancelled
  return (
    <div className={`card appt k-g${appt.cancelled ? ' cancelled' : ''}`}>
      <span className="tx">
        <span className="ln1">
          <b>{nameOf(appt.who, privacy.reveal)}</b>{' '}
          {showMood && <MoodFace mood={appt.mood} />}
          {appt.cancelled ? (
            <span className="tag carry">cancelled, slot free</span>
          ) : (
            <span className="pill p">
              {appt.filled ? 'Booked today' : 'Booking'}
            </span>
          )}{' '}
          <Tel who={appt.who} privacy={privacy} />
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
