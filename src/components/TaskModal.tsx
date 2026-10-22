import React, { useState, useEffect } from 'react';
import { Task, Course, TaskStatus, TaskPriority } from '../types/task';
import { X, Calendar, BookOpen, AlertCircle, Tag, PlusCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'notified_24h' | 'notified_12h'>) => Promise<void>;
  onUpdate?: (id: string, updates: Partial<Task>) => Promise<void>;
  courses: Course[];
  onAddCourse: (name: string, code: string) => Promise<Course>;
  taskToEdit?: Task | null;
}

export const TaskModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  courses,
  onAddCourse,
  taskToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [status, setStatus] = useState<TaskStatus>('pendiente');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showNewCourseInput, setShowNewCourseInput] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setCourseId(taskToEdit.course_id);
      const d = new Date(taskToEdit.deadline);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setDeadlineDate(`${yyyy}-${mm}-${dd}`);
      setDeadlineTime(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      );
      setStatus(taskToEdit.status);
      setPriority(taskToEdit.priority);
      setDescription(taskToEdit.description || '');
      setTags(taskToEdit.tags || []);
    } else {
      // Default: mañana a las 23:59
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yyyy = tomorrow.getFullYear();
      const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const dd = String(tomorrow.getDate()).padStart(2, '0');
      setDeadlineDate(`${yyyy}-${mm}-${dd}`);
      setDeadlineTime('23:59');
      setTitle('');
      setCourseId(courses[0]?.id || '');
      setStatus('pendiente');
      setPriority('media');
      setDescription('');
      setTags(['Ingeniería']);
    }
    setError(null);
    setShowNewCourseInput(false);
    setTagInput('');
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleCreateCustomCourse = async () => {
    if (!newCourseName.trim()) return;
    try {
      const created = await onAddCourse(newCourseName.trim(), newCourseCode.trim() || 'IS-XXX');
      setCourseId(created.id);
      setShowNewCourseInput(false);
      setNewCourseName('');
      setNewCourseCode('');
    } catch {
      setError('No se pudo agregar el curso');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El título de la tarea es obligatorio.');
      return;
    }
    if (!courseId) {
      setError('Selecciona o ingresa un curso universitario.');
      return;
    }
    if (!deadlineDate) {
      setError('La fecha de vencimiento es obligatoria.');
      return;
    }

    const selectedCourse = courses.find((c) => c.id === courseId);
    const selectedDeadline = new Date(`${deadlineDate}T${deadlineTime || '23:59'}:00`);
    if (!Number.isFinite(selectedDeadline.getTime())) {
      setError('La fecha y la hora de entrega no son válidas.');
      return;
    }
    const previousDeadline = taskToEdit ? new Date(taskToEdit.deadline) : null;
    // El formulario muestra minutos: conservar segundos originales al editar otros campos.
    const sameMinute = previousDeadline && Math.floor(previousDeadline.getTime() / 60000) === Math.floor(selectedDeadline.getTime() / 60000);
    const fullDeadline = sameMinute ? taskToEdit!.deadline : selectedDeadline.toISOString();

    setIsSubmitting(true);
    setError(null);

    try {
      if (taskToEdit && onUpdate) {
        await onUpdate(taskToEdit.id, {
          title: title.trim(),
          course_id: courseId,
          course_name: selectedCourse?.name || taskToEdit.course_name,
          deadline: fullDeadline,
          status,
          priority,
          description: description.trim(),
          tags,
        });
      } else {
        await onSave({
          title: title.trim(),
          course_id: courseId,
          course_name: selectedCourse?.name || 'Ingeniería de Sistemas',
          deadline: fullDeadline,
          status,
          priority,
          description: description.trim(),
          tags,
        });
      }
      onClose();
    } catch (err) {
      setError('No se pudo guardar la tarea. Revisa los datos e inténtalo de nuevo.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div>
            <h2 className="text-base font-semibold text-neutral-100">
              {taskToEdit ? 'Editar Tarea Universitaria' : 'Nueva Tarea de Ingeniería'}
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Tareas guardadas en este dispositivo y seguimiento de entregas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-950/40 border border-red-800/60 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Título de la Tarea / Laboratorio / Proyecto *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Implementar Balanceo de Carga con NGINX y Docker Compose"
              className="w-full px-3.5 py-2 text-sm bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Curso de la Universidad */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-neutral-400" />
                <span>Curso de la Universidad *</span>
              </label>
              <button
                type="button"
                onClick={() => setShowNewCourseInput(!showNewCourseInput)}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                <PlusCircle className="w-3 h-3" />
                <span>{showNewCourseInput ? 'Cancelar' : 'Crear nuevo curso'}</span>
              </button>
            </div>

            {showNewCourseInput ? (
              <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-lg space-y-2 mb-2">
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Nombre del curso (ej: Redes Avanzadas)"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="col-span-2 px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-700 rounded text-neutral-100"
                  />
                  <input
                    type="text"
                    placeholder="Código (ej: IS-702)"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-neutral-900 border border-neutral-700 rounded text-neutral-100"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateCustomCourse}
                  className="px-3 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-sky-400 rounded transition-colors"
                >
                  Guardar Curso
                </button>
              </div>
            ) : (
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code ? `[${course.code}] ` : ''}
                    {course.name} ({course.semester || 'Sistemas'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Fecha Límite y Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>Fecha Límite *</span>
              </label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 focus:outline-hidden focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Hora de Entrega (24h)
              </label>
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 focus:outline-hidden focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Estado y Prioridad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Estado Actual
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 focus:outline-hidden focus:border-sky-500"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso</option>
                <option value="completada">Completada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Nivel de Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 focus:outline-hidden focus:border-sky-500"
              >
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta (Crítica)</option>
              </select>
            </div>
          </div>

          {/* Descripción / Requisitos */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Descripción y Requisitos de Entrega
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre formato (PDF, repositorio GitHub, entorno de ejecución, enlaces de referencia)..."
              className="w-full px-3.5 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          </div>

          {/* Tags / Tecnologías */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-neutral-400" />
              <span>Etiquetas Tecnológicas</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Presiona Enter para añadir (ej: Docker, Rust, SQL)"
                className="flex-1 px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-100"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors"
              >
                Añadir
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] bg-neutral-800 text-neutral-300 rounded border border-neutral-700"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-neutral-500 hover:text-neutral-300"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-sky-400 hover:bg-sky-300 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
            >
              {isSubmitting ? 'Guardando...' : taskToEdit ? 'Actualizar Tarea' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
