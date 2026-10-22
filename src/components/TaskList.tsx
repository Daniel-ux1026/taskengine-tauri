import React from 'react';
import { Task, TaskStatus } from '../types/task';
import { Clock, AlertTriangle, CheckCircle, Edit3, Trash2, ArrowRight } from 'lucide-react';

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
  onOpenCreateModal: () => void;
}

export const TaskList: React.FC<Props> = ({
  tasks,
  onEdit,
  onDelete,
  onStatusChange,
  onOpenCreateModal,
}) => {
  const now = Date.now();

  const getUrgencyInfo = (task: Task) => {
    if (task.status === 'completada') {
      return { label: 'Completada', color: 'text-emerald-400', isUrgent: false, isWarning: false };
    }

    const deadlineTime = new Date(task.deadline).getTime();
    const diffMs = deadlineTime - now;
    const diffHours = diffMs / (1000 * 3600);

    if (diffMs < 0) {
      const overdueHours = Math.abs(Math.floor(diffHours));
      return {
        label: `Vencida (${overdueHours}h)`,
        color: 'text-rose-400',
        badge: 'bg-rose-950/60 text-rose-300 border border-rose-800/80',
        isUrgent: true,
        isWarning: false,
      };
    }

    if (diffHours <= 12) {
      return {
        label: `🚨 < 12h (${diffHours.toFixed(1)}h)`,
        color: 'text-red-400',
        badge: 'bg-red-950/70 text-red-300 border border-red-800/80 animate-pulse',
        isUrgent: true,
        isWarning: false,
      };
    }

    if (diffHours <= 24) {
      return {
        label: `⚠️ < 24h (${diffHours.toFixed(1)}h)`,
        color: 'text-amber-400',
        badge: 'bg-amber-950/70 text-amber-300 border border-amber-800/80',
        isUrgent: false,
        isWarning: true,
      };
    }

    const days = Math.floor(diffHours / 24);
    const remHours = Math.floor(diffHours % 24);
    return {
      label: `${days}d ${remHours}h`,
      color: 'text-neutral-400',
      badge: 'text-neutral-400',
      isUrgent: false,
      isWarning: false,
    };
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-12 text-center">
        <Clock className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-neutral-200">No se encontraron tareas con estos filtros</h3>
        <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
          Crea una nueva tarea para tu semestre universitario o restablece los criterios de búsqueda.
        </p>
        <button
          onClick={onOpenCreateModal}
          className="mt-4 px-4 py-2 text-xs font-semibold text-neutral-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors"
        >
          Crear Tarea Universitaria
        </button>
      </div>
    );
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          {/* Table Header */}
          <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 uppercase font-medium tracking-wider text-[11px]">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">Estado</th>
              <th className="py-2.5 px-4">Tarea & Detalles</th>
              <th className="py-2.5 px-4">Curso / Asignatura</th>
              <th className="py-2.5 px-4">Fecha Límite</th>
              <th className="py-2.5 px-4">Plazo Restante</th>
              <th className="py-2.5 px-4">Prioridad</th>
              <th className="py-2.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-neutral-800/60 font-sans">
            {tasks.map((task) => {
              const urgency = getUrgencyInfo(task);
              const deadlineDate = new Date(task.deadline);

              return (
                <tr
                  key={task.id}
                  className={`hover:bg-neutral-800/40 transition-colors ${
                    urgency.isUrgent ? 'bg-red-950/10' : urgency.isWarning ? 'bg-amber-950/10' : ''
                  }`}
                >
                  {/* Status toggle checkbox / icon */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() =>
                        onStatusChange(
                          task.id,
                          task.status === 'completada'
                            ? 'pendiente'
                            : task.status === 'pendiente'
                            ? 'en_progreso'
                            : 'completada'
                        )
                      }
                      title={`Estado: ${task.status}. Clic para avanzar.`}
                      className="p-1 rounded text-neutral-400 hover:text-neutral-200 transition-colors"
                    >
                      {task.status === 'completada' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : task.status === 'en_progreso' ? (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-sky-400 border-t-transparent animate-spin inline-block" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-sm border border-neutral-600 inline-block hover:border-neutral-400" />
                      )}
                    </button>
                  </td>

                  {/* Title & tags */}
                  <td className="py-3 px-4 max-w-md">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={`font-medium ${
                          task.status === 'completada'
                            ? 'line-through text-neutral-500'
                            : 'text-neutral-100'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.description && (
                        <span className="text-[11px] text-neutral-400 line-clamp-1">
                          {task.description}
                        </span>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 mt-0.5">
                          {task.tags.map((t, idx) => (
                            <React.Fragment key={t}>
                              <span>{t}</span>
                              {idx < task.tags!.length - 1 && <span aria-hidden="true">·</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Course name */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-neutral-300 font-medium">{task.course_name}</span>
                  </td>

                  {/* Deadline formatted */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-neutral-300">
                    <div>
                      {deadlineDate.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      {deadlineDate.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>

                  {/* Plazo / Urgencia */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums">
                    {urgency.badge ? (
                      <span className={`inline-block px-2 py-0.5 text-[11px] rounded ${urgency.badge}`}>
                        {urgency.label}
                      </span>
                    ) : (
                      <span className={`text-[12px] ${urgency.color}`}>{urgency.label}</span>
                    )}
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`text-xs font-medium ${
                        task.priority === 'alta'
                          ? 'text-rose-400'
                          : task.priority === 'media'
                          ? 'text-amber-400'
                          : 'text-neutral-400'
                      }`}
                    >
                      {task.priority === 'alta'
                        ? 'Alta'
                        : task.priority === 'media'
                        ? 'Media'
                        : 'Baja'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(task)}
                        title="Editar tarea"
                        className="p-1 rounded text-neutral-400 hover:text-sky-400 hover:bg-neutral-800 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la tarea "${task.title}"?`)) {
                            onDelete(task.id);
                          }
                        }}
                        title="Eliminar tarea"
                        className="p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
