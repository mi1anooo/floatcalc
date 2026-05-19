// Prevents additional console window on Windows in release mode.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

fn build_tray() -> SystemTray {
    let show   = CustomMenuItem::new("show".to_string(),   "Show FloatCalc");
    let hide   = CustomMenuItem::new("hide".to_string(),   "Hide FloatCalc");
    let sep    = SystemTrayMenuItem::Separator;
    let quit   = CustomMenuItem::new("quit".to_string(),   "Quit");

    let menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(sep)
        .add_item(quit);

    SystemTray::new().with_menu(menu)
}

fn main() {
    tauri::Builder::default()
        .system_tray(build_tray())
        .on_system_tray_event(|app, event| match event {
            // Left-click tray icon → show & focus window
            SystemTrayEvent::LeftClick { .. } => {
                if let Some(window) = app.get_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.unminimize();
                }
            }
            // Right-click menu items
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
        // Keep app alive when all windows are closed (tray mode)
        .on_window_event(|event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event.event() {
                // Instead of quitting, hide to tray
                event.window().hide().unwrap();
                api.prevent_close();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running FloatCalc");
}
