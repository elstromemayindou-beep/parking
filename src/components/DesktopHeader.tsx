/**
 * AutoGestion Pro v3.0 - Desktop Executive Header
 * Displays Electron-like window bar, branch switcher, RBAC role switcher, Edge/Offline status, and audit triggers
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft,
  Shield,
  Wifi,
  Clock,
  Building2,
  HelpCircle,
  LogOut,
  Settings2
} from 'lucide-react';

interface DesktopHeaderProps {
  onOpenAudit: () => void;
  onOpenHelp: () => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  onOpenAudit,
  onOpenHelp
}) => {
  const {
    userRole,
    currentSuccursale,
    setCurrentSuccursale,
    succursales,
    databaseStatus,
    userEmail,
    signOut,
    activeModule,
    setActiveModule
  } = useApp();

  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
      setDateStr(now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="app-header sticky top-0 z-40 select-none border-b border-slate-200 text-slate-900">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => setActiveModule('HUB')}
            aria-label="Retour au tableau de bord"
            className="nav-brand flex items-center gap-3 rounded-xl text-left"
          >
            <img src="./autogestion-pro-logo.svg" alt="" className="h-11 w-11 shrink-0 rounded-2xl shadow-lg shadow-blue-600/20" />
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="truncate text-base font-extrabold tracking-tight text-slate-950">AutoGestion<span className="text-blue-700">Pro</span></span>
                <span className="rounded-md border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-800">Gérant</span>
              </span>
              <span className="mt-0.5 block text-[11px] font-medium text-slate-500">Pilotage de l’établissement</span>
            </span>
          </button>
          {activeModule !== 'HUB' && (
            <button
              onClick={() => setActiveModule('HUB')}
              className="glass-button hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-blue-800 sm:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Tableau de bord
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 shadow-sm backdrop-blur">
            <Building2 className="h-4 w-4 text-blue-700" />
            <span className="sr-only">Établissement actif</span>
            <select
              value={currentSuccursale.id}
              onChange={event => {
                const selected = succursales.find(branch => branch.id === Number(event.target.value));
                if (selected) setCurrentSuccursale(selected);
              }}
              className="max-w-44 cursor-pointer bg-transparent text-xs font-semibold text-slate-800 outline-none"
            >
              {succursales.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.nom} · {branch.ville}</option>
              ))}
          </select>
          </label>

          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold ${
            databaseStatus === 'connected'
              ? 'border-emerald-200 bg-emerald-50/90 text-emerald-800'
              : databaseStatus === 'error'
                ? 'border-rose-200 bg-rose-50/90 text-rose-800'
                : 'border-slate-200 bg-white/80 text-slate-600'
          }`}>
            <Wifi className="h-3.5 w-3.5" />
            {databaseStatus === 'connected' ? 'Base connectée' : databaseStatus === 'error' ? 'Erreur de connexion' : 'Connexion en cours'}
          </span>

          <span className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-white/55 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur md:inline-flex">
            <Clock className="h-3.5 w-3.5 text-blue-700" />
            {dateStr} · {timeStr}
          </span>

          <button
            onClick={onOpenAudit}
            className="glass-button inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
            title="Ouvrir le journal d’activité"
          >
            <Shield className="h-4 w-4 text-blue-700" />
            <span className="hidden lg:inline">Activité</span>
          </button>

          <button
            onClick={onOpenHelp}
            className="glass-button inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-700"
            aria-label="Ouvrir l’aide"
            title="Aide"
          >
            <HelpCircle className="h-4 w-4 text-blue-700" />
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/65 py-1 pl-2 pr-1 shadow-sm backdrop-blur">
            <span className="hidden max-w-36 truncate text-[11px] font-medium text-slate-600 xl:inline" title={userEmail || ''}>{userEmail}</span>
            <span className="rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-800">{userRole.replace('_', ' ')}</span>
            {(userRole === 'GERANT' || userRole === 'PROPRIETAIRE') && (
              <button
                onClick={() => setActiveModule('PARAMETRES')}
                title="Tarifs et profil du gérant"
                aria-label="Ouvrir les tarifs et le profil"
                className="rounded-lg p-1.5 text-slate-600 transition hover:bg-blue-50 hover:text-blue-800"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => void signOut()} title="Se déconnecter" aria-label="Se déconnecter" className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
