import { useCallback, useEffect, useRef, useState } from 'react';
import { appWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/tauri';

import { AppMode, AppSettings, AppTheme, CalcMode, CalculationEntry, Folder } from './types';
import { evaluate } from './utils/calculator';
import {
  loadHistory, loadFolders, loadSettings,
  saveHistory, saveFolders, saveSettings,
} from './utils/storage';

import { TitleBar }       from './components/TitleBar';
import { Display }        from './components/Display';
import { ButtonGrid }     from './components/ButtonGrid';
import { HistoryPanel }   from './components/HistoryPanel';
import { SettingsDrawer } from './components/SettingsDrawer';

import './styles/globals.css';
import './App.css';

// Precise window heights per mode × calcMode.
// Compact needs enough room for title bar + display so text does not clip.
const MODE_SIZE: Record<AppMode, Record<CalcMode, { width: number; height: number }>> = {
  regular: {
    standard:   { width: 320, height: 430 },
    scientific: { width: 340, height: 470 },
    programmer: { width: 320, height: 505 },
  },
  compact: {
    standard:   { width: 320, height: 128 },
    scientific: { width: 320, height: 128 },
    programmer: { width: 320, height: 128 },
  },
  history: {
    standard:   { width: 480, height: 640 },
    scientific: { width: 480, height: 640 },
    programmer: { width: 480, height: 640 },
  },
};

const DEFAULT_SETTINGS: AppSettings = {
  alwaysOnTop:  true,
  skipTaskbar:  false,
  defaultMode:  'regular',
  lastMode:     'regular',
  lastPosition: null,
  calcMode:     'standard',
  theme:        'night',
  customBackgroundImage: null,
};

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

let activeNativeWindowEffect: 'none' | 'frosted' = 'none';

async function setNativeWindowEffect(theme: AppTheme) {
  const nextEffect: 'none' | 'frosted' = theme === 'frosted' ? 'frosted' : 'none';

  // Only switch the native effect when the user explicitly changes Frosted Glass on/off.
  // Do not touch native blur while resizing/mode switching.
  if (nextEffect === activeNativeWindowEffect) return;

  try {
    await invoke('set_window_effect', { effect: nextEffect });
    activeNativeWindowEffect = nextEffect;
  } catch {
    // Ignore in browser/dev fallback. The CSS theme still applies.
  }
}

function applyThemeToDom(theme: AppTheme, customBackgroundImage?: string | null) {
  document.documentElement.setAttribute('data-theme', theme);

  if (customBackgroundImage) {
    // JSON.stringify gives CSS url() a safe quoted string, including data URLs.
    document.documentElement.style.setProperty(
      '--custom-bg-image',
      `url(${JSON.stringify(customBackgroundImage)})`
    );
  } else {
    document.documentElement.style.setProperty('--custom-bg-image', 'none');
  }
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

  const modeBeforeSettings = useRef<AppMode | null>(null);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const applyWindowSize = useCallback(async (m: AppMode, c: CalcMode) => {
    const { LogicalSize } = await import('@tauri-apps/api/window');
    const { width, height } = MODE_SIZE[m][c];

    try {
      await appWindow.setSize(new LogicalSize(width, height));
    } catch (error) {
      console.error('Failed to resize FloatCalc window:', error);
    }
  }, []);

  // Load persisted data.
  useEffect(() => {
    (async () => {
      const [savedSettings, savedHistory, savedFolders] = await Promise.all([
        loadSettings(), loadHistory(), loadFolders(),
      ]);

      const s: AppSettings = { ...DEFAULT_SETTINGS, ...savedSettings };
      setSettings(s);
      if (savedHistory) setHistory(savedHistory);
      if (savedFolders) setFolders(savedFolders);

      const startMode = s.lastMode ?? s.defaultMode;
      await applyWindowSize(startMode, s.calcMode);
      setMode(startMode);

      await appWindow.setAlwaysOnTop(s.alwaysOnTop);
      if (s.skipTaskbar) await appWindow.setSkipTaskbar(true);

      applyThemeToDom(s.theme, s.customBackgroundImage);
      await setNativeWindowEffect(s.theme);
    })();
  }, [applyWindowSize]);

  useEffect(() => { saveHistory(history); }, [history]);
  useEffect(() => { saveFolders(folders); }, [folders]);

  const switchMode = useCallback((newMode: AppMode) => {
    const calcMode = settingsRef.current.calcMode;

    // Update React immediately, then resize the native window in the background.
    // This prevents the UI from feeling frozen if Windows takes a moment to resize.
    setMode(newMode);
    void applyWindowSize(newMode, calcMode);

    setSettings((prev) => {
      const next = { ...prev, lastMode: newMode };
      saveSettings(next);
      return next;
    });
  }, [applyWindowSize]);

  const handleMenuOpen = useCallback(() => {
    // Open settings immediately. Do not wait for native window resizing.
    setShowMenu(true);

    if (mode === 'compact') {
      modeBeforeSettings.current = 'compact';
      const calcMode = settingsRef.current.calcMode;
      setMode('regular');
      void applyWindowSize('regular', calcMode);
    } else {
      modeBeforeSettings.current = null;
    }
  }, [mode, applyWindowSize]);

  const handleMenuClose = useCallback(() => {
    setShowMenu(false);

    if (modeBeforeSettings.current === 'compact') {
      modeBeforeSettings.current = null;
      const calcMode = settingsRef.current.calcMode;
      setMode('compact');
      void applyWindowSize('compact', calcMode);
      setSettings((prev) => {
        const next = { ...prev, lastMode: 'compact' as AppMode };
        saveSettings(next);
        return next;
      });
    }
  }, [applyWindowSize]);

  // Live preview.
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

  const handleInput  = useCallback((v: string) => {
    if (v === '√') { setExpression((p) => p + '√('); return; }
    setExpression((p) => p + v);
  }, []);
  const handleClear  = useCallback(() => { setExpression(''); setPreview(''); setIsError(false); }, []);
  const handleDelete = useCallback(() => setExpression((p) => p.slice(0, -1)), []);

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

  const handleChangeCalcMode = useCallback((calcMode: CalcMode) => {
    setSettings((prev) => { const u = { ...prev, calcMode }; saveSettings(u); return u; });
    void applyWindowSize(mode, calcMode);
    setExpression(''); setPreview(''); setIsError(false);
  }, [mode, applyWindowSize]);

  const handleChangeTheme = useCallback(async (theme: AppTheme) => {
    const currentImage = settingsRef.current.customBackgroundImage ?? null;
    applyThemeToDom(theme, currentImage);
    await setNativeWindowEffect(theme);
    setSettings((prev) => { const u = { ...prev, theme }; saveSettings(u); return u; });
  }, []);

  const handleChangeBackgroundImage = useCallback(async (imageDataUrl: string | null) => {
    const nextTheme: AppTheme = imageDataUrl ? 'image' : 'night';
    applyThemeToDom(nextTheme, imageDataUrl);
    await setNativeWindowEffect(nextTheme);
    setSettings((prev) => {
      const u = { ...prev, theme: nextTheme, customBackgroundImage: imageDataUrl };
      saveSettings(u);
      return u;
    });
  }, []);

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

  const handleCreateFolder = useCallback((name: string) =>
    setFolders((p) => [...p, { id: uid(), name, createdAt: Date.now() }]), []);
  const handleDeleteFolder = useCallback((id: string) => {
    setFolders((p) => p.filter((f) => f.id !== id));
    setHistory((p) => p.map((e) => e.folderId === id ? { ...e, folderId: undefined } : e));
  }, []);
  const handleRenameFolder = useCallback((id: string, name: string) =>
    setFolders((p) => p.map((f) => f.id === id ? { ...f, name } : f)), []);

  return (
    <div className={`app app--${mode}`}>
      <TitleBar mode={mode} onModeChange={switchMode} onMenuOpen={handleMenuOpen} />

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
          onClose={handleMenuClose}
          onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
          onToggleSkipTaskbar={handleToggleSkipTaskbar}
          onChangeDefaultMode={handleChangeDefaultMode}
          onChangeCalcMode={handleChangeCalcMode}
          onChangeTheme={handleChangeTheme}
          onChangeBackgroundImage={handleChangeBackgroundImage}
          onHideToTray={handleHideToTray}
        />
      )}
    </div>
  );
}
