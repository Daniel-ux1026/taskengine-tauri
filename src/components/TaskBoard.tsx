import React from 'react';
import { Task, TaskStatus } from '../types/task';
import { Clock, AlertTriangle, CheckCircle, Edit3, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onOpenCreateModal: () => void;
}

export const TaskBoard: React.FC<Props> = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenCreateModal,
}) => {
  const now = Date.now();

  const columns: { id: TaskStatus; title: string; count: number }[] = [
    {
      id: 'pendiente',
      title: 'Pendientes',
      count: tasks.filter((t) => t.status === 'pendiente').length,
    },
    {
      id: 'en_progreso',
      title: 'En Progreso',
      count: tasks.filter((t) => t.status === 'en_progreso').length,
    },
    {
      id: 'completada',
      title: 'Completadas',
      count: tasks.filter((t) => t.status === 'completada').length,
    },
  ];

  const getUrgencyBadge = (task: Task) => {
    if (task.status === 'completada') return null;

    const diffHours = (new Date(task.deadline).getTime() - now) / (1000 * 3600);

    if (diffHours < 0) {
      return (
        <span className="text-[11px] font-mono text-rose-400 bg-rose-950/60 border border-rose-800/80 px-2 py-0.5 rounded">
          Atrasada
        </span>
      );
    }
    if (diffHours <= 12) {
      return (
        <span className="text-[11px] font-mono text-red-300 bg-red-950/80 border border-red-800 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-red-400" />
          <span>&lt; 12h ({diffHours.toFixed(1)}h)</span>
        </span>
      );
    }
    if (diffHours <= 24) {
      return (
        <span className="text-[11px] font-mono text-amber-300 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>&lt; 24h ({diffHours.toFixed(1)}h)</span>
        </span>
      );
    }
    const days = Math.floor(diffHours / 24);
    return (
      <span className="text-[11px] font-mono text-neutral-400">
        {days}d restantes
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);

        return (
          <div
            key={col.id}
            className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                  {col.title}
                </span>
                <span className="text-xs font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded-full">
                  {col.count}
                </span>
              </div>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {colTasks.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-lg text-neutral-500 text-xs text-center p-3">
                  <span>Sin tareas en esta etapa</span>
                </div>
              ) : (
                colTasks.map((task) => {
                  const urgencyBadge = getUrgencyBadge(task);
                  const deadlineDate = new Date(task.deadline);

                  return (
                    <div
                      key={task.id}
                      className="bg-neutral-950 border border-neutral-800/80 hover:border-neutral-700 rounded-lg p-3.5 space-y-2.5 transition-all shadow-xs"
                    >
                      {/* Top: Course & Priority */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-sky-400 truncate max-w-[190px]">
                          {task.course_name}
                        </span>
                        <span
                          className={`text-[11px] uppercase tracking-wider font-semibold ${
                            task.priority === 'alta'
                              ? 'text-rose-400'
                              : task.priority === 'media'
                              ? 'text-amber-400'
                              : 'text-neutral-500'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {/* Title */}
                      <h4
                        className={`text-xs font-medium leading-snug ${
                          task.status === 'completada'
                            ? 'line-through text-neutral-500'
                            : 'text-neutral-100'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Description if present */}
                      {task.description && (
                        <p className="text-[11px] text-neutral-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
                          {task.tags.map((t, idx) => (
                            <React.Fragment key={t}>
                              <span>{t}</span>
                              {idx < task.tags!.length - 1 && <span aria-hidden="true">·</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      )}

                      {/* Urgency & Deadline */}
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs">
                        <div className="flex items-center gap-1.5">
                          {urgencyBadge || (
                            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Completada</span>
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-neutral-500">
                          {deadlineDate.toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                          })}{' '}
                          {deadlineDate.toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-neutral-900/60">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEdit(task)}
                            className="p-1 rounded text-neutral-400 hover:text-sky-400 hover:bg-neutral-900 transition-colors"
                            title="Editar tarea"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar la tarea "${task.title}"?`)) {
                                onDelete(task.id);
                              }
                            }}
                            className="p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-900 transition-colors"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Quick state shift buttons */}
                        <div className="flex items-center gap-1">
                          {col.id !== 'pendiente' && (
                            <button
                              onClick={() =>
                                onStatusChange(
                                  task.id,
                                  col.id === 'completada' ? 'en_progreso' : 'pendiente'
                                )
                              }
                              className="px-2 py-0.5 text-[11px] bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-800 flex items-center gap-0.5"
                              title="Mover a etapa anterior"
                            >
                              <ArrowLeft className="w-2.5 h-2.5" />
                              <span>Retroceder</span>
                            </button>
                          )}
                          {col.id !== 'completada' && (
                            <button
                              onClick={() =>
                                onStatusChange(
                                  task.id,
                                  col.id === 'pendiente' ? 'en_progreso' : 'completada'
                                )
                              }
                              className="px-2 py-0.5 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-sky-300 rounded border border-neutral-700 flex items-center gap-0.5"
                              title="Avanzar a siguiente etapa"
                            >
                              <span>Avanzar</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
