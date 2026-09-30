import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { buildSummary } from '../../data/buildSummary'
import { useDashboard } from '../../state/useDashboard'

function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.98
  speechSynthesis.speak(utterance)
}

export function SummaryBar() {
  const { data, actions } = useDashboard()
  const [showBrief, setShowBrief] = useState(false)
  const summary = buildSummary(data, actions)

  const stats = [
    { label: 'calls', value: summary.calls },
    { label: 'callers', value: summary.callers },
    { label: 'handled', value: summary.handled },
    { label: 'need you', value: summary.needYou, alert: true },
    { label: 'Jade checks', value: summary.outOfHours.length, alert: true },
  ]

  return (
    <section
      aria-label="Weekend summary"
      className="rounded-2xl border border-line bg-white px-5 py-4 shadow-[0_1px_2px_rgba(22,78,99,.05)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap">
          <span className="col-span-2 mr-2 font-display text-base font-semibold text-navy">
            Monday summary
          </span>
          {stats.map((stat) => (
            <span
              key={stat.label}
              className={`flex items-baseline gap-1.5 rounded-xl px-2.5 py-2 ${
                stat.alert
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-brand-soft/60 text-navy'
              }`}
            >
              <b className="font-display text-xl font-semibold">{stat.value}</b>
              <span className="text-[11px] text-slate-500">{stat.label}</span>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => speak(summary.brief)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2.5 text-xs font-semibold text-navy hover:bg-brand-soft"
          >
            <Icon name="play" size={11} />
            Play brief
          </button>
          <button
            type="button"
            aria-expanded={showBrief}
            onClick={() => setShowBrief((value) => !value)}
            className="rounded-xl bg-brand px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-navy-2"
          >
            {showBrief ? 'Hide brief' : 'View 15-sec brief'}
          </button>
        </div>
      </div>
      {showBrief && (
        <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500">
          <strong className="text-slate-900">Jade's brief:</strong>{' '}
          {summary.brief}
        </p>
      )}
    </section>
  )
}
