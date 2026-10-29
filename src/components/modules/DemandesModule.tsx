/**
 * Gestion interne des demandes clients enregistrées dans l'établissement.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DemandeReservation } from '../../types';
import {
  Inbox,
  CheckCircle2,
  Calendar,
  Clock,
  Car,
  XCircle,
  Phone,
  MessageSquare,
  Sparkles,
  Wrench,
  ParkingSquare,
} from 'lucide-react';

export const DemandesModule: React.FC = () => {
  const {
    demandesReservations,
    traiterDemandeReservation,
    formatCurrency,
    showNotification
  } = useApp();

  const [selectedDemande, setSelectedDemande] = useState<DemandeReservation | null>(null);
  const [actionType, setActionType] = useState<'ACCEPTEE' | 'REPORTEE' | 'REFUSEE'>('ACCEPTEE');
  const [reponseMessage, setReponseMessage] = useState('');

  const handleOpenActionModal = (demande: DemandeReservation, action: 'ACCEPTEE' | 'REPORTEE' | 'REFUSEE') => {
    setSelectedDemande(demande);
    setActionType(action);
    if (action === 'ACCEPTEE') {
      setReponseMessage('Demande acceptée. Contacter le client pour confirmer le créneau.');
    } else if (action === 'REPORTEE') {
      setReponseMessage('Proposition de report à confirmer directement avec le client.');
    } else {
      setReponseMessage('Demande refusée. Contacter le client pour lui expliquer la décision.');
    }
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemande) return;

    traiterDemandeReservation(selectedDemande.id, actionType, reponseMessage);
    setSelectedDemande(null);
  };

  const getServiceIcon = (type: DemandeReservation['type_service']) => {
    switch (type) {
      case 'GARAGE': return <Wrench className="w-4 h-4 text-amber-400" />;
      case 'LAVAGE': return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'PARKING': return <ParkingSquare className="w-4 h-4 text-blue-400" />;
    }
  };

  const nouvelles = demandesReservations.filter(d => d.statut === 'NOUVELLE');
  const traitees = demandesReservations.filter(d => d.statut !== 'NOUVELLE');

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">
            <Inbox className="w-4 h-4" />
            <span>Suivi interne des demandes clients</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Demandes clients
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Les décisions et notes sont enregistrées ici. Aucun message ni notification n’est envoyé au client.
          </p>
        </div>

        <div className="bg-slate-950 px-4 py-2 rounded-xl border border-sky-500/30 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          <span className="text-xs font-bold text-sky-300">
            {nouvelles.length} demande(s) en attente de réponse gérant
          </span>
        </div>
      </div>

      {/* New Inbound Demands */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Nouvelles demandes à traiter</span>
        </h2>

        {nouvelles.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
            Aucune nouvelle demande n’est enregistrée.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nouvelles.map(d => (
              <div key={d.id} className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-2xl p-5 space-y-3 transition flex flex-col justify-between shadow-md">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-mono text-xs font-bold text-sky-400">
                      {d.code_demande}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                      {getServiceIcon(d.type_service)}
                      <span>{d.type_service}</span>
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="font-bold text-white text-sm">{d.client_nom}</div>
                    <div className="text-xs text-slate-400 font-mono">📞 {d.telephone}</div>
                    <div className="text-xs font-mono font-bold text-amber-400 mt-1">🚘 Plaque: {d.plaque}</div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300 italic">
                    "{d.description_panne_demande}"
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>🗓️ {d.date_souhaitee}</span>
                    <span className="font-bold text-white">⏰ {d.creneau_heure}</span>
                  </div>
                </div>

                {/* Gérant Response Actions */}
                <div className="pt-3 border-t border-slate-800 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleOpenActionModal(d, 'ACCEPTEE')}
                    className="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition cursor-pointer text-center"
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => handleOpenActionModal(d, 'REPORTEE')}
                    className="py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition cursor-pointer text-center"
                  >
                    Reporter
                  </button>
                  <button
                    onClick={() => handleOpenActionModal(d, 'REFUSEE')}
                    className="py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-700 text-xs font-bold transition cursor-pointer text-center"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed History */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <h2 className="text-sm font-bold text-white mb-3">Historique des Rendez-vous Confirmés & Réponses Envoyées</h2>
        <div className="space-y-2">
          {traitees.map(d => (
            <div key={d.id} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-400">{d.code_demande}</span>
                <div>
                  <span className="font-bold text-white">{d.client_nom}</span> ({d.plaque}) • <span className="text-slate-300 font-semibold">{d.type_service}</span>
                  <div className="text-[11px] text-slate-400">{d.reponse_gerant}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-400">{d.date_souhaitee} {d.creneau_heure}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  d.statut === 'ACCEPTEE' ? 'bg-emerald-500/20 text-emerald-300' : d.statut === 'REPORTEE' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {d.statut}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Internal request handling */}
      {selectedDemande && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  actionType === 'ACCEPTEE' ? 'bg-emerald-600/30 text-emerald-400' : actionType === 'REPORTEE' ? 'bg-amber-600/30 text-amber-400' : 'bg-red-600/30 text-red-400'
                }`}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {actionType === 'ACCEPTEE' ? 'Confirmation du Rendez-vous' : actionType === 'REPORTEE' ? 'Proposition de Report' : 'Refus de la Demande'}
                  </h3>
                  <p className="text-xs text-slate-400">La note est enregistrée en interne ; aucun message n’est envoyé.</p>
                </div>
              </div>
              <button onClick={() => setSelectedDemande(null)} className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Client :</span>
                  <span className="font-bold text-white">{selectedDemande.client_nom} ({selectedDemande.telephone})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Véhicule :</span>
                  <span className="font-mono text-amber-400">{selectedDemande.plaque}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Créneau initial demandé :</span>
                  <span className="font-mono text-slate-200">{selectedDemande.date_souhaitee} à {selectedDemande.creneau_heure}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Note interne de traitement (non transmise au client) :
                </label>
                <textarea
                  rows={4}
                  required
                  value={reponseMessage}
                  onChange={(e) => setReponseMessage(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setSelectedDemande(null)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">Annuler</button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 cursor-pointer ${
                    actionType === 'ACCEPTEE' ? 'bg-emerald-600 hover:bg-emerald-500' : actionType === 'REPORTEE' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Enregistrer le traitement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
