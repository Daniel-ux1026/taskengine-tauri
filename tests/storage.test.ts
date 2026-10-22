import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { readFileSync, mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SQLiteManager, type SqlConnection } from '../src/db/SQLiteManager';

function memoryStorage() {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } });
}
const input = () => ({ title: "Laboratorio 'SQL'", course_id: 'c1', course_name: 'Arquitectura de Software',
  deadline: new Date(Date.now() + 48 * 3600000).toISOString(), status: 'pendiente' as const,
  priority: 'alta' as const, tags: ['Rust', 'SQLite'], description: 'Entrega de prueba' });
function adapter(db: DatabaseSync): SqlConnection {
  return {
    select: async <T>(sql: string, params: unknown[] = []) => db.prepare(sql).all(...params as SQLInputValue[]) as T,
    execute: async (sql: string, params: unknown[] = []) => {
      const result = db.prepare(sql).run(...params as SQLInputValue[]);
      return { rowsAffected: Number(result.changes), lastInsertId: Number(result.lastInsertRowid) };
    },
  };
}
function migrate(db: DatabaseSync) {
  db.exec('PRAGMA foreign_keys = ON');
  for (const file of ['01_init.sql', '02_local_persistence.sql']) {
    db.exec(readFileSync(new URL(`../src-tauri/migrations/${file}`, import.meta.url), 'utf8'));
  }
}
const web = () => new SQLiteManager({ tasks: [], courses: [] }, undefined, () => false);

test('web: las escrituras simultáneas conservan todas las tareas y usan identificadores únicos', async () => {
  memoryStorage();
  const manager = web();
  const tasks = await Promise.all(Array.from({ length: 20 }, () => manager.createTask(input())));
  assert.equal((await manager.getTasks()).length, 20);
  assert.equal(new Set(tasks.map((task) => task.id)).size, 20);
});

test('web: eliminar todas las tareas no repone ejemplos al volver a abrir', async () => {
  memoryStorage();
  const manager = web();
  const task = await manager.createTask(input());
  await manager.deleteTask(task.id);
  assert.deepEqual(await web().getTasks(), []);
});

test('cambiar la fecha reactiva alertas; editar el título conserva las banderas y el ID', async () => {
  memoryStorage();
  const manager = web();
  const task = await manager.createTask(input());
  await manager.updateTask(task.id, { notified_24h: 1, notified_12h: 1 });
  const renamed = await manager.updateTask(task.id, { title: 'Título nuevo', id: 'inmutable' });
  assert.equal(renamed?.id, task.id);
  assert.equal(renamed?.notified_12h, 1);
  const changed = await manager.updateTask(task.id, { deadline: new Date(Date.now() + 3600000).toISOString() });
  assert.equal(changed?.notified_12h, 0);
  assert.equal(changed?.notified_24h, 0);
});

test('SQLite: CRUD parametrizado, etiquetas y persistencia al cerrar y reabrir el archivo', async () => {
  memoryStorage();
  const directory = mkdtempSync(join(tmpdir(), 'taskengine-test-'));
  const filename = join(directory, 'tasks.db');
  let db = new DatabaseSync(filename);
  try {
    migrate(db);
    const manager = new SQLiteManager({ tasks: [], courses: [] }, async () => adapter(db), () => true);
    const [courses, tasks] = await Promise.all([manager.getCourses(), manager.getTasks()]);
    assert.equal(courses.length, 7);
    assert.equal(tasks.length, 0);
    const task = await manager.createTask(input());
    await manager.updateTask(task.id, { title: "Entrega'); DROP TABLE tasks; --", tags: ['SQL seguro'] });
    db.close();
    db = new DatabaseSync(filename);
    const reopened = new SQLiteManager({ tasks: [], courses: [] }, async () => adapter(db), () => true);
    const saved = await reopened.getTasks();
    assert.equal(saved[0].title, "Entrega'); DROP TABLE tasks; --");
    assert.deepEqual(saved[0].tags, ['SQL seguro']);
    await reopened.deleteTask(task.id);
    assert.deepEqual(await reopened.getTasks(), []);
  } finally { db.close(); unlinkSync(filename); rmdirSync(directory); }
});

test('SQLite: importa los datos anteriores una sola vez y conserva las claves de origen', async () => {
  memoryStorage();
  const legacy = { ...input(), id: 'legacy-1', notified_24h: 0, notified_12h: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  localStorage.setItem('taskengine_sqlite_tasks', JSON.stringify([legacy]));
  const db = new DatabaseSync(':memory:');
  try {
    migrate(db);
    const open = () => new SQLiteManager({ tasks: [], courses: [] }, async () => adapter(db), () => true);
    const first = open();
    assert.equal((await first.getTasks())[0].id, 'legacy-1');
    await first.deleteTask('legacy-1');
    assert.deepEqual(await open().getTasks(), []);
    assert.equal(JSON.parse(localStorage.getItem('taskengine_sqlite_tasks')!)[0].id, 'legacy-1');
  } finally { db.close(); }
});

test('SQLite: admite pruebas sin tarea asociada y limita el historial a 50 registros', async () => {
  memoryStorage();
  const db = new DatabaseSync(':memory:');
  try {
    migrate(db);
    const manager = new SQLiteManager({ tasks: [], courses: [] }, async () => adapter(db), () => true);
    await Promise.all(Array.from({ length: 55 }, () => manager.addNotificationLog({ task_id: 'test-12h', task_title: 'Prueba', alert_type: 'manual_test' })));
    assert.equal((await manager.getNotificationLogs()).length, 50);
  } finally { db.close(); }
});

test('un fallo nativo se comunica y no cambia silenciosamente a localStorage', async () => {
  memoryStorage();
  const manager = new SQLiteManager({ tasks: [], courses: [] }, async () => { throw new Error('SQLite no disponible'); }, () => true);
  await assert.rejects(manager.getTasks(), /SQLite no disponible/);
  assert.equal(localStorage.getItem('taskengine_sqlite_tasks'), null);
});

test('datos dañados se conservan y los cursos duplicados se rechazan', async () => {
  memoryStorage();
  const manager = web();
  await manager.createCourse({ name: 'Curso único', code: 'C-1', color: '#ffffff', semester: 'Actual' });
  await assert.rejects(manager.createCourse({ name: 'curso único', code: 'C-2', color: '#ffffff', semester: 'Actual' }));
  localStorage.setItem('taskengine_sqlite_tasks', 'dañado');
  await assert.rejects(manager.getTasks());
  assert.equal(localStorage.getItem('taskengine_sqlite_tasks'), 'dañado');
});
