import { AppMode, AppSettings, AppTheme, CalcMode } from '../types';
import './SettingsDrawer.css';

interface SettingsDrawerProps {
  settings: AppSettings;
  onClose: () => void;
  onToggleAlwaysOnTop: () => void;
  onToggleSkipTaskbar: () => void;
  onChangeDefaultMode: (mode: AppMode) => void;
  onChangeCalcMode: (mode: CalcMode) => void;
  onChangeTheme: (theme: AppTheme) => void;
  onHideToTray: () => void;
}

const WINDOW_MODE_LABELS: Record<AppMode, { label: string; desc: string }> = {
  regular: { label: 'Regular',  desc: 'Full calculator with buttons' },
  compact: { label: 'Compact',  desc: 'Display only, keyboard input' },
  history: { label: 'History',  desc: 'Calculator + full history' },
};

const CALC_MODE_LABELS: Record<CalcMode, { label: string; desc: string }> = {
  standard:   { label: 'Standard',   desc: 'Basic arithmetic' },
  scientific: { label: 'Scientific', desc: 'Trig, log, powers' },
  programmer: { label: 'Programmer', desc: 'Bitwise, HEX, BIN' },
};

const THEME_LABELS: Record<AppTheme, string> = {
  dark:   'Always dark',
  system: 'Follow system',
};

interface ToggleRowProps {
  label: string;
  hint: string;
  checked: boolean;
  onToggle: () => void;
}
function ToggleRow({ label, hint, checked, onToggle }: ToggleRowProps) {
  return (
    <div className="drawer__row">
      <div className="drawer__row-info">
        <span className="drawer__label">{label}</span>
        <span className="drawer__hint">{hint}</span>
      </div>
      <button
        className={`drawer__toggle ${checked ? 'active' : ''}`}
        onClick={onToggle}
        role="switch"
        aria-checked={checked}
      >
        <span className="drawer__toggle-thumb" />
      </button>
    </div>
  );
}

export function SettingsDrawer({
  settings,
  onClose,
  onToggleAlwaysOnTop,
  onToggleSkipTaskbar,
  onChangeDefaultMode,
  onChangeCalcMode,
  onChangeTheme,
  onHideToTray,
}: SettingsDrawerProps) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="drawer__header">
          <span className="drawer__title">Settings</span>
          <button className="drawer__close" onClick={onClose}>×</button>
        </div>

        <div className="drawer__body">

          {/* ── Appearance ── */}
          <div className="drawer__section-title">Appearance</div>

          <div className="drawer__row">
            <div className="drawer__row-info">
              <span className="drawer__label">Theme</span>
              <span className="drawer__hint">Display colour scheme</span>
            </div>
            <div className="drawer__seg">
              {(Object.keys(THEME_LABELS) as AppTheme[]).map((t) => (
                <button
                  key={t}
                  className={`drawer__seg-btn ${settings.theme === t ? 'active' : ''}`}
                  onClick={() => onChangeTheme(t)}
                >
                  {THEME_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="drawer__divider" />

          {/* ── Window ── */}
          <div className="drawer__section-title">Window</div>

          <ToggleRow
            label="Always on top"
            hint="Float above all other windows"
            checked={settings.alwaysOnTop}
            onToggle={onToggleAlwaysOnTop}
          />

          <ToggleRow
            label="Hide from taskbar"
            hint="Remove from bottom app bar"
            checked={settings.skipTaskbar ?? false}
            onToggle={onToggleSkipTaskbar}
          />

          <div className="drawer__row">
            <button className="drawer__tray-btn" onClick={onHideToTray}>
              <span className="drawer__tray-icon">⬇</span>
              Minimise to system tray
            </button>
          </div>

          <div className="drawer__divider" />

          {/* ── Calculator mode ── */}
          <div className="drawer__section-title">Calculator mode</div>
          {(Object.keys(CALC_MODE_LABELS) as CalcMode[]).map((mode) => (
            <button
              key={mode}
              className={`drawer__mode-option ${settings.calcMode === mode ? 'active' : ''}`}
              onClick={() => onChangeCalcMode(mode)}
            >
              <span className="drawer__mode-dot" />
              <span>
                <span className="drawer__mode-name">{CALC_MODE_LABELS[mode].label}</span>
                <span className="drawer__mode-desc">{CALC_MODE_LABELS[mode].desc}</span>
              </span>
            </button>
          ))}

          <div className="drawer__divider" />

          {/* ── Default launch mode ── */}
          <div className="drawer__section-title">Default launch mode</div>
          {(Object.keys(WINDOW_MODE_LABELS) as AppMode[]).map((mode) => (
            <button
              key={mode}
              className={`drawer__mode-option ${settings.defaultMode === mode ? 'active' : ''}`}
              onClick={() => onChangeDefaultMode(mode)}
            >
              <span className="drawer__mode-dot" />
              <span>
                <span className="drawer__mode-name">{WINDOW_MODE_LABELS[mode].label}</span>
                <span className="drawer__mode-desc">{WINDOW_MODE_LABELS[mode].desc}</span>
              </span>
            </button>
          ))}

        </div>

        <div className="drawer__footer">FloatCalc v1.0.0</div>
      </div>
    </div>
  );
}
