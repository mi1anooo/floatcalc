#!/usr/bin/env python3
"""Apply FloatCalc appearance patch v2.

Run from the project root:
    python scripts/apply_theme_background_patch_v2.py

This version is intentionally direct because the first patch could be unzipped
without changing the app UI. It overwrites SettingsDrawer.tsx and patches the
other files in-place.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path.cwd()


def read(path: str) -> str:
    p = ROOT / path
    if not p.exists():
        raise SystemExit(f"Missing {path}. Run this from the FloatCalc project root.")
    return p.read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    backup = p.with_suffix(p.suffix + ".bak-theme-v2")
    if p.exists() and not backup.exists():
        backup.write_text(p.read_text(encoding="utf-8"), encoding="utf-8")
    p.write_text(text, encoding="utf-8")


def patch_types() -> None:
    path = "src/types/index.ts"
    text = read(path)
    text = re.sub(
        r"export type AppTheme\s*=\s*[^;]+;",
        "export type AppTheme  = 'night' | 'dark' | 'glass' | 'frosted' | 'image';",
        text,
    )
    if "customBackgroundImage" not in text:
        text = text.replace(
            "  theme:        AppTheme;\n}",
            "  theme:        AppTheme;\n  customBackgroundImage?: string | null;\n}",
        )
    write(path, text)


SETTINGS_DRAWER_TSX = r'''import { ChangeEvent, useRef } from 'react';
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
  regular: { label: 'Regular', desc: 'Full calculator with buttons' },
  compact: { label: 'Compact', desc: 'Display only, keyboard input' },
  history: { label: 'History', desc: 'Calculator + full history' },
};

const CALC_MODE_LABELS: Record<CalcMode, { label: string; desc: string }> = {
  standard: { label: 'Standard', desc: 'Basic arithmetic' },
  scientific: { label: 'Scientific', desc: 'Trig, log, powers' },
  programmer: { label: 'Programmer', desc: 'Bitwise, HEX, BIN' },
};

const THEME_OPTIONS: { value: AppTheme; label: string; desc: string; preview: string }[] = [
  { value: 'night', label: 'Night', desc: 'Deep dark purple', preview: '#1a1a1e' },
  { value: 'dark', label: 'Dark', desc: 'Neutral charcoal grey', preview: '#202020' },
  { value: 'glass', label: 'Glass', desc: 'Transparent tint, no blur', preview: 'linear-gradient(135deg,rgba(80,60,140,0.55),rgba(30,28,60,0.42))' },
  { value: 'frosted', label: 'Frosted Glass', desc: 'Blurred desktop background', preview: 'linear-gradient(135deg,rgba(196,181,253,0.38),rgba(26,26,30,0.52))' },
  { value: 'image', label: 'Image Background', desc: 'Use your own background image', preview: 'linear-gradient(135deg,#2b1b4a,#0f0f14)' },
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

  const handleImageFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.alert('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChangeBackgroundImage(reader.result);
      }
    };
    reader.onerror = () => window.alert('Could not load that image.');
    reader.readAsDataURL(file);
  };

  const previewBackground = (value: AppTheme, fallback: string) => {
    if (value === 'image' && settings.customBackgroundImage) {
      return `linear-gradient(rgba(0,0,0,0.18),rgba(0,0,0,0.18)), url(${settings.customBackgroundImage}) center / cover`;
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
                {settings.theme === theme.value && <span className="drawer__theme-check">✓</span>}
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
'''


def patch_settings_drawer() -> None:
    write("src/components/SettingsDrawer.tsx", SETTINGS_DRAWER_TSX)

    path = "src/components/SettingsDrawer.css"
    text = read(path)
    if "drawer__image-tools" not in text:
        text += r'''

/* Custom background image controls */
.drawer__image-tools {
  display: flex;
  gap: 8px;
  padding: 8px 0 2px;
  flex-wrap: wrap;
}

.drawer__file-input {
  display: none;
}

.drawer__image-btn {
  border: 1px solid var(--border-subtle);
  background: var(--bg-card);
  color: var(--text-primary);
  border-radius: 9px;
  padding: 8px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);
}

.drawer__image-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-focus);
}

.drawer__image-btn:active {
  transform: scale(0.98);
}

.drawer__image-btn--danger {
  color: var(--text-error);
}
'''
    write(path, text)


def patch_app() -> None:
    path = "src/App.tsx"
    text = read(path)

    # Add CSSProperties type to React import.
    if "CSSProperties" not in text.split("\n", 1)[0]:
        text = re.sub(
            r"import \{ ([^}]+) \} from 'react';",
            lambda m: "import { type CSSProperties, " + m.group(1) + " } from 'react';",
            text,
            count=1,
        )

    if "@tauri-apps/api/tauri" not in text:
        text = text.replace(
            "import { appWindow",
            "import { invoke } from '@tauri-apps/api/tauri';\nimport { appWindow",
            1,
        )

    if "customBackgroundImage" not in text:
        text = text.replace(
            "  theme:        'night',\n};",
            "  theme:        'night',\n  customBackgroundImage: null,\n};",
        )

    # Replace theme application block with native frosted toggle.
    theme_block = r'''  // ── Theme application ───────────────────────────────────
  const applyTheme = useCallback((theme: AppTheme) => {
    document.documentElement.setAttribute('data-theme', theme);

    // Native desktop blur should only be active for Frosted Glass.
    // Regular Glass stays transparent/tinted with no desktop blur.
    void invoke('set_frosted_effect', { enabled: theme === 'frosted' }).catch(() => {
      // Keep the UI working even if native blur is unavailable.
    });
  }, []);

'''
    text = re.sub(
        r"  // ── Theme application ─+\n.*?\n\s*// ── Window sizing",
        theme_block + "  // ── Window sizing",
        text,
        flags=re.S,
    )

    theme_handlers = r'''  const handleChangeTheme = useCallback((theme: AppTheme) => {
    applyTheme(theme);
    setSettings((prev) => {
      const u = { ...prev, theme };
      saveSettings(u);
      return u;
    });
  }, [applyTheme]);

  const handleChangeBackgroundImage = useCallback((imageDataUrl: string | null) => {
    setSettings((prev) => {
      const nextTheme: AppTheme = imageDataUrl ? 'image' : (prev.theme === 'image' ? 'night' : prev.theme);
      applyTheme(nextTheme);
      const u = { ...prev, theme: nextTheme, customBackgroundImage: imageDataUrl };
      saveSettings(u);
      return u;
    });
  }, [applyTheme]);'''

    if "handleChangeBackgroundImage" not in text:
        text = re.sub(
            r"  const handleChangeTheme = useCallback\(\(theme: AppTheme\) => \{.*?\n  \}, \[[^\]]*\]\);",
            theme_handlers,
            text,
            flags=re.S,
        )
    else:
        text = re.sub(
            r"  const handleChangeTheme = useCallback\(\(theme: AppTheme\) => \{.*?\n  \}, \[[^\]]*\]\);\n\n  const handleChangeBackgroundImage = useCallback\(.*?\n  \}, \[[^\]]*\]\);",
            theme_handlers,
            text,
            flags=re.S,
        )

    # Add appStyle before return.
    if "--custom-bg-image" not in text:
        text = re.sub(
            r"(\n  // ─+\n  return \(\n\s*<div className=\{`app app--\$\{mode\}`\})>",
            "\n  const appStyle = settings.theme === 'image' && settings.customBackgroundImage\n    ? ({ '--custom-bg-image': `url(\"${settings.customBackgroundImage}\")` } as CSSProperties)\n    : undefined;\n\1 style={appStyle}>",
            text,
            count=1,
        )

    # If regex did not hit, do a simpler replace.
    if "style={appStyle}" not in text and "const appStyle" not in text:
        text = text.replace(
            "  return (\n    <div className={`app app--${mode}`}",
            "  const appStyle = settings.theme === 'image' && settings.customBackgroundImage\n    ? ({ '--custom-bg-image': `url(\"${settings.customBackgroundImage}\")` } as CSSProperties)\n    : undefined;\n\n  return (\n    <div className={`app app--${mode}`} style={appStyle}",
            1,
        )

    # Pass image handler to SettingsDrawer.
    if "onChangeBackgroundImage=" not in text:
        text = text.replace(
            "          onChangeTheme={handleChangeTheme}\n          onHideToTray={handleHideToTray}",
            "          onChangeTheme={handleChangeTheme}\n          onChangeBackgroundImage={handleChangeBackgroundImage}\n          onHideToTray={handleHideToTray}",
        )

    write(path, text)


THEME_CSS = r'''

/* ============================================================
   FloatCalc theme split: Glass vs Frosted Glass vs Image
   ============================================================ */

/* Glass = translucent/tinted only. No native blur. */
[data-theme="glass"] {
  --bg-app: rgba(30, 28, 45, 0.58);
  --bg-display: rgba(10, 10, 20, 0.62);
  --bg-btn: rgba(255, 255, 255, 0.085);
  --bg-btn-op: rgba(120, 80, 255, 0.27);
  --bg-btn-eq: rgba(100, 60, 240, 0.82);
  --bg-btn-clear: rgba(200, 50, 50, 0.22);
  --bg-panel: rgba(20, 18, 35, 0.68);
  --bg-card: rgba(255, 255, 255, 0.065);
  --bg-input: rgba(255, 255, 255, 0.08);
  --bg-drawer: rgba(20, 18, 35, 0.84);
  --border-subtle: rgba(255,255,255,0.12);
  --radius-window: 20px;
  --radius-btn: 12px;
  --radius-card: 12px;
}

[data-theme="glass"] .app {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  background: linear-gradient(180deg, rgba(38, 34, 58, 0.68), rgba(22, 22, 30, 0.56)) !important;
}

[data-theme="glass"] .display,
[data-theme="glass"] .btn-grid__btn,
[data-theme="glass"] .drawer {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* Frosted Glass = native desktop blur plus translucent UI polish. */
[data-theme="frosted"] {
  --bg-app: rgba(26, 26, 30, 0.46);
  --bg-display: rgba(12, 12, 16, 0.58);
  --bg-btn: rgba(255, 255, 255, 0.08);
  --bg-btn-op: rgba(120, 80, 255, 0.25);
  --bg-btn-eq: rgba(100, 60, 240, 0.78);
  --bg-btn-clear: rgba(200, 50, 50, 0.22);
  --bg-hover: rgba(255, 255, 255, 0.13);
  --bg-hover-op: rgba(140, 100, 255, 0.35);
  --bg-hover-eq: rgba(120, 80, 255, 0.85);
  --bg-panel: rgba(22, 22, 26, 0.64);
  --bg-card: rgba(255, 255, 255, 0.075);
  --bg-input: rgba(255, 255, 255, 0.08);
  --bg-drawer: rgba(22, 22, 26, 0.78);
  --text-primary: rgba(240, 235, 255, 0.96);
  --text-secondary: rgba(180, 170, 210, 0.72);
  --text-result: rgba(200, 180, 255, 0.94);
  --text-operator: rgba(180, 150, 255, 0.92);
  --border-subtle: rgba(255, 255, 255, 0.14);
  --border-focus: rgba(160,120,255,0.6);
  --radius-window: 20px;
  --radius-btn: 12px;
  --radius-card: 12px;
}

[data-theme="frosted"] .app {
  background: linear-gradient(180deg, rgba(34, 32, 48, 0.54), rgba(22, 22, 28, 0.44)) !important;
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.62), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

[data-theme="frosted"] .display,
[data-theme="frosted"] .drawer,
[data-theme="image"] .display,
[data-theme="image"] .drawer {
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

[data-theme="frosted"] .btn-grid__btn,
[data-theme="image"] .btn-grid__btn {
  backdrop-filter: blur(10px) saturate(130%);
  -webkit-backdrop-filter: blur(10px) saturate(130%);
  border: 1px solid rgba(255,255,255,0.08);
}

/* Image Background = user-uploaded image behind the calculator UI. */
[data-theme="image"] {
  --bg-app: rgba(18, 18, 24, 0.52);
  --bg-display: rgba(8, 8, 12, 0.60);
  --bg-btn: rgba(255, 255, 255, 0.10);
  --bg-btn-op: rgba(92, 62, 176, 0.46);
  --bg-btn-eq: rgba(91, 61, 232, 0.88);
  --bg-btn-clear: rgba(112, 42, 42, 0.56);
  --bg-hover: rgba(255, 255, 255, 0.16);
  --bg-hover-op: rgba(124, 89, 220, 0.56);
  --bg-hover-eq: rgba(109, 79, 245, 0.92);
  --bg-panel: rgba(12, 12, 18, 0.58);
  --bg-card: rgba(255,255,255,0.085);
  --bg-input: rgba(0,0,0,0.28);
  --bg-drawer: rgba(15, 15, 22, 0.78);
  --text-primary: rgba(245, 242, 255, 0.98);
  --text-secondary: rgba(213, 204, 235, 0.78);
  --text-result: rgba(214, 198, 255, 0.96);
  --text-operator: rgba(196, 181, 253, 0.96);
  --border-subtle: rgba(255,255,255,0.14);
  --radius-window: 20px;
  --radius-btn: 12px;
  --radius-card: 12px;
}

[data-theme="image"] .app {
  background-image: linear-gradient(180deg, rgba(8,8,12,0.30), rgba(8,8,12,0.68)), var(--custom-bg-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
'''


def patch_css() -> None:
    path = "src/styles/globals.css"
    text = read(path)

    # Remove the invalid standalone custom properties that caused Vite warnings.
    text = re.sub(
        r"/\* Transitions \*/\s*--transition-fast:\s*120ms ease;\s*--transition-smooth:\s*220ms cubic-bezier\(0\.4, 0, 0\.2, 1\);\s*:root",
        "/* Transitions */\n:root",
        text,
        flags=re.S,
    )
    text = text.replace("--transition-fast:   120ms ease;", "--transition-fast: 120ms ease;")

    marker = "FloatCalc theme split: Glass vs Frosted Glass vs Image"
    if marker not in text:
        text += THEME_CSS
    write(path, text)


MAIN_RS = r'''// Prevents additional console window on Windows in release mode.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

#[tauri::command]
fn set_frosted_effect(window: tauri::Window, enabled: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use window_vibrancy::{apply_vibrancy, clear_vibrancy, NSVisualEffectMaterial};

        if enabled {
            apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                .map_err(|error| error.to_string())?;
        } else {
            clear_vibrancy(&window).map_err(|error| error.to_string())?;
        }
    }

    #[cfg(target_os = "windows")]
    {
        use window_vibrancy::{apply_acrylic, apply_blur, clear_acrylic, clear_blur};

        if enabled {
            if apply_acrylic(&window, Some((26, 26, 30, 170))).is_err() {
                apply_blur(&window, Some((26, 26, 30, 150)))
                    .map_err(|error| error.to_string())?;
            }
        } else {
            let _ = clear_acrylic(&window);
            let _ = clear_blur(&window);
        }
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = window;
        let _ = enabled;
    }

    Ok(())
}

fn build_tray() -> SystemTray {
    let show = CustomMenuItem::new("show".to_string(), "Show FloatCalc");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide FloatCalc");
    let sep = SystemTrayMenuItem::Separator;
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");

    let menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(sep)
        .add_item(quit);

    SystemTray::new().with_menu(menu)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![set_frosted_effect])
        .system_tray(build_tray())
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.unminimize();
                }
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "show" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                        let _ = window.unminimize();
                    }
                }
                "hide" => {
                    if let Some(window) = app.get_window("main") {
                        let _ = window.hide();
                    }
                }
                "quit" => {
                    std::process::exit(0);
                }
                _ => {}
            },
            _ => {}
        })
        .on_window_event(|event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event.event() {
                let _ = event.window().hide();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running FloatCalc");
}
'''


def patch_rust() -> None:
    write("src-tauri/src/main.rs", MAIN_RS)

    cargo_path = "src-tauri/Cargo.toml"
    cargo = read(cargo_path)
    if "window-vibrancy" not in cargo:
        cargo = cargo.replace("serde_json = \"1\"\n", "serde_json = \"1\"\nwindow-vibrancy = \"0.4.2\"\n")
    write(cargo_path, cargo)

    conf_path = ROOT / "src-tauri/tauri.conf.json"
    if conf_path.exists():
        conf = json.loads(conf_path.read_text(encoding="utf-8"))
        conf.setdefault("tauri", {}).setdefault("bundle", {})["macOSPrivateApi"] = True
        backup = conf_path.with_suffix(".json.bak-theme-v2")
        if not backup.exists():
            backup.write_text(conf_path.read_text(encoding="utf-8"), encoding="utf-8")
        conf_path.write_text(json.dumps(conf, indent=2) + "\n", encoding="utf-8")


def verify() -> None:
    drawer = read("src/components/SettingsDrawer.tsx")
    types = read("src/types/index.ts")
    app = read("src/App.tsx")
    missing = []
    for needle in ["Frosted Glass", "Image Background", "Upload background image"]:
        if needle not in drawer:
            missing.append(f"SettingsDrawer missing {needle}")
    for needle in ["'frosted'", "'image'", "customBackgroundImage"]:
        if needle not in types:
            missing.append(f"types missing {needle}")
    for needle in ["set_frosted_effect", "onChangeBackgroundImage", "--custom-bg-image"]:
        if needle not in app:
            missing.append(f"App.tsx missing {needle}")

    if missing:
        raise SystemExit("Patch verification failed:\n- " + "\n- ".join(missing))


def main() -> None:
    patch_types()
    patch_settings_drawer()
    patch_app()
    patch_css()
    patch_rust()
    verify()
    print("FloatCalc appearance patch v2 applied successfully.")
    print("You should now see five options: Night, Dark, Glass, Frosted Glass, Image Background.")
    print("Run: npm run tauri dev")


if __name__ == "__main__":
    main()
