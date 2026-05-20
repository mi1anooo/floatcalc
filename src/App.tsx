import { useCallback, useEffect, useRef, useState } from 'react';
import { appWindow } from '@tauri-apps/api/window';

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

function applyThemeToDom(theme: AppTheme, customBackgroundImage?: string | null) {
  document.documentElement.setAttribute('data-theme', theme);

  if (customBackgroundImage) {
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

  const applyWindowSize = useCallback((m: AppMode, c: CalcMode) => {
    const { width, height } = MODE_SIZE[m][c];

    void import('@tauri-apps/api/window')
      .then(({ LogicalSize }) => appWindow.setSize(new LogicalSize(width, height)))
      .catch((error) => {
        console.warn('Could not resize FloatCalc window:', error);
      });
  }, []);

  // Load persisted data.
  useEffect(() => {
    let mounted = true;

    (async () => {
      const [savedSettings, savedHistory, savedFolders] = await Promise.all([
        loadSettings(), loadHistory(), loadFolders(),
      ]);

      if (!mounted) return;

      const s: AppSettings = { ...DEFAULT_SETTINGS, ...savedSettings };
      setSettings(s);
      if (savedHistory) setHistory(savedHistory);
      if (savedFolders) setFolders(savedFolders);

      const startMode = s.lastMode ?? s.defaultMode;
      setMode(startMode);
      applyWindowSize(startMode, s.calcMode);

      void appWindow.setAlwaysOnTop(s.alwaysOnTop).catch(console.warn);
      if (s.skipTaskbar) void appWindow.setSkipTaskbar(true).catch(console.warn);

      applyThemeToDom(s.theme, s.customBackgroundImage);
    })();

    return () => { mounted = false; };
  }, [applyWindowSize]);

  useEffect(() => { void saveHistory(history); }, [history]);
  useEffect(() => { void saveFolders(folders); }, [folders]);

  const switchMode = useCallback((newMode: AppMode) => {
    const calcMode = settingsRef.current.calcMode;
    setShowMenu(false);
    setMode(newMode);
    applyWindowSize(newMode, calcMode);
    setSettings((prev) => {
      const next = { ...prev, lastMode: newMode };
      void saveSettings(next);
      return next;
    });
  }, [applyWindowSize]);

  const handleMenuOpen = useCallback(() => {
    if (mode === 'compact') {
      modeBeforeSettings.current = 'compact';
      const calcMode = settingsRef.current.calcMode;
      setMode('regular');
      applyWindowSize('regular', calcMode);
    } else {
      modeBeforeSettings.current = null;
    }

    setShowMenu(true);
  }, [mode, applyWindowSize]);

  const handleMenuClose = useCallback(() => {
    setShowMenu(false);

    if (modeBeforeSettings.current === 'compact') {
      modeBeforeSettings.current = null;
      const calcMode = settingsRef.current.calcMode;
      setMode('compact');
      applyWindowSize('compact', calcMode);
      setSettings((prev) => {
        const next = { ...prev, lastMode: 'compact' as AppMode };
        void saveSettings(next);
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
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
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

  const handleToggleAlwaysOnTop = useCallback(() => {
    const next = !settingsRef.current.alwaysOnTop;
    void appWindow.setAlwaysOnTop(next).catch(console.warn);
    setSettings((prev) => { const u = { ...prev, alwaysOnTop: next }; void saveSettings(u); return u; });
  }, []);

  const handleToggleSkipTaskbar = useCallback(() => {
    const next = !(settingsRef.current.skipTaskbar ?? false);
    void appWindow.setSkipTaskbar(next).catch(console.warn);
    setSettings((prev) => { const u = { ...prev, skipTaskbar: next }; void saveSettings(u); return u; });
  }, []);

  const handleHideToTray = useCallback(() => {
    setShowMenu(false);
    void appWindow.hide().catch(console.warn);
  }, []);

  const handleChangeDefaultMode = useCallback((defaultMode: AppMode) => {
    setSettings((prev) => { const u = { ...prev, defaultMode }; void saveSettings(u); return u; });
  }, []);

  const handleChangeCalcMode = useCallback((calcMode: CalcMode) => {
    setSettings((prev) => { const u = { ...prev, calcMode }; void saveSettings(u); return u; });
    applyWindowSize(mode, calcMode);
    setExpression(''); setPreview(''); setIsError(false);
  }, [mode, applyWindowSize]);

  const handleChangeTheme = useCallback((theme: AppTheme) => {
    const currentImage = settingsRef.current.customBackgroundImage ?? null;
    applyThemeToDom(theme, currentImage);
    setSettings((prev) => { const u = { ...prev, theme }; void saveSettings(u); return u; });
  }, []);

  const handleChangeBackgroundImage = useCallback((imageDataUrl: string | null) => {
    const nextTheme: AppTheme = imageDataUrl ? 'image' : 'night';
    applyThemeToDom(nextTheme, imageDataUrl);
    setSettings((prev) => {
      const u = { ...prev, theme: nextTheme, customBackgroundImage: imageDataUrl };
      void saveSettings(u);
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
