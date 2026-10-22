/**
 * Bridge seguro para interactuar con APIs nativas de Tauri v2
 * Funciona de manera transparente tanto en el ejecutable de escritorio Tauri como en el preview web.
 */

import { isTauri as detectTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import * as notification from '@tauri-apps/plugin-notification';

export const isTauri = (): boolean => typeof window !== 'undefined' && detectTauri();
export const getTauriWindow = () => isTauri() ? getCurrentWindow() : null;
export const getTauriNotification = () => isTauri() ? notification : null;
