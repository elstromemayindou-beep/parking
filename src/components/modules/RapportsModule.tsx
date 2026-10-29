/**
 * Synthèses de gestion, journaux opérationnels et alertes de caisse.
 * Requirements:
 * - Synthèses calculées à partir des données enregistrées
 * - Aperçus imprimables et résumés à partager manuellement
 * - Alertes de contrôle enregistrées dans l'application
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LineChart,
  MessageCircle,
  ShieldAlert,
  Share2,
  Printer,
  CheckCircle2
} from 'lucide-react';
import { FinancialReportPdfModal } from '../FinancialReportPdfModal';

export const RapportsModule: React.FC = () => {
  const {
    factures,
    encaissements,
    depenses,
    employes,
    sessionCaisse,
    alertesFraude,
    currentSuccursale,
    formatCurrency,
    showNotification
  } = useApp();

  const [activeTab, setActiveTab] = useState<'SYSCOHADA' | 'WHATSAPP' | 'IA_FRAUDES'>('SYSCOHADA');
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedPdfType, setSelectedPdfType] = useState<'SYSCOHADA' | 'DAILY_JOURNAL' | 'CASH_CLOSING' | 'AUDIT_SECURITY'>('SYSCOHADA');

  const encaissementsSession = encaissements.filter(
    payment => payment.created_at.slice(0, 10) === sessionCaisse.date
  );
  const chiffreAffaires = encaissementsSession.reduce((sum, payment) => sum + payment.montant, 0);
  const recettesParService = (type: 'GARAGE' | 'LAVAGE' | 'PARKING' | 'VENTE_PIECE') =>
    encaissementsSession
      .filter(payment => factures.find(facture => facture.id === payment.facture_id)?.type_service === type)
      .reduce((sum, payment) => sum + payment.montant, 0);
  const recettesAutres = chiffreAffaires -
    recettesParService('GARAGE') -
    recettesParService('LAVAGE') -
    recettesParService('PARKING') -
    recettesParService('VENTE_PIECE');
  const depensesValidees = depenses.filter(
    expense => expense.created_at.slice(0, 10) === sessionCaisse.date &&
      expense.valide_par_gerant &&
      (!expense.accord_proprietaire_requis || expense.valide_par_proprietaire)
  );
  const chargesExploitation = depensesValidees.reduce((sum, expense) => sum + expense.montant, 0);
  const encaissementsVirement = encaissementsSession
    .filter(payment => payment.mode_paiement === 'VIREMENT')
    .reduce((sum, payment) => sum + payment.montant, 0);
  const depensesAchats = depensesValidees
    .filter(expense => ['Consommables & Pièces', 'Équipements & Outils'].includes(expense.categorie))
    .reduce((sum, expense) => sum + expense.montant, 0);
  const depensesEnergie = depensesValidees
    .filter(expense => ['Carburant', 'Loyer & Électricité'].includes(expense.categorie))
    .reduce((sum, expense) => sum + expense.montant, 0);
  const autresDepenses = chargesExploitation - depensesAchats - depensesEnergie;
  const resultatNetExploitation = chiffreAffaires - chargesExploitation;

  const generateOwnerWhatsAppReport = () => {
    const dateLabel = new Date(`${sessionCaisse.date}T12:00:00`).toLocaleDateString('fr-FR', { dateStyle: 'long' });
    return `📊 *RAPPORT D'ACTIVITÉ QUOTIDIEN - AUTOGESTION PRO v3.0*
🏢 *Succursale :* ${currentSuccursale.nom} (${currentSuccursale.ville})
📅 *Date :* ${dateLabel}
───────────────────────────
💰 *ENCAISSEMENTS ENREGISTRÉS :*
• Total : ${formatCurrency(chiffreAffaires)}
  - Espèces : ${formatCurrency(sessionCaisse.recettes_especes_theorique)}
  - MTN MoMo : ${formatCurrency(sessionCaisse.recettes_momo_theorique)}
  - Airtel Money : ${formatCurrency(sessionCaisse.recettes_airtel_theorique)}
  - Virements enregistrés : ${formatCurrency(encaissementsVirement)}
• Dépenses validées du jour : -${formatCurrency(chargesExploitation)}
⭐ *DIFFÉRENCE : ${formatCurrency(resultatNetExploitation)}*
───────────────────────────
• État de la caisse : ${sessionCaisse.statut === 'CLOTUREE' ? `clôturée, écart ${formatCurrency(sessionCaisse.ecart_total || 0)}` : 'session ouverte'}
───────────────────────────
📋 *SUIVI :*
• Alertes de contrôle : ${alertesFraude.filter(a => a.statut === 'A_VERIFIER').length} à traiter
• Personnel déclaré présent : ${employes.filter(e => e.present_aujourdhui).length}/${employes.length}

_Résumé généré à partir des données enregistrées. Transmettez-le manuellement._`;
  };

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(generateOwnerWhatsAppReport());
      setSummaryCopied(true);
      showNotification('Résumé copié. Vous pouvez le coller dans WhatsApp.');
    } catch {
      showNotification('Impossible d’accéder au presse-papiers. Sélectionnez et copiez le texte manuellement.', 'warning');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <LineChart className="w-4 h-4" />
            <span>Rapports et suivi de gestion</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Synthèses financières et rapports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Consultez les données enregistrées, imprimez un état et partagez un résumé.
          </p>
        </div>

        {/* Action Controls & Tab switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              const mapping: Record<string, 'SYSCOHADA' | 'CASH_CLOSING' | 'DAILY_JOURNAL' | 'AUDIT_SECURITY'> = {
                SYSCOHADA: 'SYSCOHADA',
                WHATSAPP: 'CASH_CLOSING',
                IA_FRAUDES: 'AUDIT_SECURITY'
              };
              setSelectedPdfType(mapping[activeTab] || 'SYSCOHADA');
              setPdfModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition hover:scale-105 cursor-pointer"
            title="Ouvrir l'aperçu imprimable pour l'imprimer ou l'enregistrer en PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer / enregistrer en PDF</span>
          </button>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('SYSCOHADA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'SYSCOHADA'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Synthèse financière
            </button>
            <button
              onClick={() => setActiveTab('WHATSAPP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'WHATSAPP'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Résumé à partager
            </button>
            <button
              onClick={() => setActiveTab('IA_FRAUDES')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'IA_FRAUDES'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Alertes de contrôle
            </button>
          </div>
        </div>
      </div>

      {/* Financial overview */}
      {activeTab === 'SYSCOHADA' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Encaissements du jour</span>
              <div className="text-xl font-black text-white font-mono mt-1">
                {formatCurrency(chiffreAffaires)}
              </div>
              <span className="text-[11px] text-blue-300">D’après les paiements enregistrés</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Dépenses validées</span>
              <div className="text-xl font-black text-slate-300 font-mono mt-1">
                -{formatCurrency(chargesExploitation)}
              </div>
              <span className="text-[11px] text-slate-500">Pour la date de session</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Session de caisse</span>
              <div className="text-xl font-black text-slate-300 font-mono mt-1">
                {sessionCaisse.statut === 'CLOTUREE' ? 'Clôturée' : 'Ouverte'}
              </div>
              <span className="text-[11px] text-slate-500">{sessionCaisse.date}</span>
            </div>

            <div className="bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-500/50 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold text-blue-200 uppercase">Différence recettes / dépenses</span>
              <div className="text-xl font-black text-white font-mono mt-1">
                {formatCurrency(resultatNetExploitation)}
              </div>
              <span className="text-[11px] text-blue-300 font-semibold">
                Pour la date de session
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-blue-400" />
                  <span>Répartition des encaissements et dépenses</span>
                </h2>
                <p className="text-xs text-slate-400">Synthèse opérationnelle, non certifiée</p>
              </div>
              <button
                onClick={() => {
                  setSelectedPdfType('SYSCOHADA');
                  setPdfModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer / enregistrer en PDF</span>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Catégorie</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5 text-right">Montant (FCFA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr className="bg-slate-950/30">
                    <td className="p-2.5 font-bold text-white">ENCAISSEMENTS</td>
                    <td className="p-2.5 font-mono text-slate-500">Total</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(chiffreAffaires)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-400">Garage</td>
                    <td className="p-2.5 font-mono text-slate-500">Service</td>
                    <td className="p-2.5 text-right font-mono">{formatCurrency(recettesParService('GARAGE'))}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-400">Lavage</td>
                    <td className="p-2.5 font-mono text-slate-500">Service</td>
                    <td className="p-2.5 text-right font-mono">{formatCurrency(recettesParService('LAVAGE'))}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-400">Parking</td>
                    <td className="p-2.5 font-mono text-slate-500">Service</td>
                    <td className="p-2.5 text-right font-mono">{formatCurrency(recettesParService('PARKING'))}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-400">Vente de pièces</td>
                    <td className="p-2.5 font-mono text-slate-500">Service</td>
                    <td className="p-2.5 text-right font-mono">{formatCurrency(recettesParService('VENTE_PIECE'))}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-400">Autres ou prestation indisponible</td>
                    <td className="p-2.5 font-mono text-slate-500">Service</td>
                    <td className="p-2.5 text-right font-mono">{formatCurrency(recettesAutres)}</td>
                  </tr>

                  <tr className="bg-slate-950/30">
                    <td className="p-2.5 font-bold text-white">DÉPENSES VALIDÉES</td>
                    <td className="p-2.5 font-mono text-slate-500">Total</td>
                    <td className="p-2.5 text-right font-mono font-bold text-rose-400">
                      -{formatCurrency(chargesExploitation)}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-400">Achats, pièces et équipements</td>
                    <td className="p-2.5 font-mono text-slate-500">Dépense</td>
                    <td className="p-2.5 text-right font-mono">-{formatCurrency(depensesAchats)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-400">Énergie et charges de site</td>
                    <td className="p-2.5 font-mono text-slate-500">Dépense</td>
                    <td className="p-2.5 text-right font-mono">-{formatCurrency(depensesEnergie)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 pl-6 text-slate-400">Autres dépenses validées</td>
                    <td className="p-2.5 font-mono text-slate-500">Dépense</td>
                    <td className="p-2.5 text-right font-mono">-{formatCurrency(autresDepenses)}</td>
                  </tr>

                  <tr className="bg-slate-950/80 font-black border-t-2 border-slate-700">
                    <td className="p-3 text-sm text-white">DIFFÉRENCE ENCAISSEMENTS - DÉPENSES</td>
                    <td className="p-3 font-mono text-slate-400">Session</td>
                    <td className="p-3 text-right font-mono text-base text-emerald-300">
                      {formatCurrency(resultatNetExploitation)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Résumé de caisse à partager */}
      {activeTab === 'WHATSAPP' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Résumé à partager</h3>
                <p className="text-xs text-slate-400">Copiez le texte puis envoyez-le depuis votre application de messagerie.</p>
              </div>
            </div>
            <button
              onClick={() => void handleCopyWhatsApp()}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md ${
                summaryCopied ? 'bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white font-extrabold'
              }`}
            >
              {summaryCopied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Résumé copié</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Copier le résumé</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <pre className="text-xs text-blue-200 font-mono whitespace-pre-wrap leading-relaxed">
              {generateOwnerWhatsAppReport()}
            </pre>
          </div>

          <p className="text-xs text-slate-400 italic">
            * Les modes de paiement sont ceux enregistrés lors des encaissements. Aucun transfert ou envoi automatique n'est effectué.
          </p>
        </div>
      )}

      {/* TAB 4: IA DÉTECTION DES FRAUDES & REMISES ANORMALES (RF-95) */}
      {activeTab === 'IA_FRAUDES' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Alertes de contrôle de caisse</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Surveillance des écarts lors des clôtures aveugles, remises injustifiées et mouvements de stock
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {alertesFraude.map(alerte => (
                <div
                  key={alerte.id}
                  className={`p-4 rounded-xl border space-y-2 ${
                    alerte.severite === 'CRITIQUE'
                      ? 'bg-red-950/40 border-red-500/60'
                      : 'bg-amber-950/30 border-amber-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        alerte.severite === 'CRITIQUE' ? 'bg-red-500/30 text-red-200' : 'bg-amber-500/30 text-amber-200'
                      }`}>
                        {alerte.type} ({alerte.severite})
                      </span>
                      <span className="font-mono text-xs text-slate-400">{alerte.date}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-300">
                      Statut: {alerte.statut}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-white">
                    {alerte.description}
                  </p>

                  <div className="bg-black/40 p-2 rounded text-[11px] font-mono text-rose-300 flex items-center justify-between">
                    <span>Indice suspect : {alerte.valeur_suspecte}</span>
                    <button
                      onClick={() => showNotification(`Dossier ${alerte.id} consigné dans l'audit interne`)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] cursor-pointer"
                    >
                      Classer / Vérifié
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Official Financial Report PDF Export & Print Engine */}
      <FinancialReportPdfModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        initialReportType={selectedPdfType}
      />
    </div>
  );
};
