import { describe, expect, it } from 'vitest'
import { buildActions } from '../../data/buildDashboardModel'
import { getOpenings } from '../../data/activity'
import { weekendCalls } from '../../data/calls'
import { parseOutcome } from './parseOutcome'

const actions = buildActions(weekendCalls)
const openings = getOpenings(weekendCalls, actions)
const parse = (text: string) => parseOutcome(text, actions, openings)

describe('parseOutcome', () => {
  it('books the slot Peter chose', () => {
    const intent = parse('Peter Young chose Tue 18 Nov 11:00 with Dr Foster')
    expect(intent.kind).toBe('book')
    if (intent.kind === 'book') {
      expect(intent.action.id).toBe('peter')
      expect(intent.slot.id).toBe('opening-c015')
    }
  })

  it('understands casual wording', () => {
    const intent = parse('grace took thursday at 2pm')
    expect(intent.kind).toBe('book')
    if (intent.kind === 'book') expect(intent.slot.id).toBe('opening-c028')
  })

  it('logs no answer and declines', () => {
    expect(parse('Michael did not answer, voicemail').kind).toBe('called')
    const declined = parse('David declined')
    expect(declined.kind).toBe('resolve')
  })

  it('asks who when no caller is named', () => {
    expect(parse('they chose Tuesday 11:00').kind).toBe('ask-caller')
  })

  it('says so when the slot is not a known opening', () => {
    expect(parse('Peter chose Wed 19 Nov 15:00').kind).toBe('no-slot')
  })
})
