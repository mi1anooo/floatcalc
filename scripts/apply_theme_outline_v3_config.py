#!/usr/bin/env python3
"""Small config helper for FloatCalc theme/outline patch v3.

Run from the FloatCalc project root after copying the patch files:
    python scripts/apply_theme_outline_v3_config.py

It only updates src-tauri/tauri.conf.json to enable macOS vibrancy support.
"""
from __future__ import annotations

import json
from pathlib import Path

root = Path.cwd()
config_path = root / "src-tauri" / "tauri.conf.json"
if not config_path.exists() and (root / "floatcalc" / "src-tauri" / "tauri.conf.json").exists():
    root = root / "floatcalc"
    config_path = root / "src-tauri" / "tauri.conf.json"

if not config_path.exists():
    raise SystemExit("Could not find src-tauri/tauri.conf.json. Run this from the FloatCalc project root.")

backup_path = config_path.with_suffix(".json.bak-theme-outline-v3")
if not backup_path.exists():
    backup_path.write_text(config_path.read_text(encoding="utf-8"), encoding="utf-8")

config = json.loads(config_path.read_text(encoding="utf-8"))
config.setdefault("tauri", {}).setdefault("bundle", {})["macOSPrivateApi"] = True
config_path.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")

print("FloatCalc theme/outline v3 config applied.")
print("Enabled tauri.bundle.macOSPrivateApi = true")
print(f"Backup saved to {backup_path}")
