// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod sidecar;
mod tray;

use sidecar::SidecarState;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(SidecarState::new())
        .invoke_handler(tauri::generate_handler![
            sidecar::start_sidecar,
            sidecar::send_to_sidecar,
            sidecar::stop_sidecar,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
