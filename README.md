# FloatCalc

A premium floating desktop calculator built with **Tauri + React + TypeScript**.  
Dark-mode only · Always-on-top · Three window modes · Local history with folders.

---

## Prerequisites

Install these once on your machine. End users need **nothing** — they just run the installer.

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| Rust + Cargo | stable | https://rustup.rs |
| Tauri CLI | included in devDeps | via `npm install` |

**macOS only:** Xcode Command Line Tools  
```bash
xcode-select --install
```

**Windows only:** Microsoft C++ Build Tools  
Download from https://visualstudio.microsoft.com/visual-cpp-build-tools/  
Select "Desktop development with C++"

---

## Quick Start (Development)

```bash
# 1. Install Node dependencies
npm install

# 2. Run in development mode (hot-reload)
npm run tauri dev
```

This opens the live app window. Changes to React/CSS files reload instantly.  
Rust changes trigger a Tauri rebuild (takes ~30s the first time, much faster after).

---

## Production Build

```bash
# Build the installer for your current platform
npm run tauri build
```

Output locations:
- **macOS** → `src-tauri/target/release/bundle/dmg/FloatCalc_1.0.0_x64.dmg`
- **Windows** → `src-tauri/target/release/bundle/msi/FloatCalc_1.0.0_x64.msi`
- **Windows exe** → `src-tauri/target/release/bundle/nsis/FloatCalc_1.0.0_x64-setup.exe`

The first build takes 3–8 minutes (compiling Rust). Subsequent builds are much faster.

---

## Cross-Platform Builds

Tauri builds are **platform-native** — you must build macOS on a Mac and Windows on Windows.  
For automated CI builds, use GitHub Actions with Tauri's official workflow:  
https://tauri.app/v1/guides/building/cross-platform

---

## Project Structure

```
floatcalc/
├── src/                        # React frontend
│   ├── components/
│   │   ├── TitleBar.tsx        # Draggable title bar, window controls, mode switcher
│   │   ├── Display.tsx         # Expression + live result preview
│   │   ├── ButtonGrid.tsx      # Calculator button layout
│   │   ├── HistoryPanel.tsx    # Scrollable history with folders, search, rename
│   │   └── SettingsDrawer.tsx  # Slide-up settings overlay
│   ├── utils/
│   │   ├── calculator.ts       # Safe expression evaluator, formatters
│   │   └── storage.ts          # Read/write JSON via Tauri fs API
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── styles/
│   │   └── globals.css         # CSS variables, reset, scrollbar
│   ├── App.tsx                 # Root component — all state lives here
│   ├── App.css                 # Window shell styling
│   └── main.tsx                # ReactDOM entry point
│
├── src-tauri/                  # Rust/Tauri layer
│   ├── src/main.rs             # Minimal Rust entry point
│   ├── tauri.conf.json         # Window config, permissions, bundle settings
│   ├── Cargo.toml              # Rust dependencies
│   └── build.rs                # Tauri build script
│
├── index.html                  # HTML shell
├── vite.config.ts              # Vite bundler config
├── tsconfig.json               # TypeScript config
└── package.json                # Node scripts and dependencies
```

---

## How Always-on-Top Works

Configured in two places:

1. **Default on** — `tauri.conf.json` → `windows[0].alwaysOnTop: true`  
   The window starts on top before any React code runs.

2. **Toggled at runtime** — `App.tsx` calls:
   ```ts
   import { appWindow } from '@tauri-apps/api/window';
   await appWindow.setAlwaysOnTop(true | false);
   ```
   Tauri exposes this as a native OS window flag on both macOS (`NSWindowLevel`) and Windows (`HWND_TOPMOST`).

The current state is saved to `settings.json` and restored on next launch.

---

## How History Storage Works

All data is stored as **local JSON files** — no database, no cloud, no account needed.

| File | Contents |
|------|----------|
| `history.json` | `CalculationEntry[]` — all past calculations |
| `folders.json` | `Folder[]` — user-created folder definitions |
| `settings.json` | `AppSettings` — preferences |

**Location on disk:**
- macOS: `~/Library/Application Support/com.floatcalc.app/floatcalc/`
- Windows: `%APPDATA%\com.floatcalc.app\floatcalc\`

**Write strategy:** Every state change triggers a `saveHistory()` / `saveFolders()` / `saveSettings()` call using Tauri's `writeTextFile` API with `BaseDirectory.AppData`.  
Files are created automatically on first run.

---

## Window Modes

| Mode | Size | Description |
|------|------|-------------|
| **Regular** | 320 × 520 | Full calculator with buttons |
| **Compact** | 320 × 100 | Display-only bar, keyboard input |
| **History** | 480 × 640 | Calculator + full scrollable history |

Mode switching calls `appWindow.setSize(new LogicalSize(w, h))` — Tauri resizes the native OS window instantly. Last mode is saved and restored on relaunch.

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `0–9` | Enter digit |
| `+ - * /` | Operators (/ becomes ÷) |
| `%` | Percentage |
| `.` | Decimal point |
| `^ ` | Power |
| `Enter` or `=` | Calculate result |
| `Backspace` | Delete last character |
| `Escape` | Clear expression |
| `( )` | Parentheses |

---

## Platform Notes

- **Transparent window + rounded corners:** Works natively on macOS. On Windows 11 it works natively. On Windows 10, you may need to enable "Acrylic" or fall back to a solid background — set `"transparent": false` and `"decorations": true` in `tauri.conf.json` if you see issues.
- **App icon:** Replace the placeholder files in `src-tauri/icons/` with real icons before building for distribution. Use `npm run tauri icon path/to/icon.png` to auto-generate all sizes.
- **Code signing:** Required for distribution on macOS (notarization) and Windows (SmartScreen). See https://tauri.app/v1/guides/distribution/sign-macos

---

## Generating App Icons

```bash
# Requires a 1024×1024 PNG source icon
npx tauri icon ./my-icon.png
```

This generates all required sizes in `src-tauri/icons/`.
