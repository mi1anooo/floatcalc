FloatCalc Theme + Compact Outline Patch v3

This patch fixes two things:
1. The appearance menu still showing the old Liquid Glass option.
2. Compact mode missing the rounded-corner outline.

It also separates the visual modes properly:
- Night
- Dark
- Glass: transparent/tinted, no native blur
- Frosted Glass: native Windows/macOS blur
- Image Background: lets the user upload a custom background image

Install:
1. Stop the dev server if it is running.
2. Unzip this patch into the FloatCalc project root.
   It should overwrite files inside src and src-tauri.
3. Run:

   python scripts/apply_theme_outline_v3_config.py

4. Restart the app:

   npm run tauri dev

5. Build when ready:

   npm run tauri build -- --bundles nsis

Important:
- If the settings panel still says "Liquid Glass", the files did not overwrite the project source.
- Open src/components/SettingsDrawer.tsx and search for "Frosted Glass" to confirm the patch is actually installed.
- Open src/App.css and search for ".app::after" to confirm the compact outline fix is installed.
