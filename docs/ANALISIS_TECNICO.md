# Análisis técnico de TaskEngine Tauri · V1

Revisión del 22 de octubre de 2026. Alcance: archivos de aplicación React/TypeScript, estilos, configuración npm/Vite/TypeScript, capa de datos, servicios, código Rust, migraciones, permisos, empaquetado y documentación. Los iconos se revisaron como recursos del proyecto. Se excluyen del análisis de código las dependencias de terceros y los artefactos generados.

## Evaluación general

El producto es un gestor local de tareas, con una interfaz React y una capa nativa Tauri. No tiene un backend HTTP ni necesita un servidor remoto. SQLite cumple el papel de persistencia de escritorio y los plugins de Tauri conectan con el sistema operativo.

La versión recibida tenía una interfaz funcional, pero varias capacidades anunciadas por la documentación estaban simuladas o desconectadas. Para preparar la V1 se alineó el comportamiento con lo que se muestra y documenta.

## Hallazgos y correcciones

| Prioridad | Hallazgo en la base recibida | Resultado en V1 |
| --- | --- | --- |
| Alta | El servicio llamado SQLite solo leía y escribía `localStorage`. | Conexión efectiva a SQLite mediante el plugin SQL en escritorio; modo web identificado explícitamente. |
| Alta | Las APIs nativas buscaban objetos globales no configurados. | Importaciones de módulos oficiales para ventana y notificaciones. |
| Alta | Se marcaban avisos como enviados aunque faltase permiso. | Solo se consumen banderas al aceptar el envío por la API. No se garantiza presentación por el sistema. |
| Alta | La revisión TypeScript analizaba archivos binarios generados por Rust. | Alcance limitado a fuentes y pruebas; modo estricto habilitado. |
| Alta | Dependencias con alertas de seguridad de npm. | Actualización compatible a Vite 8.3.5 y dependencias transitivas corregidas. `npm audit` informó cero vulnerabilidades al validar la V1. |
| Media | Configuración de bandeja duplicada en JSON y Rust. | Un solo icono con menú nativo. |
| Media | Identificadores basados en milisegundos y escrituras web superpuestas. | UUID y cola de mutaciones por instancia del gestor. |
| Media | El historial exigía una tarea real incluso para avisos de prueba. | Migración que conserva registros y admite pruebas independientes. |
| Media | Crear un curso reiniciaba el formulario de tarea. | Se conserva el contenido y se selecciona el curso nuevo. |
| Media | Cambiar el plazo no reactivaba correctamente todos los avisos. | Reinicio de ambas banderas al cambiar la fecha; conservación de segundos al editar otros campos desde el formulario. |
| Media | Dos comprobaciones simultáneas podían repetir avisos. | Exclusión de comprobaciones superpuestas en el servicio de notificaciones. |
| Media | Los archivos de ejemplo del inspector diferían de las fuentes. | El panel importa los archivos reales con `?raw`. |
| Media | El botón de maximizar no tenía acción y faltaba el canal IPC en CSP. | Control nativo operativo, región de arrastre y permisos explícitos. |
| Baja | Versiones npm, Cargo y Tauri inconsistentes. | Versión 1.0.0 alineada y archivos de bloqueo incluidos. |
| Baja | Dependencias y configuración de IA/Express sin uso. | Eliminación de dependencias directas sin uso y aclaración de que no requiere claves. |
| Baja | README genérico sin explicación de los modos. | Documentación en español, capturas reales, guía de uso y flujo de ramas. |

## Diseño de datos

`SQLiteManager` separa el comportamiento nativo de la demostración. La conexión se inicializa una vez y se comparte entre lectores. Las mutaciones se ejecutan en serie para evitar la pérdida de cambios concurrentes dentro de una instancia.

Las consultas usan parámetros y las columnas de actualización pertenecen a una lista conocida. Un título que contiene comillas o texto parecido a SQL permanece como texto. Las etiquetas se convierten entre arreglos TypeScript y JSON. Los identificadores UUID reducen el riesgo de colisiones durante operaciones rápidas.

El historial conserva hasta 50 registros. La importación anterior es idempotente para el formato esperado y no elimina las claves de origen. Los errores de almacenamiento no sustituyen silenciosamente datos por ejemplos. No hay sincronización entre procesos, dispositivos o almacenes de navegador; el producto está orientado a una sesión de usuario.

