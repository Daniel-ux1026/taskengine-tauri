import React from 'react';
import { Task } from '../types/task';
import { AlertTriangle, Clock, CheckCircle2, ListTodo } from 'lucide-react';

interface Props {
  tasks: Task[];
  onFilterUrgent?: () => void;
  onFilterWarning?: () => void;
}

export const StatisticsBar: React.FC<Props> = ({ tasks, onFilterUrgent, onFilterWarning }) => {
  const now = Date.now();

  const total = tasks.length;
  const pendientes = tasks.filter((t) => t.status === 'pendiente').length;
  const enProgreso = tasks.filter((t) => t.status === 'en_progreso').length;
  const completadas = tasks.filter((t) => t.status === 'completada').length;

  // Cálculo de tareas próximas en riesgo
  const urgentes12h = tasks.filter((t) => {
    if (t.status === 'completada') return false;
    const diffHours = (new Date(t.deadline).getTime() - now) / (1000 * 3600);
    return diffHours > 0 && diffHours <= 12;
  }).length;

  const alerta24h = tasks.filter((t) => {
    if (t.status === 'completada') return false;
    const diffHours = (new Date(t.deadline).getTime() - now) / (1000 * 3600);
    return diffHours > 12 && diffHours <= 24;
  }).length;

  const vencidas = tasks.filter((t) => {
    if (t.status === 'completada') return false;
    return new Date(t.deadline).getTime() < now;
  }).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
      {/* Total Tareas */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-neutral-400 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Total Tareas</span>
          <ListTodo className="w-4 h-4 text-neutral-500" />
        </div>
        <div className="text-xl font-semibold text-neutral-100 font-mono tabular-nums">
          {total}
        </div>
        <div className="text-[11px] text-neutral-500 mt-1">
          {completadas} finalizadas
        </div>
      </div>

      {/* En Progreso */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-neutral-400 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">En Progreso</span>
          <Clock className="w-4 h-4 text-sky-400" />
        </div>
        <div className="text-xl font-semibold text-sky-400 font-mono tabular-nums">
          {enProgreso}
        </div>
        <div className="text-[11px] text-neutral-500 mt-1">
          {pendientes} pendientes
        </div>
      </div>

      {/* Alerta Crítica (< 12 Horas) */}
      <button
        onClick={onFilterUrgent}
        className={`bg-neutral-900/80 border text-left rounded-lg p-3 flex flex-col justify-between transition-colors ${
          urgentes12h > 0
            ? 'border-red-500/40 bg-red-950/20 hover:border-red-500/60'
            : 'border-neutral-800 hover:border-neutral-700'
        }`}
      >
        <div className="flex items-center justify-between text-neutral-400 mb-1">
          <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Urgente (&lt;12h)</span>
          <AlertTriangle className={`w-4 h-4 ${urgentes12h > 0 ? 'text-red-400 animate-pulse' : 'text-neutral-500'}`} />
        </div>
        <div className="text-xl font-semibold text-red-400 font-mono tabular-nums">
          {urgentes12h}
        </div>
        <div className="text-[11px] text-red-400/80 mt-1">
          Notificación OS activa
        </div>
      </button>

      {/* Alerta Preventiva (< 24 Horas) */}
      <button
        onClick={onFilterWarning}
        className={`bg-neutral-900/80 border text-left rounded-lg p-3 flex flex-col justify-between transition-colors ${
          alerta24h > 0
            ? 'border-amber-500/40 bg-amber-950/20 hover:border-amber-500/60'
            : 'border-neutral-800 hover:border-neutral-700'
        }`}
      >
        <div className="flex items-center justify-between text-neutral-400 mb-1">
          <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Alerta (1 Día)</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-xl font-semibold text-amber-400 font-mono tabular-nums">
          {alerta24h}
        </div>
        <div className="text-[11px] text-amber-400/80 mt-1">
          Vence en 12h-24h
        </div>
      </button>

      {/* Vencidas */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-neutral-400 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider text-rose-400/90">Atrasadas</span>
          <span className="text-xs font-mono text-neutral-500">EXP</span>
        </div>
        <div className="text-xl font-semibold text-rose-400 font-mono tabular-nums">
          {vencidas}
        </div>
        <div className="text-[11px] text-neutral-500 mt-1">
          Requieren prórroga
        </div>
      </div>

      {/* Completadas / Rendimiento */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between text-neutral-400 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Completadas</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-xl font-semibold text-emerald-400 font-mono tabular-nums">
          {completadas}
        </div>
        <div className="text-[11px] text-neutral-500 mt-1">
          {total > 0 ? Math.round((completadas / total) * 100) : 0}% efectividad
        </div>
      </div>
    </div>
  );
};
