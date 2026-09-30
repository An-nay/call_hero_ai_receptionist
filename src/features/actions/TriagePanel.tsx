import { useMemo, useState } from 'react'
import { weekendCalls } from '../../data/calls'
import type { WeekendCallsData } from '../../types/calls'
import {
  buildTriageTasks,
  type TriageTask,
  type Urgency,
} from './triage/buildTriageTasks'

const tiers: {
  urgency: Urgency
  title: string
  hint: string
  bar: string
  dot: string
}[] = [
  {
    urgency: 'now',
    title: 'Do now',
    hint: 'before the first patient',
    bar: 'border-l-rose-600',
    dot: 'bg-rose-600',
  },
  {
    urgency: 'today',
    title: 'Today',
    hint: 'a booking is at stake',
    bar: 'border-l-orange-500',
    dot: 'bg-orange-500',
  },
  {
    urgency: 'week',
    title: 'This week',
    hint: 'when there is a gap',
    bar: 'border-l-yellow-400',
    dot: 'bg-yellow-400',
  },
]

interface TriagePanelProps {
  /** Defaults to the weekend calls, so the panel works with no props. */
  data?: WeekendCallsData
  /** Optional hook for teammates, for example to open the action dialog. */
  onSelect?: (task: TriageTask) => void
}

export function TriagePanel({
  data = weekendCalls,
  onSelect,
}: TriagePanelProps) {
  const { tasks, hiddenCallers } = useMemo(() => buildTriageTasks(data), [data])
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())

  const toggleDone = (id: string) =>
    setDoneIds((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const remaining = tasks.filter((task) => !doneIds.has(task.id)).length

  return (
    <section
      aria-label="Call list"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-950">Call list</h2>
        <p className="text-sm text-slate-600" aria-live="polite">
          {remaining === 0 ? 'All done' : `${remaining} to go`}
        </p>
      </div>

      {tasks.length === 0 && (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          Nobody needs a call back from the weekend.
        </p>
      )}

      <div className="space-y-4">
        {tiers.map((tier) => {
          const items = tasks.filter((task) => task.urgency === tier.urgency)
          if (items.length === 0) return null
          return (
            <div key={tier.urgency}>
              <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 rounded-full ${tier.dot}`}
                />
                {tier.title}
                <span className="font-normal text-slate-500">{tier.hint}</span>
              </h3>
              <ul className="space-y-1.5">
                {items.map((task) => {
                  const done = doneIds.has(task.id)
                  return (
                    <li
                      key={task.id}
                      className={`flex items-center gap-2.5 rounded-lg border border-l-4 border-slate-200 p-2 ${tier.bar} ${
                        done ? 'opacity-50' : ''
                      }`}
                    >
                      <button
                        type="button"
                        aria-pressed={done}
                        aria-label={`Mark ${task.name} done`}
                        onClick={() => toggleDone(task.id)}
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs ${
                          done
                            ? 'border-teal-600 bg-teal-600 text-white'
                            : 'border-slate-300 text-transparent hover:border-teal-500'
                        }`}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelect?.(task)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span
                          className={`block truncate text-sm font-semibold text-slate-950 ${
                            done ? 'line-through' : ''
                          }`}
                        >
                          {task.label}
                        </span>
                        <span className="block truncate text-xs text-slate-600">
                          {task.name}, {task.detail}
                        </span>
                      </button>
                      {task.phone ? (
                        <a
                          href={`tel:${task.phone}`}
                          aria-label={`Call ${task.name}`}
                          className="shrink-0 rounded-full bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                        >
                          Call
                        </a>
                      ) : (
                        <span className="shrink-0 rounded-full bg-slate-100 px-3.5 py-2 text-xs text-slate-500">
                          No number
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>

      {hiddenCallers > 0 && (
        <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
          {hiddenCallers} other callers were booked, answered or need nothing.
        </p>
      )}
    </section>
  )
}
