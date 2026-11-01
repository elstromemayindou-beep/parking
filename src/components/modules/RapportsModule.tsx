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
import { DepartementActivite } from '../../types';
import { FinancialReportPdfModal } from '../FinancialReportPdfModal';

export const RapportsModule: React.FC = () => {
  const {
    factures,
    encaissements,
    depenses,
    employes: personnel,
    sessionCaisse,
    alertesFraude,
    currentSuccursale,
    formatCurrency,
    showNotification,
    departementActif,
    garageOrs,
    lavages,
    ticketsParking,
    piecesStock,
    mouvementsStock,
    configurationEntreprise
  } = useApp();

  const [activeTab, setActiveTab] = useState<'SYSCOHADA' | 'ADMINISTRATIF' | 'STOCKS' | 'WHATSAPP' | 'IA_FRAUDES'>('SYSCOHADA');
  const [period, setPeriod] = useState<'JOUR' | 'HEBDO' | 'MOIS'>('JOUR');
  const [typeRapportPartage, setTypeRapportPartage] = useState<'FINANCIER' | 'ADMINISTRATIF' | 'STOCKS'>('FINANCIER');
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedPdfType, setSelectedPdfType] = useState<'SYSCOHADA' | 'DAILY_JOURNAL' | 'CASH_CLOSING' | 'AUDIT_SECURITY'>('SYSCOHADA');

  const startOfPeriod = (() => {
    if (period === 'JOUR') return sessionCaisse.date;
    if (period === 'MOIS') return `${sessionCaisse.date.slice(0, 7)}-01`;
    const start = new Date(`${sessionCaisse.date}T12:00:00`);
    start.setDate(start.getDate() - 6);
    return start.toISOString().slice(0, 10);
  })();
  const periodLabel = period === 'JOUR' ? sessionCaisse.date : `${startOfPeriod} → ${sessionCaisse.date}`;
  const inPeriod = (date: string) => date.slice(0, 10) >= startOfPeriod && date.slice(0, 10) <= sessionCaisse.date;
  const departmentOfInvoice = (invoice: (typeof factures)[number] | undefined) => invoice?.departement || (
    invoice?.type_service === 'LAVAGE' ? 'LAVAGE'
      : invoice?.type_service === 'SALON' ? 'SALON'
        : invoice?.type_service === 'PARKING' ? 'PARKING'
          : invoice?.type_service === 'GARAGE' || invoice?.type_service === 'VENTE_PIECE' ? 'MECANIQUE'
            : undefined
  );
  const encaissementsSession = encaissements.filter(payment => {
    if (!inPeriod(payment.created_at)) return false;
    if (departementActif === 'GLOBAL') return true;
    const invoice = factures.find(item => item.id === payment.facture_id);
    return (payment.departement || departmentOfInvoice(invoice)) === departementActif;
  });
  const chiffreAffaires = encaissementsSession.reduce((sum, payment) => sum + payment.montant, 0);
  const recettesParService = (type: 'GARAGE' | 'LAVAGE' | 'PARKING' | 'VENTE_PIECE' | 'SALON') =>
    encaissementsSession
      .filter(payment => factures.find(facture => facture.id === payment.facture_id)?.type_service === type)
      .reduce((sum, payment) => sum + payment.montant, 0);
  const recettesAutres = chiffreAffaires -
    recettesParService('GARAGE') -
    recettesParService('LAVAGE') -
    recettesParService('PARKING') -
    recettesParService('VENTE_PIECE') -
    recettesParService('SALON');
  const depensesValidees = depenses.filter(
    expense => inPeriod(expense.created_at) &&
      (departementActif === 'GLOBAL' || expense.departement === departementActif) &&
      expense.valide_par_gerant &&
      (!expense.accord_proprietaire_requis || expense.valide_par_proprietaire)
  );
  const chargesExploitation = depensesValidees.reduce((sum, expense) => sum + expense.montant, 0);
  const encaissementsVirement = encaissementsSession
    .filter(payment => payment.mode_paiement === 'VIREMENT')
    .reduce((sum, payment) => sum + payment.montant, 0);
  const encaissementsEspeces = encaissementsSession
    .filter(payment => payment.mode_paiement === 'ESPECES')
    .reduce((sum, payment) => sum + payment.montant, 0);
  const encaissementsMomo = encaissementsSession
    .filter(payment => payment.mode_paiement === 'MTN_MOMO')
    .reduce((sum, payment) => sum + payment.montant, 0);
  const encaissementsAirtel = encaissementsSession
    .filter(payment => payment.mode_paiement === 'AIRTEL_MONEY')
    .reduce((sum, payment) => sum + payment.montant, 0);
  const depensesAchats = depensesValidees
    .filter(expense => ['Consommables & Pièces', 'Équipements & Outils'].includes(expense.categorie))
    .reduce((sum, expense) => sum + expense.montant, 0);
  const depensesEnergie = depensesValidees
    .filter(expense => ['Carburant', 'Carburant groupe électrogène', 'Électricité & Groupe électrogène', 'Dépannage groupe électrogène', 'Loyer & Électricité'].includes(expense.categorie))
    .reduce((sum, expense) => sum + expense.montant, 0);
  const autresDepenses = chargesExploitation - depensesAchats - depensesEnergie;
  const resultatNetExploitation = chiffreAffaires - chargesExploitation;
  const departmentOfEmployee = (employee: (typeof personnel)[number]) => employee.departement || (
    employee.poste === 'Coiffeur' ? 'SALON'
      : employee.poste === 'Laveur' ? 'LAVAGE'
        : employee.poste === 'Agent Parking' || employee.poste === 'Gardien' ? 'PARKING'
          : employee.poste === 'Mécanicien' || employee.poste === "Chef d'Atelier" ? 'MECANIQUE'
            : undefined
  );
  const personnelActif = personnel.filter(employee => employee.statut === 'ACTIF' &&
    (departementActif === 'GLOBAL' || departmentOfEmployee(employee) === departementActif));
  const personnelPresent = personnel.filter(employee => employee.present_aujourdhui &&
    (departementActif === 'GLOBAL' || departmentOfEmployee(employee) === departementActif));
  const stockDepartment = (piece: (typeof piecesStock)[number]) => piece.departement || (
    piece.categorie === 'Consommables Lavage' ? 'LAVAGE'
      : piece.categorie === 'Salon & Coiffure' ? 'SALON'
        : 'MECANIQUE'
  );
  const piecesDansScope = piecesStock.filter(piece => departementActif === 'GLOBAL' || stockDepartment(piece) === departementActif);
  const mouvementsDansPeriode = mouvementsStock.filter(movement => {
    if (!inPeriod(movement.created_at)) return false;
    if (departementActif === 'GLOBAL') return true;
    const piece = piecesStock.find(item => item.id === movement.piece_id);
    return (movement.departement || (piece ? stockDepartment(piece) : undefined)) === departementActif;
  });
  const ticketsParkingDansPeriode = ticketsParking.filter(ticket =>
    inPeriod(ticket.heure_sortie || ticket.heure_entree) &&
    (departementActif === 'GLOBAL' || (ticket.departement || 'PARKING') === departementActif)
  );
  const recettesGardiennage = encaissementsSession.reduce((sum, payment) => {
    const invoice = factures.find(item => item.id === payment.facture_id);
    const guardLineTotal = invoice?.lignes
      ?.filter(line => line.description.toLocaleLowerCase().includes('gardiennage'))
      .reduce((lineSum, line) => lineSum + line.total, 0) || 0;
    return sum + (invoice && invoice.montant_paye > 0
      ? payment.montant * guardLineTotal / invoice.montant_paye
      : 0);
  }, 0);
  const serviceLabels: Record<DepartementActivite | 'GLOBAL', string> = {
    GLOBAL: 'Toutes les activités',
    LAVAGE: 'Lavage',
    SALON: 'Salon de coiffure',
    MECANIQUE: 'Garage / mécanique',
    PARKING: 'Parking et gardiennage'
  };
  const pdgPhone = configurationEntreprise.telephonePdgWhatsapp.replace(/\D/g, '');

  const generateOwnerWhatsAppReport = () => {
    const dateLabel = periodLabel;
    const activityLabel = serviceLabels[departementActif];
      if (typeRapportPartage === 'ADMINISTRATIF') {
        return `📋 *RAPPORT ADMINISTRATIF N.O.B BUSINESS*
🏢 *Établissement :* ${currentSuccursale.nom}
📅 *Période :* ${dateLabel}
🧭 *Activité :* ${activityLabel}
• Personnel actif : ${personnelActif.length}
• Présents aujourd’hui : ${personnelPresent.length}
• Lavages enregistrés : ${lavages.filter(item => inPeriod(item.heure_reception) && (departementActif === 'GLOBAL' || (item.departement || 'LAVAGE') === departementActif)).length}
• Ordres de mécanique : ${garageOrs.filter(item => inPeriod(item.date_entree) && (departementActif === 'GLOBAL' || (item.departement || 'MECANIQUE') === departementActif)).length}
• Tickets parking actifs : ${ticketsParking.filter(item => item.statut === 'ACTIF' && (departementActif === 'GLOBAL' || (item.departement || 'PARKING') === departementActif)).length}

_Rapport administratif calculé à partir des données enregistrées. Envoi manuel._`;
      }
      if (typeRapportPartage === 'STOCKS') {
        const periodMoves = mouvementsDansPeriode;
        const lowStock = piecesDansScope.filter(piece => piece.quantite_disponible <= piece.seuil_alerte);
        return `📦 *RAPPORT STOCKS N.O.B BUSINESS*
🏢 *Établissement :* ${currentSuccursale.nom}
📅 *Période :* ${dateLabel}
🧭 *Activité :* ${activityLabel}
• Articles sous seuil : ${lowStock.length}
• Mouvements de stock sur la période : ${periodMoves.length}
• Entrées : ${periodMoves.filter(move => move.type === 'ENTREE').length}
• Sorties : ${periodMoves.filter(move => move.type === 'SORTIE').length}
• Ajustements : ${periodMoves.filter(move => move.type === 'AJUSTEMENT').length}

_Rapport de stock calculé à partir des données enregistrées. Envoi manuel._`;
      }
      return `📊 *RAPPORT FINANCIER N.O.B BUSINESS*
🏢 *Succursale :* ${currentSuccursale.nom} (${currentSuccursale.ville})
📅 *Période :* ${dateLabel}
🧭 *Activité :* ${activityLabel}
───────────────────────────
💰 *ENCAISSEMENTS ENREGISTRÉS :*
• Total : ${formatCurrency(chiffreAffaires)}
    - Espèces : ${formatCurrency(encaissementsSession.filter(payment => payment.mode_paiement === 'ESPECES').reduce((sum, payment) => sum + payment.montant, 0))}
    - MTN MoMo : ${formatCurrency(encaissementsSession.filter(payment => payment.mode_paiement === 'MTN_MOMO').reduce((sum, payment) => sum + payment.montant, 0))}
    - Airtel Money : ${formatCurrency(encaissementsSession.filter(payment => payment.mode_paiement === 'AIRTEL_MONEY').reduce((sum, payment) => sum + payment.montant, 0))}
  - Virements enregistrés : ${formatCurrency(encaissementsVirement)}
• Dépenses validées : -${formatCurrency(chargesExploitation)}
⭐ *DIFFÉRENCE : ${formatCurrency(resultatNetExploitation)}*
${departementActif === 'PARKING'
  ? `• Tickets sortis et payés : ${ticketsParkingDansPeriode.filter(ticket => ticket.statut === 'PAYE_SORTI').length}
• Tickets gardiennage : ${ticketsParkingDansPeriode.filter(ticket => ticket.service_gardiennage).length}`
  : ''}
───────────────────────────
• État de la caisse : ${sessionCaisse.statut === 'CLOTUREE' ? `clôturée, écart ${formatCurrency(sessionCaisse.ecart_total || 0)}` : 'session ouverte'}
───────────────────────────
📋 *SUIVI :*
• Alertes de contrôle : ${alertesFraude.filter(a => a.statut === 'A_VERIFIER').length} à traiter
• Personnel déclaré présent : ${personnelPresent.length}/${personnel.length}

_Résumé généré à partir des données enregistrées. Transmettez-le manuellement._`;
  };
  const whatsappUrl = pdgPhone
    ? `https://wa.me/${pdgPhone}?text=${encodeURIComponent(generateOwnerWhatsAppReport())}`
    : undefined;

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
            <span>{departementActif === 'GLOBAL' ? 'Toutes les activités' : `Espace ${serviceLabels[departementActif]}`}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            {departementActif === 'GLOBAL' ? 'Rapports globaux' : `Rapports · ${serviceLabels[departementActif]}`}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {departementActif === 'GLOBAL'
              ? 'Synthèses consolidées de toutes les activités.'
              : `Données limitées à l’activité ${serviceLabels[departementActif]} ; les autres modules sont exclus.`}
            {' '}Consultez, imprimez ou partagez le rapport de la période sélectionnée.
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
            disabled={activeTab === 'ADMINISTRATIF' || activeTab === 'STOCKS'}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition hover:scale-105 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            title={activeTab === 'ADMINISTRATIF' || activeTab === 'STOCKS' ? 'Le partage de ces rapports se fait dans l’onglet Résumé à partager.' : 'Ouvrir l’aperçu financier imprimable'}
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
              {departementActif === 'GLOBAL' ? 'Synthèse globale' : `Rapport ${serviceLabels[departementActif]}`}
            </button>
            <button
              onClick={() => setActiveTab('ADMINISTRATIF')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === 'ADMINISTRATIF' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Administratif
            </button>
            <button
              onClick={() => setActiveTab('STOCKS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === 'STOCKS' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
              Stocks
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

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-300">Période</span>
          {([
            ['JOUR', 'Journalier'],
            ['HEBDO', '7 derniers jours'],
            ['MOIS', 'Mois en cours']
          ] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setPeriod(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${period === value ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{label}</button>
          ))}
          <span className="ml-1 text-xs text-slate-400">{periodLabel}</span>
        </div>
      </div>

      {/* Financial overview */}
      {activeTab === 'SYSCOHADA' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Encaissements sur la période</span>
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
              <span className="text-[11px] text-slate-500">{periodLabel}</span>
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
              <span className="text-[11px] text-blue-300 font-semibold">{periodLabel}</span>
            </div>
          </div>

          {departementActif === 'PARKING' && (
            <section aria-label="Activité du parking sur la période" className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 to-white p-4 text-slate-900 shadow-sm">
              <div className="mb-3">
                <h2 className="text-sm font-extrabold">Activité parking · {periodLabel}</h2>
                <p className="mt-1 text-xs text-slate-600">Indicateurs des tickets du parking uniquement.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <ReportMetric label="Tickets sortis et payés" value={ticketsParkingDansPeriode.filter(ticket => ticket.statut === 'PAYE_SORTI').length} />
                <ReportMetric label="Tickets encore actifs" value={ticketsParkingDansPeriode.filter(ticket => ticket.statut === 'ACTIF').length} />
                <ReportMetric label="Tickets avec gardiennage" value={ticketsParkingDansPeriode.filter(ticket => ticket.service_gardiennage).length} />
              </div>
            </section>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-blue-400" />
                  <span>{departementActif === 'GLOBAL' ? 'Répartition des encaissements et dépenses' : `Rapport financier · ${serviceLabels[departementActif]}`}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {departementActif === 'GLOBAL'
                    ? 'Consolidation de toutes les activités · synthèse opérationnelle non certifiée'
                    : `Activité ${serviceLabels[departementActif]} uniquement · ${periodLabel}`}
                </p>
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
                  {departementActif === 'GLOBAL' ? (
                    <>
                      {([
                        ['Garage', 'GARAGE'],
                        ['Lavage', 'LAVAGE'],
                        ['Parking', 'PARKING'],
                        ['Salon de coiffure', 'SALON'],
                        ['Vente de pièces', 'VENTE_PIECE']
                      ] as const).map(([label, type]) => (
                        <tr key={type}>
                          <td className="p-2.5 pl-6 text-slate-400">{label}</td>
                          <td className="p-2.5 font-mono text-slate-500">Activité</td>
                          <td className="p-2.5 text-right font-mono">{formatCurrency(recettesParService(type))}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="p-2.5 pl-6 text-slate-400">Autres ou prestation indisponible</td>
                        <td className="p-2.5 font-mono text-slate-500">Activité</td>
                        <td className="p-2.5 text-right font-mono">{formatCurrency(recettesAutres)}</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      {(departementActif === 'PARKING'
                        ? [
                            { label: 'Stationnement', amount: chiffreAffaires - recettesGardiennage },
                            { label: 'Gardiennage de nuit', amount: recettesGardiennage }
                          ]
                        : departementActif === 'MECANIQUE'
                          ? [
                              { label: 'Garage et réparations', amount: recettesParService('GARAGE') },
                              { label: 'Vente de pièces', amount: recettesParService('VENTE_PIECE') }
                            ]
                          : [{ label: serviceLabels[departementActif], amount: chiffreAffaires }]
                      ).map(item => (
                        <tr key={item.label}>
                          <td className="p-2.5 pl-6 text-slate-400">{item.label}</td>
                          <td className="p-2.5 font-mono text-slate-500">{periodLabel}</td>
                          <td className="p-2.5 text-right font-mono">{formatCurrency(item.amount)}</td>
                        </tr>
                      ))}
                      {([
                        ['Espèces', encaissementsEspeces],
                        ['MTN MoMo', encaissementsMomo],
                        ['Airtel Money', encaissementsAirtel],
                        ['Virements', encaissementsVirement]
                      ] as const).map(([label, amount]) => (
                        <tr key={label}>
                          <td className="p-2.5 pl-6 text-slate-400">{label}</td>
                          <td className="p-2.5 font-mono text-slate-500">Moyen de paiement</td>
                          <td className="p-2.5 text-right font-mono">{formatCurrency(amount)}</td>
                        </tr>
                      ))}
                    </>
                  )}

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
                    <td className="p-3 font-mono text-slate-400">Période</td>
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

      {activeTab === 'ADMINISTRATIF' && (
        <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div>
            <h2 className="text-lg font-bold text-white">Rapport administratif · {periodLabel}</h2>
            <p className="mt-1 text-xs text-slate-400">{departementActif === 'GLOBAL' ? 'Toutes les activités' : departementActif}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReportMetric label="Personnel actif" value={personnelActif.length} />
            <ReportMetric label="Présents aujourd’hui" value={personnelPresent.length} />
            <ReportMetric label="Lavages reçus sur la période" value={lavages.filter(item =>
              inPeriod(item.heure_reception) && (departementActif === 'GLOBAL' || (item.departement || 'LAVAGE') === departementActif)
            ).length} />
            <ReportMetric label="Ordres garage créés" value={garageOrs.filter(item =>
              inPeriod(item.date_entree) && (departementActif === 'GLOBAL' || (item.departement || 'MECANIQUE') === departementActif)
            ).length} />
          </div>
          <div className="rounded-xl border border-slate-800 p-4 text-sm text-slate-300">
            <p>Tickets parking actifs : <strong className="text-white">{ticketsParking.filter(ticket =>
              ticket.statut === 'ACTIF' && (departementActif === 'GLOBAL' || (ticket.departement || 'PARKING') === departementActif)
            ).length}</strong></p>
            <p className="mt-2">Alertes de contrôle à traiter : <strong className="text-white">{alertesFraude.filter(alert => alert.statut === 'A_VERIFIER').length}</strong></p>
          </div>
        </section>
      )}

      {activeTab === 'STOCKS' && (
        <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div>
            <h2 className="text-lg font-bold text-white">Rapport de stocks · {periodLabel}</h2>
            <p className="mt-1 text-xs text-slate-400">{departementActif === 'GLOBAL' ? 'Toutes les activités' : departementActif}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ReportMetric label="Articles suivis" value={piecesDansScope.length} />
            <ReportMetric label="Articles sous seuil" value={piecesDansScope.filter(piece => piece.quantite_disponible <= piece.seuil_alerte).length} />
            <ReportMetric label="Entrées sur la période" value={mouvementsDansPeriode.filter(move => move.type === 'ENTREE').length} />
            <ReportMetric label="Sorties sur la période" value={mouvementsDansPeriode.filter(move => move.type === 'SORTIE').length} />
          </div>
          <div className="overflow-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400"><tr><th className="p-3">Article</th><th className="p-3">Activité</th><th className="p-3 text-right">Stock</th><th className="p-3 text-right">Seuil</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {piecesDansScope.map(piece => <tr key={piece.id}><td className="p-3 font-semibold text-white">{piece.nom}</td><td className="p-3">{stockDepartment(piece)}</td><td className="p-3 text-right">{piece.quantite_disponible}</td><td className="p-3 text-right">{piece.seuil_alerte}</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
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
                <p className="text-xs text-slate-400">Ouvrez WhatsApp avec le rapport prérempli, puis vérifiez et envoyez-le manuellement.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void handleCopyWhatsApp()}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md ${summaryCopied ? 'bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white font-extrabold'}`}
              >
                {summaryCopied ? <><CheckCircle2 className="w-4 h-4" /><span>Résumé copié</span></> : <><Share2 className="w-4 h-4" /><span>Copier le résumé</span></>}
              </button>
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500">
                  <MessageCircle className="h-4 w-4" /> Ouvrir WhatsApp du PDG
                </a>
              ) : (
                <span className="self-center text-xs text-amber-300">Renseignez le numéro WhatsApp du PDG dans Paramètres.</span>
              )}
            </div>
          </div>

          <label className="block text-xs font-semibold text-slate-300">Type de rapport à partager
            <select value={typeRapportPartage} onChange={event => setTypeRapportPartage(event.target.value as typeof typeRapportPartage)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
              <option value="FINANCIER">Rapport financier</option>
              <option value="ADMINISTRATIF">Rapport administratif</option>
              <option value="STOCKS">Rapport de stocks</option>
            </select>
          </label>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <pre className="text-xs text-blue-200 font-mono whitespace-pre-wrap leading-relaxed">
              {generateOwnerWhatsAppReport()}
            </pre>
          </div>

          <p className="text-xs text-slate-400 italic">
            * Les rapports sont calculés par période et activité sélectionnées. WhatsApp ne les envoie pas automatiquement : confirmez l’envoi dans WhatsApp.
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
        startDate={startOfPeriod}
        endDate={sessionCaisse.date}
      />
    </div>
  );
};

const ReportMetric: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-black text-white">{value}</p>
  </div>
);
