import { Icon } from '../../components/Icon'
import { isDone } from '../../data/activity'
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
  const summary = buildSummary(data, actions)

  const done = actions.filter(isDone).length
  const urgentLeft = actions.filter(
    (item) => !isDone(item) && item.priority !== 'normal',
  ).length

  const stats = [
    { label: 'calls', value: summary.calls },
    { label: 'callers', value: summary.callers },
    { label: 'handled by Jade', value: summary.handled },
    { label: 'tasks done', value: `${done} / ${actions.length}` },
    { label: 'urgent + high left', value: urgentLeft, alert: true },
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
        </div>
      </div>
    </section>
  )
}
