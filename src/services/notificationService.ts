import { Task, AlertType } from '../types/task';
import { sqliteService } from '../db/sqlite';
import { isTauri, getTauriNotification } from '../utils/tauriBridge';

// Generador de sonido sintético nativo con Web Audio API (evita descargas de audio externas)
export const playNotificationChime = (urgency: 'high' | 'normal' = 'normal') => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';

    if (urgency === 'high') {
      // Tono de urgencia 12h: Doble beep más agudo
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.15);
      osc2.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
    } else {
      // Tono normal 24h: Chime armónico suave
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25); // A5
      osc2.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.25);
    }

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.45);
    osc2.stop(ctx.currentTime + 0.45);
    osc2.onended = () => { void ctx.close(); };
  } catch {
    // Si el navegador bloquea audio antes de interacción de usuario, ignorar silenciosamente
  }
};

export class NotificationService {
  private permissionGranted: boolean = false;
  private intervalId: number | null = null;
  private listeners: Array<() => void> = [];
  private checking: Promise<{ triggeredCount: number }> | null = null;

  constructor(private store: Pick<typeof sqliteService, 'updateTask' | 'addNotificationLog'> = sqliteService) {
    this.checkInitialPermission();
  }

  private checkInitialPermission() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permissionGranted = Notification.permission === 'granted';
    }
  }

  public async requestPermission(): Promise<boolean> {
    try {
      if (isTauri()) {
        const notif = getTauriNotification();
        if (notif && typeof notif.requestPermission === 'function') {
          const req = await notif.requestPermission();
          this.permissionGranted = req === 'granted';
          return this.permissionGranted;
        }
      }

      if (typeof window === 'undefined' || !('Notification' in window)) return false;
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    } catch (e) {
      console.error('Error al solicitar permisos de notificación:', e);
      return false;
    }
  }

  public isPermissionGranted(): boolean {
    if (isTauri()) return this.permissionGranted;
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  }

  public async refreshPermission(): Promise<boolean> {
    const native = getTauriNotification();
    this.permissionGranted = native ? await native.isPermissionGranted() : this.isPermissionGranted();
    return this.permissionGranted;
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb());
  }

  // Despacho de la notificación al Sistema Operativo
  public async dispatchOSNotification(title: string, body: string, urgency: 'high' | 'normal' = 'normal') {
    try {
      if (!await this.refreshPermission()) return false;
      if (isTauri()) {
        const notif = getTauriNotification();
        if (notif && typeof notif.sendNotification === 'function') {
          notif.sendNotification({ title, body });
          playNotificationChime(urgency);
          return true;
        }
      }

      new Notification(title, {
        body,
        tag: title,
        silent: false,
      });
      playNotificationChime(urgency);
      return true;
    } catch (err) {
      console.warn('No se pudo enviar notificación nativa:', err);
      return false;
    }
  }


  // Motor de verificación de tareas: Evalúa las reglas de 24h y 12h
  public checkDeadlines(tasks: Task[]): Promise<{ triggeredCount: number }> {
    if (!this.checking) this.checking = this.evaluateDeadlines(tasks).finally(() => { this.checking = null; });
    return this.checking;
  }

  private async evaluateDeadlines(tasks: Task[]): Promise<{ triggeredCount: number }> {
    const now = Date.now();
    let triggeredCount = 0;

    for (const task of tasks) {
      if (task.status === 'completada') continue;

      const deadlineTime = new Date(task.deadline).getTime();
      const remainingMs = deadlineTime - now;
      const remainingHours = remainingMs / (1000 * 60 * 60);

      // Regla 2: Alerta Crítica de 12 Horas
      if (remainingHours <= 12 && remainingHours > 0 && task.notified_12h === 0) {
        const hoursLeftFormatted = Math.max(0.1, remainingHours).toFixed(1);
        const sent = await this.dispatchOSNotification(
          `🚨 Tarea por Vencer en ${hoursLeftFormatted}h: ${task.title}`,
          `Curso: ${task.course_name} — Quedan menos de 12 horas para la entrega.`,
          'high'
        );
        if (!sent) continue;

        await this.store.updateTask(task.id, { notified_12h: 1, notified_24h: 1 });
        await this.store.addNotificationLog({
          task_id: task.id,
          task_title: task.title,
          alert_type: '12_hours',
        });

        triggeredCount++;
        task.notified_12h = 1;
        task.notified_24h = 1;
      }
      // Regla 1: Alerta Preventiva de 1 Día (24 Horas)
      else if (remainingHours <= 24 && remainingHours > 12 && task.notified_24h === 0) {
        const hoursLeftFormatted = remainingHours.toFixed(1);
        const sent = await this.dispatchOSNotification(
          `⚠️ Vence en menos de 24 horas (1 día): ${task.title}`,
          `Curso: ${task.course_name} — Plazo límite: ${new Date(task.deadline).toLocaleString('es-ES', {
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })} (~${hoursLeftFormatted}h restantes).`,
          'normal'
        );
        if (!sent) continue;

        await this.store.updateTask(task.id, { notified_24h: 1 });
        await this.store.addNotificationLog({
          task_id: task.id,
          task_title: task.title,
          alert_type: '24_hours',
        });

        triggeredCount++;
        task.notified_24h = 1;
      }
    }

    if (triggeredCount > 0) {
      this.notifyListeners();
    }

    return { triggeredCount };
  }

  // Prueba de notificación inmediata para verificación del usuario
  public async testAlert(type: AlertType, customTitle?: string, customCourse?: string) {
    if (!await this.refreshPermission()) {
      await this.requestPermission();
    }
    if (!await this.refreshPermission()) throw new Error('Habilita las notificaciones en el sistema o navegador para enviar la prueba.');

    if (type === '12_hours') {
      const sent = await this.dispatchOSNotification(
        `🚨 [Prueba 12h] Entrega Inminente: ${customTitle || 'Examen Parcial de Arquitectura'}`,
        `Curso: ${customCourse || 'Arquitectura de Software'} — Quedan menos de 12 horas para el cierre en el aula virtual.`,
        'high'
      );
      if (!sent) throw new Error('No se pudo enviar la notificación de prueba.');
      await this.store.addNotificationLog({
        task_id: 'test-12h',
        task_title: customTitle || 'Prueba de Alerta 12h',
        alert_type: '12_hours',
      });
    } else {
      const sent = await this.dispatchOSNotification(
        `⚠️ [Prueba 24h] Recordatorio 1 Día Antes: ${customTitle || 'Laboratorio B-Trees'}`,
        `Curso: ${customCourse || 'Algoritmos y Estructuras'} — Queda exactamente 1 día para la entrega.`,
        'normal'
      );
      if (!sent) throw new Error('No se pudo enviar la notificación de prueba.');
      await this.store.addNotificationLog({
        task_id: 'test-24h',
        task_title: customTitle || 'Prueba de Alerta 24h',
        alert_type: '24_hours',
      });
    }

    this.notifyListeners();
  }

  // Iniciar demonio de monitoreo continuo en segundo plano
  public startBackgroundDaemon(getTasksCb: () => Promise<Task[]>) {
    if (this.intervalId !== null) return;

    // Ejecución inicial rápida
    getTasksCb().then((tasks) => this.checkDeadlines(tasks)).catch((error) => console.error('No se pudo iniciar el monitoreo:', error));

    // Revisar cada 20 segundos
    this.intervalId = window.setInterval(async () => {
      try {
        const tasks = await getTasksCb();
        await this.checkDeadlines(tasks);
      } catch (err) {
        console.error('Error en demonio de notificaciones:', err);
      }
    }, 20000);
  }

  public stopBackgroundDaemon() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const notificationService = new NotificationService();
