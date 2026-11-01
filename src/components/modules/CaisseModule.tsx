/**
 * N.O.B BUSINESS - Module 4: Caisse & Recettes
 * Requirements:
 * - RF-41 : Enregistrement encaissements Espèces, MTN Mobile Money et Airtel Money
 * - RF-43 : Calcul en direct du solde net de caisse (Encaissements bruts - Dépenses du jour)
 * - RF-47 : Procédure de clôture de caisse quotidienne avec comptage à l'aveugle et écarts
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, Facture } from '../../types';
import {
  CircleDollarSign,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Coins,
  Receipt,
  FileSpreadsheet
} from 'lucide-react';

export const CaisseModule: React.FC = () => {
  const {
    sessionCaisse,
    factures,
    encaissements,
    depenses,
    userRole,
    formatCurrency,
    effectuerClotureAveugle,
    encaisserFacture,
    creerFactureDirecte,
    annulerFacture,
    setReceiptModalData,
    showNotification,
    departementActif
  } = useApp();

  const [clotureModalOpen, setClotureModalOpen] = useState(false);
  const [encaissementModalOpen, setEncaissementModalOpen] = useState(false);
  const [factureAnnulation, setFactureAnnulation] = useState<Facture | null>(null);
  const [motifAnnulation, setMotifAnnulation] = useState('');
  const [journalPeriode, setJournalPeriode] = useState<'JOUR' | 'HISTORIQUE'>('JOUR');

  // Blind cash closing inputs (RF-47)
  const [especesComptees, setEspecesComptees] = useState<number>(0);
  const [momoCompte, setMomoCompte] = useState<number>(0);
  const [airtelCompte, setAirtelCompte] = useState<number>(0);
  const [motifEcart, setMotifEcart] = useState('');
  const [clotureResult, setClotureResult] = useState<{ ecart: number } | null>(null);

  // Direct payment form
  const [factureDesc, setFactureDesc] = useState('');
  const [montantDirect, setMontantDirect] = useState<number>(10000);
  const [modePaiementDirect, setModePaiementDirect] = useState<PaymentMethod>('MTN_MOMO');
  const [referenceDirect, setReferenceDirect] = useState('');

  const departmentOfInvoice = (invoice: Facture | undefined) => invoice?.departement || (
    invoice?.type_service === 'LAVAGE' ? 'LAVAGE'
      : invoice?.type_service === 'SALON' ? 'SALON'
        : invoice?.type_service === 'PARKING' ? 'PARKING'
          : invoice?.type_service === 'GARAGE' || invoice?.type_service === 'VENTE_PIECE' ? 'MECANIQUE'
            : undefined
  );
  const paiementsVisibles = encaissements.filter(payment => {
    if (departementActif === 'GLOBAL') return true;
    const invoice = factures.find(item => item.id === payment.facture_id);
    return (payment.departement || departmentOfInvoice(invoice)) === departementActif;
  });
  const depensesVisibles = depenses.filter(expense => departementActif === 'GLOBAL' || expense.departement === departementActif);
  const paiementsDuJour = paiementsVisibles.filter(payment => payment.created_at.slice(0, 10) === sessionCaisse.date);
  const recettesEspeces = paiementsDuJour.filter(payment => payment.mode_paiement === 'ESPECES').reduce((sum, payment) => sum + payment.montant, 0);
  const recettesMomo = paiementsDuJour.filter(payment => payment.mode_paiement === 'MTN_MOMO').reduce((sum, payment) => sum + payment.montant, 0);
  const recettesAirtel = paiementsDuJour.filter(payment => payment.mode_paiement === 'AIRTEL_MONEY').reduce((sum, payment) => sum + payment.montant, 0);
  const recettesVirement = paiementsDuJour.filter(payment => payment.mode_paiement === 'VIREMENT').reduce((sum, payment) => sum + payment.montant, 0);
  const depensesValidees = depensesVisibles.filter(expense =>
    expense.created_at.slice(0, 10) === sessionCaisse.date &&
    expense.valide_par_gerant &&
    (!expense.accord_proprietaire_requis || expense.valide_par_proprietaire)
  ).reduce((sum, expense) => sum + expense.montant, 0);
  const recettesBrutes = recettesEspeces + recettesMomo + recettesAirtel + recettesVirement;
  const soldeNet = recettesBrutes - depensesValidees;
  const encaissementsJournal = paiementsVisibles
    .filter(payment => journalPeriode === 'HISTORIQUE' || payment.created_at.slice(0, 10) === sessionCaisse.date)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const handleClotureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = effectuerClotureAveugle(
      Number(especesComptees) || 0,
      Number(momoCompte) || 0,
      Number(airtelCompte) || 0,
      motifEcart
    );
    if (res) setClotureResult(res);
  };

  const handleDirectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!factureDesc.trim() || !montantDirect) {
      showNotification('Description et montant requis', 'warning');
      return;
    }

    creerFactureDirecte({
      client_id: 1,
      succursale_id: sessionCaisse.succursale_id,
      type_service: 'VENTE_PIECE',
      description: factureDesc,
      montant_total: Number(montantDirect),
      montant_paye: Number(montantDirect),
      statut: 'PAYE',
      mode_paiement: modePaiementDirect,
      reference_paiement: referenceDirect || `${modePaiementDirect.slice(0, 4)}-${Date.now().toString().slice(-4)}`
    });

    setEncaissementModalOpen(false);
    setFactureDesc('');
    setReferenceDirect('');
    showNotification(`Encaissement de ${formatCurrency(montantDirect)} enregistré avec succès`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <CircleDollarSign className="w-4 h-4 text-blue-400" />
            <span>Module Caisse & Trésorerie</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {departementActif === 'GLOBAL' ? 'Caisse globale' : `Caisse · ${departementActif}`}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {departementActif === 'GLOBAL'
              ? 'Tous les encaissements et dépenses des activités, avec clôture de la caisse globale.'
              : `Encaissements et dépenses rattachés uniquement à l’activité ${departementActif}. La clôture physique reste globale.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setEncaissementModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition hover:scale-105 cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4 text-white" />
            <span>+ Encaissement Direct</span>
          </button>

          <button
            onClick={() => {
              setClotureResult(null);
              setClotureModalOpen(true);
            }}
            disabled={sessionCaisse.statut === 'CLOTUREE' || departementActif !== 'GLOBAL'}
            title={departementActif !== 'GLOBAL' ? 'La clôture de session reste globale. Sélectionnez toutes les activités.' : undefined}
            className="px-4 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-white border border-blue-600/50 font-bold text-xs flex items-center justify-center gap-2 transition hover:scale-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Lock className="w-4 h-4 text-blue-400" />
            <span>{departementActif !== 'GLOBAL' ? 'Clôture globale uniquement' : sessionCaisse.statut === 'CLOTUREE' ? 'Session clôturée' : 'Clôture de caisse'}</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Net Cash */}
        <div className="bg-slate-950 border border-blue-500 rounded-2xl p-5 shadow-lg shadow-blue-950/40">
          <div className="flex items-center justify-between text-xs text-blue-400 font-bold mb-2">
            <span>Solde Net de Caisse (RF-43)</span>
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {formatCurrency(soldeNet)}
          </div>
          <div className="text-[11px] text-slate-300 mt-2">
            Recettes ({formatCurrency(recettesBrutes)}) - Dépenses ({formatCurrency(depensesValidees)})
          </div>
        </div>

        {/* MTN MoMo */}
        <div className="bg-slate-950 border border-slate-800 hover:border-blue-400/60 rounded-2xl p-5 transition shadow-sm">
          <div className="flex items-center justify-between text-xs text-blue-400 font-bold mb-2">
            <span>MTN Mobile Money</span>
            <Smartphone className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {formatCurrency(recettesMomo)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Portefeuille digital MTN MoMo
          </div>
        </div>

        {/* Airtel Money */}
        <div className="bg-slate-950 border border-slate-800 hover:border-blue-400/60 rounded-2xl p-5 transition shadow-sm">
          <div className="flex items-center justify-between text-xs text-blue-400 font-bold mb-2">
            <span>Airtel Money</span>
            <Smartphone className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {formatCurrency(recettesAirtel)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Portefeuille Airtel Money
          </div>
        </div>

        {/* Espèces Cash */}
        <div className="bg-slate-950 border border-slate-800 hover:border-blue-400/60 rounded-2xl p-5 transition shadow-sm">
          <div className="flex items-center justify-between text-xs text-blue-400 font-bold mb-2">
            <span>Espèces en Tiroir</span>
            <Coins className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {formatCurrency(recettesEspeces)}
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Tiroir-caisse physique
          </div>
        </div>
      </div>

      {/* Today's Transactions Journal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Journal des Encaissements & Règlements {journalPeriode === 'JOUR' ? 'du Jour' : '— Historique'}</span>
            </h2>
            <p className="text-xs text-slate-400">
              Traçabilité horodatée des paiements et remboursements ; les transactions peuvent être annulées depuis leur ticket.
            </p>
          </div>
          <label className="text-xs font-semibold text-slate-300">
            Afficher
            <select
              value={journalPeriode}
              onChange={event => setJournalPeriode(event.target.value === 'HISTORIQUE' ? 'HISTORIQUE' : 'JOUR')}
              className="ml-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
            >
              <option value="JOUR">Aujourd’hui</option>
              <option value="HISTORIQUE">Tout l’historique</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">N° Facture</th>
                <th className="py-2.5 px-3">Date/Heure</th>
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Mode Paiement</th>
                <th className="py-2.5 px-3">Référence MoMo / Reçu</th>
                <th className="py-2.5 px-3 text-right">Montant</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {encaissementsJournal.map(payment => {
                const facture = factures.find(item => item.id === payment.facture_id);
                return (
                  <tr key={payment.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-400">
                      {facture?.numero || '—'}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {payment.created_at}
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {facture?.type_service || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-200 truncate max-w-xs">
                      {facture?.description || 'Facture introuvable'}
                      {payment.motif && <span className="block text-[10px] text-amber-300">{payment.motif}</span>}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        payment.mode_paiement === 'MTN_MOMO'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : payment.mode_paiement === 'AIRTEL_MONEY'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {payment.mode_paiement}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      {payment.reference_paiement || '-'}
                    </td>
                    <td className={`py-3 px-3 text-right font-mono font-black ${payment.montant < 0 ? 'text-rose-300' : 'text-emerald-400'}`}>
                      {payment.montant < 0 ? '−' : '+'}{formatCurrency(Math.abs(payment.montant))}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {facture && facture.statut !== 'ANNULEE' && payment.montant > 0 && (userRole === 'GERANT' || userRole === 'PROPRIETAIRE') ? (
                        <button
                          onClick={() => { setFactureAnnulation(facture); setMotifAnnulation(''); }}
                          className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-200 hover:bg-rose-500/20"
                        >
                          Annuler / rembourser
                        </button>
                      ) : facture?.statut === 'ANNULEE' ? (
                        <span className="text-[10px] font-bold text-rose-300">Annulée</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {encaissementsJournal.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-slate-500">Aucun encaissement enregistré pour cette période.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {factureAnnulation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={event => {
              event.preventDefault();
              if (annulerFacture(factureAnnulation.id, motifAnnulation)) {
                setFactureAnnulation(null);
                setMotifAnnulation('');
              }
            }}
            className="w-full max-w-md space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
          >
            <div>
              <h2 className="text-base font-bold text-white">Annuler et rembourser la transaction</h2>
              <p className="mt-1 text-xs text-slate-300">{factureAnnulation.numero} · {factureAnnulation.description}</p>
            </div>
            <div className="rounded-xl border border-amber-400/30 bg-amber-950/30 p-3 text-xs leading-5 text-amber-100">
              Le ticket et l’historique seront conservés. Une écriture inverse de {formatCurrency(factureAnnulation.montant_paye)} sera enregistrée en caisse.
            </div>
            <label className="block text-xs font-semibold text-slate-200">
              Motif obligatoire
              <textarea
                required
                minLength={3}
                value={motifAnnulation}
                onChange={event => setMotifAnnulation(event.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white"
                placeholder="Expliquez la raison de l’annulation"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setFactureAnnulation(null)} className="rounded-lg bg-slate-700 px-4 py-2 text-xs font-semibold text-white">Retour</button>
              <button type="submit" className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500">Confirmer l’annulation</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 1: CLÔTURE DE CAISSE À L'AVEUGLE (RF-47) */}
      {clotureModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600/30 text-amber-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Clôture de Caisse à l'Aveugle (RF-47)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Saisie indépendante des espèces physiques et soldes MoMo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setClotureModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {!clotureResult ? (
              <form onSubmit={handleClotureSubmit} className="space-y-4">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-amber-400">Procédure de Contrôle Interne :</p>
                  <p className="text-slate-400 text-[11px]">
                    Le montant théorique calculé par le système est masqué durant la saisie. Comptez physiquement les billets et pièces dans le tiroir, ainsi que les relevés MTN MoMo et Airtel Money.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Espèces physiques comptées dans le tiroir (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    value={especesComptees}
                    onChange={(e) => setEspecesComptees(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Solde relevé MTN Mobile Money (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    value={momoCompte}
                    onChange={(e) => setMomoCompte(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Solde relevé Airtel Money (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    value={airtelCompte}
                    onChange={(e) => setAirtelCompte(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Commentaire ou motif éventuel
                  </label>
                  <input
                    type="text"
                    value={motifEcart}
                    onChange={(e) => setMotifEcart(e.target.value)}
                    placeholder="Ex: Fond de caisse initial vérifié, pas d'anomalie"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setClotureModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 cursor-pointer"
                  >
                    Valider Comptage & Révéler Écart
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border ${
                  clotureResult.ecart === 0
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                    : clotureResult.ecart > 0
                    ? 'bg-blue-950/60 border-blue-500 text-blue-200'
                    : 'bg-red-950/60 border-red-500 text-red-200'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-base mb-1">
                    {clotureResult.ecart === 0 ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>Caisse Parfaitement Équilibrée !</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <span>Écart Détecté lors du Comptage Aveugle</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs">
                    {clotureResult.ecart === 0
                      ? 'Aucun écart entre les montants comptés et le théorique calculé.'
                      : clotureResult.ecart > 0
                      ? `Excédent constaté de +${formatCurrency(clotureResult.ecart)}`
                      : `Déficit / Manquant constaté de ${formatCurrency(clotureResult.ecart)}`}
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Compté à l'aveugle :</span>
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(especesComptees + momoCompte + airtelCompte)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Théorique Système :</span>
                    <span className="font-mono font-bold text-slate-300">
                      {formatCurrency(recettesBrutes)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-slate-800">
                    <span>Écart Final :</span>
                    <span className={`font-mono ${clotureResult.ecart === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {formatCurrency(clotureResult.ecart)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setClotureModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => {
                      setClotureModalOpen(false);
                      setReceiptModalData({ visible: true, type: 'CLOTURE', data: sessionCaisse });
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Imprimer Feuille de Caisse Journalière
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: ENCAISSEMENT DIRECT */}
      {encaissementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Encaissement Direct</h3>
                  <p className="text-xs text-slate-400">Vente de pièces, prestation rapide ou acompte</p>
                </div>
              </div>
              <button
                onClick={() => setEncaissementModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDirectPayment} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Description / Objet de l'encaissement *
                </label>
                <input
                  type="text"
                  required
                  value={factureDesc}
                  onChange={(e) => setFactureDesc(e.target.value)}
                  placeholder="Ex: Vente bidon huile 5W40 au comptoir"
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
                  value={montantDirect}
                  onChange={(e) => setMontantDirect(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-sm font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Mode de Paiement
                </label>
                <select
                  value={modePaiementDirect}
                  onChange={(e) => setModePaiementDirect(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="MTN_MOMO">MTN Mobile Money</option>
                  <option value="AIRTEL_MONEY">Airtel Money</option>
                  <option value="ESPECES">Espèces (Cash)</option>
                  <option value="VIREMENT">Virement Bancaire</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Réf. Transaction Mobile Money (Optionnel)
                </label>
                <input
                  type="text"
                  value={referenceDirect}
                  onChange={(e) => setReferenceDirect(e.target.value)}
                  placeholder="Ex: MOMO-261028-1192"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEncaissementModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  Valider Encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
