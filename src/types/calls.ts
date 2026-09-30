export type CallOutcome =
  | 'booked'
  | 'cancelled'
  | 'failed_callback_number'
  | 'hung_up'
  | 'message_taken'
  | 'no_availability'
  | 'question_answered'
  | 'urgent_flagged'
  | 'wrong_number'

export interface Appointment {
  date: string
  time: string
  type: string
  practitioner: string
  action?: 'cancelled' | 'rescheduled'
}

export interface CallRecord {
  id: string
  started_at: string
  duration_seconds: number
  caller_number: string
  caller_name: string | null
  outcome: CallOutcome
  intent: string
  summary: string
  appointment: Appointment | null
  recording_available: boolean
  sentiment: 'positive' | 'neutral' | 'negative'
  flagged?: string
  repeat_caller?: boolean
}

export interface WeekendCallsData {
  clinic: {
    name: string
    suburb: string
    state: string
    practitioners: string[]
    business_hours: string
    recording_enabled: boolean
  }
  period: {
    label: string
    from: string
    to: string
    note: string
  }
  calls: CallRecord[]
}
