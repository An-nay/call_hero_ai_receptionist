import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { dayName, wallClock } from '../../data/format'
import type { CallRecord } from '../../types/calls'

const mood = {
  positive: { icon: 'smile', tone: 'text-emerald-600' },
  neutral: { icon: 'meh', tone: 'text-slate-500' },
  negative: { icon: 'frown', tone: 'text-rose-600' },
} as const

function CallRow({ call }: { call: CallRecord }) {
  const [playing, setPlaying] = useState(false)
  const { date, time } = wallClock(call.started_at)
  const minutes = Math.floor(call.duration_seconds / 60)
  const seconds = String(call.duration_seconds % 60).padStart(2, '0')

  return (
    <li className="rounded-xl border border-line p-3">
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
        <span>
          {dayName(date)} {time} · {minutes}:{seconds}
        </span>
        <span
          className={mood[call.sentiment].tone}
          aria-label={`Sentiment ${call.sentiment}`}
        >
          <Icon name={mood[call.sentiment].icon} size={16} />
        </span>
      </div>
      <p className="mt-1.5 text-[13px] leading-snug text-slate-700">
        {call.summary}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {call.flagged && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
            Flagged
          </span>
        )}
        {call.recording_available ? (
          <button
            type="button"
            onClick={() => setPlaying((value) => !value)}
            className="rounded-md border border-line px-2 py-1 text-[10px] font-extrabold hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-1">
              <Icon name="play" size={10} />
              {playing ? 'Playing…' : 'Recording'}
            </span>
          </button>
        ) : (
          <span className="text-[10px] text-slate-400">No recording</span>
        )}
      </div>
    </li>
  )
}

export function CallHistory({ calls }: { calls: CallRecord[] }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-bold">
        {calls.length > 1 ? `${calls.length} calls this weekend` : 'The call'}
      </h3>
      <ul className="space-y-2">
        {calls.map((call) => (
          <CallRow key={call.id} call={call} />
        ))}
      </ul>
    </section>
  )
}
