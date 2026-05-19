export type AppMode   = 'regular' | 'compact' | 'history';
export type CalcMode  = 'standard' | 'scientific' | 'programmer';
export type AppTheme  = 'night' | 'dark' | 'glass';

export interface CalculationEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  name?: string;
  folderId?: string;
  calcMode?: CalcMode;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface AppSettings {
  alwaysOnTop:  boolean;
  skipTaskbar?: boolean;
  defaultMode:  AppMode;
  lastMode:     AppMode;
  lastPosition: { x: number; y: number } | null;
  calcMode:     CalcMode;
  theme:        AppTheme;
}
