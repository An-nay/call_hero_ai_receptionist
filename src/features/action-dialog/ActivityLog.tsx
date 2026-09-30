import { dayName } from '../../data/format'
import { useDashboard } from '../../state/useDashboard'
import type { ActionItem, ActivityEntry } from '../../types/dashboard'

export function ActivityLog({ action }: { action: ActionItem }) {
  const { openings, undoLastActivity } = useDashboard()

  const label = (entry: ActivityEntry) => {
    switch (entry.type) {
      case 'messaged':
        return 'Text sent'
      case 'called':
        return `Called · ${entry.detail}`
      case 'callback-booked':
        return `Callback planned for ${entry.time}`
      case 'appointment-booked': {
        const slot = openings.find((item) => item.id === entry.slotId)
        return slot
          ? `Booked ${dayName(slot.date)} ${slot.time}`
          : 'Appointment booked'
      }
      case 'resolved':
        return 'Marked resolved'
    }
  }

  if (action.activity.length === 0) return null

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold">What you've done</h3>
        <button
          type="button"
          onClick={() => undoLastActivity(action.id)}
          className="text-[11px] font-bold text-brand hover:underline"
        >
          Undo last
        </button>
      </div>
      <ol className="space-y-1">
        {action.activity.map((entry) => (
          <li key={entry.id} className="flex gap-2 text-[12px] text-slate-600">
            <span className="w-11 shrink-0 font-bold text-slate-400">
              {new Date(entry.at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}
            </span>
            {label(entry)}
          </li>
        ))}
      </ol>
    </section>
  )
}
