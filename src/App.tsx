import { useCallback, useEffect, useRef, useState } from 'react';
import { appWindow } from '@tauri-apps/api/window';

import { AppMode, AppSettings, AppTheme, CalcMode, CalculationEntry, Folder } from './types';
import { evaluate } from './utils/calculator';
import { loadHistory, loadFolders, loadSettings, saveHistory, saveFolders, saveSettings } from './utils/storage';

import { TitleBar }       from './components/TitleBar';
import { Display }        from './components/Display';
import { ButtonGrid }     from './components/ButtonGrid';
import { HistoryPanel }   from './components/HistoryPanel';
import { SettingsDrawer } from './components/SettingsDrawer';

import './styles/globals.css';
import './App.css';

// ── Window dimensions per mode ────────────────────────────────
const MODE_SIZE: Record<AppMode, Record<CalcMode, { width: number; height: number }>> = {
  regular: {
    standard:   { width: 320, height: 510 },
    scientific: { width: 340, height: 630 },
    programmer: { width: 320, height: 590 },
  },
  compact: {
    standard:   { width: 320, height: 96 },
    scientific: { width: 320, height: 96 },
    programmer: { width: 320, height: 96 },
  },
  history: {
    standard:   { width: 480, height: 640 },
    scientific: { width: 480, height: 640 },
    programmer: { width: 480, height: 640 },
  },
};

