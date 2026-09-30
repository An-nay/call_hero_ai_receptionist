import { useEffect, useRef } from 'react'
import { useDashboard } from '../../state/useDashboard'

export function ActionDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { selectedAction, selectAction, completeAction } = useDashboard()

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
      className="m-auto w-[min(92vw,560px)] rounded-2xl bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/40"
    >
      {selectedAction && (
        <div>
          <div className="border-b border-slate-100 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              {selectedAction.category.replace('-', ' ')} ·{' '}
              {selectedAction.estimatedMinutes} min
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              {selectedAction.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedAction.callerName}
            </p>
          </div>
          <div className="space-y-5 p-6">
            <div>
              <h3 className="text-sm font-semibold">Why this matters</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {selectedAction.description}
              </p>
            </div>
            <div className="rounded-xl bg-teal-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                Recommended next step
              </p>
              <p className="mt-1 font-semibold text-teal-950">
                {selectedAction.recommendedAction}
              </p>
            </div>
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
              onClick={() => completeAction(selectedAction.id)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Mark complete
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
