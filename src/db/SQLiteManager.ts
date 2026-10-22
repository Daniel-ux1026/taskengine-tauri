import type Database from '@tauri-apps/plugin-sql';
import type { Task, Course, NotificationLog } from '../types/task';
import { isTauri } from '../utils/tauriBridge';

export type SqlConnection = Pick<Database, 'select' | 'execute'>;
export interface QueryLog {
  id: string;
  sql: string;
  params: unknown[];
  timestamp: string;
  durationMs: number;
}
const queries: QueryLog[] = [];
export const getExecutedQueries = () => [...queries];
const KEYS = { tasks: 'taskengine_sqlite_tasks', courses: 'taskengine_sqlite_courses', logs: 'taskengine_sqlite_notif_logs' };
const COLUMNS = ['id', 'title', 'course_id', 'course_name', 'deadline', 'status', 'priority', 'description', 'tags', 'notified_24h', 'notified_12h', 'created_at', 'updated_at'] as const;
const EDITABLE = COLUMNS.filter((key) => !['id', 'created_at', 'updated_at'].includes(key));

function record(sql: string, params: unknown[] = [], durationMs = 0) {
  queries.unshift({ id: crypto.randomUUID(), sql, params, durationMs, timestamp: new Date().toLocaleTimeString('es-ES') });
  if (queries.length > 50) queries.pop();
}
async function loadNativeDatabase(): Promise<SqlConnection> {
  const { default: Database } = await import('@tauri-apps/plugin-sql');
  return Database.load('sqlite:tasks_university.db');
}

export class SQLiteManager {
  private database: SqlConnection | null = null;
  private initialization: Promise<void> | null = null;
  private mutations: Promise<unknown> = Promise.resolve();

  constructor(
    private samples: { tasks: Task[]; courses: Course[] },
    private loadDatabase = loadNativeDatabase,
    private native = isTauri,
  ) {}

