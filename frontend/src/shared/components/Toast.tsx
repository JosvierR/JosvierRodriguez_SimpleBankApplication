import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, CircleAlert, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ToastKind = 'success' | 'error';
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}
interface ToastContextValue {
  notify: (message: string, kind?: ToastKind) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<ToastItem[]>([]);
  const remove = useCallback((id: number) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const notify = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = Date.now() + Math.random();
      setItems((current) => [...current, { id, message, kind }]);
      window.setTimeout(() => remove(id), kind === 'error' ? 7000 : 4500);
    },
    [remove],
  );
  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="region" aria-live="polite" aria-label={t('notifications.regionLabel')}>
        {items.map((item) => (
          <div className={`toast toast--${item.kind}`} key={item.id} role={item.kind === 'error' ? 'alert' : 'status'}>
            {item.kind === 'success' ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
            <span>{item.message}</span>
            <button className="icon-button" type="button" aria-label={t('notifications.dismiss')} onClick={() => remove(item.id)}>
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// This hook intentionally shares its provider module to keep the tiny notification system cohesive.
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
