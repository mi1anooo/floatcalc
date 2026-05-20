import { ChangeEvent, useRef } from 'react';
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
  onChangeBackgroundImage: (imageDataUrl: string | null) => void;
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

const THEME_OPTIONS: { value: AppTheme; label: string; desc: string; preview: string }[] = [
  { value: 'night',   label: 'Night',            desc: 'Deep dark purple',           preview: '#1a1a1e' },
  { value: 'dark',    label: 'Dark',             desc: 'Neutral charcoal grey',      preview: '#202020' },
  { value: 'glass',   label: 'Liquid Glass',     desc: 'Original translucent glass', preview: 'linear-gradient(135deg,rgba(80,60,140,0.5),rgba(30,28,60,0.5))' },
  { value: 'frosted', label: 'Frosted Glass',    desc: 'Native blurred background', preview: 'linear-gradient(135deg,rgba(196,181,253,0.42),rgba(26,26,30,0.50))' },
  { value: 'image',   label: 'Image Background', desc: 'Use your own image',         preview: 'linear-gradient(135deg,#2b1b4a,#0f0f14)' },
];

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


function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Invalid image result'));
    };
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image'));
    image.src = src;
  });
}

async function prepareBackgroundImage(file: File): Promise<string> {
  const rawDataUrl = await readFileAsDataUrl(file);

  // Keep GIF/SVG as-is. Canvas conversion breaks animation/vector data.
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return rawDataUrl;
  }

  const image = await loadImage(rawDataUrl);
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return rawDataUrl;

  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.88);
}

export function SettingsDrawer({
  settings,
  onClose,
  onToggleAlwaysOnTop,
  onToggleSkipTaskbar,
  onChangeDefaultMode,
  onChangeCalcMode,
  onChangeTheme,
  onChangeBackgroundImage,
  onHideToTray,
}: SettingsDrawerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const pickImage = () => fileInputRef.current?.click();

  const handleImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.alert('Please choose an image file.');
      return;
    }

    try {
      const imageDataUrl = await prepareBackgroundImage(file);
      onChangeBackgroundImage(imageDataUrl);
    } catch {
      window.alert('Could not load that image. Try a JPG or PNG file.');
    }
  };

  const previewBackground = (value: AppTheme, fallback: string) => {
    if (value === 'image' && settings.customBackgroundImage) {
      return `linear-gradient(rgba(0,0,0,0.18),rgba(0,0,0,0.18)), url(${JSON.stringify(settings.customBackgroundImage)}) center / cover`;
    }
    return fallback;
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>

        <div className="drawer__header">
          <span className="drawer__title">Settings</span>
          <button className="drawer__close" onClick={onClose}>×</button>
        </div>

        <div className="drawer__body">

          {/* ── Appearance ── */}
          <div className="drawer__section-title">Appearance</div>

          <div className="drawer__theme-grid">
            {THEME_OPTIONS.map((theme) => (
              <button
                key={theme.value}
                className={`drawer__theme-card ${settings.theme === theme.value ? 'active' : ''}`}
                onClick={() => {
                  if (theme.value === 'image' && !settings.customBackgroundImage) {
                    pickImage();
                    return;
                  }
                  onChangeTheme(theme.value);
                }}
              >
                <span
                  className="drawer__theme-swatch"
                  style={{ background: previewBackground(theme.value, theme.preview) }}
                />
                <span className="drawer__theme-info">
                  <span className="drawer__theme-name">{theme.label}</span>
                  <span className="drawer__theme-desc">{theme.desc}</span>
                </span>
                {settings.theme === theme.value && (
                  <span className="drawer__theme-check">✓</span>
                )}
              </button>
            ))}
          </div>

          <div className="drawer__image-tools">
            <input
              ref={fileInputRef}
              className="drawer__file-input"
              type="file"
              accept="image/*"
              onChange={handleImageFile}
            />
            <button className="drawer__image-btn" onClick={pickImage}>
              {settings.customBackgroundImage ? 'Change background image' : 'Upload background image'}
            </button>
            {settings.customBackgroundImage && (
              <button
                className="drawer__image-btn drawer__image-btn--danger"
                onClick={() => onChangeBackgroundImage(null)}
              >
                Remove image
              </button>
            )}
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
