/**
 * Display density: independent controls for the sidebar list and the top
 * session-tab strip, plus an explicit tab-width cap.
 *
 *   sidebar : fontSize, rowHeight
 *   tabs    : tabFontSize, tabHeight, tabWidth (max width of one chip)
 *
 * A pure cosmetic preference, so it lives in browser storage. The values are
 * written to CSS custom properties on <html>; every `.wg*` rule reads them with
 * its original size as the fallback — the default look is unchanged until the
 * user adjusts it. No markup/class names change.
 */
export interface Density {
    /** Sidebar label font size in px. */
    fontSize: number;
    /** Height of one sidebar row (category / project / session) in px. */
    rowHeight: number;
    /** Top tab label font size in px. */
    tabFontSize: number;
    /** Height of the top session-tab strip in px. */
    tabHeight: number;
    /** Max width of one top tab chip in px. */
    tabWidth: number;
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
