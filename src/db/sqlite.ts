import type { Task, Course } from '../types/task';
import { SQLiteManager } from './SQLiteManager';
import { isTauri } from '../utils/tauriBridge';
export { getExecutedQueries } from './SQLiteManager';
export type { QueryLog } from './SQLiteManager';
export const isTauriEnvironment = isTauri;

const INITIAL_COURSES: Course[] = [
  { id: 'c1', name: 'Arquitectura de Software', code: 'IS-501', semester: '8vo Semestre', color: '#38bdf8' },
  { id: 'c2', name: 'Algoritmos y Estructuras de Datos', code: 'IS-202', semester: '4to Semestre', color: '#a855f7' },
  { id: 'c3', name: 'Base de Datos Distribuidas', code: 'IS-403', semester: '7mo Semestre', color: '#10b981' },
  { id: 'c4', name: 'Redes y Comunicaciones II', code: 'IS-404', semester: '7mo Semestre', color: '#f59e0b' },
  { id: 'c5', name: 'Inteligencia Artificial y ML', code: 'IS-601', semester: '9no Semestre', color: '#ec4899' },
  { id: 'c6', name: 'Sistemas Operativos', code: 'IS-303', semester: '5to Semestre', color: '#6366f1' },
  { id: 'c7', name: 'Seguridad de la Información', code: 'IS-505', semester: '8vo Semestre', color: '#ef4444' },
];

const now = new Date();
const inHours = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();
const inDays = (d: number) => new Date(now.getTime() + d * 24 * 3600 * 1000).toISOString();

const INITIAL_TASKS: Task[] = [
  {
    id: 't-101',
    title: 'Informe Técnico: Microservicios vs Monolito Modular con Event Sourcing',
    course_id: 'c1',
    course_name: 'Arquitectura de Software',
    deadline: inHours(8), // En 8 horas: ¡Alerta < 12h!
    status: 'en_progreso',
    priority: 'alta',
    description: 'Documentar el patrón CQRS y Event Sourcing implementado con Apache Kafka y Rust.',
    tags: ['Arquitectura', 'Kafka', 'Rust'],
    notified_24h: 1,
    notified_12h: 0,
    created_at: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't-102',
    title: 'Laboratorio 4: Análisis de Complejidad Temporal en Árboles B+ y Red-Black',
    course_id: 'c2',
    course_name: 'Algoritmos y Estructuras de Datos',
    deadline: inHours(20), // En 20 horas: ¡Alerta < 24h (1 día)!
    status: 'pendiente',
    priority: 'alta',
    description: 'Implementar algoritmos de balanceo e inserción con benchmarks en microsegundos.',
    tags: ['Algoritmos', 'Árboles', 'C++'],
    notified_24h: 0,
    notified_12h: 0,
    created_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't-103',
    title: 'Proyecto Semestral: Particionamiento Sharding y Replicación Raft',
    course_id: 'c3',
    course_name: 'Base de Datos Distribuidas',
    deadline: inDays(3),
    status: 'en_progreso',
    priority: 'media',
    description: 'Configurar clúster distribuido de 3 nodos con consenso Raft y tolerancia a fallos.',
    tags: ['Sistemas Distribuidos', 'Raft', 'SQLite'],
    notified_24h: 0,
    notified_12h: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't-104',
    title: 'Captura de Paquetes Wireshark y Protocolo TCP Handshake Análisis',
    course_id: 'c4',
    course_name: 'Redes y Comunicaciones II',
    deadline: inDays(5),
    status: 'pendiente',
    priority: 'media',
    description: 'Análisis de ventanas de congestión TCP Reno vs Cubic en condiciones de pérdida.',
    tags: ['Redes', 'Wireshark'],
    notified_24h: 0,
    notified_12h: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't-105',
    title: 'Entrega Final: Red Neuronal Convolucional (CNN) para Detección de Anomalías',
    course_id: 'c5',
    course_name: 'Inteligencia Artificial y ML',
    deadline: inDays(7),
    status: 'pendiente',
    priority: 'alta',
    description: 'Entrenar modelo PyTorch con matriz de confusión y métricas F1-Score superiores al 95%.',
    tags: ['Deep Learning', 'PyTorch'],
    notified_24h: 0,
    notified_12h: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 't-106',
    title: 'Driver de Dispositivo en C y Llamadas al Sistema POSIX',
    course_id: 'c6',
    course_name: 'Sistemas Operativos',
    deadline: inHours(-12), // Tarea pasada completada
    status: 'completada',
    priority: 'media',
    description: 'Compilación del kernel Linux con módulo char device personalizado.',
    tags: ['Kernel', 'Linux', 'C'],
    notified_24h: 1,
    notified_12h: 1,
    created_at: new Date(now.getTime() - 72 * 3600 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];


export const sqliteService = new SQLiteManager({ tasks: INITIAL_TASKS, courses: INITIAL_COURSES });
