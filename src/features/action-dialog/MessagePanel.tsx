import { useState } from 'react'
import { getCallbackTime } from '../../data/activity'
import { draftMessage } from '../../data/drafts'
import { firstName } from '../../data/format'
import { suggestCallbackTimes } from '../../data/schedule'
import { useDashboard } from '../../state/useDashboard'
import type { ActionItem } from '../../types/dashboard'

export function MessagePanel({
  action,
  canContact,
}: {
  action: ActionItem
  canContact: boolean
}) {
  const { actions, openings, logActivity } = useDashboard()
  const initial = getCallbackTime(action) ?? action.suggestedTime
  const [time, setTime] = useState(initial)
  const [text, setText] = useState(() => draftMessage(action, openings))
  const [suggestions] = useState(() => suggestCallbackTimes(actions, action))
  const sent = action.activity.some((entry) => entry.type === 'messaged')

  const pickTime = (next: string) => {
    if (!next) return
    setText((current) => current.replaceAll(time, next))
    setTime(next)
  }

  const send = () => {
    logActivity(action.id, { type: 'callback-booked', time })
    logActivity(action.id, { type: 'messaged', detail: text })
  }

  return (
    <section className="rounded-xl border border-slate-200 p-3.5">
      <h3 className="text-xs font-bold">💬 Message</h3>
      <p className="mt-0.5 text-[11px] text-slate-500">
        Drafted for {firstName(action.callerName)}. Edit before sending.
      </p>
      <textarea
        aria-label="Message draft"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={8}
        className="mt-2 w-full resize-none rounded-lg bg-slate-100 p-2.5 text-[13px] leading-snug"
      />
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-slate-500">Callback time</span>
        {suggestions.map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => pickTime(option)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              option === time
                ? 'bg-navy text-white'
                : 'bg-slate-100 hover:bg-slate-200'
            }`}
          >
            {option}
          </button>
        ))}
        <input
          type="time"
          aria-label="Custom callback time"
          value={time}
          onChange={(event) => pickTime(event.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px]"
        />
      </div>
      <button
        type="button"
        disabled={sent || !canContact}
        onClick={send}
        className={`mt-3 w-full rounded-lg px-3 py-2.5 text-xs font-extrabold text-white disabled:opacity-60 ${sent ? 'bg-emerald-600' : 'bg-brand hover:bg-blue-700'}`}
      >
        {sent ? '✓ Sent' : 'Send text'}
      </button>
    </section>
  )
}
