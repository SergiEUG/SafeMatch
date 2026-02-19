/**
 * Sistema de Notificacions Toast - Professional
 * 
 * Substitueix alert() i console.log() per notificacions elegants
 * Tipus: success, error, info, warning
 */

import { ref, readonly } from 'vue';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration: number;
}

const toasts = ref<Toast[]>([]);

let toastIdCounter = 0;

function createToast(type: Toast['type'], message: string, duration = 3000) {
  const id = `toast-${++toastIdCounter}`;
  
  const toast: Toast = {
    id,
    type,
    message,
    duration,
  };

  toasts.value.push(toast);

  // Auto-remove després de duration
  if (duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }

  return id;
}

function removeToast(id: string) {
  const index = toasts.value.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.value.splice(index, 1);
  }
}

export const useToast = () => {
  return {
    toasts: readonly(toasts),
    success: (message: string, duration?: number) => createToast('success', message, duration),
    error: (message: string, duration?: number) => createToast('error', message, duration),
    info: (message: string, duration?: number) => createToast('info', message, duration),
    warning: (message: string, duration?: number) => createToast('warning', message, duration),
    remove: removeToast,
    clear: () => toasts.value = [],
  };
};

// Export singleton per usar directament
export const toast = {
  success: (message: string, duration?: number) => createToast('success', message, duration),
  error: (message: string, duration?: number) => createToast('error', message, duration),
  info: (message: string, duration?: number) => createToast('info', message, duration),
  warning: (message: string, duration?: number) => createToast('warning', message, duration),
};
