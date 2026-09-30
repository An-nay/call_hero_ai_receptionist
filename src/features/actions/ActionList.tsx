import { useState } from 'react'
import { sortByUrgency } from '../../data/activity'
import { buildSummary } from '../../data/buildSummary'
import { draftMessage } from '../../data/drafts'
import { shortName } from '../../data/format'
import { useDashboard } from '../../state/useDashboard'
import type { ActionFilter, ActionItem } from '../../types/dashboard'

const filters: { label: string; value: ActionFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Urgent', value: 'urgent' },
  { label: 'Complaints', value: 'complaint' },
  { label: 'Openings', value: 'opening' },
  { label: 'Follow-ups', value: 'follow-up' },
  { label: 'Referrals', value: 'referral' },
  { label: 'Completed', value: 'completed' },
]

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.98
  speechSynthesis.speak(utterance)
}

function DraftCard({ item }: { item: ActionItem }) {
  const { openings, selectAction, logActivity } = useDashboard()
  const [edited, setEdited] = useState<string | null>(null)
  const text = edited ?? draftMessage(item, openings)
  const sent = item.activity.some((entry) => entry.type === 'messaged')

  return (
    <div className="mb-2 rounded-xl bg-white p-2.5 text-navy">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-[11px] font-bold">
            {shortName(item.callerName)}
          </h4>
          <small className="text-[9px] text-slate-500">{item.title}</small>
        </div>
        {item.priority === 'critical' && (
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-extrabold text-rose-700">
            Human first
          </span>
        )}
      </div>
      <textarea
        aria-label={`Message draft for ${shortName(item.callerName)}`}
        value={text}
        onChange={(event) => setEdited(event.target.value)}
        rows={4}
        className="mt-2 w-full resize-none rounded-lg bg-slate-100 p-2 text-[11px] leading-snug text-slate-700"
      />
      <div className="mt-1.5 flex gap-1.5">
        <button
          type="button"
          onClick={() => speak(text)}
          className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-extrabold"
        >
          ▶ Hear
        </button>
        <button
          type="button"
          onClick={() => selectAction(item.id)}
          className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-extrabold"
        >
          Details
        </button>
        <button
          type="button"
          disabled={sent}
          onClick={() =>
            logActivity(item.id, { type: 'messaged', detail: text })
          }
          className={`rounded-md px-2.5 py-1 text-[10px] font-extrabold text-white ${sent ? 'bg-emerald-600' : 'bg-brand hover:bg-blue-700'}`}
        >
          {sent ? '✓ Sent' : 'Send'}
        </button>
      </div>
    </div>
  )
}

export function ActionList() {
  const { data, actions, filter, filteredActions, setFilter } = useDashboard()
  const [answer, setAnswer] = useState('Choose a question.')
  const summary = buildSummary(data, actions)
  const queue = sortByUrgency(filteredActions)
  const first = sortByUrgency(actions).find((item) => item.status === 'open')

  return (
    <aside className="overflow-hidden rounded-2xl bg-gradient-to-b from-navy to-navy-2 text-white shadow-[0_14px_40px_rgba(20,33,61,.08)]">
      <div className="flex items-end justify-between gap-3 border-b border-white/10 px-5 pb-3.5 pt-[18px]">
        <div>
          <h2 className="text-lg font-bold">Jade Messages</h2>
          <p className="mt-1 text-[11px] text-blue-200/80">
            One-click replies. You approve before anything is sent.
          </p>
        </div>
        <span className="text-[11px] font-extrabold text-blue-200">
          {summary.needYou} ready
        </span>
      </div>

      <div className="p-5">
        <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3.5">
          <strong className="block text-xs">Morning voice brief</strong>
          <span className="mt-1 block text-[10px] text-blue-100/80">
            {summary.brief}
          </span>
          <button
            type="button"
            onClick={() => speak(summary.brief)}
            className="mt-2.5 rounded-lg bg-white px-2.5 py-2 text-[10px] font-extrabold text-navy"
          >
            ▶ Play brief
          </button>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <strong className="text-[11px]">Suggested replies</strong>
          <span className="text-[9px] text-blue-200/70">Editable</span>
        </div>
        <div
          className="mb-3 flex flex-wrap gap-1.5"
          aria-label="Action filters"
        >
          {filters.map((item) => (
            <button
              type="button"
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                filter === item.value
                  ? 'bg-white text-navy'
                  : 'bg-white/10 text-blue-100 hover:bg-white/20'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {queue.map((item) => (
          <DraftCard key={item.id} item={item} />
        ))}
        {queue.length === 0 && (
          <p className="rounded-xl bg-white/10 p-3 text-xs text-blue-100">
            No actions in this view.
          </p>
        )}

        <div className="mt-3 rounded-xl border border-dashed border-white/20 p-2.5 text-[10px] leading-snug text-blue-100/90">
          <strong className="text-white">Your call:</strong> nothing is sent
          automatically. Urgent and complaint replies are drafted but flagged
          for a human first.
        </div>

        <div className="mt-3 border-t border-white/10 pt-3">
          <strong className="text-[11px]">Ask Jade</strong>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() =>
                setAnswer(
                  first
                    ? `${shortName(first.callerName)} first: ${first.description}`
                    : 'Everything is cleared.',
                )
              }
              className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px]"
            >
              Who first?
            </button>
            <button
              type="button"
              onClick={() =>
                setAnswer(
                  `${summary.outOfHours.length} bookings fall on a weekend, and repeat calls are merged into one action per caller.`,
                )
              }
              className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-[10px]"
            >
              What did Jade check?
            </button>
          </div>
          <p className="mt-2 min-h-7 text-[10px] leading-snug text-blue-100/80">
            {answer}
          </p>
        </div>
      </div>
    </aside>
  )
}
