import { getCallbackTime } from './activity'
import { dayName, firstName } from './format'
import type { ActionItem, OpeningSlot } from '../types/dashboard'

/**
 * Non-clinical SMS draft. Never mentions symptoms or treatment: Jade does not
 * capture health information and a text can be seen by others.
 */
export function draftMessage(
  action: ActionItem,
  openings: OpeningSlot[],
): string {
  const name = firstName(action.callerName)
  const time = getCallbackTime(action) ?? action.suggestedTime
  // Only offer the slot the plan actually reserved for this caller.
  const slot = openings.find(
    (item) =>
      !item.bookedByActionId &&
      action.relatedOpening?.startsWith(`${item.date}T${item.time}`),
  )

  switch (action.kind) {
    case 'confirm':
      return `Hi ${name}, it's Harbourside Dental. We're confirming your upcoming appointment. Reply YES to confirm, or let us know if you need a different time.`
    case 'bookfix':
      return `Hi ${name}, it's Harbourside Dental. Your booking falls outside our opening hours. Could we move it to a time that suits you? Are you free for a call at ${time}?`
    case 'datafix':
      return `Hi ${name}, it's Harbourside Dental. We didn't catch your number clearly when you called. Could you reply with the best number to reach you? Otherwise we'll call you at ${time}.`
    case 'note':
      return `Hi ${name}, it's Harbourside Dental. We've passed your note on to your dentist ahead of your appointment. See you soon.`
    case 'rebook':
      return slot
        ? `Hi ${name}, it's Harbourside Dental. You asked us to help you rebook. We have ${dayName(slot.date)} at ${slot.time} free. Would that suit? Reply YES to confirm, or let us know a time that works.`
        : `Hi ${name}, it's Harbourside Dental. You asked us to help you rebook. Are you free for a quick call at ${time}?`
  }

  switch (action.category) {
    case 'opening':
      return slot
        ? `Hi ${name}, it's Harbourside Dental. An appointment has opened up on ${dayName(slot.date)} at ${slot.time}. Would you like us to reserve it for you? Reply YES to confirm, or let us know if you're free for a quick call at ${time} instead.`
        : `Hi ${name}, it's Harbourside Dental. Sorry we couldn't fit you in sooner. We'll message you as soon as an earlier time opens up.`
    case 'urgent':
      return `Hi ${name}, it's Harbourside Dental. We saw your call from overnight and would like to speak with you this morning. Are you free for a call at ${time}?`
    case 'complaint':
      return `Hi ${name}, it's Harbourside Dental. Thank you for your patience. Our practice manager would like to call you about your enquiry at ${time}. Does that suit?`
    case 'referral':
      return `Hi ${name}, it's Harbourside Dental. As Jade mentioned, we don't offer that service ourselves, but we can share some referral options. Are you free for a call at ${time}?`
    default:
      return `Hi ${name}, it's Harbourside Dental. We're following up on your enquiry. Are you free for a quick call at ${time}?`
  }
}
