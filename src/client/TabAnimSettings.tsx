// @ts-nocheck
/**
 * In-plugin settings for the session-tab drag animation.
 *
 * Shows all four modes at once as 1:1 replicas of the real tab strip (reusing
 * the plugin's own `.wgTabs/.wgTab` classes, so gaps/sizes/borders match the
 * live strip exactly), each independently draggable for side-by-side comparison.
 * "选用" sets the mode for the real top strip; a bottom option turns it off.
 */
import { useEffect, useRef, useState } from 'react'
import { getTabAnimMode, loadTabAnimMode, saveTabAnimMode, setTabAnimMode, subscribeTabAnim } from './tab-anim.ts'
import { getDensity, loadDensity, resetDensity, saveDensity, subscribeDensity, type Density } from './density.ts'

const DUR = { A: 200, B: 280, C: 300, D: 420 }
const EASE = {
  A: 'cubic-bezier(.22,1,.36,1)',
  B: 'cubic-bezier(.4,0,.2,1)',
  C: 'cubic-bezier(.22,1,.36,1)',
  D: 'cubic-bezier(.34,1.56,.64,1)',
}
const DOT = { ongoing: '#2f9e44', attention: '#e8a700', settled: '#b9bcc2', unread: '#4a90d9', idle: '#ced2d8' }
const DATA = [
  { p: 'project-1', t: '示例会话 1', s: 'ongoing' },
  { p: 'project-2', t: '示例会话 2', s: 'ongoing' },
  { p: 'project-3', t: '示例会话 3', s: 'attention' },
  { p: 'project-4', t: '示例会话 4', s: 'settled' },
]

