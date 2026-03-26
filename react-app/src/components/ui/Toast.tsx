import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onDone: () => void;
}

export default function Toast({ message, type = 'success', onDone }: ToastProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 10);
    const t2 = setTimeout(() => {
      setShow(false);
      setTimeout(onDone, 300);
    }, 3000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div className={`toast ${type} ${show ? 'show' : ''}`}>
      {message}
    </div>
  );
}
