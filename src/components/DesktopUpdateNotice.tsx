import React, { useEffect, useState } from 'react';
import type { DesktopUpdateStatus } from '../types/desktop';

export const DesktopUpdateNotice: React.FC = () => {
  const [status, setStatus] = useState<DesktopUpdateStatus>({ state: 'idle' });
  const updater = window.autoGestionUpdater;

  useEffect(() => {
    if (!updater) return;
    const unsubscribe = updater.onStatus(setStatus);
    void updater.getStatus().then(setStatus).catch(error => {
      setStatus({ state: 'error', message: error instanceof Error ? error.message : 'État de mise à jour indisponible.' });
    });
    return unsubscribe;
  }, [updater]);

  if (!updater || status.state === 'idle' || status.state === 'not-available') return null;

  const message = {
    checking: 'Recherche des mises à jour…',
    available: `Mise à jour ${status.version ? `v${status.version} ` : ''}disponible. Téléchargement en cours…`,
    downloading: `Téléchargement de la mise à jour : ${status.percent ?? 0} %`,
    downloaded: `La mise à jour${status.version ? ` v${status.version}` : ''} est prête à être installée.`,
    error: `La vérification de mise à jour a échoué${status.message ? ` : ${status.message}` : '.'}`,
    idle: '',
    'not-available': ''
  }[status.state];

  return (
    <aside
      role={status.state === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 text-sm ${
        status.state === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-900'
          : 'border-blue-200 bg-blue-50 text-blue-950'
      }`}
    >
      <span>{message}</span>
      {status.state === 'downloading' && (
        <progress className="h-2 w-36 accent-blue-700" max={100} value={status.percent ?? 0}>
          {status.percent ?? 0}%
        </progress>
      )}
      {status.state === 'downloaded' && (
        <button
          type="button"
          onClick={() => updater.installUpdate()}
          className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Redémarrer et installer
        </button>
      )}
      {status.state === 'error' && (
        <button
          type="button"
          onClick={() => updater.checkForUpdates()}
          className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-bold text-rose-900 hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
        >
          Réessayer
        </button>
      )}
    </aside>
  );
};
