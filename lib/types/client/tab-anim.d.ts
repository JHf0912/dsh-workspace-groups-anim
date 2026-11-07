/**
 * Session-tab drag animation mode: state, persistence (localStorage) and the
 * per-mode duration/easing table shared by the strip and the settings preview.
 *
 * A cosmetic preference, so it lives in browser storage (the the agent harness web
 * origin is stable at the configured port). The real tab ORDER still persists on
 * the host via `/workspace-groups/tabs`, unchanged.
 */
export type TabAnimMode = 'off' | 'A' | 'B' | 'C' | 'D';
/** Per-mode FLIP duration (ms). */
export declare const TAB_ANIM_DUR: Record<string, number>;
/** Per-mode FLIP easing. */
export declare const TAB_ANIM_EASE: Record<string, string>;
/** The active mode (defaults to C). */
export declare function getTabAnimMode(): TabAnimMode;
/** Set + broadcast the mode; unknown values fall back to C. */
export declare function setTabAnimMode(mode: string): void;
/** Subscribe to mode changes; returns an unsubscribe. */
export declare function subscribeTabAnim(fn: (mode: TabAnimMode) => void): () => void;
/** Load the stored mode once. */
export declare function loadTabAnimMode(): void;
/** Persist the chosen mode. */
export declare function saveTabAnimMode(mode: string): void;