/** Build one draggable 1:1 preview strip into `host`; mode is fixed per strip. */
function buildPreview(host: HTMLElement, getMode: () => string): () => void {
  host.innerHTML = ''
  const tabs = document.createElement('div')
  tabs.className = 'wgTabs'
  const scroll = document.createElement('div')
  scroll.className = 'wgTabsScroll'
  scroll.style.position = 'relative'
  tabs.appendChild(scroll)
  host.appendChild(tabs)
  const chips: HTMLElement[] = []
  let dragEl: HTMLElement | null = null
  let dragging = false
  let targetIdx = 0
  let prevRects: Map<HTMLElement, DOMRect> | null = null
  let ghost: HTMLElement | null = null

  DATA.forEach((d, idx) => {
    const el = document.createElement('div')
    el.className = 'wgTab' + (idx === 2 ? ' wgTabActive' : '')
    el.setAttribute('draggable', 'true')
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'wgTabMain'
    btn.setAttribute('role', 'tab')
    btn.draggable = false
    const st = document.createElement('span')
    st.className = 'wgTabStatus'
    const dot = document.createElement('span')
    dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:' + (DOT[d.s] || DOT.idle) + ';'
    st.appendChild(dot)
    const tx = document.createElement('span')
    tx.className = 'wgTabText'
    const pj = document.createElement('span')
    pj.className = 'wgTabProject'
    pj.textContent = d.p
    const lb = document.createElement('span')
    lb.className = 'wgTabLabel'
    lb.textContent = d.t
    tx.appendChild(pj)
    tx.appendChild(lb)
    btn.appendChild(st)
    btn.appendChild(tx)
    const cl = document.createElement('button')
    cl.type = 'button'
    cl.className = 'wgTabClose'
    cl.innerHTML = '&#215;'
    cl.draggable = false
    el.appendChild(btn)
    el.appendChild(cl)
    el.addEventListener('dragstart', startDrag(el))
    el.addEventListener('dragend', endDrag)
    scroll.appendChild(el)
    chips.push(el)
  })

  const line = document.createElement('div')
  line.style.cssText = 'position:absolute;width:2px;border-radius:2px;background:#4a90d9;box-shadow:0 0 0 3px #4a90d926;opacity:0;pointer-events:none;z-index:6;transition:opacity .12s;'
  scroll.appendChild(line)

  function insertion(px: number): void {
    const sr = scroll.getBoundingClientRect()
    const others = chips.filter(c => c !== dragEl)
    let idx = 0
    others.forEach(o => { const r = o.getBoundingClientRect(); if (px > r.left + r.width / 2) idx += 1 })
    targetIdx = idx
    if (idx < others.length) {
      const r = others[idx]!.getBoundingClientRect()
      line.style.left = (r.left - sr.left - 3) + 'px'
      line.style.top = (r.top - sr.top + 3) + 'px'
      line.style.height = (r.height - 6) + 'px'
    } else if (others.length > 0) {
      const r = others[others.length - 1]!.getBoundingClientRect()
      line.style.left = (r.right - sr.left + 3) + 'px'
      line.style.top = (r.top - sr.top + 3) + 'px'
      line.style.height = (r.height - 6) + 'px'
    } else return
    line.style.opacity = '1'
  }

  function startDrag(el: HTMLElement): (e: DragEvent) => void {
    return (e: DragEvent) => {
      const m = getMode()
      if (m === 'off' || !m) { e.preventDefault(); return }
      dragging = true
      dragEl = el
      targetIdx = chips.indexOf(el)
      prevRects = new Map()
      chips.forEach(c => prevRects!.set(c, c.getBoundingClientRect()))
      el.style.opacity = m === 'C' ? '.32' : '.5'
      try { e.dataTransfer?.setData('text/plain', String(chips.indexOf(el))); if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move' } catch { /* ignore */ }
      if (m === 'C') {
        const r = el.getBoundingClientRect()
        ghost = el.cloneNode(true) as HTMLElement
        ghost.style.cssText += ';position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;z-index:9999;pointer-events:none;opacity:1;box-shadow:0 12px 28px #00000040;'
        document.body.appendChild(ghost)
      }
    }
  }

  function over(e: DragEvent): void {
    if (!dragging) return
    const m = getMode()
    e.preventDefault()
    try { if (e.dataTransfer) e.dataTransfer.dropEffect = 'move' } catch { /* ignore */ }
    if (ghost) { ghost.style.left = (e.clientX - 40) + 'px'; ghost.style.top = (e.clientY - 20) + 'px' }
    if (m === 'A' || m === 'C') insertion(e.clientX)
    else {
      const others = chips.filter(c => c !== dragEl)
      let idx = 0
      others.forEach(o => { const r = o.getBoundingClientRect(); if (e.clientX > r.left + r.width / 2) idx += 1 })
      targetIdx = idx
    }
  }

  function drop(e: DragEvent): void {
    if (!dragging || dragEl === null) return
    e.preventDefault()
    const m = getMode()
    const others = chips.filter(c => c !== dragEl)
    const ref = targetIdx < others.length ? others[targetIdx]! : null
    scroll.insertBefore(dragEl, ref)
    dragEl.style.opacity = ''
    line.style.opacity = '0'
    if (ghost) { ghost.remove(); ghost = null }
    const d = DUR[m] || 280
    const ease = EASE[m] || 'ease'
    chips.forEach(c => {
      const prev = prevRects?.get(c)
      if (!prev) return
      const now = c.getBoundingClientRect()
      const dx = prev.left - now.left
      const dy = prev.top - now.top
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        try { c.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'translate(0,0)' }], { duration: d, easing: ease }) } catch { /* ignore */ }
      }
    })
    prevRects = null
    dragging = false
    dragEl = null
  }

  function endDrag(): void {
    line.style.opacity = '0'
    if (ghost) { ghost.remove(); ghost = null }
    if (dragEl) dragEl.style.opacity = ''
    dragging = false
    dragEl = null
    prevRects = null
  }

  scroll.addEventListener('dragover', over)
  scroll.addEventListener('drop', drop)
  return () => {
    scroll.removeEventListener('dragover', over)
    scroll.removeEventListener('drop', drop)
    host.innerHTML = ''
    if (ghost) { ghost.remove(); ghost = null }
  }
}

