import { AppMode, AppSettings } from '../types';
import './SettingsDrawer.css';

interface SettingsDrawerProps {
  settings: AppSettings;
  onClose: () => void;
  onToggleAlwaysOnTop: () => void;
  onChangeDefaultMode: (mode: AppMode) => void;
}

const MODE_LABELS: Record<AppMode, string> = {
  regular: 'Regular calculator',
  compact: 'Compact keyboard-only',
  history: 'Half-screen with history',
};

export function SettingsDrawer({
  settings,
  onClose,
  onToggleAlwaysOnTop,
  onChangeDefaultMode,
}: SettingsDrawerProps) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div
        className="drawer"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer__header">
          <span className="drawer__title">Settings</span>
          <button className="drawer__close" onClick={onClose}>×</button>
        </div>

        <div className="drawer__body">
          {/* Always on top toggle */}
          <div className="drawer__row">
            <div className="drawer__row-info">
              <span className="drawer__label">Always on top</span>
              <span className="drawer__hint">Keep window above all others</span>
            </div>
            <button
              className={`drawer__toggle ${settings.alwaysOnTop ? 'active' : ''}`}
              onClick={onToggleAlwaysOnTop}
              role="switch"
              aria-checked={settings.alwaysOnTop}
            >
              <span className="drawer__toggle-thumb" />
            </button>
          </div>

          <div className="drawer__divider" />

          {/* Default launch mode */}
          <div className="drawer__section-title">Default launch mode</div>
          {(Object.keys(MODE_LABELS) as AppMode[]).map((mode) => (
            <button
              key={mode}
              className={`drawer__mode-option ${settings.defaultMode === mode ? 'active' : ''}`}
              onClick={() => onChangeDefaultMode(mode)}
            >
              <span className="drawer__mode-dot" />
              {MODE_LABELS[mode]}
            </button>
          ))}
        </div>

        <div className="drawer__footer">
          FloatCalc v1.0.0
        </div>
      </div>
    </div>
  );
}