  private read<T>(key: string, fallback: T[]): T[] {
    const raw = localStorage.getItem(key);
    if (raw === null) return structuredClone(fallback);
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('Los datos locales tienen un formato inválido. Conserva una copia antes de repararlos.');
    return data as T[];
  }
  private async select<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const start = performance.now();
    const rows = await this.database!.select<T[]>(sql, params);
    record(sql, params, Math.round((performance.now() - start) * 100) / 100);
    return rows;
  }
  private async execute(sql: string, params: unknown[] = []) {
    const start = performance.now();
    const result = await this.database!.execute(sql, params);
    record(sql, params, Math.round((performance.now() - start) * 100) / 100);
    return result;
  }
  public init(): Promise<void> {
    if (!this.initialization) {
      this.initialization = this.initialize().catch((error) => {
        this.database = null;
        this.initialization = null;
        throw error;
      });
    }
    return this.initialization;
  }
  private async initialize() {
    if (!this.native()) {
      for (const [key, seed] of [[KEYS.tasks, this.samples.tasks], [KEYS.courses, this.samples.courses], [KEYS.logs, []]] as const) {
        if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify(seed));
      }
      record('localStorage: demostración web (sin motor SQLite)');
      return;
    }
    this.database = await this.loadDatabase();
    // Se conservan las claves originales: una importación interrumpida se puede reintentar.
    const imported = await this.select<{ value: string }>("SELECT value FROM app_metadata WHERE key = 'legacy_import_v1'");
    if (imported.length) return;
    for (const course of this.read<Course>(KEYS.courses, [])) {
      await this.execute('INSERT OR IGNORE INTO courses (id, name, code, semester, color) VALUES (?, ?, ?, ?, ?)',
        [course.id, course.name, course.code, course.semester, course.color]);
    }
    for (const task of this.read<Task>(KEYS.tasks, [])) await this.insertTask(task, true);
    for (const log of this.read<NotificationLog>(KEYS.logs, [])) await this.insertLog(log, true);
    await this.execute("INSERT INTO app_metadata (key, value) VALUES ('legacy_import_v1', 'done')");
  }
  private mutate<T>(operation: () => Promise<T>): Promise<T> {
    const next = this.mutations.then(async () => { await this.init(); return operation(); });
    this.mutations = next.catch(() => undefined);
    return next;
  }
  private insertTask(task: Task, ignore = false) {
    return this.execute(`INSERT ${ignore ? 'OR IGNORE ' : ''}INTO tasks (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map(() => '?').join(', ')})`,
      COLUMNS.map((key) => key === 'tags' ? JSON.stringify(task.tags || []) : task[key] ?? ''));
  }
  public async getTasks(): Promise<Task[]> {
    await this.init();
    if (!this.database) return this.read<Task>(KEYS.tasks, []).sort((a, b) => a.deadline.localeCompare(b.deadline));
    const rows = await this.select<Omit<Task, 'tags'> & { tags: string }>('SELECT * FROM tasks ORDER BY deadline ASC');
    return rows.map((row) => ({ ...row, tags: JSON.parse(row.tags || '[]') }));
  }
  public createTask(data: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'notified_24h' | 'notified_12h'>): Promise<Task> {
    return this.mutate(async () => {
      this.validateTask(data);
      const timestamp = new Date().toISOString();
      const task: Task = { ...data, id: crypto.randomUUID(), notified_24h: 0, notified_12h: 0, created_at: timestamp, updated_at: timestamp };
      if (this.database) await this.insertTask(task);
      else localStorage.setItem(KEYS.tasks, JSON.stringify([...await this.getTasks(), task]));
      return task;
    });
  }
  private validateTask(task: Pick<Task, 'title' | 'course_id' | 'deadline' | 'status' | 'priority'>) {
    if (!task.title.trim() || !task.course_id || !Number.isFinite(Date.parse(task.deadline)) ||
      !['pendiente', 'en_progreso', 'completada'].includes(task.status) || !['baja', 'media', 'alta'].includes(task.priority)) {
      throw new Error('Revisa el título, curso, fecha, estado y prioridad de la tarea.');
    }
  }
  public updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    return this.mutate(async () => {
      const tasks = await this.getTasks();
      const index = tasks.findIndex((task) => task.id === id);
      if (index < 0) return null;
      const safe = Object.fromEntries(Object.entries(updates).filter(([key, value]) => EDITABLE.includes(key as typeof EDITABLE[number]) && value !== undefined));
      const task = { ...tasks[index], ...safe, updated_at: new Date().toISOString() } as Task;
      if (task.deadline !== tasks[index].deadline) {
        task.notified_24h = 0;
        task.notified_12h = 0;
        Object.assign(safe, { notified_24h: 0, notified_12h: 0 });
      }
      this.validateTask(task);
      if (this.database) {
        const fields = Object.keys(safe);
        await this.execute(`UPDATE tasks SET ${[...fields.map((key) => `${key} = ?`), 'updated_at = ?'].join(', ')} WHERE id = ?`,
          [...fields.map((key) => key === 'tags' ? JSON.stringify(task.tags || []) : task[key as keyof Task]), task.updated_at, id]);
      } else {
        tasks[index] = task;
        localStorage.setItem(KEYS.tasks, JSON.stringify(tasks));
      }
      return task;
    });
  }
  public deleteTask(id: string): Promise<boolean> {
    return this.mutate(async () => {
      if (this.database) return (await this.execute('DELETE FROM tasks WHERE id = ?', [id])).rowsAffected > 0;
      const tasks = await this.getTasks();
      localStorage.setItem(KEYS.tasks, JSON.stringify(tasks.filter((task) => task.id !== id)));
      return tasks.some((task) => task.id === id);
    });
  }
  public async getCourses(): Promise<Course[]> {
    await this.init();
    return this.database ? this.select<Course>('SELECT id, name, code, semester, color FROM courses ORDER BY name ASC') :
      this.read<Course>(KEYS.courses, []).sort((a, b) => a.name.localeCompare(b.name));
  }
  public createCourse(data: Omit<Course, 'id'>): Promise<Course> {
    return this.mutate(async () => {
      const courses = await this.getCourses();
      if (!data.name.trim() || courses.some((course) => course.name.toLowerCase() === data.name.trim().toLowerCase())) {
        throw new Error('Escribe un nombre de curso nuevo.');
      }
      const course = { ...data, name: data.name.trim(), id: crypto.randomUUID() };
      if (this.database) await this.execute('INSERT INTO courses (id, name, code, semester, color) VALUES (?, ?, ?, ?, ?)',
        [course.id, course.name, course.code, course.semester, course.color]);
      else localStorage.setItem(KEYS.courses, JSON.stringify([...courses, course]));
      return course;
    });
  }
  public async getNotificationLogs(): Promise<NotificationLog[]> {
    await this.init();
    return this.database ? this.select<NotificationLog>('SELECT * FROM notification_logs ORDER BY triggered_at DESC, rowid DESC LIMIT 50') :
      this.read<NotificationLog>(KEYS.logs, []);
  }
  private insertLog(log: NotificationLog, ignore = false) {
    return this.execute(`INSERT ${ignore ? 'OR IGNORE ' : ''}INTO notification_logs (id, task_id, task_title, alert_type, triggered_at) VALUES (?, ?, ?, ?, ?)`,
      [log.id, log.task_id, log.task_title, log.alert_type, log.triggered_at]);
  }
  public addNotificationLog(data: Omit<NotificationLog, 'id' | 'triggered_at'>): Promise<NotificationLog> {
    return this.mutate(async () => {
      const log = { ...data, id: crypto.randomUUID(), triggered_at: new Date().toISOString() };
      if (this.database) {
        await this.insertLog(log);
        await this.execute('DELETE FROM notification_logs WHERE id NOT IN (SELECT id FROM notification_logs ORDER BY triggered_at DESC, rowid DESC LIMIT 50)');
      } else localStorage.setItem(KEYS.logs, JSON.stringify([log, ...await this.getNotificationLogs()].slice(0, 50)));
      return log;
    });
  }
}
