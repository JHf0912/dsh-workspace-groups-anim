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
    fontSize: number;
    /** Height of one sidebar row (category / project / session) in px. */
    rowHeight: number;
    /** Height of the top session-tab strip in px. */
    tabHeight: number;
}
/** Current density. */
export declare function getDensity(): Density;
/** Subscribe to density changes; returns an unsubscribe. */
export declare function subscribeDensity(fn: (d: Density) => void): () => void;
/** Push the density onto <html> as CSS custom properties. */
export declare function applyDensity(d?: Density): void;
/** Merge a patch into the live density and apply it; broadcasts to subscribers. */
export declare function setDensity(patch: Partial<Density>): Density;
/** Like setDensity, but also persists to localStorage. */
export declare function saveDensity(patch: Partial<Density>): Density;
/** Load the stored density once and apply it. */
export declare function loadDensity(): void;
/** Restore defaults and persist. */
export declare function resetDensity(): Density;
