import React, { useState } from 'react';
import { TrayState } from '../services/trayService';
import { 
  Radio, 
  Maximize2, 
  Power, 
  Check, 
  Bell, 
  AlertTriangle, 
  ShieldCheck, 
  Cpu, 
  Clock, 
  ChevronUp 
} from 'lucide-react';

interface Props {
  trayState: TrayState;
  onRestore: () => void;
  onCheckAlerts: () => Promise<void>;
}

export const SystemTraySimulator: React.FC<Props> = ({
  trayState,
  onRestore,
  onCheckAlerts,
}) => {
  const [showTrayMenu, setShowTrayMenu] = useState(false);
  const [lastCheckMessage, setLastCheckMessage] = useState<string | null>(null);

  if (!trayState.isMinimizedToTray) {
    return null;
  }

  const handleManualCheck = async () => {
    await onCheckAlerts();
    setLastCheckMessage('Comprobación completada: Base de datos SQLite sincronizada');
    setTimeout(() => setLastCheckMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-md flex flex-col justify-between p-6 animate-in fade-in duration-200">
      {/* Top Banner explaining background state */}
      <div className="max-w-2xl mx-auto w-full pt-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl mb-2">
          <Radio className="w-10 h-10 text-sky-400 animate-pulse" />
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight">
          TaskEngine está Minimizado en la Bandeja del Sistema (System Tray)
        </h2>

        <p className="text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
          La ventana principal está oculta, pero el proceso sigue activo en segundo plano.
          Las notificaciones nativas de 1 día (24h) y 12 horas antes del vencimiento se dispararán automáticamente.
        </p>

        {/* Live background daemon stats */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-4 text-xs font-mono">
          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-left">
            <span className="text-neutral-500 block text-[10px] uppercase">Demonio</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Activo (20s)
            </span>
          </div>

          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-left">
            <span className="text-neutral-500 block text-[10px] uppercase">Pendientes</span>
            <span className="text-neutral-200 font-semibold mt-0.5 block tabular-nums">
              {trayState.pendingTasksCount} tareas
            </span>
          </div>

          <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-left">
            <span className="text-neutral-500 block text-[10px] uppercase">Urgentes &lt;12h</span>
            <span className="text-red-400 font-semibold mt-0.5 block tabular-nums">
              {trayState.urgentTasksCount} en riesgo
            </span>
          </div>
        </div>

        {/* Restore button */}
        <div className="pt-6">
          <button
            onClick={onRestore}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-neutral-950 bg-sky-400 hover:bg-sky-300 rounded-lg shadow-lg hover:shadow-sky-400/20 transition-all cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Restaurar Ventana Principal</span>
          </button>
        </div>

        {lastCheckMessage && (
          <div className="text-xs text-sky-400 font-mono animate-in fade-in">
            {lastCheckMessage}
          </div>
        )}
      </div>

      {/* Simulated OS System Tray Bar at bottom */}
      <div className="w-full max-w-4xl mx-auto">
        <div className="relative">
          {/* Popover Tray Menu */}
          {showTrayMenu && (
            <div className="absolute bottom-14 right-4 w-72 bg-neutral-900 border border-neutral-700/80 rounded-xl shadow-2xl overflow-hidden p-1.5 text-xs z-20 animate-in slide-in-from-bottom-2 duration-150">
              <div className="px-3 py-2 border-b border-neutral-800 flex items-center justify-between">
                <span className="font-semibold text-white">TaskEngine Tauri Tray</span>
                <span className="text-[10px] text-emerald-400 font-mono">SQLite OK</span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowTrayMenu(false);
                    onRestore();
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 rounded flex items-center justify-between"
                >
                  <span>Mostrar Ventana</span>
                  <span className="text-[10px] text-neutral-500 font-mono">Doble Clic</span>
                </button>

                <button
                  onClick={handleManualCheck}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-neutral-200 rounded flex items-center gap-2"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Comprobar plazos ahora</span>
                </button>
              </div>

              <div className="pt-1 border-t border-neutral-800">
                <div className="px-3 py-1 text-[11px] text-neutral-400">
                  {trayState.pendingTasksCount} tareas pendientes ({trayState.urgentTasksCount} urgentes)
                </div>
                <button
                  onClick={onRestore}
                  className="w-full text-left px-3 py-1.5 hover:bg-red-950/40 text-red-400 rounded flex items-center gap-2"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Cerrar completamente</span>
                </button>
              </div>
            </div>
          )}

          {/* OS Taskbar / Tray Bar */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span className="font-semibold text-neutral-200">Bandeja del Sistema (OS Tray)</span>
              <span className="hidden sm:inline text-neutral-600">|</span>
              <span className="hidden sm:inline text-[11px] text-neutral-500">
                Minimizado a las: {trayState.lastMinimizedAt || '12:00'}
              </span>
            </div>

            {/* Tray Icons Cluster */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTrayMenu(!showTrayMenu)}
                className="relative flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors cursor-pointer"
                title="Hacer clic para abrir menú de la bandeja"
              >
                <div className="relative">
                  <Radio className="w-4 h-4 text-sky-400" />
                  {trayState.urgentTasksCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  )}
                </div>
                <span className="text-xs font-medium text-neutral-200">
                  TaskEngine
                </span>
                <span className="text-[10px] font-mono bg-sky-950 text-sky-300 px-1.5 py-0.5 rounded border border-sky-800/80">
                  {trayState.pendingTasksCount}
                </span>
                <ChevronUp className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${showTrayMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
