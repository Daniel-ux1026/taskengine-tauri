// =========================================================================
// TaskEngine Tauri - Backend Rust (Tauri v2)
// Gestión de SQLite Local, Bandeja del Sistema (System Tray) y Notificaciones
// =========================================================================

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. Definición de Migraciones SQLite
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_schema",
            sql: include_str!("../migrations/01_init.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "local_persistence_and_notification_history",
            sql: include_str!("../migrations/02_local_persistence.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        // Plugin de SQLite Local
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:tasks_university.db", migrations)
                .build(),
        )
        // Plugin de Notificaciones del Sistema Operativo
        .plugin(tauri_plugin_notification::init())
        // Configuración de la Ventana y el System Tray (Bandeja del Sistema)
        .setup(|app| {
            // Configurar menú de la bandeja
            let show_i = MenuItem::with_id(app, "show", "Mostrar TaskEngine", true, None::<&str>)?;
            let hide_i =
                MenuItem::with_id(app, "hide", "Minimizar a la Bandeja", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Cerrar Aplicación", true, None::<&str>)?;

            let tray_menu = Menu::with_items(app, &[&show_i, &hide_i, &quit_i])?;

            // Construir el Tray Icon
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("TaskEngine - Gestión de Tareas (Ejecutándose en segundo plano)")
                .menu(&tray_menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        // Interceptar el botón de cerrar para minimizar a la bandeja en lugar de matar el proceso
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                // Previene el cierre destructivo y lo oculta a la bandeja
                api.prevent_close();
                let _ = window.hide();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("Error al ejecutar la aplicación TaskEngine Tauri");
}
