/**
 * Storage utilities using Tauri's filesystem API.
 *
 * All data is stored as JSON files under the OS AppData directory:
 *   macOS:   ~/Library/Application Support/com.floatcalc.app/floatcalc/
 *   Windows: %APPDATA%\com.floatcalc.app\floatcalc\
 *
 * Files:
 *   history.json  – CalculationEntry[]
 *   folders.json  – Folder[]
 *   settings.json – AppSettings
 */

import {
  readTextFile,
  writeTextFile,
  createDir,
  BaseDirectory,
} from '@tauri-apps/api/fs';
import { AppSettings, CalculationEntry, Folder } from '../types';

const DATA_SUBDIR = 'floatcalc';

/** Ensure the data directory exists (idempotent) */
async function ensureDir(): Promise<void> {
  try {
    await createDir(DATA_SUBDIR, {
      dir: BaseDirectory.AppData,
      recursive: true,
    });
  } catch {
    // Directory already exists – safe to ignore
  }
}

/** Read and parse a JSON file from AppData, returns null if missing/corrupt */
async function readJSON<T>(filename: string): Promise<T | null> {
  await ensureDir();
  try {
    const text = await readTextFile(`${DATA_SUBDIR}/${filename}`, {
      dir: BaseDirectory.AppData,
    });
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Serialize and write a JSON file to AppData */
async function writeJSON<T>(filename: string, data: T): Promise<void> {
  await ensureDir();
  await writeTextFile(
    `${DATA_SUBDIR}/${filename}`,
    JSON.stringify(data, null, 2),
    { dir: BaseDirectory.AppData }
  );
}

// --- Public API ---

export const loadHistory = (): Promise<CalculationEntry[] | null> =>
  readJSON<CalculationEntry[]>('history.json');

export const saveHistory = (data: CalculationEntry[]): Promise<void> =>
  writeJSON('history.json', data);

export const loadFolders = (): Promise<Folder[] | null> =>
  readJSON<Folder[]>('folders.json');

export const saveFolders = (data: Folder[]): Promise<void> =>
  writeJSON('folders.json', data);

export const loadSettings = (): Promise<AppSettings | null> =>
  readJSON<AppSettings>('settings.json');

export const saveSettings = (data: AppSettings): Promise<void> =>
  writeJSON('settings.json', data);