## Interfaz y experiencia de uso

El tablero ofrece tres estados con botones de transición. La lista permite consultar más campos y avanzar el estado desde su control. La búsqueda abarca título, descripción, nombre del curso y etiquetas; los filtros y el ordenamiento se aplican en memoria. Los indicadores globales se calculan sobre todas las tareas, no solo sobre el resultado filtrado.

El diseño oscuro funciona como aplicación de escritorio. La V1 no añade arrastrar y soltar, administración completa de cursos, recuperación de eliminaciones ni una evaluación exhaustiva de accesibilidad o dispositivos móviles. Los botones de borrar solicitan confirmación, pero la eliminación posterior es definitiva en la interfaz.

## Recordatorios y límites operativos

La revisión periódica usa un temporizador del frontend de aproximadamente 20 segundos. No hay un planificador residente independiente de la aplicación ni una tarea del sistema operativo. El equipo suspendido, el proceso terminado o las restricciones de pestañas pueden impedir o retrasar comprobaciones.

Los plazos se guardan en ISO y se muestran con el horario local. Una vez vencida una tarea, el sistema la muestra atrasada y no genera alertas retrospectivas. La API puede aceptar una notificación sin que Windows la muestre por sus preferencias. Los registros son un historial de solicitudes aceptadas, no una confirmación de lectura.

Las pruebas cubren los límites y el control de concurrencia del servicio; no certifican todas las condiciones posibles de suspensión, varios procesos abiertos, permisos revocados durante un envío o cambios de fecha concurrentes con una notificación en curso.

## Seguridad y dependencias

- CSP con scripts propios, canal IPC local y fuentes tipográficas externas opcionales.
- Permisos nativos limitados a las operaciones de ventana, SQL y avisos utilizadas por la aplicación.
- Sin servidor Express, claves Gemini ni autenticación remota.
- Bases, archivos de entorno, carpetas de compilación y dependencias excluidos de Git.
- SQLite sin cifrado gestionado por la aplicación; respaldo y protección del equipo siguen siendo responsabilidad del usuario.
- Archivos `package-lock.json` y `Cargo.lock` incluidos para reproducibilidad.

La auditoría automatizada citada es la de **npm**, con el estado del registro en la fecha indicada. No equivale a una auditoría independiente de seguridad. No se ejecutó `cargo audit` ni se afirma ausencia de vulnerabilidades en todas las dependencias Rust.

## Validación

| Comprobación | Alcance |
| --- | --- |
| `npm run lint` | TypeScript estricto de código y pruebas. |
| `npm test` | 12 pruebas de reglas, persistencia, importación, concurrencia y errores. |
| Pruebas con `node:sqlite` | Migraciones reales, consultas parametrizadas y lectura después de cerrar y reabrir un archivo SQLite. El adaptador reproduce la interfaz del plugin; no reemplaza la prueba de Tauri. |
| `npm run build` | Generación de interfaz de producción con Vite. |
| `cargo check` y `cargo fmt --check` | Código Rust, configuración nativa y formato. |
| `npm audit` | Revisión de avisos publicados para el árbol npm. |
| Revisión visual | Tablero, lista, creación de curso/tarea, búsqueda, edición y centro de notificaciones en navegador. |
| Compilación de escritorio | Paquete Windows x64 con NSIS, compilado desde fuentes de la V1. |

La carpeta de compilación original conservaba rutas de otra ubicación del proyecto. Se empleó una carpeta nueva `CARGO_TARGET_DIR` para el empaquetado local. Esta carpeta y el respaldo preventivo de la base anterior están excluidos de Git.

## Trabajo posterior recomendado

1. Exportación y restauración de datos con respaldo verificable antes de operaciones importantes.
2. Administración completa de cursos y papelera para tareas eliminadas.
3. Pruebas de integración de escritorio automatizadas y validación en Linux/macOS.
4. Evaluación de accesibilidad, teclado y tamaños de ventana reducidos.
5. Si se requiere monitoreo con el programa cerrado, diseñar un mecanismo nativo específico y comunicar sus requisitos.
6. Si se añade sincronización, definir autenticación, privacidad, conflictos y seguridad antes de incorporar un servidor.

El autor todavía debe elegir una licencia general de distribución/reutilización. Se han conservado los avisos originales en lugar de atribuir una licencia nueva al proyecto.
