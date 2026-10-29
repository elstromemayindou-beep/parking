/**
 * AutoGestion Pro v3.0 - Module 7: Dépenses & Petite Caisse
 * Requirements:
 * - RF-51 : Saisie des dépenses de fonctionnement avec motif, catégorie et reçu photographié
 * - Double niveau de validation : Gérant < 50 000 F, Accord Direction Propriétaire > 50 000 F
 * - Déduction directe du Solde Net de caisse (RF-43)
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Depense } from '../../types';
import {
  TrendingDown,
  PlusCircle,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Fuel,
  Wrench,
  Coffee,
  Building,
  DollarSign
} from 'lucide-react';

export const DepensesModule: React.FC = () => {
  const {
    depenses,
    userRole,
    ajouterDepense,
    validerDepenseGerant,
    validerDepenseProprietaire,
    formatCurrency,
    showNotification
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [motif, setMotif] = useState('');
  const [montant, setMontant] = useState<number>(15000);
  const [categorie, setCategorie] = useState<Depense['categorie']>('Carburant');
  const [justificatif, setJustificatif] = useState('');

  const categories: { label: Depense['categorie']; icon: any }[] = [
    { label: 'Carburant', icon: Fuel },
    { label: 'Consommables & Pièces', icon: Wrench },
    { label: 'Équipements & Outils', icon: Wrench },
    { label: 'Alimentation & Eau', icon: Coffee },
    { label: 'Loyer & Électricité', icon: Building },
    { label: 'Petite Caisse / Imprévus', icon: DollarSign }
  ];

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motif.trim() || !montant) {
      showNotification('Motif et montant obligatoires', 'warning');
      return;
    }

    ajouterDepense(
      motif.trim(),
      Number(montant),
      categorie,
      justificatif.trim() || undefined
    );

    setModalOpen(false);
    setMotif('');
    setJustificatif('');
  };

  const totalDepenses = depenses
    .filter(d => d.valide_par_gerant && (!d.accord_proprietaire_requis || d.valide_par_proprietaire))
    .reduce((sum, d) => sum + d.montant, 0);

  const enAttenteDirection = depenses.filter(d => d.accord_proprietaire_requis && !d.valide_par_proprietaire);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-1">
            <TrendingDown className="w-4 h-4" />
            <span>Module Dépenses & Petite Caisse</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Contrôle des Sorties de Caisse & Achats Urgents
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Validation duale (Gérant &lt; 50k / Accord Propriétaire &gt; 50k) et pièces justificatives (RF-51).
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition hover:scale-105 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Saisie Sortie de Caisse</span>
        </button>
      </div>

      {/* Warning banner for pending owner approval */}
      {enAttenteDirection.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/30 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {enAttenteDirection.length} dépense(s) supérieure(s) à 50 000 FCFA en attente d'accord Propriétaire !
              </h3>
              <p className="text-xs text-amber-200 mt-0.5">
                Règle de gouvernance : Toute dépense lourde requiert la signature de la Direction avant imputation finale.
              </p>
            </div>
          </div>
          {userRole === 'PROPRIETAIRE' ? (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-600/40">
              Connecté en tant que Propriétaire : Vous pouvez valider ci-dessous
            </span>
          ) : (
            <span className="text-xs font-medium text-amber-300">
              Basculez sur le profil Propriétaire pour approuver
            </span>
          )}
        </div>
      )}

      {/* Summary KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Dépenses Validées du Jour
          </span>
          <span className="text-2xl font-black text-rose-400 font-mono">
            {formatCurrency(totalDepenses)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            Déduit directement du solde net de caisse
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Nombre de Pièces Justificatives
          </span>
          <span className="text-2xl font-black text-white font-mono">
            {depenses.length} reçus
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            Carburant groupe, fournitures atelier
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            En Attente Approbation Propriétaire
          </span>
          <span className="text-2xl font-black text-amber-400 font-mono">
            {enAttenteDirection.length} dossier(s)
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            Seuil strict &gt; 50 000 FCFA
          </span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-400" />
            <span>Historique des Bons de Sortie & Factures Achats (RF-51)</span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date & Auteur</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Motif de la dépense</th>
                <th className="py-3 px-4">Justificatif / N° Facture</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Validation</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {depenses.map(d => {
                const isPendingOwner = d.accord_proprietaire_requis && !d.valide_par_proprietaire;

                return (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-400">
                      <div>{d.created_at}</div>
                      <div className="text-[10px] text-slate-500">{d.auteur}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {d.categorie}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white max-w-xs truncate">
                      {d.motif}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {d.justificatif_url || 'Ticket de caisse papier joint'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400 text-sm">
                      -{formatCurrency(d.montant)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isPendingOwner ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Attente Propriétaire (&gt;50k)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                          ✓ Validée
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isPendingOwner && (
                        <button
                          onClick={() => validerDepenseProprietaire(d.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] transition cursor-pointer shadow-sm"
                          title="Autoriser la sortie de caisse en tant que Direction"
                        >
                          Accorder (Propriétaire)
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: NOUVELLE DÉPENSE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600/30 text-rose-400 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Saisie Sortie de Caisse (RF-51)</h3>
                  <p className="text-xs text-slate-400">Petite caisse, carburant groupe, achats urgents</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Catégorie de la dépense
                </label>
                <select
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c.label} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Motif détaillé de la dépense *
                </label>
                <textarea
                  required
                  rows={2}
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Ex: 50L Gasoil station Total pour groupe électrogène pendant coupure réseau"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Montant en FCFA *
                </label>
                <input
                  type="number"
                  required
                  value={montant}
                  onChange={(e) => setMontant(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-sm font-bold text-white focus:outline-none"
                />
                {montant > 50000 && (
                  <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1 font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Montant &gt; 50 000 FCFA : Accord préalable du Propriétaire requis !
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Référence / Photo du Reçu ou Facture
                </label>
                <input
                  type="text"
                  value={justificatif}
                  onChange={(e) => setJustificatif(e.target.value)}
                  placeholder="Ex: Facture Total N° 09844 ou Reçu Quincaillerie Moderne"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer">Annuler</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer">Enregistrer la Sortie</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
