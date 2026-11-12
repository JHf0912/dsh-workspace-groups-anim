// @ts-nocheck
/**
 * The session tab strip: one chip per opened conversation, rendered into the
 * DOM seat at the head of the conversation column (see `tab-seat.ts` for why
 * this is a DOM injection rather than a slot).
 *
 * Dragging: chips are HTML5-draggable; on drop the tab store reorders its array
 * and the chips FLIP-animate to their new slots. The animation style is chosen
 * by the user via the plugin settings page (`tab-anim.ts`); "off" disables
 * dragging entirely.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconCloseFillMedium, StateDot, Tooltip, type StateDotState } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SessionsTabsProps } from './contract.ts'
import { mountTabSeat } from './tab-seat.ts'
import { orderedTabs, projectIndex, tabIndicator, type SessionTab, type SessionTabIndicator } from './tabs.ts'
import { currentSessionId } from './tree.ts'
import { TAB_ANIM_DUR, TAB_ANIM_EASE, getTabAnimMode, loadTabAnimMode, subscribeTabAnim } from './tab-anim.ts'
import { useBlankTitles } from './title-blank.ts'

/** Private dataTransfer type so only in-strip drags are accepted. */
const TAB_DND_TYPE = 'application/x-dsh-wg-tab'

/** Dot state for one tab (the sidebar's session rows share this vocabulary). */
function dotState(indicator: SessionTabIndicator): StateDotState {
  if (indicator.attention) return 'warning'
  if (indicator.running) return 'ongoing'
  return 'done'
}

interface TabDragState {
  draggedId: string
  overId: string
  pos: 'before' | 'after'
}

/**
 * Render the session tab strip into the conversation column's head seat.
 * @param props - tab store, catalog/status hooks, navigation, locale.
 * @returns the portal (or null until the column has mounted).
 */
