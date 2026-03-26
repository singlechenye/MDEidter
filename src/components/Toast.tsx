import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

function Toast({ message, type = 'success', duration = 2000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // 等待动画完成
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div className={`toast toast-${type} ${isVisible ? 'visible' : ''}`}>
      <span className="toast-icon">{icons[type]}</span>
      <span className="toast-message">{message}</span>
    </div>
  );
}

// Toast 管理器
interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastId = 0;
let toastCallbacks: {
  add: ((toast: ToastItem) => void) | null;
  remove: ((id: number) => void) | null;
} = { add: null, remove: null };

export const toast = {
  success: (message: string) => {
    if (toastCallbacks.add) {
      toastCallbacks.add({ id: ++toastId, message, type: 'success' });
    }
  },
  error: (message: string) => {
    if (toastCallbacks.add) {
      toastCallbacks.add({ id: ++toastId, message, type: 'error' });
    }
  },
  info: (message: string) => {
    if (toastCallbacks.add) {
      toastCallbacks.add({ id: ++toastId, message, type: 'info' });
    }
  },
};

// Toast 容器组件
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    toastCallbacks.add = (toast: ToastItem) => {
      setToasts(prev => [...prev, toast]);
    };
    toastCallbacks.remove = (id: number) => {
      setToasts(prev => prev.filter(t => t.id !== id));
    };

    return () => {
      toastCallbacks.add = null;
      toastCallbacks.remove = null;
    };
  }, []);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => toastCallbacks.remove?.(toast.id)}
        />
      ))}
    </div>
  );
}

export default Toast;