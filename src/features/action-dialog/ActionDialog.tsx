import { useEffect, useRef, useState } from 'react'
import { getProgress, progressLabels } from '../../data/activity'
import {
  formatPhone,
  isValidPhone,
  maskPhone,
  shortName,
} from '../../data/format'
import { useDashboard } from '../../state/useDashboard'
import type { ActionItem } from '../../types/dashboard'
import { ActivityLog } from './ActivityLog'
import { BookPanel } from './BookPanel'
import { CallHistory } from './CallHistory'
import { CallPanel } from './CallPanel'
import { MessagePanel } from './MessagePanel'

function DialogBody({ action }: { action: ActionItem }) {
  const { data, selectAction, completeAction } = useDashboard()
  const [revealed, setRevealed] = useState(false)
  const [tryAnyway, setTryAnyway] = useState(false)

  const calls = action.callIds
    .map((id) => data.calls.find((call) => call.id === id))
    .filter((call) => call !== undefined)
    .sort((a, b) => a.started_at.localeCompare(b.started_at))
  const phone = calls.at(-1)?.caller_number ?? ''
  const validPhone = isValidPhone(phone)
  const canContact = validPhone || tryAnyway
  const badCallback = calls.some(
    (call) => call.outcome === 'failed_callback_number',
  )
  const progress = getProgress(action)

  return (
    <div>
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-brand">
            {action.category.replace('-', ' ')} · {action.estimatedMinutes} min
          </p>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold">
            {progressLabels[progress]}
          </span>
        </div>
        <h2 className="mt-1.5 text-xl font-bold">{action.title}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>
            {revealed ? action.callerName : shortName(action.callerName)}
          </span>
          <span aria-hidden>·</span>
          <span>{revealed ? formatPhone(phone) : maskPhone(phone)}</span>
          <button
            type="button"
            aria-pressed={revealed}
            onClick={() => setRevealed((value) => !value)}
            className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-bold hover:bg-slate-50"
          >
            {revealed ? 'Hide details' : 'Reveal details'}
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="rounded-xl bg-blue-50 p-3.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-brand">
            Recommended next step
          </p>
          <p className="mt-1 font-bold text-navy">{action.recommendedAction}</p>
          <p className="mt-1 text-[13px] text-slate-600">
            {action.description}
          </p>
        </div>

        {(!validPhone || badCallback) && (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900"
          >
            {validPhone ? (
              <>
                The number Jade captured was incomplete, so use the caller ID
                shown above instead.
              </>
            ) : (
              <>
                This caller's number looks incomplete, so calling and texting
                are off.{' '}
                {!tryAnyway && (
                  <button
                    type="button"
                    onClick={() => setTryAnyway(true)}
                    className="font-bold underline"
                  >
                    Try anyway
                  </button>
                )}
              </>
            )}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          <MessagePanel action={action} canContact={canContact} />
          <CallPanel
            action={action}
            phone={phone}
            revealed={revealed}
            canContact={canContact}
          />
          <BookPanel action={action} />
        </div>

        <CallHistory calls={calls} />
        <ActivityLog action={action} />
      </div>

      <div className="flex justify-end gap-3 border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={() => selectAction(null)}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => completeAction(action.id)}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-2"
        >
          Mark resolved
        </button>
      </div>
    </div>
  )
}

export function ActionDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { selectedAction, selectAction } = useDashboard()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (selectedAction && !dialog.open) dialog.showModal()
    if (!selectedAction && dialog.open) dialog.close()
  }, [selectedAction])

  return (
    <dialog
      ref={dialogRef}
      onClose={() => selectAction(null)}
      className="m-auto max-h-[92vh] w-[min(94vw,880px)] overflow-y-auto rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/40 max-sm:mb-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none"
    >
      {selectedAction && (
        <DialogBody key={selectedAction.id} action={selectedAction} />
      )}
    </dialog>
  )
}
