#!/usr/bin/env python3
"""Config helper for FloatCalc rounded corners + restored glass patch v4.

Run from the FloatCalc project root after copying the patch files:
    python scripts/apply_rounded_glass_restore_v4_config.py

This keeps the Tauri config compatible with native macOS vibrancy/frosted mode.
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

backup_path = config_path.with_suffix(".json.bak-rounded-glass-v4")
if not backup_path.exists():
    backup_path.write_text(config_path.read_text(encoding="utf-8"), encoding="utf-8")

config = json.loads(config_path.read_text(encoding="utf-8"))
config.setdefault("tauri", {}).setdefault("bundle", {})["macOSPrivateApi"] = True
config_path.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")

print("FloatCalc rounded corners + restored glass v4 config applied.")
print("Enabled tauri.bundle.macOSPrivateApi = true")
print(f"Backup saved to {backup_path}")
