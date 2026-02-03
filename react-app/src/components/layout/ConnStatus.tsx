import { useNetwork } from '../../hooks/useNetwork';
import { getLastSyncTime } from '../../lib/cache';
import { useState, useEffect } from 'react';

function formatAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'à l\u0027instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

export default function ConnStatus() {
  const { online, quality } = useNetwork();
  const [lastSync, setLastSync] = useState<number | null>(null);

  useEffect(() => {
    getLastSyncTime().then(setLastSync);
    const id = setInterval(() => getLastSyncTime().then(setLastSync), 30000);
    return () => clearInterval(id);
  }, []);

  if (online && quality === '4g') return null;

  let className = 'conn-status';
  let label = '';

  if (!online) {
    className += ' offline';
    label = 'Hors ligne';
    if (lastSync) label += ` \u00B7 sync ${formatAgo(lastSync)}`;
  } else if (quality === '2g') {
    className += ' slow';
    label = 'Connexion faible (2G)';
  } else if (quality === '3g') {
    className += ' medium';
    label = 'Connexion moyenne';
  }

  return (
    <div className={className}>
      <span className="conn-dot" />
      <span className="conn-label">{label}</span>
    </div>
  );
}
