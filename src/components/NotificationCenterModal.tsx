import React, { useState, useEffect } from 'react';
import { Task, NotificationLog } from '../types/task';
import { sqliteService } from '../db/sqlite';
import { notificationService, playNotificationChime } from '../services/notificationService';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  Clock, 
  Volume2, 
  CheckCircle, 
  Send, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw 
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onTriggerCheck: () => Promise<void>;
}

export const NotificationCenterModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tasks,
  onTriggerCheck,
}) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [testingAlert, setTestingAlert] = useState<string | null>(null);

  const reloadLogs = async () => {
    const list = await sqliteService.getNotificationLogs();
    setLogs(list);
    setHasPermission(notificationService.isPermissionGranted());
  };

  useEffect(() => {
    if (isOpen) {
      reloadLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setHasPermission(granted);
    if (granted) {
      notificationService.dispatchOSNotification(
        '🔔 TaskEngine - Notificaciones Habilitadas',
        'Ahora recibirás alertas automáticas 1 día y 12 horas antes de tus entregas universitarias.'
      );
    }
  };

  const handleTestAlert = async (type: '24_hours' | '12_hours') => {
    setTestingAlert(type);
    await notificationService.testAlert(
      type,
      type === '12_hours'
        ? 'Laboratorio 3: Árboles B+ y Sharding Raft'
        : 'Entrega de Avance: Arquitectura Microservicios',
      type === '12_hours' ? 'Algoritmos y Estructuras' : 'Arquitectura de Software'
    );
    await reloadLogs();
    setTimeout(() => setTestingAlert(null), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100">
                Centro de Notificaciones Nativas del SO
              </h2>
              <p className="text-xs text-neutral-400">
                Alertas automáticas programadas a 1 día (24h) y 12 horas antes del vencimiento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Permission Status Box */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {hasPermission ? (
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-neutral-100">
                  {hasPermission
                    ? 'Permiso de Notificaciones Concedido'
                    : 'Permiso de Notificaciones Pendiente'}
                </div>
                <p className="text-[11px] text-neutral-400">
                  {hasPermission
                    ? 'TaskEngine tiene autorización para enviar alertas nativas al escritorio del SO.'
                    : 'Permite las notificaciones para que el sistema operativo te avise a tiempo.'}
                </p>
              </div>
            </div>

            {!hasPermission && (
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-neutral-950 rounded-lg transition-colors whitespace-nowrap"
              >
                Habilitar Permiso
              </button>
            )}
          </div>

          {/* Reglas de Notificación Nativas */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Reglas de Notificación de Ingeniería de Sistemas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Regla 24 Horas */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Alerta Preventiva (24 Horas)</span>
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500">1 Día Antes</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Se activa automáticamente cuando restan entre 24 y 12 horas para la entrega. Chime suave y notificación en escritorio.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => handleTestAlert('24_hours')}
                    disabled={testingAlert === '24_hours'}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-amber-300 border border-neutral-800 rounded-md transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>{testingAlert === '24_hours' ? 'Enviando...' : 'Probar Alerta de 1 Día'}</span>
                  </button>
                </div>
              </div>

              {/* Regla 12 Horas */}
              <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Alerta Crítica (12 Horas)</span>
                  </span>
                  <span className="text-[11px] font-mono text-red-400 font-semibold">&lt; 12h</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Se activa cuando restan 12 horas o menos para la fecha límite. Tono de alta frecuencia y prioridad urgente en la bandeja.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => handleTestAlert('12_hours')}
                    disabled={testingAlert === '12_hours'}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-950/30 hover:bg-red-950/50 text-red-300 border border-red-900/60 rounded-md transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    <span>{testingAlert === '12_hours' ? 'Enviando...' : 'Probar Alerta Crítica (12h)'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Test Sound & Manual Scan */}
          <div className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <Volume2 className="w-4 h-4 text-sky-400" />
              <span>Chime Sintético Web Audio:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => playNotificationChime('normal')}
                className="px-2.5 py-1 text-[11px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-neutral-300"
              >
                Sonido 24h
              </button>
              <button
                onClick={() => playNotificationChime('high')}
                className="px-2.5 py-1 text-[11px] bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded text-red-400"
              >
                Sonido 12h
              </button>
              <button
                onClick={async () => {
                  await onTriggerCheck();
                  await reloadLogs();
                }}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-sky-950/60 hover:bg-sky-900/60 text-sky-300 border border-sky-800 rounded transition-colors ml-2"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Escanear Ahora</span>
              </button>
            </div>
          </div>

          {/* Registro de Auditoría SQLite de Notificaciones */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Registro de Alertas Disparadas (Tabla: notification_logs)
              </h3>
              <span className="text-[11px] font-mono text-neutral-500">
                {logs.length} registros
              </span>
            </div>

            {logs.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-neutral-800 rounded-lg text-xs text-neutral-500">
                No se han disparado alertas en esta sesión aún. Haz clic en "Probar Alerta" arriba para verificar.
              </div>
            ) : (
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg max-h-48 overflow-y-auto divide-y divide-neutral-900">
                {logs.map((log) => (
                  <div key={log.id} className="p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {log.alert_type === '12_hours' ? (
                        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-medium text-neutral-200">{log.task_title}</div>
                        <div className="text-[11px] text-neutral-500">
                          Tipo: {log.alert_type === '12_hours' ? 'Alerta Crítica (12h)' : 'Alerta Preventiva (24h)'}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-[11px] text-neutral-500 tabular-nums">
                      {new Date(log.triggered_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
