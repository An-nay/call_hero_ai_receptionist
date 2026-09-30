import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { getCallbackTime } from '../../data/activity'
import { dayName } from '../../data/format'
import { useDashboard } from '../../state/useDashboard'
import type { ActionItem } from '../../types/dashboard'

export function BookPanel({ action }: { action: ActionItem }) {
  const { openings, logActivity } = useDashboard()
  const free = openings.filter((slot) => !slot.bookedByActionId)
  const mine = openings.find((slot) => slot.bookedByActionId === action.id)
  const attached = free.find((slot) =>
    action.relatedOpening?.startsWith(`${slot.date}T${slot.time}`),
  )
  const [slotId, setSlotId] = useState(attached?.id ?? free[0]?.id ?? '')
  const [callback, setCallback] = useState(
    getCallbackTime(action) ?? action.suggestedTime,
  )
  const selected =
    slotId && free.some((slot) => slot.id === slotId)
      ? slotId
      : (free[0]?.id ?? '')

  return (
    <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(22,78,99,.04)]">
      <h3 className="flex items-center gap-1.5 text-xs font-bold text-navy">
        <Icon name="calendar" size={14} /> Book
      </h3>
      {mine ? (
        <p className="mt-2 rounded-lg bg-emerald-50 p-2.5 text-[12px] font-bold text-emerald-800">
          <Icon name="check" size={14} className="mr-1 inline" />
          Booked {dayName(mine.date)} {mine.time}
        </p>
      ) : free.length > 0 ? (
        <>
          <label className="mt-2 block text-[11px] text-slate-500">
            Open appointment
            <select
              value={selected}
              onChange={(event) => setSlotId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-[12px] text-slate-900"
            >
              {free.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {dayName(slot.date)} {slot.time} · {slot.type}
                  {slot.id === attached?.id ? ' (offered)' : ''}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() =>
              logActivity(action.id, {
                type: 'appointment-booked',
                slotId: selected,
              })
            }
            className="mt-2 w-full rounded-lg bg-brand px-3 py-2 text-xs font-extrabold text-white hover:bg-navy-2"
          >
            Book appointment
          </button>
        </>
      ) : (
        <p className="mt-2 text-[11px] text-slate-500">
          No open appointments left.
        </p>
      )}
      <div className="mt-3 border-t border-line/60 pt-3">
        <label className="block text-[11px] text-slate-500">
          Callback slot in my plan
          <input
            type="time"
            value={callback}
            onChange={(event) => setCallback(event.target.value)}
            className="mt-1 w-full rounded-lg border border-line px-2 py-1.5 text-[12px] text-slate-900"
          />
        </label>
        <button
          type="button"
          onClick={() =>
            callback &&
            logActivity(action.id, { type: 'callback-booked', time: callback })
          }
          className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-xs font-extrabold hover:bg-slate-50"
        >
          Add to my plan
        </button>
      </div>
    </section>
  )
}
