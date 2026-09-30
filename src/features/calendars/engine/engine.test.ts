import { describe, expect, it } from 'vitest'
import { weekendCalls } from '../../../data/calls'
import { buildCalendarModel } from './model'
import { plan } from './plan'
import { buildTasks } from './tasks'

const model = buildCalendarModel(weekendCalls)
const { tasks, log } = buildTasks(model, 480)
const monday = tasks.filter((t) => t.due <= 0)

describe('calendar engine', () => {
  it('finds twelve tasks for Monday, matching the prototype', () => {
    expect(monday.map((t) => t.id).sort()).toEqual(
      [
        'peter',
        'michael',
        'david',
        'grace',
        'laura',
        'james',
        'kevin',
        'chris',
        'sophie',
        'hannah',
        'natalie',
        'daniel',
      ].sort(),
    )
  })

  it('demotes Kevin below the urgent call and keeps eight corrections', () => {
    expect(tasks.find((t) => t.id === 'kevin')?.pri).toBe(3)
    expect(log.filter((entry) => entry.fix)).toHaveLength(8)
  })

  it('plans Urgent and High first and keeps lunch free', () => {
    const p = plan(model, tasks, {}, { day: 0, min: 480 })
    const placed = Object.values(p.hours[0]).flat()
    expect(placed[0].t.id).toBe('peter')
    expect(placed.some((x) => x.start < 885 && x.end > 840)).toBe(false)
  })

  it('stops offering a slot once it has been filled', () => {
    const filledModel = buildCalendarModel(weekendCalls, [
      { cid: 'c002', who: 'Grace Scott' },
    ])
    const next = buildTasks(filledModel, 480).tasks
    expect(next.find((t) => t.id === 'david')?.text).not.toMatch(
      /Mon 17 Nov 09:00/,
    )
  })
})
