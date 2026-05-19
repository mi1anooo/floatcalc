import { appWindow } from '@tauri-apps/api/window';
import { AppMode } from '../types';
import './TitleBar.css';

interface TitleBarProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onMenuOpen: () => void;
}

const MODE_ICONS: Record<AppMode, { icon: string; title: string }> = {
  regular: { icon: '⊞', title: 'Regular mode' },
  compact: { icon: '▬', title: 'Compact mode' },
  history: { icon: '☰', title: 'History mode' },
};

export function TitleBar({ mode, onModeChange, onMenuOpen }: TitleBarProps) {
  const handleMinimize = () => appWindow.minimize();
  const handleClose    = () => appWindow.close();

  return (
    <div className="titlebar" data-tauri-drag-region>
      {/* Window traffic lights */}
      <div className="titlebar__controls">
        <button
          className="titlebar__btn titlebar__btn--close"
          onClick={handleClose}
          title="Close"
        />
        <button
          className="titlebar__btn titlebar__btn--minimize"
          onClick={handleMinimize}
          title="Minimize"
        />
      </div>

      {/* App name - also drag region */}
      <span className="titlebar__title" data-tauri-drag-region>
        FloatCalc
      </span>

      {/* Right side: mode switcher + hamburger */}
      <div className="titlebar__actions">
        {(Object.keys(MODE_ICONS) as AppMode[]).map((m) => (
          <button
            key={m}
            className={`titlebar__mode-btn ${mode === m ? 'active' : ''}`}
            onClick={() => onModeChange(m)}
            title={MODE_ICONS[m].title}
          >
            {MODE_ICONS[m].icon}
          </button>
        ))}
        <button
          className="titlebar__menu-btn"
          onClick={onMenuOpen}
          title="Settings & History"
        >
          <span /><span /><span />
        </button>
      </div>
    </div>
  );
}
