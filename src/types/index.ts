/** The three window display modes */
export type AppMode = 'regular' | 'compact' | 'history';

/** A single completed calculation stored in history */
export interface CalculationEntry {
  id: string;
  expression: string;   // e.g. "24 × 7"
  result: string;        // e.g. "168"
  timestamp: number;     // Unix milliseconds
  name?: string;         // Optional user-defined label
  folderId?: string;     // Optional folder assignment
}

/** A user-created folder for organizing history */
export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

/** Persistent app preferences saved to disk */
export interface AppSettings {
  alwaysOnTop: boolean;
  defaultMode: AppMode;
  lastMode: AppMode;
  lastPosition: { x: number; y: number } | null;
}
