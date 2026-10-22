/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, Course, TaskStatus } from './types/task';
import { sqliteService } from './db/sqlite';
import { notificationService } from './services/notificationService';
import { trayService, TrayState } from './services/trayService';
import { Header } from './components/Header';
import { StatisticsBar } from './components/StatisticsBar';
import { TaskFilters } from './components/TaskFilters';
import { TaskList } from './components/TaskList';
import { TaskBoard } from './components/TaskBoard';
import { TaskModal } from './components/TaskModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { SystemTraySimulator } from './components/SystemTraySimulator';
import { TauriArchitectureModal } from './components/TauriArchitectureModal';
import { Database, Radio, BellRing, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'board' | 'list'>('board');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [sortBy, setSortBy] = useState<'deadline_asc' | 'deadline_desc' | 'priority'>('deadline_asc');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isTauriModalOpen, setIsTauriModalOpen] = useState(false);

  // System Tray State
  const [trayState, setTrayState] = useState<TrayState>(trayService.getState());

  // Load Initial Data
  const loadData = useCallback(async () => {
    try {
      const [loadedTasks, loadedCourses] = await Promise.all([
        sqliteService.getTasks(),
        sqliteService.getCourses(),
      ]);
      setTasks(loadedTasks);
      setCourses(loadedCourses);
    } catch (err) {
      console.error('Error al cargar datos desde SQLite:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Iniciar demonio de notificaciones de fondo
    notificationService.startBackgroundDaemon(async () => {
      const currentTasks = await sqliteService.getTasks();
      setTasks(currentTasks);
      return currentTasks;
    });

    // Suscripción al estado de la bandeja del sistema
    const unsubscribeTray = trayService.subscribe((state) => {
      setTrayState(state);
    });

    const unsubscribeNotif = notificationService.subscribe(() => {
      sqliteService.getTasks().then(setTasks);
    });

    return () => {
      unsubscribeTray();
      unsubscribeNotif();
      notificationService.stopBackgroundDaemon();
    };
  }, [loadData]);

  // Actualizar conteos en el System Tray
  useEffect(() => {
    const now = Date.now();
    const pending = tasks.filter((t) => t.status !== 'completada').length;
    const urgent = tasks.filter((t) => {
      if (t.status === 'completada') return false;
      const diffHours = (new Date(t.deadline).getTime() - now) / (1000 * 3600);
      return diffHours > 0 && diffHours <= 12;
    }).length;

    trayService.updateCounts(pending, urgent);
  }, [tasks]);

  // Filtrado y Ordenamiento
  const filteredTasks = useMemo(() => {
    const now = Date.now();
    return tasks.filter((task) => {
      // 1. Filtro de búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesCourse = task.course_name.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        const matchesTags = task.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCourse && !matchesDesc && !matchesTags) {
          return false;
        }
      }

      // 2. Filtro de curso
      if (selectedCourseId !== 'all' && task.course_id !== selectedCourseId) {
        return false;
      }

      // 3. Filtro de estado
      if (selectedStatus !== 'all' && task.status !== selectedStatus) {
        return false;
      }

      // 4. Filtro de urgencia
      if (selectedUrgency !== 'all') {
        const diffHours = (new Date(task.deadline).getTime() - now) / (1000 * 3600);
        if (selectedUrgency === 'urgent_12h') {
          if (task.status === 'completada' || diffHours <= 0 || diffHours > 12) return false;
        } else if (selectedUrgency === 'warning_24h') {
          if (task.status === 'completada' || diffHours <= 12 || diffHours > 24) return false;
        } else if (selectedUrgency === 'overdue') {
          if (task.status === 'completada' || diffHours >= 0) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'deadline_asc') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sortBy === 'deadline_desc') {
        return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
      }
      if (sortBy === 'priority') {
        const prioScore = { alta: 3, media: 2, baja: 1 };
        return prioScore[b.priority] - prioScore[a.priority];
      }
      return 0;
    });
  }, [tasks, searchQuery, selectedCourseId, selectedStatus, selectedUrgency, sortBy]);

  // Alertas urgentes no leídas
  const unreadAlertCount = useMemo(() => {
    const now = Date.now();
    return tasks.filter((t) => {
      if (t.status === 'completada') return false;
      const diffHours = (new Date(t.deadline).getTime() - now) / (1000 * 3600);
      return diffHours > 0 && diffHours <= 24;
    }).length;
  }, [tasks]);

  // Handlers CRUD
  const handleCreateTask = async (
    data: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'notified_24h' | 'notified_12h'>
  ) => {
    await sqliteService.createTask(data);
    await loadData();
    // Evaluar plazos de inmediato
    const updated = await sqliteService.getTasks();
    await notificationService.checkDeadlines(updated);
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    await sqliteService.updateTask(id, updates);
    await loadData();
  };

  const handleDeleteTask = async (id: string) => {
    await sqliteService.deleteTask(id);
    await loadData();
  };

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    await sqliteService.updateTask(id, { status: newStatus });
    await loadData();
  };

  const handleAddCourse = async (name: string, code: string): Promise<Course> => {
    const newCourse = await sqliteService.createCourse({
      name,
      code,
      semester: 'Semestre Actual',
      color: '#38bdf8',
    });
    const updatedCourses = await sqliteService.getCourses();
    setCourses(updatedCourses);
    return newCourse;
  };

  const handleTriggerManualCheck = async () => {
    const currentTasks = await sqliteService.getTasks();
    await notificationService.checkDeadlines(currentTasks);
    await loadData();
  };

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* OS Header Bar */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenCreateModal={() => {
          setTaskToEdit(null);
          setIsTaskModalOpen(true);
        }}
        onOpenNotifModal={() => setIsNotifModalOpen(true)}
        onOpenTauriModal={() => setIsTauriModalOpen(true)}
        onMinimizeToTray={() => trayService.minimizeToTray()}
        unreadAlertCount={unreadAlertCount}
      />

      {/* Main Workspace */}
      <main className="flex-1 overflow-y-auto px-6 py-6 max-w-7xl w-full mx-auto">
        {/* Banner de bienvenida y contexto de ingeniería */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-neutral-800 gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Gestión de Tareas Universitarias</span>
              <span className="text-xs font-mono font-normal text-sky-400 bg-sky-950/60 border border-sky-800/80 px-2 py-0.5 rounded">
                Ingeniería de Sistemas
              </span>
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Base de datos SQLite local · Notificaciones automáticas 1 día y 12h antes · Segundo plano activo
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTauriModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-sky-400 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Ver Esquema SQLite</span>
            </button>
            <button
              onClick={handleTriggerManualCheck}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors"
              title="Sincronizar y escanear vencimientos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de Estadísticas y Métricas de Plazos */}
        <StatisticsBar
          tasks={tasks}
          onFilterUrgent={() => setSelectedUrgency('urgent_12h')}
          onFilterWarning={() => setSelectedUrgency('warning_24h')}
        />

        {/* Filtros, Búsqueda y Ordenamiento */}
        <TaskFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedUrgency={selectedUrgency}
          setSelectedUrgency={setSelectedUrgency}
          sortBy={sortBy}
          setSortBy={setSortBy}
          courses={courses}
        />

        {/* Viewport: Kanban Board vs High Density List */}
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2 text-neutral-500">
            <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Cargando base de datos SQLite...</span>
          </div>
        ) : activeView === 'board' ? (
          <TaskBoard
            tasks={filteredTasks}
            onEdit={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDelete={handleDeleteTask}
            onStatusChange={handleStatusChange}
            onOpenCreateModal={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
          />
        ) : (
          <TaskList
            tasks={filteredTasks}
            onEdit={(task) => {
              setTaskToEdit(task);
              setIsTaskModalOpen(true);
            }}
            onDelete={handleDeleteTask}
            onStatusChange={handleStatusChange}
            onOpenCreateModal={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Desktop App Status Bar */}
      <footer className="bg-neutral-950 border-t border-neutral-800/80 px-6 py-2 text-[11px] text-neutral-400 flex items-center justify-between select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-mono">SQLite: tasks_university.db (Conectado)</span>
          </span>
          <span className="text-neutral-700">|</span>
          <span className="flex items-center gap-1">
            <BellRing className="w-3 h-3 text-amber-400" />
            <span>Monitoreo 24h & 12h: Activo</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => trayService.minimizeToTray()}
            className="hover:text-neutral-200 transition-colors flex items-center gap-1"
          >
            <Radio className="w-3 h-3 text-sky-400" />
            <span>Minimizar a la Bandeja (Tray)</span>
          </button>
          <span className="text-neutral-700">|</span>
          <button
            onClick={() => setIsTauriModalOpen(true)}
            className="hover:text-neutral-200 transition-colors font-mono"
          >
            Archivos Rust / Tauri v2
          </button>
        </div>
      </footer>

      {/* Modals & Simulators */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSave={handleCreateTask}
        onUpdate={handleUpdateTask}
        courses={courses}
        onAddCourse={handleAddCourse}
        taskToEdit={taskToEdit}
      />

      <NotificationCenterModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        tasks={tasks}
        onTriggerCheck={handleTriggerManualCheck}
      />

      <TauriArchitectureModal
        isOpen={isTauriModalOpen}
        onClose={() => setIsTauriModalOpen(false)}
      />

      <SystemTraySimulator
        trayState={trayState}
        onRestore={() => trayService.restoreFromTray()}
        onCheckAlerts={handleTriggerManualCheck}
      />
    </div>
  );
}
