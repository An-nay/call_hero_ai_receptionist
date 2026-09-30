import { shortName } from '../../data/format'

export interface Privacy {
  reveal: boolean
  phones: Record<string, string>
}

export const nameOf = (name: string, reveal: boolean) =>
  reveal ? name : shortName(name)
