/** Journal des événements enregistrés dans l'application. */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Search, Filter, AlertTriangle, Info, ShieldAlert } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  const { logsAudit } = useApp();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredLogs = logsAudit.filter(l => {
    const matches = l.action.toLowerCase().includes(query.toLowerCase()) ||
      l.details.toLowerCase().includes(query.toLowerCase()) ||
      l.utilisateur.toLowerCase().includes(query.toLowerCase()) ||
      l.entite.toLowerCase().includes(query.toLowerCase());
    
    if (filterType === 'ALL') return matches;
    return matches && l.type === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Journal d'activité
              </h3>
              <p className="text-xs text-slate-400">
                Événements enregistrés par l'application. Ce journal n'est pas un audit certifié.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par action, utilisateur, entité..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">Tous les événements</option>
              <option value="INFO">Infos / Standard</option>
              <option value="AVERTISSEMENT">Avertissements</option>
              <option value="CRITIQUE">Critiques / Sécurité</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/80">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 sticky top-0 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Horodatage</th>
                <th className="py-2.5 px-3">Utilisateur (Rôle)</th>
                <th className="py-2.5 px-3">Action Système</th>
                <th className="py-2.5 px-3">Entité Ciblée</th>
                <th className="py-2.5 px-3">Détails de l'Opération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {log.date}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-bold text-white block">{log.utilisateur}</span>
                    <span className="text-[10px] text-slate-500">{log.role}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-amber-300">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-300 whitespace-nowrap">
                    {log.entite}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>{filteredLogs.length} événements répertoriés dans le journal chiffré</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
