'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, AlertCircle, Heart } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'warn' | 'care';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const icons = {
  success: <CheckCircle size={16} className="text-[#1F9D6B]" />,
  error:   <XCircle size={16} className="text-[#D23B3B]" />,
  warn:    <AlertCircle size={16} className="text-[#C9821A]" />,
  care:    <Heart size={16} className="text-[#E8623D]" />,
};

const variantClass = {
  success: 'border-emerald-200 bg-white',
  error:   'border-red-200 bg-white',
  warn:    'border-amber-200 bg-white',
  care:    'border-orange-200 bg-[#FCEDE7]',
};

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const toast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    const t = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
      timers.current.delete(id);
    }, 4000);
    timers.current.set(id, t);
  }, []);

  const dismiss = (id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[12px] border shadow-[0_4px_16px_rgba(21,22,26,.12)] max-w-sm fade-up ${variantClass[t.variant]}`}
          >
            {icons[t.variant]}
            <p className="text-sm text-[#15161A] flex-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-[#5B5F6B] hover:text-[#15161A] transition-colors"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
