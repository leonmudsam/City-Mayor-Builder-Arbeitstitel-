// Tauri desktop/mobile entry (v0.35). The game is the Vite/React/three.js frontend;
// this only wraps it in a native window. Keep it thin — all game logic stays in
// TypeScript so the same simulation runs on web and desktop (and later mobile).
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
