/**
 * Bridge seguro para interactuar con APIs nativas de Tauri v2
 * Funciona de manera transparente tanto en el ejecutable de escritorio Tauri como en el preview web.
 */

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && Boolean((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__);
};

export const getTauriWindow = () => {
  if (typeof window !== 'undefined' && (window as any).__TAURI__?.window) {
    return (window as any).__TAURI__.window.getCurrentWindow();
  }
  return null;
};

export const getTauriNotification = () => {
  if (typeof window !== 'undefined' && (window as any).__TAURI__?.notification) {
    return (window as any).__TAURI__.notification;
  }
  return null;
};
