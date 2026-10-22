import React from 'react';
import { Course, TaskStatus } from '../types/task';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface Props {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedUrgency: string;
  setSelectedUrgency: (urgency: string) => void;
  sortBy: 'deadline_asc' | 'deadline_desc' | 'priority';
  setSortBy: (sort: 'deadline_asc' | 'deadline_desc' | 'priority') => void;
  courses: Course[];
}

export const TaskFilters: React.FC<Props> = ({
  searchQuery,
  setSearchQuery,
  selectedCourseId,
  setSelectedCourseId,
  selectedStatus,
  setSelectedStatus,
  selectedUrgency,
  setSelectedUrgency,
  sortBy,
  setSortBy,
  courses,
}) => {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 mb-6 space-y-3">
      {/* Fila Principal: Búsqueda y Filtros Rápidos */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, etiquetas o temas (ej: Kafka, B-Trees, Socket)..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-md text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Selector de Curso */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-md text-neutral-200 focus:outline-hidden focus:border-sky-500"
          >
            <option value="all">Todos los Cursos</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>

          {/* Ordenamiento */}
          <div className="flex items-center gap-1.5 ml-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-md text-neutral-200 focus:outline-hidden focus:border-sky-500"
            >
              <option value="deadline_asc">Vencimiento: Más Próximo</option>
              <option value="deadline_desc">Vencimiento: Más Lejano</option>
              <option value="priority">Prioridad Más Alta</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fila Secundaria: Filtros Segmentados de Estado y Urgencia */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800/80 text-xs">
        {/* Estado Filter (Segmented control) */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-md border border-neutral-800">
          <span className="text-[11px] text-neutral-500 px-2 uppercase font-medium">Estado:</span>
          {(['all', 'pendiente', 'en_progreso', 'completada'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedStatus === st
                  ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {st === 'all'
                ? 'Todos'
                : st === 'pendiente'
                ? 'Pendientes'
                : st === 'en_progreso'
                ? 'En Progreso'
                : 'Completadas'}
            </button>
          ))}
        </div>

        {/* Urgencia / Alertas Filter (Segmented control) */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-md border border-neutral-800">
          <span className="text-[11px] text-neutral-500 px-2 uppercase font-medium">Alerta:</span>
          {[
            { id: 'all', label: 'Todas' },
            { id: 'urgent_12h', label: '🚨 < 12 Horas' },
            { id: 'warning_24h', label: '⚠️ < 24 Horas' },
            { id: 'overdue', label: 'Atrasadas' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedUrgency(item.id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedUrgency === item.id
                  ? 'bg-neutral-800 text-neutral-100 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