const DEFAULT_SETTINGS: AppSettings = {
  alwaysOnTop:  true,
  defaultMode:  'regular',
  lastMode:     'regular',
  lastPosition: null,
  calcMode:     'standard',
  theme:        'dark',
};

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function App() {
  const [expression, setExpression] = useState('');
  const [preview,    setPreview]    = useState('');
  const [isError,    setIsError]    = useState(false);

  const [mode,     setMode]     = useState<AppMode>('regular');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [history,  setHistory]  = useState<CalculationEntry[]>([]);
  const [folders,  setFolders]  = useState<Folder[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // ── Load persisted data ───────────────────────────────────
  useEffect(() => {
    (async () => {
      const [savedSettings, savedHistory, savedFolders] = await Promise.all([
        loadSettings(), loadHistory(), loadFolders(),
      ]);
      const s = { ...DEFAULT_SETTINGS, ...savedSettings };
      setSettings(s);
      if (savedHistory) setHistory(savedHistory);
      if (savedFolders) setFolders(savedFolders);

      const startMode = s.lastMode ?? s.defaultMode;
      await applyWindowSize(startMode, s.calcMode);
      setMode(startMode);

      await appWindow.setAlwaysOnTop(s.alwaysOnTop);
      if (s.skipTaskbar !== undefined) {
        await appWindow.setSkipTaskbar(s.skipTaskbar);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { saveHistory(history); }, [history]);
  useEffect(() => { saveFolders(folders); }, [folders]);

  // ── Window sizing ─────────────────────────────────────────
  const applyWindowSize = useCallback(async (m: AppMode, c: CalcMode) => {
    const { LogicalSize } = await import('@tauri-apps/api/window');
    const { width, height } = MODE_SIZE[m][c];
    await appWindow.setSize(new LogicalSize(width, height));
  }, []);

  const switchMode = useCallback(async (newMode: AppMode) => {
    const calcMode = settingsRef.current.calcMode;
    setMode(newMode);
    await applyWindowSize(newMode, calcMode);
    setSettings((prev) => {
      const next = { ...prev, lastMode: newMode };
      saveSettings(next);
      return next;
    });
  }, [applyWindowSize]);

  // ── Live preview ──────────────────────────────────────────
  useEffect(() => {
    if (!expression) { setPreview(''); setIsError(false); return; }
    try {
      setPreview(evaluate(expression));
      setIsError(false);
    } catch (err: unknown) {
      setPreview(err instanceof Error ? err.message : 'Error');
      setIsError(true);
    }
  }, [expression]);

  // ── Compute result ────────────────────────────────────────
  const computeResult = useCallback(() => {
    if (!expression || isError) return;
    try {
      const result = evaluate(expression);
      const entry: CalculationEntry = {
        id: uid(), expression, result, timestamp: Date.now(),
        calcMode: settingsRef.current.calcMode,
      };
      setHistory((prev) => [entry, ...prev]);
      setExpression(result);
      setPreview('');
    } catch { setIsError(true); setPreview('Invalid expression'); }
  }, [expression, isError]);

  // ── Input handlers ────────────────────────────────────────
  const handleInput  = useCallback((v: string) => {
    if (v === '√') { setExpression((p) => p + '√('); return; }
    setExpression((p) => p + v);
  }, []);
  const handleClear  = useCallback(() => { setExpression(''); setPreview(''); setIsError(false); }, []);
  const handleDelete = useCallback(() => setExpression((p) => p.slice(0, -1)), []);

  // ── Keyboard ──────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
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

  // ── Settings handlers ─────────────────────────────────────
  const handleToggleAlwaysOnTop = useCallback(async () => {
    const next = !settingsRef.current.alwaysOnTop;
    await appWindow.setAlwaysOnTop(next);
    setSettings((prev) => { const u = { ...prev, alwaysOnTop: next }; saveSettings(u); return u; });
  }, []);

  const handleToggleSkipTaskbar = useCallback(async () => {
    const next = !(settingsRef.current.skipTaskbar ?? false);
    await appWindow.setSkipTaskbar(next);
    setSettings((prev) => { const u = { ...prev, skipTaskbar: next }; saveSettings(u); return u; });
  }, []);

  const handleHideToTray = useCallback(async () => {
    setShowMenu(false);
    await appWindow.hide();
  }, []);

  const handleChangeDefaultMode = useCallback((defaultMode: AppMode) => {
    setSettings((prev) => { const u = { ...prev, defaultMode }; saveSettings(u); return u; });
  }, []);

  const handleChangeCalcMode = useCallback(async (calcMode: CalcMode) => {
    setSettings((prev) => { const u = { ...prev, calcMode }; saveSettings(u); return u; });
    await applyWindowSize(mode, calcMode);
    setExpression(''); setPreview(''); setIsError(false);
  }, [mode, applyWindowSize]);

  const handleChangeTheme = useCallback((theme: AppTheme) => {
    setSettings((prev) => { const u = { ...prev, theme }; saveSettings(u); return u; });
  }, []);

  // ── History handlers ──────────────────────────────────────
  const handleDeleteEntry  = useCallback((id: string) =>
    setHistory((p) => p.filter((e) => e.id !== id)), []);
  const handleRenameEntry  = useCallback((id: string, name: string) =>
    setHistory((p) => p.map((e) => e.id === id ? { ...e, name } : e)), []);
  const handleAssignFolder = useCallback((id: string, folderId: string | undefined) =>
    setHistory((p) => p.map((e) => e.id === id ? { ...e, folderId } : e)), []);
  const handleClearAll     = useCallback(() => {
    if (window.confirm('Clear all calculation history?')) setHistory([]);
  }, []);
  const handleLoadEntry    = useCallback((entry: CalculationEntry) =>
    setExpression(entry.result), []);

  // ── Folder handlers ───────────────────────────────────────
  const handleCreateFolder = useCallback((name: string) =>
    setFolders((p) => [...p, { id: uid(), name, createdAt: Date.now() }]), []);
  const handleDeleteFolder = useCallback((id: string) => {
    setFolders((p) => p.filter((f) => f.id !== id));
    setHistory((p) => p.map((e) => e.folderId === id ? { ...e, folderId: undefined } : e));
  }, []);
  const handleRenameFolder = useCallback((id: string, name: string) =>
    setFolders((p) => p.map((f) => f.id === id ? { ...f, name } : f)), []);

  // ─────────────────────────────────────────────────────────
  return (
    <div className={`app app--${mode}`}>
      <TitleBar mode={mode} onModeChange={switchMode} onMenuOpen={() => setShowMenu(true)} />

      <Display
        expression={expression}
        preview={preview}
        isError={isError}
        compact={mode === 'compact'}
        calcMode={settings.calcMode}
      />

      {mode !== 'compact' && (
        <ButtonGrid
          onInput={handleInput}
          onClear={handleClear}
          onDelete={handleDelete}
          onEquals={computeResult}
          calcMode={settings.calcMode}
        />
      )}

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

      {showMenu && (
        <SettingsDrawer
          settings={settings}
          onClose={() => setShowMenu(false)}
          onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
          onToggleSkipTaskbar={handleToggleSkipTaskbar}
          onChangeDefaultMode={handleChangeDefaultMode}
          onChangeCalcMode={handleChangeCalcMode}
          onChangeTheme={handleChangeTheme}
          onHideToTray={handleHideToTray}
        />
      )}
    </div>
  );
}
