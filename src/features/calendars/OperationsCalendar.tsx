import { useState } from 'react'
import { getProgress, progressLabels, sortByUrgency } from '../../data/activity'
import { buildSummary } from '../../data/buildSummary'
import { dayName, shortName } from '../../data/format'
import { useDashboard } from '../../state/useDashboard'
import type {
  ActionCategory,
  ActionItem,
  CalendarEvent,
} from '../../types/dashboard'

const MONDAY = '2026-11-17'

const categoryIcon: Record<ActionCategory, string> = {
  urgent: '🚨',
  complaint: '⚠️',
  opening: '✨',
  'follow-up': '🟠',
  referral: '🟡',
}

const toneClasses: Record<CalendarEvent['tone'], string> = {
  confirmed: 'border-sky-200 bg-sky-50',
  opening: 'border-blue-200 bg-blue-50/60',
  critical: 'border-rose-200 bg-rose-50/60',
  task: 'border-slate-200 bg-white',
  completed: 'border-emerald-200 bg-emerald-50/50 opacity-60',
}

function EventCard({
  event,
  action,
  offer,
}: {
  event: CalendarEvent
  action?: ActionItem
  offer?: ActionItem
}) {
  const { selectAction } = useDashboard()
  const target = action ?? offer
  const progress = action ? getProgress(action) : 'new'

  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border p-3 ${toneClasses[event.tone]}`}
    >
      <div className="flex min-w-0 gap-2.5">
        <span
          aria-hidden
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-black/5 bg-white"
        >
          {action ? categoryIcon[action.category] : '✨'}
        </span>
        <div className="min-w-0">
          <h3 className="text-[13px] font-bold">
            {action ? shortName(action.callerName) : event.title}
            {event.tone === 'completed' && (
              <span className="ml-1 text-emerald-600">✓</span>
            )}
          </h3>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
            {action ? action.title : event.subtitle}
            {action && ` · ${action.estimatedMinutes} min`}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {action?.priority === 'critical' && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[9px] font-extrabold text-rose-700">
                {action.category === 'urgent' ? 'URGENT' : 'HIGH'}
              </span>
            )}
            {action && action.callIds.length > 1 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold text-slate-600">
                {action.callIds.length} calls merged
              </span>
            )}
            {action && progress !== 'new' && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-extrabold text-brand">
                {progressLabels[progress]}
              </span>
            )}
          </div>
        </div>
      </div>
      {target && event.tone !== 'completed' && (
        <button
          type="button"
          onClick={() => selectAction(target.id)}
          className="rounded-lg bg-navy px-2.5 py-1.5 text-[11px] font-extrabold text-white hover:bg-navy-2"
        >
          {action
            ? action.recommendedAction
            : `Offer to ${shortName(target.callerName)}`}
        </button>
      )}
    </div>
  )
}

export function OperationsCalendar() {
  const { data, actions, calendarEvents, selectAction } = useDashboard()
  const [showChecks, setShowChecks] = useState(false)

  const byId = new Map(actions.map((item) => [item.id, item]))
  const next = sortByUrgency(actions).find((item) => item.status === 'open')
  const offerFor = (event: CalendarEvent) =>
    actions.find(
      (item) =>
        item.status === 'open' &&
        item.relatedOpening?.startsWith(`${event.date}T${event.time}`),
    )

  const isMonday = (event: CalendarEvent) =>
    event.lane === 'front-desk' || event.date === MONDAY
  const timeline = calendarEvents
    .filter(isMonday)
    .sort((a, b) => a.time.localeCompare(b.time))
  const later = calendarEvents.filter((event) => !isMonday(event))
  const cleared = actions.filter((item) => item.status === 'completed').length
  const { outOfHours } = buildSummary(data, actions)

  const rows = [
    ...timeline.map((event) => ({ time: event.time, event })),
    { time: '08:30', event: null },
  ].sort((a, b) => a.time.localeCompare(b.time))

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_14px_40px_rgba(20,33,61,.08)]">
      <div className="flex items-end justify-between gap-3 border-b border-slate-200 px-5 pb-3.5 pt-[18px]">
        <div>
          <h2 className="text-lg font-bold">Your morning</h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Time-sensitive items and actions that need you.
          </p>
        </div>
        <span className="text-[11px] font-extrabold text-brand">
          {cleared} of {actions.length} cleared
        </span>
      </div>

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-blue-50 p-3.5">
          <div>
            <small className="block text-[9px] font-black uppercase tracking-widest text-brand">
              Next best action
            </small>
            <strong className="mt-1 block text-[15px]">
              {next ? next.recommendedAction : 'Ready for your first patient ✓'}
              {next && ` · ${shortName(next.callerName)}`}
            </strong>
            <span className="mt-1 block text-[10px] text-slate-500">
              {next ? next.description : 'Priority queue cleared.'}
            </span>
          </div>
          {next && (
            <button
              type="button"
              onClick={() => selectAction(next.id)}
              className="shrink-0 rounded-lg bg-navy px-3 py-2 text-[11px] font-extrabold text-white hover:bg-navy-2"
            >
              Start →
            </button>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="grid grid-cols-[58px_1fr] border-b border-slate-200 bg-slate-50 text-[10px] font-extrabold text-slate-500 sm:grid-cols-[72px_1fr]">
            <div className="px-3 py-2">Time</div>
            <div className="px-3 py-2">Monday morning</div>
          </div>
          <div className="grid grid-cols-[58px_1fr] sm:grid-cols-[72px_1fr]">
            {rows.map(({ time, event }, index) => (
              <div key={event?.id ?? 'first-patient'} className="contents">
                <div
                  className={`border-r border-slate-200 bg-slate-50/60 px-2 py-3.5 text-center text-[11px] font-bold text-slate-500 ${index < rows.length - 1 ? 'border-b' : ''}`}
                >
                  {time}
                </div>
                <div
                  className={`border-slate-200 p-2.5 ${index < rows.length - 1 ? 'border-b' : ''}`}
                >
                  {event ? (
                    <EventCard
                      event={event}
                      action={
                        event.actionId ? byId.get(event.actionId) : undefined
                      }
                      offer={
                        event.tone === 'opening' ? offerFor(event) : undefined
                      }
                    />
                  ) : (
                    <div className="flex gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <span
                        aria-hidden
                        className="grid h-8 w-8 place-items-center rounded-lg bg-white"
                      >
                        🦷
                      </span>
                      <div>
                        <h3 className="text-[13px] font-bold">First patient</h3>
                        <p className="text-[11px] text-slate-500">
                          Your normal clinic day starts here.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {later.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold">Later this week</h3>
              <span className="text-[10px] text-slate-500">Other openings</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {later.map((event) => {
                const offer = offerFor(event)
                return (
                  <div
                    key={event.id}
                    className="rounded-xl border border-slate-200 p-2.5"
                  >
                    <strong className="block text-[11px]">
                      {event.tone === 'confirmed' ? '✅' : '✨'}{' '}
                      {dayName(event.date!)} {event.time}
                    </strong>
                    <span className="mt-1 block text-[10px] leading-snug text-slate-500">
                      {event.title} · {event.subtitle}
                    </span>
                    {offer && (
                      <button
                        type="button"
                        onClick={() => selectAction(offer.id)}
                        className="mt-2 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-extrabold hover:bg-slate-50"
                      >
                        Offer to {shortName(offer.callerName)}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {outOfHours.length > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <div>
              <strong className="text-[11px]">
                ⚠️ Jade check: {outOfHours.length}{' '}
                {outOfHours.length === 1 ? 'booking' : 'bookings'} outside
                clinic hours
              </strong>
              <p className="mt-0.5 text-[10px] text-amber-900/70">
                Booked on a weekend; the clinic is open Mon–Fri.
              </p>
              {showChecks && (
                <p className="mt-2 text-[10px] leading-relaxed text-amber-900">
                  {outOfHours
                    .map(
                      (call) =>
                        `${shortName(call.caller_name ?? 'Unknown')} — ${dayName(call.appointment!.date)} ${call.appointment!.time}`,
                    )
                    .join(' · ')}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowChecks((value) => !value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-extrabold"
            >
              Review
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