export function SessionTabs({
  useTabs,
  actions,
  useSessions,
  useSessionStatus,
  useWorkspaces,
  activate,
  rename,
  t,
}: SessionsTabsProps) {
  const tabs = useTabs(s => s.tabs)
  const list = useSessions(s => s)
  const statuses = useSessionStatus(s => s)
  const currentId = useSessions(s => currentSessionId(s))
  const workspaces = useWorkspaces(s => s.items)
  const blankTitles = useBlankTitles()

  const projects = useMemo(() => projectIndex(workspaces), [workspaces])

  const [seat, setSeat] = useState<HTMLElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const mounted = mountTabSeat(setSeat)
    if (mounted.host !== null) setSeat(mounted.host)
    return () => {
      mounted.dispose()
      setSeat(null)
    }
  }, [])

  const display = useMemo(() => orderedTabs(tabs, currentId), [tabs, currentId])

  // ---- drag-and-drop reorder ----------------------------------------------
  const [animMode, setAnimMode] = useState(getTabAnimMode())
  useEffect(() => {
    const un = subscribeTabAnim(setAnimMode)
    loadTabAnimMode()
    return un
  }, [])
  const [tabDrag, setTabDrag] = useState<TabDragState | null>(null)
  const flipRef = useRef<{ rects: Map<string, { x: number; y: number }>; dur: number; ease: string } | null>(null)

  const captureRects = (): Map<string, { x: number; y: number }> => {
    const map = new Map<string, { x: number; y: number }>()
    const el = scrollRef.current
    if (el === null) return map
    el.querySelectorAll<HTMLElement>('[data-tab-session]').forEach(node => {
      const r = node.getBoundingClientRect()
      map.set(node.getAttribute('data-tab-session')!, { x: r.x, y: r.y })
    })
    return map
  }

  useLayoutEffect(() => {
    const flip = flipRef.current
    if (flip === null) return
    flipRef.current = null
    const el = scrollRef.current
    if (el === null) return
    el.querySelectorAll<HTMLElement>('[data-tab-session]').forEach(node => {
      const prev = flip.rects.get(node.getAttribute('data-tab-session')!)
      if (prev === undefined) return
      const now = node.getBoundingClientRect()
      const dx = prev.x - now.x
      const dy = prev.y - now.y
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
      try {
        node.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'translate(0,0)' }], { duration: flip.dur, easing: flip.ease })
      } catch { /* ignore */ }
    })
  })

  const onTabDragStart = (sessionId: string) => (event: React.DragEvent) => {
    setTabDrag({ draggedId: sessionId, overId: '', pos: 'before' })
    try {
      event.dataTransfer.setData(TAB_DND_TYPE, sessionId)
      event.dataTransfer.effectAllowed = 'move'
    } catch { /* ignore */ }
  }
  const onTabDragOver = (sessionId: string) => (event: React.DragEvent) => {
    if (!Array.from(event.dataTransfer.types).includes(TAB_DND_TYPE)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const rect = event.currentTarget.getBoundingClientRect()
    const pos: 'before' | 'after' = event.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
    setTabDrag(prev => prev === null || (prev.overId === sessionId && prev.pos === pos) ? prev : { ...prev, overId: sessionId, pos })
  }
  const onTabDragLeave = (event: React.DragEvent) => {
    const related = event.relatedTarget as Node | null
    if (related !== null && event.currentTarget.contains(related)) return
    setTabDrag(prev => prev === null || prev.overId === '' ? prev : { ...prev, overId: '' })
  }
  const onTabDrop = (targetId: string) => (event: React.DragEvent) => {
    if (!Array.from(event.dataTransfer.types).includes(TAB_DND_TYPE)) return
    event.preventDefault()
    const draggedId = event.dataTransfer.getData(TAB_DND_TYPE) || (tabDrag === null ? '' : tabDrag.draggedId)
    const dropRect = event.currentTarget.getBoundingClientRect()
    const pos: 'before' | 'after' = event.clientX < dropRect.left + dropRect.width / 2 ? 'before' : 'after'
    setTabDrag(null)
    if (draggedId === '' || draggedId === targetId) return
    const mode = getTabAnimMode()
    if (mode !== 'off') flipRef.current = { rects: captureRects(), dur: TAB_ANIM_DUR[mode] || 280, ease: TAB_ANIM_EASE[mode] || 'cubic-bezier(.4,0,.2,1)' }
    actions.reorder(draggedId, targetId, pos)
  }
  const onTabDragEnd = () => setTabDrag(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el === null || currentId === undefined) return
    const chip = el.querySelector<HTMLElement>(`[data-tab-session="${CSS.escape(currentId)}"]`)
    chip?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [currentId, display.length])

  if (seat === null || display.length === 0) return null

  return createPortal(
    <div className="wgTabs" role="tablist" aria-label={t('tabs.aria')}>
      <div
        className="wgTabsScroll"
        ref={scrollRef}
        onWheel={(event) => {
          const el = event.currentTarget
          if (el.scrollWidth <= el.clientWidth) return
          const delta = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX
          if (delta === 0) return
          const atStart = el.scrollLeft <= 0 && delta < 0
          const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && delta > 0
          if (atStart || atEnd) return
          el.scrollLeft += delta
          event.preventDefault()
        }}
      >
        {display.map((tab: SessionTab) => {
          const summary = list.byId[tab.sessionId]
          const label = summary === undefined
            ? tab.sessionId
            : summary.blank ? t('newSession') : summary.displayTitle
          const active = tab.sessionId === currentId
          const indicator = tabIndicator(summary, statuses.get(tab.sessionId))
          const project = projects.get(tab.sessionId)
          const projectBlanked = project !== undefined && blankTitles.workspaces.includes(String(project.workspaceId))
          const sessionBlanked = blankTitles.sessions.includes(tab.sessionId)
          const tip = project === undefined
            ? label
            : `${project.label} · ${label}\n${project.path}`
          const isDragging = tabDrag !== null && tabDrag.draggedId === tab.sessionId
          const showLine = (animMode === 'A' || animMode === 'C') && tabDrag !== null && tabDrag.overId === tab.sessionId && tabDrag.draggedId !== tab.sessionId
          const chipClass = `wgTab${active ? ' wgTabActive' : ''}${isDragging ? (animMode === 'C' ? ' wgTabPlaceholder' : ' wgTabDragging') : ''}${showLine ? (tabDrag!.pos === 'before' ? ' wgTabInsertBefore' : ' wgTabInsertAfter') : ''}`
          return (
            <div
              key={tab.order}
              className={chipClass}
              data-tab-session={tab.sessionId}
              draggable={animMode !== 'off'}
              onDragStart={onTabDragStart(tab.sessionId)}
              onDragOver={onTabDragOver(tab.sessionId)}
              onDragLeave={onTabDragLeave}
              onDrop={onTabDrop(tab.sessionId)}
              onDragEnd={onTabDragEnd}
              {...(project !== undefined ? { 'data-tab-project': project.workspaceId } : {})}
            >
              <button
                type="button"
                role="tab"
                aria-selected={active}
                className="wgTabMain"
                title={tip}
                onClick={() => { activate(tab.sessionId) }}
                onDoubleClick={() => { rename(tab.sessionId, label) }}
              >
                <span className="wgTabStatus" data-tab-state={indicator.attention ? 'attention' : indicator.running ? 'running' : indicator.unread ? 'unread' : indicator.settled ? 'settled' : 'idle'}>
                  <StateDot state={dotState(indicator)} />
                </span>
                <span className="wgTabText">
                  {project !== undefined && !projectBlanked && (
                    <span className="wgTabProject" title={project.path}>{project.label}</span>
                  )}
                  <span className="wgTabLabel">{sessionBlanked ? '' : label}</span>
                </span>
              </button>
              <Tooltip label={t('tabs.close')} side="top" delayMs={600}>
                <button
                  type="button"
                  className="wgTabClose"
                  draggable={false}
                  onDragStart={(event) => { event.stopPropagation() }}
                  aria-label={`${t('tabs.close')} ${label}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    actions.close(tab.sessionId)
                  }}
                >
                  <IconCloseFillMedium />
                </button>
              </Tooltip>
            </div>
          )
        })}
      </div>
    </div>,
    seat,
  )
}
