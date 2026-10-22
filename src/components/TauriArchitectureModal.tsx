import schema from '../../src-tauri/migrations/01_init.sql?raw';
import persistence from '../../src-tauri/migrations/02_local_persistence.sql?raw';
import cargo from '../../src-tauri/Cargo.toml?raw';
import config from '../../src-tauri/tauri.conf.json?raw';
import backend from '../../src-tauri/src/lib.rs?raw';
import capabilities from '../../src-tauri/capabilities/default.json?raw';
import React, { useState } from 'react';
import { getExecutedQueries, QueryLog } from '../db/sqlite';
import { 
  X, 
  Terminal, 
  Copy, 
  Check, 
  FileCode, 
  FolderTree, 
  Database, 
  Layers, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FILES_DATA: Record<string, { title: string; lang: string; content: string }> = {
 '01_init.sql': { title: 'src-tauri/migrations/01_init.sql', lang: 'sql', content: schema },
 '02_local_persistence.sql': { title: 'src-tauri/migrations/02_local_persistence.sql', lang: 'sql', content: persistence },
 'Cargo.toml': { title: 'src-tauri/Cargo.toml', lang: 'toml', content: cargo },
 'tauri.conf.json': { title: 'src-tauri/tauri.conf.json', lang: 'json', content: config },
 'lib.rs': { title: 'src-tauri/src/lib.rs', lang: 'rust', content: backend },
 'default.json': { title: 'src-tauri/capabilities/default.json', lang: 'json', content: capabilities },
};

export const TauriArchitectureModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'files' | 'structure' | 'guide' | 'queries'>('files');
  const [selectedFile, setSelectedFile] = useState<string>('01_init.sql');
  const [copied, setCopied] = useState(false);
  const [queries, setQueries] = useState<QueryLog[]>([]);

  if (!isOpen) return null;

  const currentFile = FILES_DATA[selectedFile];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShowQueries = () => {
    setActiveTab('queries');
    setQueries(getExecutedQueries());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg">
              <Terminal className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">
                Arquitectura de Código: React + Tauri v2 + SQLite Local
              </h2>
              <p className="text-xs text-neutral-400">
                Archivos reales del proyecto · SQLite en escritorio y localStorage en la demostración web
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

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-neutral-800 bg-neutral-950/60 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('files')}
              className={`py-3 px-3 border-b-2 font-medium transition-colors ${
                activeTab === 'files'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Archivos de Configuración
            </button>
            <button
              onClick={() => setActiveTab('structure')}
              className={`py-3 px-3 border-b-2 font-medium transition-colors ${
                activeTab === 'structure'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Estructura de Carpetas
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`py-3 px-3 border-b-2 font-medium transition-colors ${
                activeTab === 'guide'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Guía de Arranque Rápido
            </button>
            <button
              onClick={handleShowQueries}
              className={`py-3 px-3 border-b-2 font-medium transition-colors ${
                activeTab === 'queries'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Inspector de Consultas SQLite
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'files' && (
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar file list */}
              <div className="w-64 bg-neutral-950 border-r border-neutral-800 p-3 space-y-1 overflow-y-auto">
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider px-2 block mb-2">
                  Archivos de Configuración
                </span>
                {Object.entries(FILES_DATA).map(([key, data]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedFile(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      selectedFile === key
                        ? 'bg-neutral-800 text-sky-400 font-medium'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{key}</span>
                    </div>
                    {selectedFile === key && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                ))}
              </div>

              {/* Code viewer */}
              <div className="flex-1 flex flex-col bg-neutral-900/90 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-950/80">
                  <span className="text-xs font-mono text-neutral-300">{currentFile?.title}</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4 font-mono text-xs text-neutral-200 leading-relaxed">
                  <pre className="whitespace-pre">{currentFile?.content}</pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200">
                Estructura de Directorios del Proyecto
              </h3>
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 font-mono text-xs text-neutral-300 leading-relaxed overflow-x-auto">
                <pre>{`taskengine-tauri/
├── src-tauri/                       # Backend Nativo Rust (Tauri v2)
│   ├── Cargo.toml                   # Dependencias Rust (tauri, tauri-plugin-sql, tauri-plugin-notification)
│   ├── tauri.conf.json              # Configuración de ventana, bandejas (Tray) y permisos
│   ├── capabilities/
│   │   └── default.json             # Reglas de seguridad Tauri v2 (IPC, SQLite, Notificaciones)
│   ├── migrations/
│   │   └── 01_init.sql              # Esquema SQLite inicial con cursos y tareas
│   └── src/
│       ├── lib.rs                   # Configuración del System Tray, hooks de ventana y plugins
│       └── main.rs                  # Punto de entrada de la aplicación binaria
├── src/                             # Frontend React + TypeScript
│   ├── db/
│   │   ├── sqlite.ts                # Capa de abstracción SQLite (Tauri IPC + fallback Web persistente)
│   │   └── SQLiteManager.ts         # Persistencia nativa y demostración web
│   ├── services/
│   │   ├── notificationService.ts   # Motor de alertas nativas a 24h y 12h
│   │   └── trayService.ts           # Control de bandeja del sistema y ejecución en segundo plano
│   ├── types/
│   │   └── task.ts                  # Modelos de TypeScript (Task, Course, NotificationLog)
│   ├── components/                  # Componentes modulares con Tailwind CSS
│   │   ├── Header.tsx               # Barra de título desktop con controles de ventana
│   │   ├── TaskBoard.tsx            # Vista tipo tablero Kanban
│   │   ├── TaskList.tsx             # Vista tipo tabla/lista de alta densidad
│   │   ├── TaskModal.tsx            # Formulario CRUD con validaciones y fechas
│   │   ├── NotificationCenterModal.tsx   # Panel de auditoría de notificaciones y alertas de 24h/12h
│   │   ├── SystemTraySimulator.tsx  # Control interactivo de bandeja y segundo plano
│   │   └── TauriArchitectureModal.tsx   # Visualizador y exportador de archivos nativos
│   ├── App.tsx                      # Orquestador principal
│   └── main.tsx                     # Montaje de React
└── package.json`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-neutral-300">
              <h3 className="text-sm font-semibold text-neutral-100">
                Puesta en Marcha en tu Máquina Local
              </h3>

              <div className="space-y-2">
                <span className="font-semibold text-sky-400">Paso 1: Clonar o descargar el proyecto</span>
                <p className="text-neutral-400">Todos los archivos generados en esta sesión ya se encuentran en el repositorio actual.</p>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-sky-400">Paso 2: Instalar plugins de Tauri</span>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono text-neutral-200">
                  npm ci
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-sky-400">Paso 3: Ejecutar en modo desarrollo nativo</span>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono text-neutral-200">
                  npm run desktop:dev
                </div>
                <p className="text-neutral-400">
                  Esto levantará la ventana nativa de Tauri en Windows/Linux/macOS con la base de datos local SQLite y el System Tray activo.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-sky-400">Paso 4: Compilar ejecutable de producción (.exe / .dmg / .deb)</span>
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 font-mono text-neutral-200">
                  npm run desktop:build
                </div>
              </div>
            </div>
          )}

          {activeTab === 'queries' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-200">
                    Operaciones de almacenamiento de esta sesión
                  </h3>
                  <p className="text-xs text-neutral-400">
                    En escritorio se muestran consultas SQLite reales y su duración. La demostración web usa localStorage.
                  </p>
                </div>
                <button
                  onClick={() => setQueries(getExecutedQueries())}
                  className="px-3 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded"
                >
                  Actualizar
                </button>
              </div>

              <div className="space-y-2">
                {queries.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-neutral-800 rounded-lg text-neutral-500 text-xs">
                    Realiza una acción como crear o editar una tarea para ver las consultas SQL en vivo.
                  </div>
                ) : (
                  queries.map((q) => (
                    <div
                      key={q.id}
                      className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 font-mono text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <span className="text-sky-400">OPERACIÓN</span>
                        <span>{q.timestamp} · {q.durationMs}ms</span>
                      </div>
                      <div className="text-neutral-200 whitespace-pre-wrap">{q.sql}</div>
                      {q.params.length > 0 && (
                        <div className="text-[11px] text-neutral-400 pt-1 border-t border-neutral-900">
                          Params: {JSON.stringify(q.params)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex justify-between items-center text-xs">
          <span className="text-neutral-500">
            TaskEngine V1 · Arquitectura local
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
