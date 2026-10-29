/**
 * AutoGestion Pro v3.0 - Financial Report PDF Export & Print Engine
 * Requirements:
 * - RF-80 : Journaux d'achats, ventes, caisse et banques
 * - Synthèse de gestion et impression des états
 * - Partage manuel des informations par e-mail ou messagerie
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  Printer,
  Download,
  Mail,
  MessageCircle,
  X,
} from 'lucide-react';

interface FinancialReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReportType?: 'SYSCOHADA' | 'DAILY_JOURNAL' | 'CASH_CLOSING' | 'AUDIT_SECURITY';
}

export const FinancialReportPdfModal: React.FC<FinancialReportPdfModalProps> = ({
  isOpen,
  onClose,
  initialReportType = 'SYSCOHADA'
}) => {
  const {
    currentSuccursale,
    sessionCaisse,
    factures,
    encaissements,
    depenses,
    alertesFraude,
    formatCurrency,
    showNotification
  } = useApp();

  const [reportType, setReportType] = useState<'SYSCOHADA' | 'DAILY_JOURNAL' | 'CASH_CLOSING' | 'AUDIT_SECURITY'>(initialReportType);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState(`Synthèse de gestion - ${currentSuccursale.nom}`);

  if (!isOpen) return null;

  // Financial aggregates
  const encaissementsSession = encaissements.filter(
    payment => payment.created_at.slice(0, 10) === sessionCaisse.date
  );
  const chiffreAffaires = encaissementsSession.reduce((sum, payment) => sum + payment.montant, 0);
  const encaissementsVirement = encaissementsSession
    .filter(payment => payment.mode_paiement === 'VIREMENT')
    .reduce((sum, payment) => sum + payment.montant, 0);

  const depensesValidees = depenses.filter(
    d => d.created_at.slice(0, 10) === sessionCaisse.date &&
      d.valide_par_gerant &&
      (!d.accord_proprietaire_requis || d.valide_par_proprietaire)
  );
  const chargesExploitation = depensesValidees
    .reduce((sum, d) => sum + d.montant, 0);

  const soldeActivite = chiffreAffaires - chargesExploitation;

  const recettesParService = (type: 'GARAGE' | 'LAVAGE' | 'PARKING' | 'VENTE_PIECE') =>
    encaissementsSession
      .filter(payment => factures.find(facture => facture.id === payment.facture_id)?.type_service === type)
      .reduce((sum, payment) => sum + payment.montant, 0);
  const caGarage = recettesParService('GARAGE');
  const caLavage = recettesParService('LAVAGE');
  const caParking = recettesParService('PARKING');
  const caPieces = recettesParService('VENTE_PIECE');
  const autresRecettes = chiffreAffaires - caGarage - caLavage - caParking - caPieces;
  const depensesAchats = depensesValidees
    .filter(d => ['Consommables & Pièces', 'Équipements & Outils'].includes(d.categorie))
    .reduce((sum, d) => sum + d.montant, 0);
  const depensesEnergie = depensesValidees
    .filter(d => ['Carburant', 'Loyer & Électricité'].includes(d.categorie))
    .reduce((sum, d) => sum + d.montant, 0);
  const autresDepenses = chargesExploitation - depensesAchats - depensesEnergie;

  const handlePrintPdf = () => {
    window.print();
  };

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const body = `Synthèse de gestion - ${currentSuccursale.nom}\nDate de session : ${sessionCaisse.date}\nEncaissements enregistrés : ${formatCurrency(chiffreAffaires)}\nDépenses validées : ${formatCurrency(chargesExploitation)}\nDifférence : ${formatCurrency(soldeActivite)}\n\nImprimez la synthèse depuis l'application si vous souhaitez la joindre.`;
    const mailto = `mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setEmailModalOpen(false);
    showNotification('Si une application de messagerie est configurée, un brouillon va s’ouvrir. Aucun e-mail n’a été envoyé.', 'info');
  };

  const handleCopyWhatsApp = async () => {
    const summary = `SYNTHÈSE DE GESTION - AUTOGESTION PRO\nSuccursale : ${currentSuccursale.nom}\nDate : ${sessionCaisse.date}\nEncaissements enregistrés : ${formatCurrency(chiffreAffaires)}\nDépenses validées : ${formatCurrency(chargesExploitation)}\nDifférence : ${formatCurrency(soldeActivite)}\n\nDocument imprimable depuis l'application.`;
    try {
      await navigator.clipboard.writeText(summary);
      showNotification('Résumé copié. Vous pouvez le coller dans votre messagerie.');
    } catch {
      showNotification('Impossible d’accéder au presse-papiers. Sélectionnez et copiez le texte manuellement.', 'warning');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative flex flex-col max-h-[95vh] text-slate-100">
        
        {/* Top Controls Header (Hidden in Print) */}
        <div className="no-print pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Impression et partage des rapports</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Aperçu imprimable
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Aperçu de gestion à vérifier avant toute utilisation comptable officielle.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPdf}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition hover:scale-105 cursor-pointer"
              title="Ouvrir la boîte d'impression pour enregistrer en PDF ou imprimer sur papier"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer / PDF</span>
            </button>

            <button
              onClick={() => setEmailModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Préparer un e-mail</span>
            </button>

            <button
              onClick={() => void handleCopyWhatsApp()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Copier le résumé pour le partager manuellement"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Report Type Selector Pills (Hidden in Print) */}
        <div className="no-print py-3 flex flex-wrap items-center gap-2 border-b border-slate-800/80 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Sélection du document :</span>
          <button
            onClick={() => setReportType('SYSCOHADA')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              reportType === 'SYSCOHADA'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Synthèse des recettes et dépenses
          </button>
          <button
            onClick={() => setReportType('CASH_CLOSING')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              reportType === 'CASH_CLOSING'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            État de session de caisse
          </button>
          <button
            onClick={() => setReportType('DAILY_JOURNAL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              reportType === 'DAILY_JOURNAL'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Journal des encaissements
          </button>
          <button
            onClick={() => setReportType('AUDIT_SECURITY')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              reportType === 'AUDIT_SECURITY'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Alertes de contrôle
          </button>
        </div>

        {/* Scrollable A4 Document Preview Area */}
        <div className="flex-1 overflow-y-auto py-4 bg-slate-950/70 rounded-2xl p-2 sm:p-4 my-2">
          {/* Printable Sheet (Pure White Background with crisp black typography for pristine PDF export) */}
          <div className="printable-document bg-white text-slate-900 mx-auto max-w-3xl p-8 sm:p-10 rounded-xl shadow-2xl font-sans text-xs border border-slate-300 min-h-[1050px] flex flex-col justify-between">
            <div>
              {/* Printable report header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-950 flex items-center gap-2">
                    AUTOGESTION PRO v3.0
                  </h1>
                  <p className="text-[11px] font-bold text-slate-700 mt-0.5">
                    Synthèse de gestion
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Succursale : <span className="font-semibold text-slate-800">{currentSuccursale.nom}</span> • {currentSuccursale.ville} ({currentSuccursale.adresse})
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Tél : {currentSuccursale.telephone}
                  </p>
                </div>

                <div className="text-right font-mono text-[10px] space-y-1">
                  <div className="bg-slate-100 p-2 rounded-lg border border-slate-300">
                    <span className="font-bold text-slate-800 block text-[11px]">APERÇU DE GESTION</span>
                    <span className="text-slate-600 block">Date de session : {sessionCaisse.date}</span>
                    <span className="text-slate-500 block">Généré le : {new Date().toLocaleString('fr-FR')}</span>
                  </div>
                </div>
              </div>

              {/* Title of Document */}
              <div className="bg-slate-100 text-center py-2.5 px-4 rounded-lg border border-slate-300 mb-6">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-900">
                  {reportType === 'SYSCOHADA' && 'RÉCAPITULATIF DES ENCAISSEMENTS ET DÉPENSES'}
                  {reportType === 'CASH_CLOSING' && `ÉTAT DE SESSION DE CAISSE DU ${sessionCaisse.date}`}
                  {reportType === 'DAILY_JOURNAL' && `JOURNAL DES ENCAISSEMENTS DU ${sessionCaisse.date}`}
                  {reportType === 'AUDIT_SECURITY' && 'JOURNAL DES ALERTES DE CONTRÔLE'}
                </h2>
                <div className="text-[10px] text-slate-600 mt-0.5 font-medium">
                  Données enregistrées dans l’application · Aperçu non certifié
                </div>
              </div>

              {/* DOCUMENT CONTENT 1: SYSCOHADA */}
              {reportType === 'SYSCOHADA' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                    <div className="border border-slate-300 p-2 rounded bg-slate-50">
                      <span className="text-[10px] text-slate-600 block">Encaissements enregistrés</span>
                      <span className="font-mono font-black text-slate-900 text-xs">{formatCurrency(chiffreAffaires)}</span>
                    </div>
                    <div className="border border-slate-300 p-2 rounded bg-slate-50">
                      <span className="text-[10px] text-slate-600 block">Dépenses validées</span>
                      <span className="font-mono font-bold text-slate-700 text-xs">-{formatCurrency(chargesExploitation)}</span>
                    </div>
                    <div className="border-2 border-emerald-600 p-2 rounded bg-emerald-50">
                      <span className="text-[10px] font-bold text-emerald-800 block">DIFFÉRENCE</span>
                      <span className="font-mono font-black text-emerald-900 text-sm">{formatCurrency(soldeActivite)}</span>
                    </div>
                  </div>

                  {/* Statement Table */}
                  <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
                    <thead>
                      <tr className="bg-slate-200 text-slate-800 font-bold">
                        <th className="border border-slate-300 p-2">Catégorie</th>
                        <th className="border border-slate-300 p-2 w-20 text-center">Type</th>
                        <th className="border border-slate-300 p-2 w-36 text-right">Montant (FCFA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-slate-100 font-bold">
                        <td className="border border-slate-300 p-2 text-slate-900" colSpan={2}>
                          Encaissements enregistrés
                        </td>
                        <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-950">
                          {formatCurrency(chiffreAffaires)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 pl-6 text-slate-700">Garage</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono text-slate-500">Service</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">{formatCurrency(caGarage)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 pl-6 text-slate-700">Lavage</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono text-slate-500">Service</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">{formatCurrency(caLavage)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 pl-6 text-slate-700">Parking</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono text-slate-500">Service</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">{formatCurrency(caParking)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 pl-6 text-slate-700">Vente de pièces</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono text-slate-500">Service</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">{formatCurrency(caPieces)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 pl-6 text-slate-700">Autres ou prestation indisponible</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono text-slate-500">Service</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">{formatCurrency(autresRecettes)}</td>
                      </tr>

                      <tr className="bg-slate-100 font-bold">
                        <td className="border border-slate-300 p-2 text-slate-900" colSpan={2}>
                          Dépenses validées
                        </td>
                        <td className="border border-slate-300 p-2 text-right font-mono font-bold text-slate-950">
                          -{formatCurrency(chargesExploitation)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 pl-6 text-slate-700">Achats, pièces et équipements</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono text-slate-500">Dépense</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">-{formatCurrency(depensesAchats)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 pl-6 text-slate-700">Énergie et charges de site</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono text-slate-500">Dépense</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">-{formatCurrency(depensesEnergie)}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 p-1.5 pl-6 text-slate-700">Autres dépenses validées</td>
                        <td className="border border-slate-300 p-1.5 text-center font-mono text-slate-500">Dépense</td>
                        <td className="border border-slate-300 p-1.5 text-right font-mono">-{formatCurrency(autresDepenses)}</td>
                      </tr>

                      <tr className="bg-slate-900 text-white font-black text-xs">
                        <td className="border border-slate-900 p-2.5" colSpan={2}>
                          Différence entre les encaissements et dépenses validées
                        </td>
                        <td className="border border-slate-900 p-2.5 text-right font-mono text-sm">
                          {formatCurrency(soldeActivite)}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="rounded border border-amber-300 bg-amber-50 p-3 text-[10px] text-amber-900">
                    Ce récapitulatif ne constitue pas un bilan comptable. Les soldes bancaires, créances et dettes ne sont pas suivis dans cet état.
                  </p>
                </div>
              )}

              {/* DOCUMENT CONTENT 2: CASH CLOSING */}
              {reportType === 'CASH_CLOSING' && (
                <div className="space-y-6">
                  <div className="border border-slate-300 p-4 rounded-xl bg-slate-50 space-y-3">
                    <h3 className="font-black text-slate-900 text-xs border-b border-slate-300 pb-1 uppercase">
                      État de la session de caisse
                    </h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white p-2.5 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Recettes suivies en caisse</span>
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {formatCurrency(
                            sessionCaisse.recettes_especes_theorique +
                            sessionCaisse.recettes_momo_theorique +
                            sessionCaisse.recettes_airtel_theorique
                          )}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Dépenses validées</span>
                        <span className="font-mono font-bold text-rose-700 text-sm">
                          -{formatCurrency(sessionCaisse.depenses_validees)}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Différence</span>
                        <span className="font-mono font-black text-emerald-800 text-sm">
                          {formatCurrency(sessionCaisse.solde_net_theorique)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span>• Comptage espèces saisi :</span>
                        <span className="font-mono font-bold">{sessionCaisse.comptage_especes_saisi === undefined ? 'Non renseigné' : formatCurrency(sessionCaisse.comptage_especes_saisi)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Montant MTN MoMo déclaré :</span>
                        <span className="font-mono font-bold">{sessionCaisse.comptage_momo_saisi === undefined ? 'Non renseigné' : formatCurrency(sessionCaisse.comptage_momo_saisi)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Montant Airtel Money déclaré :</span>
                        <span className="font-mono font-bold">{sessionCaisse.comptage_airtel_saisi === undefined ? 'Non renseigné' : formatCurrency(sessionCaisse.comptage_airtel_saisi)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Virements enregistrés, hors rapprochement caisse :</span>
                        <span className="font-mono font-bold">{formatCurrency(encaissementsVirement)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-300 font-bold">
                        <span>État / écart de session :</span>
                        <span className={`font-mono ${sessionCaisse.statut === 'CLOTUREE' && sessionCaisse.ecart_total === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {sessionCaisse.statut !== 'CLOTUREE'
                            ? 'Clôture non effectuée'
                            : formatCurrency(sessionCaisse.ecart_total || 0)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 italic mt-1">
                        Commentaire Gérant : {sessionCaisse.motif_ecart || 'Aucun commentaire enregistré'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DOCUMENT CONTENT 3: DAILY JOURNAL */}
              {reportType === 'DAILY_JOURNAL' && (
                <div className="space-y-4">
                  <h3 className="font-black text-slate-900 text-xs border-b border-slate-300 pb-1 uppercase">
                    Encaissements enregistrés pour la session
                  </h3>
                  <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                    <thead>
                      <tr className="bg-slate-200 text-slate-800 font-bold">
                        <th className="border border-slate-300 p-1.5">Référence facture</th>
                        <th className="border border-slate-300 p-1.5">Prestation</th>
                        <th className="border border-slate-300 p-1.5">Mode saisi</th>
                        <th className="border border-slate-300 p-1.5">Référence paiement</th>
                        <th className="border border-slate-300 p-1.5 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {encaissementsSession.map(payment => {
                        const facture = factures.find(item => item.id === payment.facture_id);
                        return (
                          <tr key={payment.id} className="border-b border-slate-200">
                            <td className="p-1.5 font-mono font-bold">{facture?.numero || 'Facture indisponible'}</td>
                            <td className="p-1.5 truncate max-w-xs">
                              {payment.montant < 0 ? 'REMBOURSEMENT — ' : ''}{facture?.description || '—'}
                              {payment.motif && <span className="block text-[9px] text-slate-600">Motif : {payment.motif}</span>}
                            </td>
                            <td className="p-1.5 font-bold">{payment.mode_paiement}</td>
                            <td className="p-1.5 font-mono text-[9px]">{payment.reference_paiement || '-'}</td>
                            <td className="p-1.5 text-right font-mono font-black text-slate-900">
                              {formatCurrency(payment.montant)}
                            </td>
                          </tr>
                        );
                      })}
                      {encaissementsSession.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-500">Aucun encaissement enregistré pour cette session.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* DOCUMENT CONTENT 4: AUDIT SECURITY */}
              {reportType === 'AUDIT_SECURITY' && (
                <div className="space-y-4">
                  <h3 className="font-black text-slate-900 text-xs border-b border-slate-300 pb-1 uppercase">
                    Alertes de contrôle enregistrées
                  </h3>
                  <div className="space-y-2">
                    {alertesFraude.map((a) => (
                      <div key={a.id} className="border border-slate-300 p-2.5 rounded bg-slate-50 text-[11px] space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-900">{a.id} - {a.type}</span>
                          <span className="text-slate-500 font-mono">{a.date}</span>
                        </div>
                        <p className="text-slate-700">{a.description}</p>
                        <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                          <span>Indice : <span className="font-mono font-bold text-slate-800">{a.valeur_suspecte}</span></span>
                          <span className="font-bold">Statut de vérification : {a.statut}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional signature areas for manual review */}
              <div className="mt-8 pt-4 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-[11px]">
                <div className="border border-slate-300 p-4 rounded-xl min-h-[110px] flex flex-col justify-between bg-slate-50">
                  <div>
                    <span className="font-bold uppercase text-slate-800 block">Pour le Site d'Exploitation :</span>
                    <span className="text-slate-600 text-[10px]">Le Gérant Principal du Complexe Automobile</span>
                  </div>
                  <div className="pt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>Signature & Visa</span>
                    <span className="text-emerald-700 font-bold">État de session : {sessionCaisse.statut}</span>
                  </div>
                </div>

                <div className="border border-slate-300 p-4 rounded-xl min-h-[110px] flex flex-col justify-between bg-slate-50 relative overflow-hidden">
                  <div>
                    <span className="font-bold uppercase text-slate-800 block">Pour la Direction Générale :</span>
                    <span className="text-slate-600 text-[10px]">Le Propriétaire / Auditeur Comptable</span>
                  </div>
                  <div className="pt-4 text-[10px] text-slate-500 font-mono">
                    <span>Visa et cachet à apposer manuellement</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="mt-8 pt-3 border-t border-slate-300 text-center text-[9px] text-slate-500 flex items-center justify-between font-mono">
              <span>AutoGestion Pro v3.0 • Système Intégré de Gestion Automobile</span>
              <span>Page 1 / 1 • Format ISO 216 A4</span>
              <span>Aperçu non certifié · Vérifier les écritures avant usage comptable</span>
            </div>
          </div>
        </div>

        {/* Action Bar Footer (Hidden in Print) */}
        <div className="no-print pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            Astuce : Cliquez sur <span className="font-bold text-white">"Imprimer / PDF"</span> puis sélectionnez <span className="font-bold text-white">"Enregistrer au format PDF"</span> dans votre navigateur.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
            >
              Fermer
            </button>
            <button
              onClick={handlePrintPdf}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/30 transition hover:scale-105"
            >
              <Download className="w-4 h-4" />
              <span>Imprimer / enregistrer en PDF</span>
            </button>
          </div>
        </div>

        {/* MODAL ENVOI EMAIL AVEC PDF JOINT */}
        {emailModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Préparer un brouillon d’e-mail</h3>
                    <p className="text-xs text-slate-400">L’application de messagerie s’ouvrira si elle est configurée.</p>
                  </div>
                </div>
                <button onClick={() => setEmailModalOpen(false)} className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-3 text-xs">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Adresse Email Destinataire (Direction / Propriétaire) *
                  </label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Objet du Message *
                  </label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-xs leading-5 text-blue-900">
                  Votre application de messagerie s’ouvrira avec le résumé. Imprimez d’abord le rapport en PDF et joignez-le manuellement si nécessaire.
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEmailModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer shadow flex items-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Ouvrir un brouillon</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
