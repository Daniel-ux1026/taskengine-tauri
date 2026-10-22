import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NotificationService } from '../src/services/notificationService';
import type { Task, NotificationLog } from '../src/types/task';

function task(hours: number, status: Task['status'] = 'pendiente'): Task {
  return { id: crypto.randomUUID(), title: 'Entrega', course_id: 'c1', course_name: 'Curso',
    deadline: new Date(Date.now() + hours * 3600000).toISOString(), status, priority: 'alta',
    notified_24h: 0, notified_12h: 0, created_at: '', updated_at: '' };
}
function service(sent = true) {
  const updates: Partial<Task>[] = [];
  const logs: Partial<NotificationLog>[] = [];
  const store = {
    updateTask: async (_id: string, data: Partial<Task>) => { updates.push(data); return null; },
    addNotificationLog: async (log: Omit<NotificationLog, 'id' | 'triggered_at'>) => {
      logs.push(log);
      return { ...log, id: crypto.randomUUID(), triggered_at: new Date().toISOString() };
    },
  };
  const instance = new NotificationService(store);
  instance.dispatchOSNotification = async () => sent;
  return { instance, updates, logs };
}
test('alertas: distingue ventanas de 24h y 12h y omite completadas, vencidas y lejanas', async () => {
  const { instance, logs } = service();
  const result = await instance.checkDeadlines([task(20), task(8), task(6, 'completada'), task(-1), task(40)]);
  assert.equal(result.triggeredCount, 2);
  assert.deepEqual(logs.map((log) => log.alert_type), ['24_hours', '12_hours']);
});
test('alertas: sin entrega al sistema no consume banderas ni añade registros', async () => {
  const { instance, updates, logs } = service(false);
  assert.equal((await instance.checkDeadlines([task(4)])).triggeredCount, 0);
  assert.deepEqual(updates, []);
  assert.deepEqual(logs, []);
});
test('alertas: las comprobaciones superpuestas y repetidas no duplican avisos', async () => {
  const { instance, logs } = service();
  const tasks = [task(5)];
  await Promise.all([instance.checkDeadlines(tasks), instance.checkDeadlines(tasks)]);
  await instance.checkDeadlines(tasks);
  assert.equal(logs.length, 1);
});
test('alertas: exactamente 12 horas entra en el aviso crítico y cero horas ya está vencida', async () => {
  const { instance, logs } = service();
  await instance.checkDeadlines([task(12), task(0)]);
  assert.deepEqual(logs.map((log) => log.alert_type), ['12_hours']);
});
