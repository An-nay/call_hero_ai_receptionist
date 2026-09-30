import { useDashboard } from '../../state/useDashboard'
import type { CalendarEvent } from '../../types/dashboard'

const toneClasses: Record<CalendarEvent['tone'], string> = {
  confirmed: 'border-sky-200 bg-sky-50 text-sky-900',
  opening: 'border-amber-300 bg-amber-50 text-amber-950',
  critical: 'border-rose-300 bg-rose-50 text-rose-950',
  task: 'border-teal-200 bg-teal-50 text-teal-950',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-950',
}

function CalendarLane({
  title,
  events,
}: {
  title: string
  events: CalendarEvent[]
}) {
  const { selectAction } = useDashboard()
  return (
    <div className="min-w-0">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="space-y-2">
        {events
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((event) => (
            <button
              key={event.id}
              type="button"
              disabled={!event.actionId}
              onClick={() => event.actionId && selectAction(event.actionId)}
              className={`flex w-full gap-3 rounded-xl border p-3 text-left ${toneClasses[event.tone]} disabled:cursor-default`}
            >
              <span className="w-12 shrink-0 text-sm font-semibold">
                {event.time}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {event.title}
                </span>
                {event.subtitle && (
                  <span className="block truncate text-xs opacity-75">
                    {event.subtitle}
                  </span>
                )}
              </span>
            </button>
          ))}
      </div>
    </div>
  )
}

export function OperationsCalendar() {
  const { calendarEvents } = useDashboard()
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-teal-700">Monday plan</p>
          <h2 className="text-xl font-semibold text-slate-950">
            Practice calendar
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
          Suggested plan
        </span>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <CalendarLane
          title="Patient schedule"
          events={calendarEvents.filter((event) => event.lane === 'patient')}
        />
        <CalendarLane
          title="Front-desk actions"
          events={calendarEvents.filter((event) => event.lane === 'front-desk')}
        />
      </div>
    </section>
  )
}
