-- Los avisos de prueba y el historial sobreviven a la eliminación de una tarea.
CREATE TABLE notification_logs_v2 (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    task_title TEXT NOT NULL,
    alert_type TEXT CHECK(alert_type IN ('24_hours', '12_hours', 'manual_test')),
    triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO notification_logs_v2 SELECT * FROM notification_logs;
DROP TABLE notification_logs;
ALTER TABLE notification_logs_v2 RENAME TO notification_logs;

CREATE TABLE app_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
