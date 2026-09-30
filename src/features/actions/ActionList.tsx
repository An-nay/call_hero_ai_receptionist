import { useDashboard } from '../../state/useDashboard'
import type { ActionFilter, ActionPriority } from '../../types/dashboard'

const filters: { label: string; value: ActionFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Urgent', value: 'urgent' },
  { label: 'Openings', value: 'opening' },
  { label: 'Follow-ups', value: 'follow-up' },
  { label: 'Completed', value: 'completed' },
]

const priorityClasses: Record<ActionPriority, string> = {
  critical: 'bg-rose-500',
  high: 'bg-amber-500',
  normal: 'bg-teal-500',
}

export function ActionList() {
  const { filter, filteredActions, setFilter, selectAction } = useDashboard()

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-semibold text-teal-700">Decision queue</p>
        <h2 className="text-xl font-semibold text-slate-950">Actions</h2>
      </div>
      <div className="mb-4 flex flex-wrap gap-2" aria-label="Action filters">
        {filters.map((item) => (
          <button
            type="button"
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              filter === item.value
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filteredActions.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => selectAction(item.id)}
            className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-teal-300 hover:shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${priorityClasses[item.priority]}`}
              />
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {item.category.replace('-', ' ')} · {item.suggestedTime}
              </span>
            </div>
            <h3 className="font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-1 text-sm text-slate-600">
              {item.callerName.split(' ')[0]}{' '}
              {item.callerName.split(' ')[1]?.[0]}.
            </p>
            <p className="mt-2 line-clamp-2 text-sm text-slate-500">
              {item.description}
            </p>
          </button>
        ))}
        {filteredActions.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            No actions in this view.
          </p>
        )}
      </div>
    </aside>
  )
}
