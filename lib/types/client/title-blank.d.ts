export interface BlankTitles {
    workspaces: string[];
    sessions: string[];
}
/** Load the stored blank set once (no broadcast; call from apply before render). */
export declare function loadBlankTitles(): void;
/** Current blank set (stable identity until a change). */
export declare function getBlankTitles(): BlankTitles;
/** Subscribe to blank-set changes. */
export declare function subscribeBlankTitles(fn: () => void): () => void;
/** Whether one workspace / session currently renders a blank label. */
export declare function isWorkspaceBlank(id: string): boolean;
export declare function isSessionBlank(id: string): boolean;
/** Blank (true) or restore (false) one workspace label. */
export declare function setWorkspaceBlank(id: string, blank: boolean): void;
/** Blank (true) or restore (false) one session label. */
export declare function setSessionBlank(id: string, blank: boolean): void;
/** React hook over the blank set (re-renders on change). */
export declare function useBlankTitles(): BlankTitles;
