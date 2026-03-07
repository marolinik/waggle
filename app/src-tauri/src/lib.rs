// Tauri 2 requires a lib.rs for the cdylib/staticlib crate types.
// The actual app entry point is main.rs.

mod sidecar;
mod tray;

use sidecar::SidecarState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(SidecarState::new())
        .invoke_handler(tauri::generate_handler![
            sidecar::start_sidecar,
            sidecar::send_to_sidecar,
            sidecar::stop_sidecar,
        ])
        .setup(|app| {
            tray::setup_tray(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
