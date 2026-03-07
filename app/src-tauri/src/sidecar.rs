use serde_json::Value;
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, ChildStdout, Command, Stdio};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;
use tauri::State;

pub struct SidecarState {
    pub process: Mutex<Option<Child>>,
    pub reader: Mutex<Option<BufReader<ChildStdout>>>,
    pub next_id: AtomicU64,
}

impl SidecarState {
    pub fn new() -> Self {
        Self {
            process: Mutex::new(None),
            reader: Mutex::new(None),
            next_id: AtomicU64::new(1),
        }
    }
}

#[tauri::command]
pub async fn start_sidecar(
    state: State<'_, SidecarState>,
    mind_path: Option<String>,
) -> Result<String, String> {
    let mut proc = state.process.lock().map_err(|e| e.to_string())?;

    if proc.is_some() {
        return Ok("Sidecar already running".to_string());
    }

    // FIXME: fragile path resolution — depends on cwd being app/src-tauri/
    let sidecar_script = std::env::current_dir()
        .map_err(|e| e.to_string())?
        .parent()
        .ok_or("No parent dir")?
        .parent()
        .ok_or("No grandparent dir")?
        .join("sidecar")
        .join("src")
        .join("main.ts");

    let mut cmd = Command::new("node");
    cmd.arg("--import")
        .arg("tsx")
        .arg(&sidecar_script)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    if let Some(path) = mind_path {
        cmd.env("WAGGLE_MIND_PATH", path);
    }

    let mut child = cmd.spawn().map_err(|e| format!("Failed to spawn sidecar: {}", e))?;

    // Take stdout and wrap in persistent BufReader to avoid data loss
    let stdout = child.stdout.take().ok_or("No stdout")?;
    let buf_reader = BufReader::new(stdout);

    let mut reader_guard = state.reader.lock().map_err(|e| e.to_string())?;
    *reader_guard = Some(buf_reader);

    *proc = Some(child);
    Ok("Sidecar started".to_string())
}

// TODO: blocking I/O with std::sync::Mutex in async fn is a known M1 trade-off.
// For M2, consider tokio::sync::Mutex + async BufReader for proper non-blocking I/O.
#[tauri::command]
pub async fn send_to_sidecar(
    state: State<'_, SidecarState>,
    method: String,
    params: Value,
) -> Result<Value, String> {
    let mut proc_guard = state.process.lock().map_err(|e| e.to_string())?;
    let child = proc_guard.as_mut().ok_or("Sidecar not running")?;

    let id = state.next_id.fetch_add(1, Ordering::SeqCst);
    let request = serde_json::json!({
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
        "id": id
    });

    let stdin = child.stdin.as_mut().ok_or("No stdin")?;
    let line = serde_json::to_string(&request).map_err(|e| e.to_string())?;
    writeln!(stdin, "{}", line).map_err(|e| e.to_string())?;
    stdin.flush().map_err(|e| e.to_string())?;

    let mut reader_guard = state.reader.lock().map_err(|e| e.to_string())?;
    let reader = reader_guard.as_mut().ok_or("No stdout reader")?;
    let mut response_line = String::new();
    reader.read_line(&mut response_line).map_err(|e| e.to_string())?;

    let response: Value = serde_json::from_str(&response_line).map_err(|e| e.to_string())?;
    Ok(response)
}

#[tauri::command]
pub async fn stop_sidecar(state: State<'_, SidecarState>) -> Result<String, String> {
    let mut proc = state.process.lock().map_err(|e| e.to_string())?;
    let mut reader_guard = state.reader.lock().map_err(|e| e.to_string())?;
    *reader_guard = None;
    if let Some(mut child) = proc.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
    Ok("Sidecar stopped".to_string())
}
