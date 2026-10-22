# Guía de escritorio · TaskEngine V1

La [guía principal](README.md) explica el uso cotidiano y la instalación. Este documento describe la integración nativa para desarrollo y mantenimiento.

## Preparación

Instala Node.js 24, Rust estable y los [requisitos oficiales de Tauri](https://v2.tauri.app/start/prerequisites/). En Windows necesitas C++ Build Tools con desarrollo de escritorio y WebView2. Ejecuta desde la raíz del proyecto:

```bash
npm ci
npm run desktop:dev
```

Tauri inicia Vite automáticamente. `devUrl` apunta a `http://localhost:3000`; el servidor usa el puerto 3000 fijo y escucha en la interfaz local. No ejecutes otro Vite en ese puerto al mismo tiempo.

## Responsabilidad de cada capa

- `src/App.tsx`: carga de datos, filtros, selección de vistas y coordinación de acciones.
- `src/db/SQLiteManager.ts`: consultas parametrizadas, persistencia, escritura en serie e importación anterior. Solo el modo web utiliza `localStorage` como almacenamiento principal.
- `src/db/sqlite.ts`: instancia del servicio y datos de ejemplo de la demostración web.
- `src/utils/tauriBridge.ts`: detección del entorno y acceso a módulos oficiales de Tauri. No depende de un objeto global `__TAURI__.notification`.
- `src/services/notificationService.ts`: revisión de plazos, permisos y registro de avisos. Funciona mientras se ejecuta el frontend.
- `src/services/trayService.ts`: ocultar/restaurar la ventana y publicar su estado a React.
- `src-tauri/src/lib.rs`: plugins, migraciones, icono y menú nativos, y comportamiento del cierre.

## SQLite y migraciones

La conexión utiliza `Database.load('sqlite:tasks_university.db')`. Tauri registra las migraciones:

1. `01_init.sql`: cursos, tareas, historial e índices por fecha, estado y curso.
2. `02_local_persistence.sql`: historial independiente de la vida de una tarea y tabla `app_metadata`.

La segunda migración conserva el historial existente. Permite avisos de prueba sin un identificador real de tarea y evita perder los registros al eliminar una entrega.

La inicialización es compartida entre llamadas concurrentes. En el primer arranque nativo se importan, si existen, las claves `taskengine_sqlite_tasks`, `taskengine_sqlite_courses` y `taskengine_sqlite_notif_logs` del mismo WebView. Se marca `legacy_import_v1` solo después de completar la importación. Las claves originales no se eliminan. Una instalación limpia comienza con siete cursos y sin tareas de ejemplo.

La importación cubre el formato generado por la versión anterior; no es una herramienta general para reparar datos manualmente alterados. Si la base o el almacenamiento fallan, la aplicación muestra el error y no cambia silenciosamente a otra base.

No edites las migraciones ya publicadas: agrega una nueva con un número superior y regístrala en Rust. Mantén respaldos antes de migrar datos reales.

## Ventana y bandeja

Hay un único icono creado con `TrayIconBuilder`. Su menú permite mostrar, ocultar y cerrar completamente la aplicación. El botón de cerrar dispara `CloseRequested`, previene la terminación y oculta la ventana. Un clic izquierdo en el icono alterna su visibilidad. El control de maximizar utiliza `toggleMaximize()` y la franja superior incorpora una región para arrastrar.

Ocultar una ventana no crea un servicio del sistema ni permite trabajar con el equipo apagado. El monitoreo depende de que el proceso y el WebView sigan activos.

## Permisos y seguridad

`src-tauri/capabilities/default.json` habilita las operaciones necesarias de ventana, SQL y notificaciones para la ventana `main`. La política CSP de `tauri.conf.json` permite el canal IPC local y las fuentes de Google Fonts, sin permitir la ejecución de scripts remotos.

Las consultas de datos llevan parámetros; la lista de campos actualizables está fijada en código. Los registros del inspector SQL viven en memoria, muestran las últimas 50 consultas nativas y pueden contener títulos de tareas introducidos por el usuario. No se envían a un servidor.

La base no está cifrada. El acceso depende de la cuenta y los permisos del sistema operativo. No almacenes credenciales en tareas ni publiques bases personales en un reporte.

## Compilar y verificar

```bash
npm run lint
npm test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo check --manifest-path src-tauri/Cargo.toml --locked
npm run desktop:build -- --bundles nsis
```

El último comando genera el instalador Windows x64 cuando se ejecuta en ese entorno. El empaquetado de Linux o macOS requiere sus herramientas y pruebas propias. La presencia de iconos de Android/iOS en el proyecto no implica una edición móvil terminada.

## Problemas frecuentes

| Síntoma | Qué revisar |
| --- | --- |
| Puerto 3000 ocupado | Cierra el servidor de desarrollo anterior o la aplicación que usa ese puerto. |
| Falta `link.exe` o herramientas C++ | Revisa los requisitos de compilación de Tauri en Windows. |
| La compilación busca una carpeta antigua | La carpeta `target` procede de otra ubicación. Usa una carpeta nueva con `CARGO_TARGET_DIR` o limpia los artefactos generados antes de recompilar. No borres la carpeta de datos de la aplicación. |
| El navegador no muestra avisos | Revisa si soporta notificaciones y si concediste permiso. Mantén abierta la pestaña. |
| No aparece un aviso en Windows | Revisa permisos y «No molestar»; usa una prueba desde el centro de notificaciones. |
| Cerrar no termina el proceso | Es el comportamiento esperado. Usa **Cerrar Aplicación** en la bandeja. |
| No aparecen las tareas creadas en el navegador | Web y escritorio usan almacenes diferentes. No hay sincronización automática. |
| No se pueden cargar los datos | Conserva un respaldo. Comprueba acceso a la carpeta de datos y evita borrar archivos para «solucionarlo». |

Referencias: [plugin SQL](https://v2.tauri.app/plugin/sql/), [notificaciones](https://v2.tauri.app/plugin/notification/) y [bandeja](https://v2.tauri.app/learn/system-tray/).
