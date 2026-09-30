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
