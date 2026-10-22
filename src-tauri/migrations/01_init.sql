-- =========================================================================
-- TaskEngine Tauri - Esquema SQLite para Ingeniería de Sistemas
-- =========================================================================

-- Tabla de Cursos de la Carrera de Ingeniería de Sistemas
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    semester TEXT,
    color TEXT DEFAULT '#38bdf8',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Principal de Tareas Universitarias
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
    notified_24h INTEGER DEFAULT 0, -- 0 = no enviada, 1 = enviada (1 día antes)
    notified_12h INTEGER DEFAULT 0, -- 0 = no enviada, 1 = enviada (12 horas antes)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
);

-- Índices de alto rendimiento para consultas por fecha de vencimiento y estado
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_course ON tasks(course_id);

-- Registro de Auditoría de Notificaciones Enviadas
CREATE TABLE IF NOT EXISTS notification_logs (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    task_title TEXT NOT NULL,
    alert_type TEXT CHECK(alert_type IN ('24_hours', '12_hours', 'manual_test')),
    triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
);

-- Cursos Iniciales Semilla (Semestre 2026 - Ingeniería de Sistemas)
INSERT OR IGNORE INTO courses (id, name, code, semester, color) VALUES
('c1', 'Arquitectura de Software', 'IS-501', '8vo Semestre', '#38bdf8'),
('c2', 'Algoritmos y Estructuras de Datos', 'IS-202', '4to Semestre', '#a855f7'),
('c3', 'Base de Datos Distribuidas', 'IS-403', '7mo Semestre', '#10b981'),
('c4', 'Redes y Comunicaciones II', 'IS-404', '7mo Semestre', '#f59e0b'),
('c5', 'Inteligencia Artificial y Machine Learning', 'IS-601', '9no Semestre', '#ec4899'),
('c6', 'Sistemas Operativos', 'IS-303', '5to Semestre', '#6366f1'),
('c7', 'Seguridad de la Información', 'IS-505', '8vo Semestre', '#ef4444');
