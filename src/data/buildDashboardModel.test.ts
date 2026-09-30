import { describe, expect, it } from 'vitest'
import { buildActions, buildCalendarEvents } from './buildDashboardModel'
import { weekendCalls } from './calls'

describe('dashboard model', () => {
  it('groups the weekend into seven human actions', () => {
    const actions = buildActions(weekendCalls)
    expect(actions).toHaveLength(7)
    expect(actions.filter((item) => item.priority === 'critical')).toHaveLength(
      2,
    )
  })

  it('surfaces three cancelled appointment openings', () => {
    const events = buildCalendarEvents(weekendCalls, buildActions(weekendCalls))
    expect(events.filter((event) => event.tone === 'opening')).toHaveLength(3)
  })

  it('groups repeat calls into one action', () => {
    const actions = buildActions(weekendCalls)
    expect(
      actions.find((item) => item.id === 'complaint-michael')?.callIds,
    ).toEqual(['c005', 'c031'])
  })
})

describe('activity', () => {
  it('derives progress, calendar and undo from the activity log', async () => {
    const { getProgress, withoutLastActivity } = await import('./activity')
    const actions = buildActions(weekendCalls)
    const grace = actions.find((a) => a.id === 'opening-grace')!
    expect(getProgress(grace)).toBe('new')

    const booked = {
      ...grace,
      activity: [
        { id: 'a', type: 'messaged' as const, at: '' },
        {
          id: 'b',
          type: 'appointment-booked' as const,
          at: '',
          slotId: 'opening-c002',
        },
      ],
    }
    expect(getProgress(booked)).toBe('booked')
    const events = buildCalendarEvents(weekendCalls, [booked])
    expect(events.find((e) => e.id === 'opening-c002')?.title).toBe('Grace S.')
    expect(getProgress(withoutLastActivity(booked))).toBe('messaged')
  })
})
