import React from 'react';
import { 
  Bell, 
  Terminal, 
  Plus, 
  FolderDown, 
  Layers, 
  List, 
  Minus, 
  Square, 
  X,
  Radio
} from 'lucide-react';
import { isTauriEnvironment } from '../db/sqlite';

interface Props {
  activeView: 'board' | 'list';
  setActiveView: (view: 'board' | 'list') => void;
  onOpenCreateModal: () => void;
  onOpenNotifModal: () => void;
  onOpenTauriModal: () => void;
  onMinimizeToTray: () => void;
  unreadAlertCount: number;
}

export const Header: React.FC<Props> = ({
  activeView,
  setActiveView,
  onOpenCreateModal,
  onOpenNotifModal,
  onOpenTauriModal,
  onMinimizeToTray,
  unreadAlertCount,
}) => {
  const isTauri = isTauriEnvironment();

  return (
    <header className="bg-neutral-900 border-b border-neutral-800 text-neutral-200 select-none">
      {/* Top Titlebar Strip / Window Controls */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-neutral-950 border-b border-neutral-800/60 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          {/* Indicador de entorno */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] text-neutral-400">
              {isTauri ? 'Tauri Runtime v2 · SQLite Local' : 'Tauri Desktop Sandbox · SQLite Local'}
            </span>
          </div>
          <span className="text-neutral-600">|</span>
          <span className="text-neutral-400 text-[11px]">Ingeniería de Sistemas</span>
        </div>

        {/* Window controls (Minimizar a la Bandeja / Maximizar / Cerrar a Bandeja) */}
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimizeToTray}
            title="Minimizar a la bandeja del sistema (System Tray)"
            className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 rounded transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            title="Maximizar ventana"
            className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 rounded transition-colors"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={onMinimizeToTray}
            title="Cerrar ventana (se minimiza en segundo plano al System Tray)"
            className="p-1 hover:bg-red-900/40 text-neutral-400 hover:text-red-400 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Bar complying with Top Bar Contract: [Brand Wordmark] — [Nav Links / Views] — [Actions] */}
      <div className="flex items-center justify-between px-6 py-3">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight text-white font-sans">
            TaskEngine
          </span>
          <span className="text-xs font-mono text-neutral-500">
            v1.0.0
          </span>
        </div>

        {/* Zone 2: Navigation Links / Segmented View Controls */}
        <nav className="flex items-center gap-1 bg-neutral-950/70 p-1 rounded-lg border border-neutral-800">
          <button
            onClick={() => setActiveView('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeView === 'board'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tablero</span>
          </button>

          <button
            onClick={() => setActiveView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeView === 'list'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista Detallada</span>
          </button>

          <div className="w-[1px] h-4 bg-neutral-800 mx-1" />

          <button
            onClick={onOpenNotifModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors relative"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Notificaciones</span>
            {unreadAlertCount > 0 && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          <button
            onClick={onOpenTauriModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span>Archivos Tauri & SQL</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onMinimizeToTray}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700/80 border border-neutral-700 rounded-lg transition-colors"
            title="Minimizar a la bandeja del sistema"
          >
            <Radio className="w-3.5 h-3.5 text-sky-400" />
            <span>Bandeja (Tray)</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>
    </header>
  );
};
