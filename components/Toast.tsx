'use client';

import { createContext, useCallback, useContext, useState } from 'react';

type Tone = 'info' | 'success' | 'error';
type ToastItem = { id: number; tone: Tone; text: string };

const ToastCtx = createContext<((text: string, tone?: Tone) => void) | null>(null);

export function useToast() {
  const fn = useContext(ToastCtx);
  if (!fn) throw new Error('useToast outside ToastProvider');
  return fn;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((text: string, tone: Tone = 'info') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, tone, text }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={
              'rounded-lg px-4 py-2 text-sm shadow-lg ' +
              (t.tone === 'error'
                ? 'bg-red-600 text-white'
                : t.tone === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-900 text-white')
            }
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
