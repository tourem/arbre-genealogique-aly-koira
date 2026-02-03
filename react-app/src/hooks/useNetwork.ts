import { useState, useEffect } from 'react';

export type ConnectionQuality = 'offline' | '2g' | '3g' | '4g';

interface NetworkState {
  online: boolean;
  quality: ConnectionQuality;
  saveData: boolean;
}

function getQuality(): ConnectionQuality {
  if (!navigator.onLine) return 'offline';
  const conn = (navigator as any).connection;
  if (!conn) return '4g';
  const type: string = conn.effectiveType || '4g';
  if (type === 'slow-2g' || type === '2g') return '2g';
  if (type === '3g') return '3g';
  return '4g';
}

function getSaveData(): boolean {
  const conn = (navigator as any).connection;
  return conn?.saveData === true;
}

export function useNetwork(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    online: navigator.onLine,
    quality: getQuality(),
    saveData: getSaveData(),
  });

  useEffect(() => {
    function update() {
      setState({
        online: navigator.onLine,
        quality: getQuality(),
        saveData: getSaveData(),
      });
    }

    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', update);
    }

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      if (conn) {
        conn.removeEventListener('change', update);
      }
    };
  }, []);

  return state;
}
