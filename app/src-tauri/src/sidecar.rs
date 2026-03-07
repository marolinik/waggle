use std::sync::Mutex;
use tauri::State;

/// Tracks whether the Node.js sidecar process is running.
pub struct SidecarState {
    running: Mutex<bool>,
}

impl SidecarState {
    pub fn new() -> Self {
        SidecarState {
            running: Mutex::new(false),
        }
    }
}

/// Start the Node.js sidecar process.
/// Stub: will be implemented in Task 1.2 / 1.3.
#[tauri::command]
pub async fn start_sidecar(state: State<'_, SidecarState>) -> Result<String, String> {
    let mut running = state.running.lock().map_err(|e| e.to_string())?;
    if *running {
        return Err("Sidecar is already running".into());
    }
    *running = true;
    Ok("Sidecar started (stub)".into())
}

/// Send a JSON-RPC message to the sidecar.
/// Stub: will be implemented in Task 1.3.
#[tauri::command]
pub async fn send_to_sidecar(
    state: State<'_, SidecarState>,
    message: String,
) -> Result<String, String> {
    let running = state.running.lock().map_err(|e| e.to_string())?;
    if !*running {
        return Err("Sidecar is not running".into());
    }
    // Stub: echo back the message
    Ok(format!("Echo (stub): {}", message))
}

/// Stop the Node.js sidecar process.
/// Stub: will be implemented in Task 1.2 / 1.3.
#[tauri::command]
pub async fn stop_sidecar(state: State<'_, SidecarState>) -> Result<String, String> {
    let mut running = state.running.lock().map_err(|e| e.to_string())?;
    if !*running {
        return Err("Sidecar is not running".into());
    }
    *running = false;
    Ok("Sidecar stopped (stub)".into())
}
