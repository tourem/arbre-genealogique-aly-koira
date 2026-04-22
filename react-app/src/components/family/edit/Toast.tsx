import { useCallback, useRef, useState } from 'react';

interface ToastState {
  message: string;
  visible: boolean;
}

/**
 * Lightweight toast notification. Use via the useToast() hook:
 *
 *   const toast = useToast();
 *   toast.show('Fiche enregistrée');
 *   // render near the bottom of your tree:
 *   {toast.render()}
 */
export function useToast() {
  const [state, setState] = useState<ToastState>({ message: '', visible: false });
  const timerRef = useRef<number | null>(null);

  const show = useCallback((msg: string) => {
    setState({ message: msg, visible: true });
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setState((s) => ({ ...s, visible: false }));
      timerRef.current = null;
    }, 2400);
  }, []);

  const render = useCallback(() => {
    return (
      <div
        className={`edit-toast${state.visible ? ' is-visible' : ''}`}
        role="status"
        aria-live="polite"
        aria-hidden={!state.visible}
      >
        <span className="edit-toast-dot" aria-hidden="true" />
        <span className="edit-toast-msg">{state.message}</span>
      </div>
    );
  }, [state]);

  return { show, render };
}
