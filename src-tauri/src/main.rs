mod workspace;

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![workspace::discover_workspace])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
