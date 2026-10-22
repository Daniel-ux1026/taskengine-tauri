import React, { useState } from 'react';
import { getExecutedQueries, QueryLog } from '../db/sqlite';
import { 
  X, 
  Terminal, 
  Copy, 
  Check, 
  FileCode, 
  FolderTree, 
  Database, 
  Layers, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FILES_DATA: Record<string, { title: string; lang: string; content: string }> = {
  'schema.sql': {
    title: 'Esquema SQLite Local (migrations/01_init.sql)',
    lang: 'sql',
    content: `-- =========================================================================
-- TaskEngine Tauri - Esquema SQLite para Ingeniería de Sistemas
-- =========================================================================

-- 1. Tabla de Cursos Universitarios
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    semester TEXT,
    color TEXT DEFAULT '#38bdf8',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla Principal de Tareas con Estados y Alertas de 24h/12h
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    course_id TEXT NOT NULL,
    course_name TEXT NOT NULL,
    deadline DATETIME NOT NULL,
    status TEXT CHECK(status IN ('pendiente', 'en_progreso', 'completada')) DEFAULT 'pendiente',
    priority TEXT CHECK(priority IN ('baja', 'media', 'alta')) DEFAULT 'media',
    description TEXT,
    tags TEXT DEFAULT '[]',
    notified_24h INTEGER DEFAULT 0, -- 0 = pendiente, 1 = enviada (1 día antes)
    notified_12h INTEGER DEFAULT 0, -- 0 = pendiente, 1 = enviada (12 horas antes)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_course ON tasks(course_id);

-- 3. Tabla de Auditoría de Notificaciones Enviadas
CREATE TABLE IF NOT EXISTS notification_logs (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    task_title TEXT NOT NULL,
    alert_type TEXT CHECK(alert_type IN ('24_hours', '12_hours', 'manual_test')),
    triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
);`,
  },
  'Cargo.toml': {
    title: 'Dependencias Rust (src-tauri/Cargo.toml)',
    lang: 'toml',
    content: `[package]
name = "taskengine-tauri"
version = "0.1.0"
description = "Gestor local de tareas universitarias con SQLite y System Tray"
authors = ["Ingeniería de Sistemas"]
edition = "2021"

[lib]
name = "taskengine_tauri_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2.0", features = [] }

[dependencies]
tauri = { version = "2.0", features = ["tray-icon"] }
tauri-plugin-sql = { version = "2.0", features = ["sqlite"] }
tauri-plugin-notification = "2.0"
tauri-plugin-process = "2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
chrono = { version = "0.4", features = ["serde"] }
tokio = { version = "1.0", features = ["full"] }`,
  },
  'tauri.conf.json': {
    title: 'Configuración Tauri v2 (src-tauri/tauri.conf.json)',
    lang: 'json',
    content: `{
  "$schema": "https://raw.githubusercontent.com/tauri-apps/tauri/dev/tooling/cli/schema.json",
  "productName": "TaskEngine Tauri",
  "version": "1.0.0",
  "identifier": "com.sistemas.taskengine",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:3000",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "TaskEngine - Ingeniería de Sistemas",
        "width": 1280,
        "height": 840,
        "minWidth": 960,
        "minHeight": 640,
        "resizable": true,
        "decorations": false,
        "theme": "Dark"
      }
    ],
    "trayIcon": {
      "iconPath": "icons/icon.png",
      "tooltip": "TaskEngine - Tareas Universitarias (En segundo plano)"
    }
  },
  "plugins": {
    "sql": {
      "preload": ["sqlite:tasks_university.db"]
    },
    "notification": {}
  }
}`,
  },
  'lib.rs': {
    title: 'Backend Rust & System Tray (src-tauri/src/lib.rs)',
    lang: 'rust',
    content: `// =========================================================================
// TaskEngine Tauri - Configuración Rust con System Tray y Migraciones SQLite
// =========================================================================

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};
use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_schema",
            sql: include_str!("../migrations/01_init.sql"),
            kind: MigrationKind::Up,
        }
    ];

    tauri::Builder::default()
        // 1. Inicialización del plugin de SQLite Local
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:tasks_university.db", migrations)
                .build(),
        )
        // 2. Plugin de Notificaciones del Sistema Operativo
        .plugin(tauri_plugin_notification::init())
        // 3. Configuración del System Tray (Bandeja del Sistema)
        .setup(|app| {
            let show_i = MenuItem::with_id(app, "show", "Mostrar TaskEngine", true, None::<&str>)?;
            let hide_i = MenuItem::with_id(app, "hide", "Minimizar a la Bandeja", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Cerrar Aplicación", true, None::<&str>)?;
            let tray_menu = Menu::with_items(app, &[&show_i, &hide_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("TaskEngine - Ejecutándose en segundo plano")
                .menu(&tray_menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(w) = app.get_webview_window("main") {
                            let _ = w.hide();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        // 4. Interceptar evento de cierre para ocultar a bandeja en lugar de matar proceso
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close();
                let _ = window.hide();
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("Error al iniciar TaskEngine Tauri");
}`,
  },
  'capabilities.json': {
    title: 'Permisos de Seguridad Tauri v2 (src-tauri/capabilities/default.json)',
    lang: 'json',
    content: `{
  "$schema": "https://raw.githubusercontent.com/tauri-apps/tauri/dev/tooling/cli/schema.json",
  "identifier": "default",
  "description": "Permisos para SQLite, Notificaciones y Ventana",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-hide",
    "core:window:allow-show",
    "core:window:allow-close",
    "sql:default",
    "sql:allow-execute",
    "sql:allow-select",
    "notification:default",
    "notification:allow-notify"
  ]
}`,
  },
};

export const TauriArchitectureModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'files' | 'structure' | 'guide' | 'queries'>('files');
  const [selectedFile, setSelectedFile] = useState<string>('schema.sql');
  const [copied, setCopied] = useState(false);
  const [queries, setQueries] = useState<QueryLog[]>([]);

  if (!isOpen) return null;

  const currentFile = FILES_DATA[selectedFile];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShowQueries = () => {
    setActiveTab('queries');
    setQueries(getExecutedQueries());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg">
              <Terminal className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">
                Arquitectura de Código: React + Tauri v2 + SQLite Local
              </h2>
              <p className="text-xs text-neutral-400">
                Archivos nativos generados listos para compilar en Windows, Linux y macOS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-neutral-800 bg-neutral-950/60 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('files')}
              className={`py-3 px-3 border-b-2 font-medium transition-colors ${
                activeTab === 'files'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Archivos de Configuración
            </button>
            <button
              onClick={() => setActiveTab('structure')}
              className={`py-3 px-3 border-b-2 font-medium transition-colors ${
                activeTab === 'structure'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Estructura de Carpetas
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`py-3 px-3 border-b-2 font-medium transition-colors ${
                activeTab === 'guide'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Guía de Arranque Rápido
            </button>
            <button
              onClick={handleShowQueries}
              className={`py-3 px-3 border-b-2 font-medium transition-colors ${
                activeTab === 'queries'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Inspector de Consultas SQLite
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'files' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar file list */}
              <div className="w-64 bg-neutral-950 border-r border-neutral-800 p-3 space-y-1 overflow-y-auto">
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider px-2 block mb-2">
                  Archivos de Configuración
                </span>
                {Object.entries(FILES_DATA).map(([key, data]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFile(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      selectedFile === key
                        ? 'bg-neutral-800 text-sky-400 font-medium'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{key}</span>
                    </div>
                    {selectedFile === key && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>

              {/* Code viewer */}
              <div className="flex-1 flex flex-col bg-neutral-900/90 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-950/80">
                  <span className="text-xs font-mono text-neutral-300">{currentFile?.title}</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4 font-mono text-xs text-neutral-200 leading-relaxed">
                  <pre className="whitespace-pre">{currentFile?.content}</pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200">
                Estructura de Directorios del Proyecto
              </h3>
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 font-mono text-xs text-neutral-300 leading-relaxed overflow-x-auto">
                <pre>{`taskengine-tauri/
├── src-tauri/                       # Backend Nativo Rust (Tauri v2)
│   ├── Cargo.toml                   # Dependencias Rust (tauri, tauri-plugin-sql, tauri-plugin-notification)
│   ├── tauri.conf.json              # Configuración de ventana, bandejas (Tray) y permisos
│   ├── capabilities/
│   │   └── default.json             # Reglas de seguridad Tauri v2 (IPC, SQLite, Notificaciones)
│   ├── migrations/
│   │   └── 01_init.sql              # Esquema SQLite inicial con cursos y tareas
│   └── src/
│       ├── lib.rs                   # Configuración del System Tray, hooks de ventana y plugins
│       └── main.rs                  # Punto de entrada de la aplicación binaria
├── src/                             # Frontend React + TypeScript
│   ├── db/
│   │   ├── sqlite.ts                # Capa de abstracción SQLite (Tauri IPC + fallback Web persistente)
│   │   └── schema.sql               # Referencia del esquema SQL
│   ├── services/
│   │   ├── notificationService.ts   # Motor de alertas nativas a 24h y 12h
│   │   └── trayService.ts           # Control de bandeja del sistema y ejecución en segundo plano
│   ├── types/
│   │   └── task.ts                  # Modelos de TypeScript (Task, Course, NotificationLog)
│   ├── components/                  # Componentes modulares con Tailwind CSS
│   │   ├── Header.tsx               # Barra de título desktop con controles de ventana
│   │   ├── TaskBoard.tsx            # Vista tipo tablero Kanban
│   │   ├── TaskList.tsx             # Vista tipo tabla/lista de alta densidad
│   │   ├── TaskModal.tsx            # Formulario CRUD con validaciones y fechas
│   │   ├── NotificationCenter.tsx   # Panel de auditoría de notificaciones y alertas de 24h/12h
│   │   ├── SystemTraySimulator.tsx  # Control interactivo de bandeja y segundo plano
│   │   └── TauriProjectViewer.tsx   # Visualizador y exportador de archivos nativos
│   ├── App.tsx                      # Orquestador principal
│   └── main.tsx                     # Montaje de React
└── package.json`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-neutral-300">
              <h3 className="text-sm font-semibold text-neutral-100">
                Puesta en Marcha en tu Máquina Local
              </h3>

              <div className="space-y-2">
                <span className="font-semibold text-sky-400">Paso 1: Clonar o descargar el proyecto</span>
                <p className="text-neutral-400">Todos los archivos generados en esta sesión ya se encuentran en el repositorio actual.</p>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-sky-400">Paso 2: Instalar plugins de Tauri</span>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono text-neutral-200">
                  npm install @tauri-apps/api @tauri-apps/plugin-sql @tauri-apps/plugin-notification
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-sky-400">Paso 3: Ejecutar en modo desarrollo nativo</span>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono text-neutral-200">
                  npx @tauri-apps/cli dev
                </div>
                <p className="text-neutral-400">
                  Esto levantará la ventana nativa de Tauri en Windows/Linux/macOS con la base de datos local SQLite y el System Tray activo.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-sky-400">Paso 4: Compilar ejecutable de producción (.exe / .dmg / .deb)</span>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono text-neutral-200">
                  npx @tauri-apps/cli build
                </div>
              </div>
            </div>
          )}

          {activeTab === 'queries' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-200">
                    Consultas SQLite Ejecutadas en Vivo
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Registro de todas las operaciones SQL realizadas por la UI sobre el motor SQLite
                  </p>
                </div>
                <button
                  onClick={() => setQueries(getExecutedQueries())}
                  className="px-3 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded"
                >
                  Actualizar
                </button>
              </div>

              <div className="space-y-2">
                {queries.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-neutral-800 rounded-lg text-neutral-500 text-xs">
                    Realiza una acción como crear o editar una tarea para ver las consultas SQL en vivo.
                  </div>
                ) : (
                  queries.map((q) => (
                    <div
                      key={q.id}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 font-mono text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <span className="text-sky-400">SQL QUERY</span>
                        <span>{q.timestamp} · {q.durationMs}ms</span>
                      </div>
                      <div className="text-neutral-200 whitespace-pre-wrap">{q.sql}</div>
                      {q.params.length > 0 && (
                        <div className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-900">
                          Params: {JSON.stringify(q.params)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex justify-between items-center text-xs">
          <span className="text-neutral-500">
            TaskEngine Tauri v2 Architecture Package
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
