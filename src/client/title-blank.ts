/**
 * "Blank display title" overlay for workspaces and sessions.
 *
 * The host refuses to store an empty Workspace title ("requires a non-blank
 * title") and an empty Session title ("must contain visible characters"), so a
 * true empty rename is impossible at the data layer. This module lets the user
 * blank the *displayed* label instead: the id is remembered in browser storage
 * and the row / tab renders an empty label, while the real title is untouched.
 *
 * Cosmetic and reversible: renaming to a non-empty title clears the flag.
 */
import { useSyncExternalStore } from 'react'

export interface BlankTitles {
  workspaces: string[]
  sessions: string[]
}

const STORAGE_KEY = 'dsw.workspaceGroups.blankTitles'

let loaded = false
let state: BlankTitles = { workspaces: [], sessions: [] }
const listeners = new Set<() => void>()

function readStorage(): BlankTitles {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw) as { workspaces?: unknown; sessions?: unknown }
      return {
        workspaces: Array.isArray(parsed.workspaces) ? parsed.workspaces.filter((v): v is string => typeof v === 'string') : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions.filter((v): v is string => typeof v === 'string') : [],
      }
    }
  } catch { /* storage unavailable: nothing blanked */ }
  return { workspaces: [], sessions: [] }
}

function emit(): void {
  listeners.forEach((fn) => { try { fn() } catch { /* listener error is not fatal */ } })
}

function persist(): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

/** Load the stored blank set once (no broadcast; call from apply before render). */
export function loadBlankTitles(): void {
  if (loaded) return
  loaded = true
  state = readStorage()
}

function ensureLoaded(): void {
  if (!loaded) { loaded = true; state = readStorage() }
}

/** Current blank set (stable identity until a change). */
export function getBlankTitles(): BlankTitles {
  ensureLoaded()
  return state
}

/** Subscribe to blank-set changes. */
export function subscribeBlankTitles(fn: () => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/** Whether one workspace / session currently renders a blank label. */
export function isWorkspaceBlank(id: string): boolean {
  return getBlankTitles().workspaces.includes(id)
}
export function isSessionBlank(id: string): boolean {
  return getBlankTitles().sessions.includes(id)
}

/** Blank (true) or restore (false) one workspace label. */
export function setWorkspaceBlank(id: string, blank: boolean): void {
  const has = state.workspaces.includes(id)
  if (blank === has) return
  state = { ...state, workspaces: blank ? [...state.workspaces, id] : state.workspaces.filter(x => x !== id) }
  persist(); emit()
}

/** Blank (true) or restore (false) one session label. */
export function setSessionBlank(id: string, blank: boolean): void {
  const has = state.sessions.includes(id)
  if (blank === has) return
  state = { ...state, sessions: blank ? [...state.sessions, id] : state.sessions.filter(x => x !== id) }
  persist(); emit()
}

/** React hook over the blank set (re-renders on change). */
export function useBlankTitles(): BlankTitles {
  return useSyncExternalStore(subscribeBlankTitles, getBlankTitles, getBlankTitles)
}
