# Contribuir a TaskEngine

## Organización de ramas

- `main`: código oficial y terminado. La V1 se identifica con `v1.0.0`.
- `dev`: desarrollo activo; puede contener cambios incompletos.
- Para trabajos extensos puedes crear ramas como `feat/exportar-tareas` a partir de `dev` y abrir un PR hacia `dev`.

No subas trabajo incompleto a `main`. Al empezar una tarea:

```bash
git switch dev
git pull --ff-only origin dev
```

## Commits en español

Mantén un propósito claro por commit. Los prefijos convencionales ayudan a clasificar el cambio; el mensaje se escribe en español.

```text
feat: permitir exportar las tareas a un archivo
fix: conservar las etiquetas al editar una entrega
docs: explicar cómo activar los recordatorios
test: comprobar los límites de las alertas
chore: actualizar las dependencias de desarrollo
```

Revisa los archivos antes de guardarlos en Git:

```bash
git status
git diff
git add ruta/del/archivo
git commit -m "fix: describir el problema resuelto"
git push origin dev
```

No incluyas bases de datos personales, claves, archivos `.env`, `node_modules`, `dist` ni carpetas `target` de Cargo. Los cambios de esquema deben usar una **migración nueva**; no modifiques migraciones que ya se hayan distribuido.

## Pasar trabajo terminado a main

Antes del PR de `dev` hacia `main`:

```bash
npm ci
npm run lint
npm test
npm run build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo check --manifest-path src-tauri/Cargo.toml --locked
```

Prueba también la ventana nativa, las operaciones afectadas, el reinicio y la bandeja. Si cambian las notificaciones, compruébalas en un equipo con permiso del sistema. Las pruebas automáticas de reglas no sustituyen la comprobación de presentación del aviso en Windows.

En GitHub, abre el PR con base `main` y rama de comparación `dev`. Explica el problema, el resultado y cómo lo verificaste. Espera que la validación automática termine correctamente y revisa el código antes de integrar.

Después de integrar, sincroniza `dev`:

```bash
git switch main
git pull --ff-only origin main
git switch dev
git merge main
git push origin dev
```

No uses `git push --force` en las ramas compartidas para sincronizarlas.

## Publicar otra versión

Actualiza la misma versión en `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` y el indicador de `Header.tsx`; actualiza los archivos de bloqueo y `CHANGELOG.md`. Compila y prueba desde `main` una vez integrado el trabajo. Crea una etiqueta `vX.Y.Z` y una publicación con notas en español y los instaladores verificados.

Como orientación: `1.0.1` corrige errores compatibles; `1.1.0` añade funciones compatibles; `2.0.0` introduce cambios incompatibles. No cambies ni reutilices una etiqueta de una versión ya distribuida.
