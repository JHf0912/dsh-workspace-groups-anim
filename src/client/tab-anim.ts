/**
 * Session-tab drag animation mode: state, persistence (localStorage) and the
 * per-mode duration/easing table shared by the strip and the settings preview.
 *
 * A cosmetic preference, so it lives in browser storage (the the agent harness web
 * origin is stable at the configured port). The real tab ORDER still persists on
 * the host via `/workspace-groups/tabs`, unchanged.
 */
export type TabAnimMode = 'off' | 'A' | 'B' | 'C' | 'D'

/** Per-mode FLIP duration (ms). */
export const TAB_ANIM_DUR: Record<string, number> = { A: 200, B: 280, C: 300, D: 420 }

/** Per-mode FLIP easing. */
export const TAB_ANIM_EASE: Record<string, string> = {
  A: 'cubic-bezier(.22,1,.36,1)',
  B: 'cubic-bezier(.4,0,.2,1)',
  C: 'cubic-bezier(.22,1,.36,1)',
  D: 'cubic-bezier(.34,1.56,.64,1)',
}

const STORAGE_KEY = 'dsw.workspaceGroups.tabAnim'
const MODES: readonly TabAnimMode[] = ['off', 'A', 'B', 'C', 'D']

let current: TabAnimMode = 'C'
let loaded = false
const listeners = new Set<(mode: TabAnimMode) => void>()

/** The active mode (defaults to C). */
export function getTabAnimMode(): TabAnimMode { return current }

/** Set + broadcast the mode; unknown values fall back to C. */
export function setTabAnimMode(mode: string): void {
  const next = (MODES as readonly string[]).includes(mode) ? (mode as TabAnimMode) : 'C'
  current = next
  listeners.forEach(fn => { try { fn(next) } catch { /* listener error is not fatal */ } })
}

/** Subscribe to mode changes; returns an unsubscribe. */
export function subscribeTabAnim(fn: (mode: TabAnimMode) => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/** Load the stored mode once. */
export function loadTabAnimMode(): void {
  if (loaded) return
  loaded = true
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v !== null && (MODES as readonly string[]).includes(v)) setTabAnimMode(v)
  } catch { /* storage unavailable: keep default */ }
}

/** Persist the chosen mode. */
export function saveTabAnimMode(mode: string): void {
  try { localStorage.setItem(STORAGE_KEY, mode) } catch { /* ignore */ }
}
