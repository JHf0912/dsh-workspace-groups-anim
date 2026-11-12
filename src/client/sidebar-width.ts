/**
 * Left-sidebar width control.
 *
 * The shell layout owns the sidebar width. Its own drag handle clamps to
 * 264–420 px (default 280), so a third-party plugin cannot make it narrower
 * than 264 through the supported API. It DOES expose the panel actions on
 * `ctx.layout.panels` (the same `setSidebar` the drag handle calls), so this
 * module drives that action to set a width in the supported range and persists
 * the preference in browser storage.
 *
 * Framework: apply is called from the client plugin's `apply()`, so the
 * layout controller reference is captured for the settings UI.
 */
export const SIDEBAR_MIN = 264
export const SIDEBAR_MAX = 420
export const SIDEBAR_DEFAULT = 280
/** First-run value: a little narrower than the shell default. */
export const SIDEBAR_COMPACT = 264

const STORAGE_KEY = 'dsw.workspaceGroups.sidebarWidth'

interface LayoutControllerLike {
  panels?: { setSidebar?: (px: number) => void }
}

let resolveLayout: (() => LayoutControllerLike | null) | null = null
let current = SIDEBAR_DEFAULT

function clamp(px: number): number {
  const n = Number(px)
  if (!Number.isFinite(n)) return SIDEBAR_DEFAULT
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(n)))
}

function readStored(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    const n = Number(raw)
    return Number.isFinite(n) ? clamp(n) : null
  } catch { return null }
}

function persist(): void {
  try { localStorage.setItem(STORAGE_KEY, String(current)) } catch { /* ignore */ }
}

/** Capture a resolver for the layout controller once at apply() time. Resolving
 * lazily means the width still works if the layout service is provided later,
 * and the plugin never hard-depends on it. */
export function setLayoutResolver(fn: (() => LayoutControllerLike | null) | null): void {
  resolveLayout = fn
}

/** Push the width to the shell layout (safe no-op until a controller resolves). */
function push(px: number): void {
  try { resolveLayout?.()?.panels?.setSidebar?.(px) } catch { /* ignore */ }
}

/** Current preferred width in px. */
export function getSidebarWidth(): number { return current }

/**
 * Load the saved width, or — on first run — shrink the *current* sidebar by a
 * modest 24 px (never below the shell minimum, never re-opening a collapsed
 * sidebar). Re-pushed a few times while the frame mounts.
 */
function measureSidebarWidth(): number {
  try {
    const el = document.querySelector<HTMLElement>('[class*="_sidebarCol"]')
    return el === null ? 0 : el.getBoundingClientRect().width
  } catch { return 0 }
}

export function initSidebarWidth(): void {
  const stored = readStored()
  if (stored !== null) {
    current = stored
    // Respect a collapsed sidebar: only push while it is open.
    const apply = (): void => { if (measureSidebarWidth() >= 120) push(current) }
    apply()
    for (const ms of [80, 260, 700, 1500]) setTimeout(apply, ms)
    return
  }
  // First run: measure the live sidebar column and shave a little off.
  let done = false
  const shrink = (): void => {
    if (done) return
    const width = measureSidebarWidth()
    // No column yet, or collapsed to the rail: leave it alone.
    if (width < 120) return
    done = true
    current = clamp(width - 24)
    persist()
    push(current)
  }
  for (const ms of [120, 400, 900, 1600]) setTimeout(shrink, ms)
}

/** Set + persist a width (clamped to the shell's supported range). */
export function saveSidebarWidth(px: number): number {
  current = clamp(px)
  persist()
  push(current)
  return current
}

/** Restore the shell default width. */
export function resetSidebarWidth(): number {
  return saveSidebarWidth(SIDEBAR_DEFAULT)
}
