import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { weekendCalls } from '../../../data/calls'
import { TriagePanel } from '../TriagePanel'
import { buildTriageTasks, maskName } from './buildTriageTasks'

describe('buildTriageTasks', () => {
  const result = buildTriageTasks(weekendCalls)
  const names = result.tasks.map((task) => task.name)

  it('ranks red, then orange, then yellow', () => {
    expect(names).toEqual([
      'Peter Y.',
      'Michael B.',
      'Grace S.',
      'David M.',
      'James A.',
      'Rachel L.',
      'Daniel C.',
      'Natalie E.',
    ])
    expect(result.tasks.map((task) => task.urgency)).toEqual([
      'now',
      'now',
      'today',
      'today',
      'today',
      'week',
      'week',
      'week',
    ])
  })

  it('drops callers who ended up booked or need nothing', () => {
    expect(names).not.toContain('Chris M.')
    expect(names).not.toContain('Sarah J.')
    expect(result.totalCallers).toBe(26)
    expect(result.hiddenCallers).toBe(18)
  })

  it('does not crash on incomplete data', () => {
    const empty = { ...weekendCalls, calls: [] }
    expect(buildTriageTasks(empty).tasks).toEqual([])
  })

  it('masks names', () => {
    expect(maskName('Peter Young')).toBe('Peter Y.')
    expect(maskName('Cher')).toBe('Cher')
    expect(maskName(null)).toBe('Unknown caller')
  })
})

describe('TriagePanel', () => {
  it('never renders full names or phone numbers as text', () => {
    const html = renderToStaticMarkup(createElement(TriagePanel))
    expect(html).toContain('Peter Y.')
    expect(html).not.toContain('Peter Young')
    const visibleText = html.replace(/<[^>]*>/g, ' ')
    expect(visibleText).not.toMatch(/\+61|\d{8,}/)
  })
})
