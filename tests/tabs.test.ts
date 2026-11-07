import { describe, it, expect } from 'vitest'
import { moveTab } from '../src/client/tabs.ts'

const mk = (a: string[]) => a.map((id, i) => ({ sessionId: id as never, order: i + 1 }))
const ids = (s: Array<{ sessionId: unknown }>) => s.map(t => t.sessionId as string)

describe('moveTab', () => {
  const base = mk(['A', 'B', 'C', 'D'])
  it('moves an item after the target', () => {
    expect(ids(moveTab(base, 'A' as never, 'C' as never, 'after'))).toEqual(['B', 'C', 'A', 'D'])
  })
  it('moves an item before the target', () => {
    expect(ids(moveTab(base, 'D' as never, 'B' as never, 'before'))).toEqual(['A', 'D', 'B', 'C'])
  })
  it('is a no-op when dragging onto itself', () => {
    expect(moveTab(base, 'A' as never, 'A' as never, 'after')).toBe(base)
  })
  it('is a no-op for an unknown id', () => {
    expect(moveTab(base, 'A' as never, 'Z' as never, 'after')).toBe(base)
  })
  it('keeps the order (React key) attached to each tab', () => {
    expect(moveTab(base, 'A' as never, 'D' as never, 'after').map(t => t.order)).toEqual([2, 3, 4, 1])
  })
})