/**
 * Display-density controls. Three sliders write CSS custom properties (see
 * density.ts / styles.css) so the real sidebar list and top tab strip shrink
 * together; the previews below use the plugin's own classes, so they are a 1:1
 * mirror of what the live UI will look like. No markup structure is changed.
 */
function DensitySettings(): JSX.Element {
  const [den, setDen] = useState<Density>(getDensity())
  useEffect(() => {
    loadDensity()
    const un = subscribeDensity(d => setDen(d))
    return un
  }, [])
  const row = (label: string, key: keyof Density, min: number, max: number, step: number, hint: string): JSX.Element => (
    <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: 'var(--dsw-alias-label-tertiary,#8a8f98)' }}>{den[key]}px · {hint}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={den[key]}
        onChange={e => { setDen(saveDensity({ [key]: Number(e.target.value) } as Partial<Density>)) }}
        style={{ width: '100%', accentColor: 'var(--dsw-alias-brand-primary,#4a90d9)' }}
      />
    </label>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--dsw-alias-border-l2,#00000014)', borderRadius: '12px', padding: '12px 14px', background: 'var(--dsw-alias-bg-layer-1,#fbfbfc)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontWeight: 600, fontSize: '14px', flex: 'none' }}>显示密度</span>
        <span style={{ fontSize: '12px', color: 'var(--dsw-alias-label-tertiary,#8a8f98)', flex: 1, minWidth: 0 }}>调小字号 / 行高，侧边栏与顶部标签栏一起变紧凑，一屏显示更多标签。改动即时生效并自动保存。</span>
        <button
          type="button"
          onClick={() => setDen(resetDensity())}
          style={{ flex: 'none', fontSize: '12px', padding: '4px 10px', borderRadius: '8px', border: '1px solid var(--dsw-alias-border-l2,#00000020)', background: 'transparent', cursor: 'pointer', color: 'inherit' }}
        >恢复默认</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        {row('字号', 'fontSize', 9, 16, 1, '越小越紧凑')}
        {row('列表行高', 'rowHeight', 18, 44, 1, '会话/项目行')}
        {row('标签栏高度', 'tabHeight', 32, 80, 2, '顶部标签')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* 侧边栏列表预览：复用真实 .wg* 类，尺寸随上面的变量实时变化 */}
        <div style={{ border: '1px solid var(--dsw-alias-border-l2,#0000000f)', borderRadius: '10px', padding: '6px 4px', background: 'var(--dsw-alias-bg-layer-2,#fff)' }}>
          <div className="wgList">
            <div className="wgCategoryRow" role="treeitem">
              <span className="wgChevron">▸</span>
              <span className="wgCategoryIcon">📁</span>
              <span className="wgCategoryLabel">全部项目</span>
              <span className="wgCategoryCount">3</span>
            </div>
            <div className="wgProjectRow" role="treeitem">
              <span className="wgChevron">▸</span>
              <span className="wgCategoryIcon">▣</span>
              <span className="wgProjectLabel">project-1</span>
            </div>
            <div className="wgSessionRow" role="treeitem">
              <span className="wgStatusSlot"><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2f9e44' }} /></span>
              <span className="wgSessionTitle">示例会话 —— 更小的字号和行高，一屏放更多</span>
              <span className="wgSessionTime">5min</span>
            </div>
            <div className="wgSessionRow" role="treeitem">
              <span className="wgStatusSlot"><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#b9bcc2' }} /></span>
              <span className="wgSessionTitle">第二个示例会话</span>
              <span className="wgSessionTime">2h</span>
            </div>
          </div>
        </div>
        {/* 顶部标签栏预览 */}
        <div className="wgTabs" style={{ borderRadius: '10px', overflow: 'hidden' }}>
          <div className="wgTabsScroll">
            {['示例会话 1', '示例会话 2', '示例会话 3'].map((title, i) => (
              <div key={title} className={'wgTab' + (i === 0 ? ' wgTabActive' : '')}>
                <button type="button" className="wgTabMain" tabIndex={-1}>
                  <span className="wgTabStatus"><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2f9e44' }} /></span>
                  <span className="wgTabText">
                    <span className="wgTabProject">project-{i + 1}</span>
                    <span className="wgTabLabel">{title}</span>
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const CARDS = [
  { k: 'A', name: '模式 1 · 插入线让位', desc: '蓝色竖线标示落点，其余标签平滑让位。落点最清晰、最稳。' },
  { k: 'B', name: '模式 2 · 平滑跟手', desc: '标签略微滞后跟随指针，经过邻居即交换。干净顺滑。' },
  { k: 'C', name: '模式 3 · 幽灵浮层', desc: '拖起的标签变成漂浮「幽灵」，原位留虚框，松手飞回。质感最好。' },
  { k: 'D', name: '模式 4 · 弹性磁吸', desc: '带惯性与回弹（overshoot），最活泼、最 Q 弹。' },
]

/** Settings panel component. */
export function TabAnimSettings(): JSX.Element {
  const [mode, setMode] = useState<string>(getTabAnimMode())
  const rootRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const un = subscribeTabAnim(m => setMode(m))
    loadTabAnimMode()
    return un
  }, [])
  useEffect(() => {
    const root = rootRef.current
    if (root === null) return
    const hosts = Array.from(root.querySelectorAll<HTMLElement>('[data-wg-preview]'))
    const cleanups = hosts.map(h => buildPreview(h, () => h.getAttribute('data-wg-preview') || 'C'))
    return () => { cleanups.forEach(fn => { try { fn() } catch { /* ignore */ } }) }
  }, [])
  const choose = (m: string): void => { setTabAnimMode(m); saveTabAnimMode(m) }
  const cardStyle = (k: string): React.CSSProperties => ({
    border: '1px solid ' + (mode === k ? 'var(--dsw-alias-brand-primary,#4a90d9)' : 'var(--dsw-alias-border-l2,#00000014)'),
    borderRadius: '12px',
    padding: '10px 12px',
    background: mode === k ? 'var(--dsw-alias-bg-hover,#7f7f7f0f)' : 'transparent',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  })
  return (
    <div ref={rootRef} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '780px', padding: '4px 0' }}>
      <DensitySettings />
      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>会话标签拖拽动效</h3>
      <p style={{ margin: 0, fontSize: '13px', color: 'var(--dsw-alias-label-tertiary,#8a8f98)', lineHeight: 1.6 }}>
        下面 4 种效果都可以直接拖动对比；点右侧「选用」把它设为顶部真实标签栏的拖拽动效。
      </p>
      {CARDS.map(c => (
        <div key={c.k} style={cardStyle(c.k)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 600, fontSize: '13px', flex: 'none' }}>{c.name}</span>
            <span style={{ color: 'var(--dsw-alias-label-tertiary,#8a8f98)', fontSize: '12px', flex: 1, minWidth: 0 }}>{c.desc}</span>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', flex: 'none' }}>
              <input type="radio" name="wg-tab-anim" checked={mode === c.k} onChange={() => { choose(c.k) }} />
              <span>{mode === c.k ? '已选用' : '选用'}</span>
            </label>
          </div>
          <div data-wg-preview={c.k} style={{ padding: '6px', borderRadius: '10px', background: 'var(--dsw-alias-bg-layer-1,#fbfbfc)', border: '1px solid var(--dsw-alias-border-l2,#0000000f)' }} />
        </div>
      ))}
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', padding: '6px 0' }}>
        <input type="radio" name="wg-tab-anim" checked={mode === 'off'} onChange={() => { choose('off') }} />
        <span>关闭（不使用拖拽动效，标签不可拖动）</span>
      </label>
    </div>
  )
}
