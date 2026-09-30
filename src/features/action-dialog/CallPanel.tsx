import { useState } from 'react'
import { firstName, formatPhone } from '../../data/format'
import { useDashboard } from '../../state/useDashboard'
import type { ActionItem } from '../../types/dashboard'

export function CallPanel({
  action,
  phone,
  canContact,
}: {
  action: ActionItem
  phone: string
  canContact: boolean
}) {
  const { logActivity } = useDashboard()
  const [dialled, setDialled] = useState(false)
  const last = [...action.activity].reverse().find((e) => e.type === 'called')

  return (
    <section className="rounded-xl border border-slate-200 p-3.5">
      <h3 className="text-xs font-bold">📞 Call</h3>
      <p className="mt-0.5 text-[11px] text-slate-500">{formatPhone(phone)}</p>
      <a
        href={canContact ? `tel:${phone}` : undefined}
        aria-disabled={!canContact}
        onClick={() => canContact && setDialled(true)}
        className={`mt-3 block rounded-lg px-3 py-2.5 text-center text-xs font-extrabold text-white ${canContact ? 'bg-navy hover:bg-navy-2' : 'pointer-events-none bg-navy opacity-40'}`}
      >
        Call {firstName(action.callerName)}
      </a>
      {dialled && (
        <div className="mt-2.5">
          <p className="mb-1.5 text-[11px] text-slate-500">How did it go?</p>
          <div className="flex gap-1.5">
            {['Reached them', 'No answer'].map((detail) => (
              <button
                type="button"
                key={detail}
                onClick={() => {
                  logActivity(action.id, { type: 'called', detail })
                  setDialled(false)
                }}
                className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-bold hover:bg-slate-50"
              >
                {detail}
              </button>
            ))}
          </div>
        </div>
      )}
      {!dialled && last && (
        <p className="mt-2.5 text-[11px] text-slate-500">Last: {last.detail}</p>
      )}
    </section>
  )
}
