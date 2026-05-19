import { useCallback, useEffect, useRef, useState } from 'react';
import { appWindow } from '@tauri-apps/api/window';

import { AppMode, AppSettings, CalculationEntry, Folder } from './types';
import { evaluate } from './utils/calculator';
import { loadHistory, loadFolders, loadSettings, saveHistory, saveFolders, saveSettings } from './utils/storage';

import { TitleBar }       from './components/TitleBar';
import { Display }        from './components/Display';
import { ButtonGrid }     from './components/ButtonGrid';
import { HistoryPanel }   from './components/HistoryPanel';
import { SettingsDrawer } from './components/SettingsDrawer';

import './styles/globals.css';
import './App.css';

// ─── Window dimensions per mode ─────────────────────────────────────────────
const MODE_SIZE: Record<AppMode, { width: number; height: number }> = {
  regular: { width: 320, height: 520 },
  compact: { width: 320, height: 100 },
  history: { width: 480, height: 640 },
};

// ─── Default settings ────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: AppSettings = {
  alwaysOnTop: true,
  defaultMode: 'regular',
  lastMode: 'regular',
  lastPosition: null,
};

// ─── ID generator ────────────────────────────────────────────────────────────
function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function App() {
  // Calculator state
  const [expression, setExpression] = useState('');
  const [preview,    setPreview]    = useState('');
  const [isError,    setIsError]    = useState(false);

  // App state
  const [mode,        setMode]        = useState<AppMode>('regular');
  const [settings,    setSettings]    = useState<AppSettings>(DEFAULT_SETTINGS);
  const [history,     setHistory]     = useState<CalculationEntry[]>([]);
  const [folders,     setFolders]     = useState<Folder[]>([]);
  const [showMenu,    setShowMenu]    = useState(false);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // ── Load persisted data on mount ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [savedSettings, savedHistory, savedFolders] = await Promise.all([
        loadSettings(),
        loadHistory(),
        loadFolders(),
      ]);

      const resolvedSettings = savedSettings ?? DEFAULT_SETTINGS;
      setSettings(resolvedSettings);
      if (savedHistory) setHistory(savedHistory);
      if (savedFolders) setFolders(savedFolders);

      // Restore mode from last session
      const startMode = resolvedSettings.lastMode ?? resolvedSettings.defaultMode;
      await switchMode(startMode);

      // Restore always-on-top
      await appWindow.setAlwaysOnTop(resolvedSettings.alwaysOnTop);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist history whenever it changes ──────────────────────────────────
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // ── Persist folders whenever they change ─────────────────────────────────
  useEffect(() => {
    saveFolders(folders);
  }, [folders]);

  // ── Switch window mode: resize + remember ─────────────────────────────────
  const switchMode = useCallback(async (newMode: AppMode) => {
    setMode(newMode);
    const { width, height } = MODE_SIZE[newMode];
    await appWindow.setSize({ type: 'Physical', width, height } as never);
    // Tauri v1 API – use LogicalSize
    const { LogicalSize } = await import('@tauri-apps/api/window');
    await appWindow.setSize(new LogicalSize(width, height));

    setSettings((prev) => {
      const next = { ...prev, lastMode: newMode };
      saveSettings(next);
      return next;
    });
  }, []);

  // ── Live preview on expression change ─────────────────────────────────────
  useEffect(() => {
    if (!expression) {
      setPreview('');
      setIsError(false);
      return;
    }
    try {
      const result = evaluate(expression);
      setPreview(result);
      setIsError(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPreview(err.message);
      } else {
        setPreview('Error');
      }
      setIsError(true);
    }
  }, [expression]);

  // ── Calculate final result ─────────────────────────────────────────────────
  const computeResult = useCallback(() => {
    if (!expression || isError) return;
    try {
      const result = evaluate(expression);
      // Save to history
      const entry: CalculationEntry = {
        id: uid(),
        expression,
        result,
        timestamp: Date.now(),
      };
      setHistory((prev) => [entry, ...prev]);
      setExpression(result);
      setPreview('');
    } catch {
      setIsError(true);
      setPreview('Invalid expression');
    }
  }, [expression, isError]);

  // ── Input handlers ─────────────────────────────────────────────────────────
  const handleInput = useCallback((value: string) => {
    if (value === '√') {
      setExpression((prev) => prev + '√(');
    } else {
      setExpression((prev) => prev + value);
    }
  }, []);

  const handleClear  = useCallback(() => { setExpression(''); setPreview(''); setIsError(false); }, []);
  const handleDelete = useCallback(() => setExpression((prev) => prev.slice(0, -1)), []);

  // ── Keyboard input ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      if (e.key >= '0' && e.key <= '9') { handleInput(e.key); return; }
      if (e.key === '+' || e.key === '-') { handleInput(e.key); return; }
      if (e.key === '*') { handleInput('×'); return; }
      if (e.key === '/') { e.preventDefault(); handleInput('÷'); return; }
      if (e.key === '%') { handleInput('%'); return; }
      if (e.key === '.') { handleInput('.'); return; }
      if (e.key === '(' || e.key === ')') { handleInput(e.key); return; }
      if (e.key === '^') { handleInput('^'); return; }
      if (e.key === 'Enter' || e.key === '=') { computeResult(); return; }
      if (e.key === 'Backspace') { handleDelete(); return; }
      if (e.key === 'Escape') { handleClear(); return; }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleInput, handleDelete, handleClear, computeResult]);

  // ── Settings handlers ──────────────────────────────────────────────────────
  const handleToggleAlwaysOnTop = useCallback(async () => {
    const next = !settingsRef.current.alwaysOnTop;
    await appWindow.setAlwaysOnTop(next);
    setSettings((prev) => {
      const updated = { ...prev, alwaysOnTop: next };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const handleChangeDefaultMode = useCallback((defaultMode: AppMode) => {
    setSettings((prev) => {
      const updated = { ...prev, defaultMode };
      saveSettings(updated);
      return updated;
    });
  }, []);

  // ── History handlers ───────────────────────────────────────────────────────
  const handleDeleteEntry = useCallback((id: string) => {
    setHistory((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleRenameEntry = useCallback((id: string, name: string) => {
    setHistory((prev) => prev.map((e) => e.id === id ? { ...e, name } : e));
  }, []);

  const handleAssignFolder = useCallback((id: string, folderId: string | undefined) => {
    setHistory((prev) => prev.map((e) => e.id === id ? { ...e, folderId } : e));
  }, []);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Clear all calculation history?')) {
      setHistory([]);
    }
  }, []);

  // ── Folder handlers ────────────────────────────────────────────────────────
  const handleCreateFolder = useCallback((name: string) => {
    const folder: Folder = { id: uid(), name, createdAt: Date.now() };
    setFolders((prev) => [...prev, folder]);
  }, []);

  const handleDeleteFolder = useCallback((id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    // Move entries out of deleted folder
    setHistory((prev) => prev.map((e) => e.folderId === id ? { ...e, folderId: undefined } : e));
  }, []);

  const handleRenameFolder = useCallback((id: string, name: string) => {
    setFolders((prev) => prev.map((f) => f.id === id ? { ...f, name } : f));
  }, []);

  const handleLoadEntry = useCallback((entry: CalculationEntry) => {
    setExpression(entry.result);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`app app--${mode}`}>
      {/* Always-visible title bar */}
      <TitleBar
        mode={mode}
        onModeChange={switchMode}
        onMenuOpen={() => setShowMenu(true)}
      />

      {/* Display – visible in all modes */}
      <Display
        expression={expression}
        preview={preview}
        isError={isError}
        compact={mode === 'compact'}
      />

      {/* Button grid – regular + history modes only */}
      {mode !== 'compact' && (
        <ButtonGrid
          onInput={handleInput}
          onClear={handleClear}
          onDelete={handleDelete}
          onEquals={computeResult}
        />
      )}

      {/* History panel – history mode only */}
      {mode === 'history' && (
        <HistoryPanel
          history={history}
          folders={folders}
          onDelete={handleDeleteEntry}
          onRename={handleRenameEntry}
          onAssignFolder={handleAssignFolder}
          onClearAll={handleClearAll}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
          onRenameFolder={handleRenameFolder}
          onLoadEntry={handleLoadEntry}
        />
      )}

      {/* Settings drawer overlay */}
      {showMenu && (
        <SettingsDrawer
          settings={settings}
          onClose={() => setShowMenu(false)}
          onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
          onChangeDefaultMode={handleChangeDefaultMode}
        />
      )}
    </div>
  );
}
