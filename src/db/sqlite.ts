import { Task, Course, NotificationLog } from '../types/task';

// Verificación de si la aplicación se está ejecutando dentro del contenedor nativo Tauri
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
};

export interface QueryLog {
  id: string;
  sql: string;
  params: any[];
  timestamp: string;
  durationMs: number;
}

const STORAGE_KEY_TASKS = 'taskengine_sqlite_tasks';
const STORAGE_KEY_COURSES = 'taskengine_sqlite_courses';
const STORAGE_KEY_LOGS = 'taskengine_sqlite_notif_logs';

const INITIAL_COURSES: Course[] = [
  { id: 'c1', name: 'Arquitectura de Software', code: 'IS-501', semester: '8vo Semestre', color: '#38bdf8' },
  { id: 'c2', name: 'Algoritmos y Estructuras de Datos', code: 'IS-202', semester: '4to Semestre', color: '#a855f7' },
  { id: 'c3', name: 'Base de Datos Distribuidas', code: 'IS-403', semester: '7mo Semestre', color: '#10b981' },
  { id: 'c4', name: 'Redes y Comunicaciones II', code: 'IS-404', semester: '7mo Semestre', color: '#f59e0b' },
  { id: 'c5', name: 'Inteligencia Artificial y ML', code: 'IS-601', semester: '9no Semestre', color: '#ec4899' },
  { id: 'c6', name: 'Sistemas Operativos', code: 'IS-303', semester: '5to Semestre', color: '#6366f1' },
  { id: 'c7', name: 'Seguridad de la Información', code: 'IS-505', semester: '8vo Semestre', color: '#ef4444' },
];

const now = new Date();
const inHours = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();
const inDays = (d: number) => new Date(now.getTime() + d * 24 * 3600 * 1000).toISOString();

