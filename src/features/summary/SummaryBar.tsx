import { useDashboard } from '../../state/useDashboard'

export function SummaryBar() {
  const { data, actions, setFilter } = useDashboard()
  const open = actions.filter((item) => item.status === 'open')
  const completed = actions.length - open.length
  const openings = data.calls.filter(
    (call) => call.appointment?.action === 'cancelled',
  ).length
  const urgent = open.filter((item) => item.priority === 'critical').length

  const metrics = [
    {
      label: 'Calls handled',
      value: data.calls.length,
      onClick: () => setFilter('all'),
    },
    {
      label: 'Actions open',
      value: open.length,
      onClick: () => setFilter('all'),
    },
    { label: 'Urgent', value: urgent, onClick: () => setFilter('urgent') },
    { label: 'Openings', value: openings, onClick: () => setFilter('opening') },
    {
      label: 'Completed',
      value: completed,
      onClick: () => setFilter('completed'),
    },
  ]

  return (
    <section
      aria-label="Weekend summary"
      className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-5"
    >
      {metrics.map((metric) => (
        <button
          key={metric.label}
          type="button"
          onClick={metric.onClick}
          className="border-b border-slate-100 px-5 py-4 text-left transition hover:bg-teal-50 sm:border-b-0 sm:border-r sm:last:border-r-0"
        >
          <span className="block text-2xl font-semibold text-slate-950">
            {metric.value}
          </span>
          <span className="text-sm text-slate-600">{metric.label}</span>
        </button>
      ))}
    </section>
  )
}
