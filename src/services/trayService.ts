import { isTauri, getTauriWindow } from '../utils/tauriBridge';

export interface TrayState {
  isMinimizedToTray: boolean;
  backgroundDaemonActive: boolean;
  pendingTasksCount: number;
  urgentTasksCount: number;
  lastMinimizedAt: string | null;
}

class SystemTrayService {
  private state: TrayState = {
    isMinimizedToTray: false,
    backgroundDaemonActive: true,
    pendingTasksCount: 0,
    urgentTasksCount: 0,
    lastMinimizedAt: null,
  };

  private listeners: Array<(state: TrayState) => void> = [];

  public getState(): TrayState {
    return { ...this.state };
  }

  public subscribe(cb: (state: TrayState) => void) {
    this.listeners.push(cb);
    cb(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((cb) => cb(currentState));
  }

  public updateCounts(pending: number, urgent: number) {
    this.state.pendingTasksCount = pending;
    this.state.urgentTasksCount = urgent;
    this.notify();
  }

  public async minimizeToTray(): Promise<void> {
    this.state.isMinimizedToTray = true;
    this.state.lastMinimizedAt = new Date().toLocaleTimeString('es-ES');
    this.notify();

    if (isTauri()) {
      try {
        const appWindow = getTauriWindow();
        if (appWindow) {
          await appWindow.hide();
        }
      } catch (e) {
        console.warn('Tauri window hide error:', e);
      }
    }
  }

  public async restoreFromTray(): Promise<void> {
    this.state.isMinimizedToTray = false;
    this.notify();

    if (isTauri()) {
      try {
        const appWindow = getTauriWindow();
        if (appWindow) {
          await appWindow.show();
          await appWindow.setFocus();
        }
      } catch (e) {
        console.warn('Tauri window restore error:', e);
      }
    }
  }

  public toggleDaemon(active?: boolean): boolean {
    this.state.backgroundDaemonActive = active !== undefined ? active : !this.state.backgroundDaemonActive;
    this.notify();
    return this.state.backgroundDaemonActive;
  }
}

export const trayService = new SystemTrayService();

