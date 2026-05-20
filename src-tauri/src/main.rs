// Prevents additional console window on Windows in release mode.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

#[tauri::command]
fn set_window_effect(window: tauri::Window, effect: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use window_vibrancy::{apply_acrylic, apply_blur, clear_blur};

        if effect == "frosted" {
            apply_acrylic(&window, Some((26, 26, 30, 170)))
                .or_else(|_| apply_blur(&window, Some((26, 26, 30, 150))))
                .map_err(|error| error.to_string())?;
        } else {
            clear_blur(&window).map_err(|error| error.to_string())?;
        }
    }

    #[cfg(target_os = "macos")]
    {
        use window_vibrancy::{apply_vibrancy, clear_vibrancy, NSVisualEffectMaterial};

        if effect == "frosted" {
            apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                .map_err(|error| error.to_string())?;
        } else {
            clear_vibrancy(&window).map_err(|error| error.to_string())?;
        }
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        let _ = window;
        let _ = effect;
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
        .invoke_handler(tauri::generate_handler![set_window_effect])
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
