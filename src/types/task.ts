export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada';
export type TaskPriority = 'baja' | 'media' | 'alta';
export type AlertType = '24_hours' | '12_hours' | 'manual_test';

export interface Task {
  id: string;
  title: string;
  course_id: string;
  course_name: string;
  deadline: string; // ISO 8601 string: YYYY-MM-DDTHH:mm:ss
  status: TaskStatus;
  priority: TaskPriority;
  description?: string;
  tags?: string[];
  notified_24h: number; // 0 = false, 1 = true
  notified_12h: number; // 0 = false, 1 = true
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  semester: string;
  color: string;
}

export interface NotificationLog {
  id: string;
  task_id: string;
  task_title: string;
  alert_type: AlertType;
  triggered_at: string;
}

export interface TaskStats {
  total: number;
  pendientes: number;
  enProgreso: number;
  completadas: number;
  urgentes12h: number;
  alerta24h: number;
  vencidas: number;
}
