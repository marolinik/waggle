use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::State;

pub struct ServiceState {
    pub process: Mutex<Option<Child>>,
    pub port: u16,
}

impl ServiceState {
    pub fn new(port: u16) -> Self {
        Self {
            process: Mutex::new(None),
            port,
        }
    }
}

#[tauri::command]
pub async fn ensure_service(state: State<'_, ServiceState>) -> Result<String, String> {
    let port = state.port;
    let health_url = format!("http://localhost:{}/health", port);

    // Check if service is already running via health check
    match reqwest::get(&health_url).await {
        Ok(resp) if resp.status().is_success() => {
            return Ok("Service already running".to_string());
        }
        _ => {}
    }

    // Start the agent service
    let mut proc = state.process.lock().map_err(|e| e.to_string())?;

    // Use bundled node or system node
    let node_path = std::env::var("WAGGLE_NODE_PATH").unwrap_or_else(|_| "node".to_string());

    // Service script path:
    //   Dev:  ../../packages/server/src/local/service.ts (via tsx)
    //   Prod: resources/service.js (bundled)
    let service_script = if cfg!(debug_assertions) {
        let app_dir = std::env::current_dir().map_err(|e| e.to_string())?;
        let script = app_dir
            .parent()
            .ok_or("no parent")?
            .parent()
            .ok_or("no grandparent")?
            .join("packages")
            .join("server")
            .join("src")
            .join("local")
            .join("service.ts");
        script.to_string_lossy().to_string()
    } else {
        "resources/service.js".to_string()
    };

    let mut cmd = if cfg!(debug_assertions) {
        let mut c = Command::new(&node_path);
        c.arg("--import").arg("tsx").arg(&service_script);
        c
    } else {
        let mut c = Command::new(&node_path);
        c.arg(&service_script);
        c
    };

    cmd.env("WAGGLE_PORT", port.to_string());

    let child = cmd
        .spawn()
        .map_err(|e| format!("Failed to start service: {}", e))?;
    *proc = Some(child);

    // Wait for health check (up to 30 seconds)
    for _ in 0..30 {
        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        match reqwest::get(&health_url).await {
            Ok(resp) if resp.status().is_success() => {
                return Ok("Service started".to_string());
            }
            _ => continue,
        }
    }

    Err("Service failed to start within 30 seconds".to_string())
}

#[tauri::command]
pub async fn stop_service(state: State<'_, ServiceState>) -> Result<String, String> {
    let mut proc = state.process.lock().map_err(|e| e.to_string())?;
    if let Some(mut child) = proc.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
    Ok("Service stopped".to_string())
}

#[tauri::command]
pub async fn get_service_port(state: State<'_, ServiceState>) -> Result<u16, String> {
    Ok(state.port)
}