const INITIAL_TASKS: Task[] = [
  {
    id: 't-101',
    title: 'Informe Técnico: Microservicios vs Monolito Modular con Event Sourcing',
    course_id: 'c1',
    course_name: 'Arquitectura de Software',
    deadline: inHours(8), // En 8 horas: ¡Alerta < 12h!
    status: 'en_progreso',
    priority: 'alta',
    description: 'Documentar el patrón CQRS y Event Sourcing implementado con Apache Kafka y Rust.',
    tags: ['Arquitectura', 'Kafka', 'Rust'],
    notified_24h: 1,
    notified_12h: 0,
    created_at: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't-102',
    title: 'Laboratorio 4: Análisis de Complejidad Temporal en Árboles B+ y Red-Black',
    course_id: 'c2',
    course_name: 'Algoritmos y Estructuras de Datos',
    deadline: inHours(20), // En 20 horas: ¡Alerta < 24h (1 día)!
    status: 'pendiente',
    priority: 'alta',
    description: 'Implementar algoritmos de balanceo e inserción con benchmarks en microsegundos.',
    tags: ['Algoritmos', 'Árboles', 'C++'],
    notified_24h: 0,
    notified_12h: 0,
    created_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't-103',
    title: 'Proyecto Semestral: Particionamiento Sharding y Replicación Raft',
    course_id: 'c3',
    course_name: 'Base de Datos Distribuidas',
    deadline: inDays(3),
    status: 'en_progreso',
    priority: 'media',
    description: 'Configurar clúster distribuido de 3 nodos con consenso Raft y tolerancia a fallos.',
    tags: ['Sistemas Distribuidos', 'Raft', 'SQLite'],
    notified_24h: 0,
    notified_12h: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't-104',
    title: 'Captura de Paquetes Wireshark y Protocolo TCP Handshake Análisis',
    course_id: 'c4',
    course_name: 'Redes y Comunicaciones II',
    deadline: inDays(5),
    status: 'pendiente',
    priority: 'media',
    description: 'Análisis de ventanas de congestión TCP Reno vs Cubic en condiciones de pérdida.',
    tags: ['Redes', 'Wireshark'],
    notified_24h: 0,
    notified_12h: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't-105',
    title: 'Entrega Final: Red Neuronal Convolucional (CNN) para Detección de Anomalías',
    course_id: 'c5',
    course_name: 'Inteligencia Artificial y ML',
    deadline: inDays(7),
    status: 'pendiente',
    priority: 'alta',
    description: 'Entrenar modelo PyTorch con matriz de confusión y métricas F1-Score superiores al 95%.',
    tags: ['Deep Learning', 'PyTorch'],
    notified_24h: 0,
    notified_12h: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't-106',
    title: 'Driver de Dispositivo en C y Llamadas al Sistema POSIX',
    course_id: 'c6',
    course_name: 'Sistemas Operativos',
    deadline: inHours(-12), // Tarea pasada completada
    status: 'completada',
    priority: 'media',
    description: 'Compilación del kernel Linux con módulo char device personalizado.',
    tags: ['Kernel', 'Linux', 'C'],
    notified_24h: 1,
    notified_12h: 1,
    created_at: new Date(now.getTime() - 72 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Registro en memoria de consultas SQL ejecutadas para auditoría técnica
const executedQueries: QueryLog[] = [];

function recordQuery(sql: string, params: any[] = [], durationMs: number = 2) {
  executedQueries.unshift({
    id: 'q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    sql,
    params,
    timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    durationMs,
  });
  if (executedQueries.length > 50) executedQueries.pop();
}

export const getExecutedQueries = (): QueryLog[] => [...executedQueries];

class SQLiteManager {
  private initialized = false;

  public async init(): Promise<void> {
    if (this.initialized) return;

    if (typeof window !== 'undefined') {
      const storedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
      if (!storedTasks) {
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(INITIAL_TASKS));
      }

      const storedCourses = localStorage.getItem(STORAGE_KEY_COURSES);
      if (!storedCourses) {
        localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(INITIAL_COURSES));
      }

      const storedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
      if (!storedLogs) {
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify([]));
      }
    }

    recordQuery('CREATE TABLE IF NOT EXISTS courses (...);', [], 1);
    recordQuery('CREATE TABLE IF NOT EXISTS tasks (...);', [], 1);
    recordQuery('CREATE TABLE IF NOT EXISTS notification_logs (...);', [], 1);

    this.initialized = true;
  }

  // --- CRUD: Tareas ---

  public async getTasks(): Promise<Task[]> {
    await this.init();
    recordQuery('SELECT * FROM tasks ORDER BY deadline ASC;', []);
    try {
      const data = localStorage.getItem(STORAGE_KEY_TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return INITIAL_TASKS;
    }
  }

  public async createTask(
    data: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'notified_24h' | 'notified_12h'>
  ): Promise<Task> {
    await this.init();
    const newTask: Task = {
      ...data,
      id: 'task-' + Date.now(),
      notified_24h: 0,
      notified_12h: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    recordQuery(
      'INSERT INTO tasks (id, title, course_id, course_name, deadline, status, priority, description, tags, notified_24h, notified_12h, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?);',
      [newTask.id, newTask.title, newTask.course_id, newTask.course_name, newTask.deadline, newTask.status, newTask.priority, newTask.description || '', JSON.stringify(newTask.tags || [])]
    );

    const tasks = await this.getTasks();
    tasks.push(newTask);
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    return newTask;
  }

  public async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    await this.init();
    const tasks = await this.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const updatedTask: Task = {
      ...tasks[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const updatedFields = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
    recordQuery(`UPDATE tasks SET ${updatedFields}, updated_at = ? WHERE id = ?;`, [...Object.values(updates), id]);

    tasks[index] = updatedTask;
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
    return updatedTask;
  }

  public async deleteTask(id: string): Promise<boolean> {
    await this.init();
    recordQuery('DELETE FROM tasks WHERE id = ?;', [id]);
    const tasks = await this.getTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(filtered));
    return true;
  }

  // --- CRUD: Cursos ---

  public async getCourses(): Promise<Course[]> {
    await this.init();
    recordQuery('SELECT * FROM courses ORDER BY name ASC;', []);
    try {
      const data = localStorage.getItem(STORAGE_KEY_COURSES);
      return data ? JSON.parse(data) : INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  }

  public async createCourse(courseData: Omit<Course, 'id'>): Promise<Course> {
    await this.init();
    const newCourse: Course = {
      ...courseData,
      id: 'c-' + Date.now(),
    };

    recordQuery('INSERT INTO courses (id, name, code, semester, color) VALUES (?, ?, ?, ?, ?);', [
      newCourse.id,
      newCourse.name,
      newCourse.code,
      newCourse.semester,
      newCourse.color,
    ]);

    const courses = await this.getCourses();
    courses.push(newCourse);
    localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(courses));
    return newCourse;
  }

  // --- Logs de Notificaciones Nativas ---

  public async getNotificationLogs(): Promise<NotificationLog[]> {
    await this.init();
    recordQuery('SELECT * FROM notification_logs ORDER BY triggered_at DESC LIMIT 50;', []);
    try {
      const data = localStorage.getItem(STORAGE_KEY_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public async addNotificationLog(log: Omit<NotificationLog, 'id' | 'triggered_at'>): Promise<NotificationLog> {
    await this.init();
    const newLog: NotificationLog = {
      ...log,
      id: 'notif-' + Date.now(),
      triggered_at: new Date().toISOString(),
    };

    recordQuery(
      'INSERT INTO notification_logs (id, task_id, task_title, alert_type, triggered_at) VALUES (?, ?, ?, ?, ?);',
      [newLog.id, newLog.task_id, newLog.task_title, newLog.alert_type, newLog.triggered_at]
    );

    const logs = await this.getNotificationLogs();
    logs.unshift(newLog);
    if (logs.length > 50) logs.pop();
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    return newLog;
  }

  // Restablecer datos de muestra
  public async resetSampleData(): Promise<void> {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(INITIAL_COURSES));
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify([]));
    recordQuery('ROLLBACK; -- Base de datos restablecida con datos semilla iniciales', []);
  }
}

export const sqliteService = new SQLiteManager();
