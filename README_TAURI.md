# TaskEngine Tauri - Gestión de Tareas de Ingeniería de Sistemas

Aplicación de escritorio de alto rendimiento construida con **React (Vite) + Tauri v2 + SQLite Local** en modo oscuro, con soporte para minimización en bandeja del sistema (System Tray) y notificaciones nativas programadas para alertar 1 día (24 horas) y 12 horas antes de cada entrega.

---

## 📁 Estructura del Proyecto

```text
taskengine-tauri/
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
└── package.json
```

---

## 🚀 Requisitos Previos

1. **Node.js**: Versión 18 o superior.
2. **Rust & Cargo**: Instálalo desde [https://rustup.rs](https://rustup.rs) (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`).
3. **Dependencias del Sistema**:
   - **Linux (Ubuntu/Debian)**:
     ```bash
     sudo apt update && sudo apt install -y libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libayatana-appindicator3-dev librsvg2-dev
     ```
   - **Windows**: Microsoft C++ Build Tools o Visual Studio Community con "Desktop development with C++".
   - **macOS**: Xcode Command Line Tools (`xcode-select --install`).

---

## 🛠️ Instalación y Puesta en Marcha

### 1. Instalar dependencias npm:
```bash
npm install
npm install @tauri-apps/api @tauri-apps/plugin-sql @tauri-apps/plugin-notification
```

### 2. Ejecutar en modo desarrollo nativo (Desktop):
```bash
npx @tauri-apps/cli dev
# O si tienes tauri-cli global:
cargo tauri dev
```

### 3. Compilar el ejecutable final para tu sistema operativo:
```bash
npx @tauri-apps/cli build
```
El instalador (`.msi` / `.exe` en Windows, `.deb` / `.AppImage` en Linux, `.dmg` en macOS) se generará en `src-tauri/target/release/bundle/`.

---

## 🔔 Reglas de Notificaciones Nativas

El motor de notificaciones monitorea los plazos de entrega (`deadline`) de cada tarea:
1. **Alerta de 1 Día (24 Horas)**: Se dispara automáticamente cuando faltan entre 24 y 12 horas para el vencimiento de una tarea que siga en estado `pendiente` o `en_progreso`.
2. **Alerta de 12 Horas**: Se dispara con prioridad máxima cuando restan 12 horas o menos para el vencimiento.
3. El estado de la alerta se registra en el campo `notified_24h` y `notified_12h` de la tabla SQLite `tasks` para evitar alertas duplicadas.

---

## 🛡️ Minimización a la Bandeja (System Tray)

Al presionar el botón de minimizar o cerrar en la ventana principal, el hook nativo de Tauri intercepta el evento (`WindowEvent::CloseRequested`) y ejecuta:
```rust
api.prevent_close();
window.hide();
```
La aplicación continúa ejecutándose en segundo plano, verificando los plazos de entrega y lanzando las notificaciones nativas en el momento exacto. Al hacer doble clic en el ícono del System Tray o seleccionar "Mostrar", la ventana se restaura al instante.
