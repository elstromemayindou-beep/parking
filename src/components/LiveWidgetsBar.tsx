import React from 'react';
import { AlertCircle, CircleDollarSign, Inbox, Users, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LiveWidgetsBar: React.FC = () => {
  const {
    sessionCaisse,
    employes,
    factures,
    demandesReservations,
    depenses,
    formatCurrency,
  } = useApp();

  const activeStaff = employes.filter(employee => employee.statut === 'ACTIF');
  const presentStaff = activeStaff.filter(employee => employee.present_aujourdhui);
  const dueAmount = factures
    .filter(invoice => invoice.statut !== 'PAYE' && invoice.statut !== 'ANNULEE')
    .reduce((total, invoice) => total + invoice.montant_total - invoice.montant_paye, 0);
  const approvals = depenses.filter(expense => expense.accord_proprietaire_requis && !expense.valide_par_proprietaire).length;
  const newRequests = demandesReservations.filter(request => request.statut === 'NOUVELLE').length;
  const widgets = [
    { label: 'Solde net du jour', value: formatCurrency(sessionCaisse.solde_net_theorique), icon: Wallet, tone: 'blue' },
    { label: 'Créances à recouvrer', value: formatCurrency(dueAmount), icon: CircleDollarSign, tone: 'violet' },
    { label: 'Présence équipe', value: `${presentStaff.length} / ${activeStaff.length}`, icon: Users, tone: 'emerald' },
    { label: 'Dépenses à approuver', value: String(approvals), icon: AlertCircle, tone: 'amber' },
    { label: 'Demandes à traiter', value: String(newRequests), icon: Inbox, tone: 'cyan' }
  ];

  return (
    <section aria-label="Indicateurs de gestion" className="indicator-strip border-b border-white/70 bg-white/35 px-4 py-3.5 backdrop-blur-xl">
      <div className="mx-auto max-w-[1440px]">
        <p className="mb-2 ml-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Vue rapide · indicateurs informatifs</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {widgets.map(widget => {
          const Icon = widget.icon;
          return (
            <article
              key={widget.label}
              className="glass-panel indicator-card flex min-w-0 items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-3 py-2.5"
            >
              <span className={`indicator-icon tone-${widget.tone} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl`}><Icon className="h-4 w-4" /></span>
              <span className="min-w-0">
                <span className="line-clamp-2 block text-[10px] font-semibold uppercase leading-3 tracking-wide text-slate-500">{widget.label}</span>
                <span className="mt-1 block truncate text-sm font-bold tabular-nums text-slate-950">{widget.value}</span>
              </span>
            </article>
          );
        })}
        </div>
      </div>
    </section>
  );
};
