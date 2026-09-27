'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import Link from 'next/link';

// Minimal toast system: instant visual confirmation for every action.
// Usage: const toast = useToast(); toast.success('Saved!'); toast.error('…');
// <ToastProvider> must wrap the app (mounted in the root layout).

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number; kind: ToastKind; text: string;
  action?: { label: string; href?: string; onClick?: () => void };
}

interface ToastAction { label: string; href?: string; onClick?: () => void }

const ToastCtx = createContext<{
  success: (text: string, action?: ToastAction) => void;
  error: (text: string) => void;
  info: (text: string) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  return ctx ?? { success: () => {}, error: () => {}, info: () => {} };
}

const KIND_STYLE: Record<ToastKind, string> = {
  success: 'bg-leaf-500 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-stone-800 text-white',
};
const KIND_ICON: Record<ToastKind, string> = { success: '✓', error: '✕', info: 'ℹ' };

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, text: string, action?: ToastAction) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, kind, text, action }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), kind === 'error' ? 6000 : 3500);
  }, []);

  const api = {
    success: (text: string, action?: ToastAction) => push('success', text, action),
    error: (text: string) => push('error', text),
    info: (text: string) => push('info', text),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {/* Toast stack — bottom center, above mobile nav thumb zone */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} role="status" aria-live="polite"
            className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${KIND_STYLE[t.kind]}`}>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25 text-xs">{KIND_ICON[t.kind]}</span>
            <span>{t.text}</span>
            {t.action && (
              t.action.onClick ? (
                <button type="button" onClick={t.action.onClick} className="ml-1 shrink-0 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-bold hover:bg-white/30">
                  {t.action.label}
                </button>
              ) : (
                <Link href={t.action.href ?? '/'} className="ml-1 shrink-0 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-bold hover:bg-white/30">
                  {t.action.label}
                </Link>
              )
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
