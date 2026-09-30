import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../components/Icon'
import { dayName, firstName } from '../../data/format'
import { useDashboard } from '../../state/useDashboard'
import { parseOutcome, type Intent } from './parseOutcome'

interface Message {
  id: number
  from: 'user' | 'jade'
  text: string
  /** Undo target for a change this message made. */
  undoId?: string
  undone?: boolean
}

const GREETING =
  'Hi, I\'m Jade. Tell me how a call went and I\'ll update the plan, for example "Peter chose Tue 18 Nov 11:00".'

export function ChatWidget() {
  const { actions, openings, logActivity, undoLastActivity } = useDashboard()
  const [open, setOpen] = useState(false)
  const [typing, setTyping] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, from: 'jade', text: GREETING },
  ])
  const nextId = useRef(1)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, typing, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const openActions = actions.filter((item) => item.status === 'open')
  const suggestions = openActions
    .flatMap((item) => {
      const slot = openings.find(
        (s) =>
          !s.bookedByActionId &&
          item.relatedOpening?.startsWith(`${s.date}T${s.time}`),
      )
      return slot
        ? [
            `${firstName(item.callerName)} chose ${dayName(slot.date)} ${slot.time}`,
          ]
        : []
    })
    .slice(0, 2)
  const chips = [
    ...suggestions,
    ...(openActions[1]
      ? [`${firstName(openActions[1].callerName)} did not answer`]
      : []),
  ]

  const apply = (intent: Intent): Pick<Message, 'text' | 'undoId'> => {
    switch (intent.kind) {
      case 'book': {
        logActivity(intent.action.id, {
          type: 'appointment-booked',
          slotId: intent.slot.id,
        })
        return {
          text: `Booked ${intent.action.callerName} into ${dayName(intent.slot.date)} ${intent.slot.time} (${intent.slot.type}, ${intent.slot.practitioner}). It's now in the Bookings calendar and their task is ticked.`,
          undoId: intent.action.id,
        }
      }
      case 'called':
        logActivity(intent.action.id, { type: 'called', detail: intent.detail })
        return {
          text: `Logged: ${intent.detail.toLowerCase()} for ${intent.action.callerName}. Their task stays open until it is resolved.`,
          undoId: intent.action.id,
        }
      case 'callback':
        logActivity(intent.action.id, {
          type: 'callback-booked',
          time: intent.time,
        })
        return {
          text: `Added a callback for ${intent.action.callerName} at ${intent.time}.`,
          undoId: intent.action.id,
        }
      case 'resolve':
        logActivity(intent.action.id, {
          type: 'resolved',
          detail: intent.detail,
        })
        return {
          text: `Marked ${intent.action.callerName} as ${intent.detail.toLowerCase()} and ticked their task.`,
          undoId: intent.action.id,
        }
      case 'no-slot':
        return {
          text: intent.available.length
            ? `I can't find that time for ${intent.action.callerName}. Open slots: ${intent.available
                .map((s) => `${dayName(s.date)} ${s.time}`)
                .join(', ')}.`
            : `There are no open slots left to book for ${intent.action.callerName}.`,
        }
      case 'ask-caller':
        return {
          text: `Who was that for? ${intent.options
            .map((item) => item.callerName)
            .join(', ')}…`,
        }
      case 'unclear':
        return {
          text: `Got it, ${firstName(intent.action.callerName)}. What was the outcome? For example "chose Tue 11:00", "did not answer" or "declined".`,
        }
    }
  }

  const send = (raw: string) => {
    const text = raw.trim()
    if (!text || typing) return
    setDraft('')
    setMessages((m) => [...m, { id: nextId.current++, from: 'user', text }])
    setTyping(true)
    window.setTimeout(() => {
      const reply = apply(parseOutcome(text, actions, openings))
      setMessages((m) => [
        ...m,
        { id: nextId.current++, from: 'jade', ...reply },
      ])
      setTyping(false)
    }, 650)
  }

  const undo = (message: Message) => {
    if (!message.undoId) return
    undoLastActivity(message.undoId)
    setMessages((m) =>
      m.map((item) =>
        item.id === message.id ? { ...item, undone: true } : item,
      ),
    )
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <section
          role="dialog"
          aria-label="Jade assistant"
          onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
          className="chat-panel flex h-[min(560px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-[0_24px_60px_rgba(11,60,79,.22)]"
        >
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand">
              <Icon name="sparkle" size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-semibold leading-tight text-navy">
                Jade assistant
              </h2>
              <p className="text-xs text-slate-500">
                Log an outcome, I'll update the calendar
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
            >
              <Icon name="close" size={16} />
            </button>
          </header>

          <div
            ref={listRef}
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto bg-canvas/60 px-4 py-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug ${
                    message.from === 'user'
                      ? 'rounded-br-md bg-brand text-white'
                      : 'rounded-bl-md border border-line bg-white text-slate-700'
                  }`}
                >
                  {message.text}
                  {message.undoId && (
                    <button
                      type="button"
                      disabled={message.undone}
                      onClick={() => undo(message)}
                      className="mt-1.5 block text-xs font-semibold text-brand underline-offset-2 hover:underline disabled:text-slate-400 disabled:no-underline"
                    >
                      {message.undone ? 'Undone' : 'Undo'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start" aria-label="Jade is typing">
                <div className="flex gap-1 rounded-2xl rounded-bl-md border border-line bg-white px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-line px-4 pt-3">
              {chips.map((chip) => (
                <button
                  type="button"
                  key={chip}
                  onClick={() => send(chip)}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-brand-soft"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault()
              send(draft)
            }}
            className="flex items-center gap-2 px-4 py-3"
          >
            <label htmlFor="chat-input" className="sr-only">
              Describe the outcome of a call
            </label>
            <input
              id="chat-input"
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="e.g. Peter chose Tue 18 Nov 11:00"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-full border border-line bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!draft.trim() || typing}
              aria-label="Send"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white hover:bg-navy-2 disabled:opacity-40"
            >
              <Icon name="send" size={16} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close assistant' : 'Open Jade assistant'}
        aria-expanded={open}
        className="grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-[0_10px_28px_rgba(14,116,144,.45)] hover:bg-navy-2"
      >
        <Icon name={open ? 'close' : 'chat'} size={24} />
      </button>
    </div>
  )
}
