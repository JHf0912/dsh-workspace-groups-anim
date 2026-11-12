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
export declare const SIDEBAR_MIN = 264;
export declare const SIDEBAR_MAX = 420;
export declare const SIDEBAR_DEFAULT = 280;
/** First-run value: a little narrower than the shell default. */
export declare const SIDEBAR_COMPACT = 264;
interface LayoutControllerLike {
    panels?: {
        setSidebar?: (px: number) => void;
    };
}
/** Capture a resolver for the layout controller once at apply() time. Resolving
 * lazily means the width still works if the layout service is provided later,
 * and the plugin never hard-depends on it. */
export declare function setLayoutResolver(fn: (() => LayoutControllerLike | null) | null): void;
/** Current preferred width in px. */
export declare function getSidebarWidth(): number;
export declare function initSidebarWidth(): void;
/** Set + persist a width (clamped to the shell's supported range). */
export declare function saveSidebarWidth(px: number): number;
/** Restore the shell default width. */
export declare function resetSidebarWidth(): number;
export {};
