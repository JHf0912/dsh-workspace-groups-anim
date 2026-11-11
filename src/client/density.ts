/**
 * Display density: font size + row height + top tab-strip height.
 *
 * A pure cosmetic preference (like the drag-animation mode), so it lives in
 * browser storage. The chosen values are written to CSS custom properties on
 * <html>, which every `.wg*` rule reads with its original size as the fallback
 * — so the default look is byte-for-byte unchanged until the user adjusts it.
 *
 * Shrinking these makes the sidebar session list AND the top tab strip denser,
 * so more session tabs fit in one window without altering the plugin's markup.
 */
export interface Density {
  /** Base font size in px (sidebar labels + tab labels). */
  fontSize: number
  /** Height of one sidebar row (category / project / session) in px. */
  rowHeight: number
  /** Height of the top session-tab strip in px. */
  tabHeight: number
}

const STORAGE_KEY = 'dsw.workspaceGroups.density'

/** Original, unmodified sizes — the fallbacks baked into styles.css. */
const DEFAULTS: Density = { fontSize: 12, rowHeight: 28, tabHeight: 56 }

let current: Density = { ...DEFAULTS }
let loaded = false
const listeners = new Set<(d: Density) => void>()

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

function normalize(input: Partial<Density>): Density {
  return {
    fontSize: clampInt(input.fontSize, 9, 16, DEFAULTS.fontSize),
    rowHeight: clampInt(input.rowHeight, 18, 44, DEFAULTS.rowHeight),
    tabHeight: clampInt(input.tabHeight, 32, 80, DEFAULTS.tabHeight),
  }
}

/** Current density. */
export function getDensity(): Density { return current }

/** Subscribe to density changes; returns an unsubscribe. */
export function subscribeDensity(fn: (d: Density) => void): () => void {
  listeners.add(fn)
  return () => { listeners.delete(fn) }
}

/** Push the density onto <html> as CSS custom properties. */
export function applyDensity(d: Density = current): void {
  try {
    const el = document.documentElement
    el.style.setProperty('--wg-font-size', `${d.fontSize}px`)
    el.style.setProperty('--wg-font-sm', `${Math.max(9, d.fontSize - 1)}px`)
    el.style.setProperty('--wg-font-xs', `${Math.max(8, d.fontSize - 2)}px`)
    el.style.setProperty('--wg-row-height', `${d.rowHeight}px`)
    el.style.setProperty('--wg-tab-height', `${d.tabHeight}px`)
  } catch { /* no document (non-browser): nothing to apply */ }
}

/** Merge a patch into the live density and apply it; broadcasts to subscribers. */
export function setDensity(patch: Partial<Density>): Density {
  current = normalize({ ...current, ...patch })
  applyDensity()
  listeners.forEach((fn) => { try { fn(current) } catch { /* listener error is not fatal */ } })
  return current
}

/** Like setDensity, but also persists to localStorage. */
export function saveDensity(patch: Partial<Density>): Density {
  const d = setDensity(patch)
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)) } catch { /* storage unavailable */ }
  return d
}

/** Load the stored density once and apply it. */
export function loadDensity(): void {
  if (loaded) return
  loaded = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw !== null) {
      const parsed = JSON.parse(raw) as Partial<Density> | null
      if (parsed !== null && typeof parsed === 'object') current = normalize(parsed)
    }
  } catch { /* keep defaults */ }
  applyDensity()
}

/** Restore defaults and persist. */
export function resetDensity(): Density {
  const d = setDensity(DEFAULTS)
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)) } catch { /* ignore */ }
  return d
}
