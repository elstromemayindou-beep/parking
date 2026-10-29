/**
 * AutoGestion Pro v3.0 - Module 8: Dettes & Crédits Clients
 * Requirements:
 * - RF-63 : Suivi des factures impayées, échéanciers et saisie des versements échelonnés
 * - Blocage automatique des prestations si le client dépasse son découvert autorisé
 * - Génération de bordereaux de relance transmissibles par SMS & WhatsApp
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Facture, PaymentMethod, Client } from '../../types';
import {
  HandCoins,
  AlertCircle,
  Smartphone,
  CheckCircle2,
  Lock,
  ArrowRight,
  MessageCircle,
  FileText,
  Search,
  Filter,
  Coins
} from 'lucide-react';

export const DettesModule: React.FC = () => {
  const {
    factures,
    clients,
    vehicules,
    lavages,
    ticketsParking,
    enregistrerVersementDette,
    formatCurrency,
    showNotification
  } = useApp();

  const [selectedFactureForPayment, setSelectedFactureForPayment] = useState<Facture | null>(null);
  const [versementMontant, setVersementMontant] = useState<number>(50000);
  const [versementMode, setVersementMode] = useState<PaymentMethod>('MTN_MOMO');
  const [filterQuery, setFilterQuery] = useState('');

  // WhatsApp reminder modal
  const [whatsappModalFacture, setWhatsappModalFacture] = useState<Facture | null>(null);

  const facturesImpayees = factures.filter(f => f.statut === 'IMPAYE' || f.statut === 'PARTIEL');
  const totalCreances = facturesImpayees.reduce((sum, f) => sum + (f.montant_total - f.montant_paye), 0);
  const frequencesClients = clients.map(client => {
    const clientPhone = client.telephone.replace(/\D/g, '');
    const clientPlates = new Set(vehicules.filter(vehicle => vehicle.client_id === client.id).map(vehicle => vehicle.plaque.toUpperCase().trim()));
    const lavagesTermines = lavages.filter(wash =>
      wash.statut === 'LIVRE_PAYE' &&
      (wash.client_id === client.id || clientPhone.length > 0 && wash.client_telephone.replace(/\D/g, '') === clientPhone ||
        clientPlates.has(wash.plaque.toUpperCase().trim()))
    ).length;
    const stationnementsTermines = ticketsParking.filter(ticket =>
      ticket.statut === 'PAYE_SORTI' &&
      (ticket.client_id === client.id || clientPlates.has(ticket.plaque.toUpperCase().trim()))
    ).length;
    const reparationsTerminees = factures.filter(facture =>
      facture.client_id === client.id && facture.type_service === 'GARAGE' && facture.statut !== 'ANNULEE'
    ).length;
    return {
      client,
      count: lavagesTermines + stationnementsTermines + reparationsTerminees,
      lavages: lavagesTermines,
      stationnements: stationnementsTermines,
      reparations: reparationsTerminees
    };
  }).filter(item => item.count > 0).sort((a, b) => b.count - a.count);
  const clientsFideles = frequencesClients.filter(item => item.count >= 5);

  const handleVersementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFactureForPayment) return;
    if (!versementMontant || versementMontant <= 0) {
      showNotification('Montant invalide', 'warning');
      return;
    }

    enregistrerVersementDette(
      selectedFactureForPayment.id,
      Number(versementMontant),
      versementMode
    );

    setSelectedFactureForPayment(null);
  };

  const getClientTotalDue = (clientId: number) => {
    return factures
      .filter(f => f.client_id === clientId && (f.statut === 'IMPAYE' || f.statut === 'PARTIEL'))
      .reduce((sum, f) => sum + (f.montant_total - f.montant_paye), 0);
  };

  const generateWhatsAppMessage = (facture: Facture, client: Client) => {
    const resteDu = facture.montant_total - facture.montant_paye;
    return `Bonjour ${client.nom}, selon nos informations, le solde de votre facture ${facture.numero} concernant ${facture.description} est de ${formatCurrency(resteDu)}. Merci de nous contacter pour convenir des modalités de règlement. Cordialement.`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Brouillon copié. Vous pouvez le coller dans votre messagerie.');
    } catch {
      showNotification('Impossible d’accéder au presse-papiers. Sélectionnez et copiez le texte manuellement.', 'warning');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-yellow-400 mb-1">
            <HandCoins className="w-4 h-4" />
            <span>Module Dettes & Crédits Clients</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Suivi des Créances, Règlements Partiels & Relances
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Recouvrement échelonné (RF-63), plafonds de crédit avec blocage et messages WhatsApp automatisés.
          </p>
        </div>

        <div className="bg-slate-950 px-4 py-2.5 rounded-xl border border-amber-500/40 flex items-center gap-3">
          <span className="text-xs text-slate-400">Total Créances Dehors :</span>
          <span className="text-base font-black text-amber-400 font-mono">
            {formatCurrency(totalCreances)}
          </span>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50 p-4">
          <div>
            <h2 className="text-sm font-bold text-emerald-950">Fréquence de visite et clients fidèles</h2>
            <p className="mt-1 text-xs text-emerald-900">Un client est fidèle après 5 services terminés, toutes périodes confondues. Les prestations annulées sont exclues.</p>
          </div>
          <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">{clientsFideles.length} client(s) fidèle(s)</span>
        </div>
        {frequencesClients.length === 0 ? (
          <p className="p-5 text-center text-xs text-slate-500">Aucune prestation terminée n’est encore reliée à une fiche client.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Client</th>
                  <th className="px-4 py-2.5 text-center">Lavages</th>
                  <th className="px-4 py-2.5 text-center">Parkings</th>
                  <th className="px-4 py-2.5 text-center">Garages</th>
                  <th className="px-4 py-2.5 text-right">Services terminés</th>
                  <th className="px-4 py-2.5">Fidélité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {frequencesClients.map(({ client, count, lavages: washCount, stationnements, reparations }) => (
                  <tr key={client.id}>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{client.nom}</p>
                      <p className="text-[11px] text-slate-500">{client.telephone}</p>
                    </td>
                    <td className="px-4 py-3 text-center">{washCount}</td>
                    <td className="px-4 py-3 text-center">{stationnements}</td>
                    <td className="px-4 py-3 text-center">{reparations}</td>
                    <td className="px-4 py-3 text-right font-mono font-black">{count}</td>
                    <td className="px-4 py-3">
                      {count >= 5
                        ? <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800">Client fidèle</span>
                        : <span className="text-slate-500">{5 - count} avant fidélité</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Debtors List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span>Factures en Souffrance & Versements Échelonnés ({facturesImpayees.length})</span>
          </h2>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher facture, client..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">N° Facture</th>
                <th className="py-3 px-4">Client Débiteur</th>
                <th className="py-3 px-4">Service & Objet</th>
                <th className="py-3 px-4 text-right">Montant Total</th>
                <th className="py-3 px-4 text-right">Déjà Payé</th>
                <th className="py-3 px-4 text-right">Reste Dû</th>
                <th className="py-3 px-4 text-center">Statut Plafond</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {facturesImpayees.map(f => {
                const client = clients.find(c => c.id === f.client_id);
                const totalDue = client ? getClientTotalDue(client.id) : 0;
                const isOverLimit = client ? totalDue > client.plafond_credit || client.bloque_credit : false;
                const resteDu = f.montant_total - f.montant_paye;

                return (
                  <tr key={f.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-yellow-400">
                      {f.numero}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{client?.nom || 'Client introuvable'}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {client?.telephone ? `📞 ${client.telephone}` : 'Téléphone non renseigné'}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                      {f.description}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {formatCurrency(f.montant_total)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400">
                      {formatCurrency(f.montant_paye)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-400 text-sm">
                      {formatCurrency(resteDu)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {!client ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                          Compte client introuvable
                        </span>
                      ) : isOverLimit ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 flex items-center justify-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Bloqué Plafond
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                          Dans le plafond
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setWhatsappModalFacture(f)}
                        disabled={!client}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 text-[11px] font-bold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        title={client ? 'Préparer un brouillon de relance à copier' : 'Aucun compte client associé à cette facture'}
                      >
                        <MessageCircle className="w-3.5 h-3.5 inline mr-1" />
                        Relance
                      </button>

                      <button
                        onClick={() => {
                          setSelectedFactureForPayment(f);
                          setVersementMontant(resteDu);
                        }}
                        className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-500 text-black font-extrabold text-[11px] shadow-sm transition cursor-pointer"
                      >
                        Encaisser Acompte
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clients Credit Limits Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <h3 className="text-sm font-bold text-white mb-3">
          Surveillance des Plafonds de Découvert Autorisés (Règle Anti-Déficit RF-63)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {clients.map(c => {
            const due = getClientTotalDue(c.id);
            const ratio = c.plafond_credit > 0 ? (due / c.plafond_credit) * 100 : 0;
            const blocked = due > c.plafond_credit || c.bloque_credit;

            return (
              <div key={c.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate">{c.nom}</span>
                  {blocked && (
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                      INTERDIT CRÉDIT
                    </span>
                  )}
                </div>

                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Dû : <span className="font-mono text-rose-400 font-bold">{formatCurrency(due)}</span></span>
                  <span>Plafond : <span className="font-mono text-slate-300">{formatCurrency(c.plafond_credit)}</span></span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${ratio >= 100 ? 'bg-red-500' : ratio > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, ratio)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: ENCAISSEMENT ACOMPTE / RÈGLEMENT PARTIEL */}
      {selectedFactureForPayment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-yellow-600/30 text-yellow-400 flex items-center justify-center">
                  <HandCoins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Saisie Versement Partiel</h3>
                  <p className="text-xs text-slate-400">Facture {selectedFactureForPayment.numero}</p>
                </div>
              </div>
              <button onClick={() => setSelectedFactureForPayment(null)} className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleVersementSubmit} className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Total Facture :</span>
                  <span className="font-mono text-white">{formatCurrency(selectedFactureForPayment.montant_total)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Déjà encaissé :</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(selectedFactureForPayment.montant_paye)}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-400 pt-1 border-t border-slate-800">
                  <span>Solde Restant Dû :</span>
                  <span className="font-mono text-sm">{formatCurrency(selectedFactureForPayment.montant_total - selectedFactureForPayment.montant_paye)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Montant de l'acompte versé aujourd'hui (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={selectedFactureForPayment.montant_total - selectedFactureForPayment.montant_paye}
                  value={versementMontant}
                  onChange={(e) => setVersementMontant(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-sm font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Mode de règlement
                </label>
                <select
                  value={versementMode}
                  onChange={(e) => setVersementMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="MTN_MOMO">MTN Mobile Money</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="ESPECES">Espèces</option>
                  <option value="VIREMENT">Virement / Chèque</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setSelectedFactureForPayment(null)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">Annuler</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-black font-extrabold text-xs cursor-pointer">Valider Versement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RELANCE WHATSAPP DIRECTE */}
      {whatsappModalFacture && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Bordereau de Relance Client WhatsApp</h3>
                  <p className="text-xs text-slate-400">Brouillon à vérifier et à envoyer manuellement</p>
                </div>
              </div>
              <button onClick={() => setWhatsappModalFacture(null)} className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer">✕</button>
            </div>

            {(() => {
              const client = clients.find(c => c.id === whatsappModalFacture.client_id);
              if (!client) {
                return (
                  <p className="rounded-xl border border-amber-700 bg-amber-950/40 p-4 text-sm text-amber-200">
                    Aucun compte client n’est associé à cette facture. La relance ne peut pas être préparée.
                  </p>
                );
              }
              const msg = generateWhatsAppMessage(whatsappModalFacture, client);

              return (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Destinataire :</span>
                      <span className="font-bold text-white">{client.nom} ({client.telephone})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reste dû sur facture :</span>
                      <span className="font-mono text-rose-400 font-bold">
                        {formatCurrency(whatsappModalFacture.montant_total - whatsappModalFacture.montant_paye)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Texte du Message WhatsApp Généré :
                    </label>
                    <textarea
                      readOnly
                      rows={5}
                      value={msg}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono leading-relaxed focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => setWhatsappModalFacture(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Fermer
                    </button>
                    <button
                      onClick={() => void copyToClipboard(msg)}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Copier pour WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
