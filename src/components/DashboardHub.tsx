import React from 'react';
import { useApp } from '../context/AppContext';
import { ActiveModule } from '../types';
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Building2,
  CircleDollarSign,
  FileText,
  HandCoins,
  Inbox,
  LineChart,
  ParkingSquare,
  Sparkles,
  Settings2,
  ReceiptText,
  TrendingDown,
  Users2,
  Wrench
} from 'lucide-react';
import { CaisseRevenueChart } from './CaisseRevenueChart';
import { StockCriticalAlertsWidget } from './StockCriticalAlertsWidget';

export const DashboardHub: React.FC = () => {
  const {
    setActiveModule,
    currentSuccursale,
    placesParking,
    ticketsParking,
    lavages,
    garageOrs,
    sessionCaisse,
    employes,
    piecesStock,
    depenses,
    factures,
    demandesReservations,
    alertesFraude,
    formatCurrency,
    userRole
  } = useApp();

  const activeParking = ticketsParking.filter(ticket => ticket.statut === 'ACTIF').length;
  const activeWash = lavages.filter(wash => wash.statut === 'EN_ATTENTE' || wash.statut === 'EN_COURS').length;
  const activeRepairs = garageOrs.filter(order => order.etape !== 'PRET_FACTURE').length;
  const unpaidInvoices = factures.filter(invoice => invoice.statut !== 'PAYE' && invoice.statut !== 'ANNULEE');
  const receivables = unpaidInvoices.reduce((total, invoice) => total + invoice.montant_total - invoice.montant_paye, 0);
  const criticalStock = piecesStock.filter(piece => piece.quantite_disponible <= piece.seuil_alerte).length;
  const pendingRequests = demandesReservations.filter(request => request.statut === 'NOUVELLE').length;
  const activeEmployees = employes.filter(employee => employee.statut === 'ACTIF');
  const presentEmployees = activeEmployees.filter(employee => employee.present_aujourdhui).length;
  const pendingAlerts = alertesFraude.filter(alert => alert.statut === 'A_VERIFIER').length;
  const todayInvoices = factures.filter(invoice => invoice.created_at.slice(0, 10) === sessionCaisse.date);

  const modules: { id: ActiveModule; title: string; description: string; count: string; icon: React.ElementType; tone: string }[] = [
    { id: 'PARKING', title: 'Parking', description: 'Places et tickets actifs', count: `${activeParking} ticket(s)`, icon: ParkingSquare, tone: 'sky' },
    { id: 'LAVAGE', title: 'Lavage', description: 'File de véhicules', count: `${activeWash} en cours`, icon: Sparkles, tone: 'cyan' },
    { id: 'GARAGE', title: 'Garage', description: 'Ordres de réparation', count: `${activeRepairs} ordre(s) actif(s)`, icon: Wrench, tone: 'violet' },
    { id: 'CAISSE', title: 'Caisse', description: 'Encaissements et clôture', count: formatCurrency(sessionCaisse.solde_net_theorique), icon: CircleDollarSign, tone: 'emerald' },
    { id: 'EMPLOYES', title: 'Équipe', description: 'Présences du jour', count: `${presentEmployees}/${activeEmployees.length} présent(s)`, icon: Users2, tone: 'indigo' },
    { id: 'STOCKS', title: 'Stocks', description: 'Inventaire et alertes', count: `${criticalStock} sous le seuil`, icon: Boxes, tone: 'amber' },
    { id: 'DEPENSES', title: 'Dépenses', description: 'Sorties et validations', count: formatCurrency(sessionCaisse.depenses_validees), icon: TrendingDown, tone: 'rose' },
    { id: 'DETTES', title: 'Créances clients', description: 'Factures à recouvrer', count: formatCurrency(receivables), icon: HandCoins, tone: 'orange' },
    { id: 'DEMANDES', title: 'Réservations', description: 'Demandes à traiter', count: `${pendingRequests} en attente`, icon: Inbox, tone: 'teal' },
    { id: 'RAPPORTS', title: 'Rapports', description: 'Activité et journal', count: `${pendingAlerts} alerte(s) à vérifier`, icon: LineChart, tone: 'slate' },
    { id: 'PARAMETRES', title: 'Tarifs et profil', description: 'Prix des services et fiche du gérant', count: 'Réglages établissement', icon: Settings2, tone: 'blue' }
  ];
  const availableModules = modules.filter(module =>
    module.id !== 'PARAMETRES' || userRole === 'GERANT' || userRole === 'PROPRIETAIRE'
  );

  return (
    <div className="mx-auto max-w-[1440px] space-y-8 p-4 sm:p-6 lg:space-y-10 lg:p-9">
      <header className="animate-rise-in flex flex-col justify-between gap-4 lg:flex-row lg:items-end lg:gap-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100/80 bg-white/75 px-3 py-1.5 text-xs font-semibold text-blue-800 shadow-sm backdrop-blur">
            <Building2 className="h-3.5 w-3.5" />
            {currentSuccursale.nom}{currentSuccursale.ville && ` · ${currentSuccursale.ville}`}
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.65rem]">Bonjour, voici votre activité</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Votre poste de pilotage pour suivre les opérations et la caisse de la journée.
          </p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-2xl border border-white/80 bg-white/65 px-3.5 py-2.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur lg:self-auto">
          <span className={`h-2 w-2 rounded-full ${sessionCaisse.statut === 'OUVERTE' ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]' : 'bg-slate-400'}`} />
          Session de caisse {sessionCaisse.statut === 'OUVERTE' ? 'ouverte' : 'clôturée'}
          <span className="mx-1 h-4 w-px bg-slate-200" />
          <span className="font-semibold text-slate-800">{sessionCaisse.date}</span>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <div className="cash-hero glass-panel animate-rise-in relative overflow-hidden rounded-[1.75rem] bg-blue-50 p-5 sm:p-7 lg:p-8">
          <div className="cash-hero-orb ambient-orb -right-20 -top-32 h-72 w-72 bg-blue-200/50" />
          <div className="cash-hero-orb ambient-orb -bottom-36 right-1/4 h-64 w-64 bg-indigo-100/60" />
          <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-800">
                <CircleDollarSign className="h-4 w-4" /> Résumé de caisse
              </p>
              <p className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.5rem]">{formatCurrency(sessionCaisse.solde_net_theorique)}</p>
              <p className="mt-2 text-sm text-slate-600">
                Solde net théorique de la session
                <span className="mx-2 text-slate-400">·</span>
                Recettes {formatCurrency(sessionCaisse.recettes_especes_theorique + sessionCaisse.recettes_momo_theorique + sessionCaisse.recettes_airtel_theorique)}
                <span className="mx-2 text-slate-400">−</span>
                Dépenses {formatCurrency(sessionCaisse.depenses_validees)}
              </p>
            </div>
            <button onClick={() => setActiveModule('CAISSE')} className="button-primary inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white">
              <CircleDollarSign className="h-4 w-4" />
              Accéder à la caisse
              <ArrowUpRight className="h-4 w-4 opacity-80" />
            </button>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-2 border-t border-blue-200/70 pt-5 sm:grid-cols-4 sm:gap-3">
            <CashMetric label="Espèces" value={sessionCaisse.recettes_especes_theorique} formatCurrency={formatCurrency} />
            <CashMetric label="MTN MoMo" value={sessionCaisse.recettes_momo_theorique} formatCurrency={formatCurrency} />
            <CashMetric label="Airtel Money" value={sessionCaisse.recettes_airtel_theorique} formatCurrency={formatCurrency} />
            <div className="cash-metric">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Statut</p>
              <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
                <span className={`h-1.5 w-1.5 rounded-full ${sessionCaisse.statut === 'OUVERTE' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {sessionCaisse.statut === 'OUVERTE' ? 'Ouverte' : 'Clôturée'}
              </p>
            </div>
          </div>
          </div>
        </div>

        <div className="glass-panel animate-rise-in rounded-[1.75rem] border border-white/80 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-base font-extrabold tracking-tight text-slate-950">À suivre aujourd’hui</p>
              <p className="mt-1 text-xs text-slate-500">{todayInvoices.length} facture(s) enregistrée(s) pour cette session</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><ReceiptText className="h-5 w-5" /></span>
          </div>
          <div className="mt-4 space-y-1">
            <FollowUp label="Demandes en attente" value={pendingRequests} onClick={() => setActiveModule('DEMANDES')} />
            <FollowUp label="Articles sous le seuil" value={criticalStock} onClick={() => setActiveModule('STOCKS')} />
            <FollowUp label="Alertes à vérifier" value={pendingAlerts} onClick={() => setActiveModule('RAPPORTS')} />
            <FollowUp label="Employés présents" value={`${presentEmployees} / ${activeEmployees.length}`} onClick={() => setActiveModule('EMPLOYES')} />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-950">Espaces de travail</h2>
            <p className="text-sm text-slate-600">Choisissez une activité pour consulter ou enregistrer une opération.</p>
          </div>
          <span className="text-xs font-medium text-slate-500">{availableModules.length} modules</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {availableModules.map(module => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className={`glass-panel glass-button dashboard-card group rounded-2xl border border-white/80 bg-white p-4 text-left tone-${module.tone}`}
              >
                <div className="flex items-center justify-between">
                  <span className="module-icon flex h-11 w-11 items-center justify-center rounded-xl"><Icon className="h-5 w-5" /></span>
                  <ArrowRight className="module-arrow h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">{module.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{module.description}</p>
                <p className="module-count mt-3 text-sm font-bold">{module.count}</p>
                <span className="module-open-label mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Ouvrir le module <ArrowUpRight className="h-3 w-3" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {todayInvoices.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Dernières factures du jour</h2>
          <div className="mt-3 divide-y divide-slate-100">
            {todayInvoices.slice(0, 5).map(invoice => (
              <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-800">{invoice.numero} · {invoice.description}</p>
                  <p className="text-xs text-slate-500">{invoice.type_service} · {invoice.created_at}</p>
                </div>
                <span className="font-semibold text-slate-900">{formatCurrency(invoice.montant_paye)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <CaisseRevenueChart />
      <StockCriticalAlertsWidget />
    </div>
  );
};

const CashMetric: React.FC<{ label: string; value: number; formatCurrency: (amount: number) => string }> = ({ label, value, formatCurrency }) => (
  <div className="cash-metric">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-1.5 text-sm font-bold text-slate-900">{formatCurrency(value)}</p>
  </div>
);

const FollowUp: React.FC<{ label: string; value: string | number; onClick: () => void }> = ({ label, value, onClick }) => (
  <button onClick={onClick} className="follow-up-row group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left">
    <span className="text-sm font-medium text-slate-600">{label}</span>
    <span className="flex items-center gap-2 text-sm font-bold text-slate-900">{value}<ArrowRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5" /></span>
  </button>
);
