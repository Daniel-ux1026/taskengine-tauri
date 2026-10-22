# Historial de cambios

## [1.0.0] - 2026-10-22

Primera versión oficial de TaskEngine Tauri.

### Funciones

- Gestión local de tareas universitarias con cursos, prioridades, fechas, descripciones y etiquetas.
- Tablero por estados y lista detallada con búsqueda, filtros y ordenamiento.
- Indicadores de entregas, tareas atrasadas y avance.
- Recordatorios a 24 y 12 horas mientras la aplicación está abierta.
- Ventana de escritorio, icono de bandeja y centro de notificaciones.
- Demostración web con datos de ejemplo y almacenamiento del navegador.

### Correcciones realizadas para publicar la V1

- Conexión efectiva de las tareas, cursos y avisos con SQLite en escritorio.
- Importación única de datos anteriores del mismo WebView, conservando su origen.
- Uso de las APIs de módulos de Tauri para ventana y notificaciones.
- Eliminación del segundo icono de bandeja configurado por duplicado.
- Identificadores UUID, serialización de escrituras y consultas parametrizadas.
- Reactivación de alertas al cambiar una fecha, control de comprobaciones simultáneas y conservación de avisos pendientes sin permiso.
- Conservación del formulario al crear un curso.
- Historial compatible con avisos de prueba, limitado a 50 registros.
- TypeScript estricto con exclusión de artefactos generados por Rust.
- Actualización de dependencias afectadas por los avisos de npm y retirada de dependencias sin uso de IA y servidor.
- Documentación y capturas reales en español, pruebas automatizadas y validación en GitHub Actions.

[1.0.0]: https://github.com/Daniel-ux1026/taskengine-tauri/releases/tag/v1.0.0
