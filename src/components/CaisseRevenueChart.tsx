import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

type Range = '7D' | 'MONTH';

export const CaisseRevenueChart: React.FC = () => {
  const { encaissements, depenses, sessionCaisse, formatCurrency } = useApp();
  const [range, setRange] = useState<Range>('7D');

  const data = useMemo(() => {
    const end = new Date(`${sessionCaisse.date}T12:00:00`);
    const dayCount = range === '7D' ? 7 : 28;
    return Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(end);
      date.setDate(end.getDate() - (dayCount - index - 1));
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayPayments = encaissements.filter(payment =>
        payment.created_at.slice(0, 10) === dateKey
      );
      const dayExpenses = depenses.filter(expense =>
        expense.created_at.slice(0, 10) === dateKey &&
        expense.valide_par_gerant &&
        (!expense.accord_proprietaire_requis || expense.valide_par_proprietaire)
      );
      const revenue = dayPayments.reduce((total, payment) => total + payment.montant, 0);
      const costs = dayExpenses.reduce((total, expense) => total + expense.montant, 0);
      return {
        date: range === '7D'
          ? date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' })
          : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        recettes: revenue,
        depenses: costs,
        solde: revenue - costs
      };
    });
  }, [encaissements, depenses, range, sessionCaisse.date]);

  const hasActivity = data.some(day => day.recettes > 0 || day.depenses > 0);

  return (
    <section className="glass-panel rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">Suivi financier</p>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight text-slate-950">Tendance de trésorerie</h2>
          <p className="mt-1 text-sm text-slate-500">Recettes et dépenses enregistrées sur cet établissement.</p>
        </div>
        <div className="glass-button flex rounded-xl p-1 text-xs">
          <button aria-pressed={range === '7D'} onClick={() => setRange('7D')} className={`rounded-lg px-3 py-2 font-semibold transition ${range === '7D' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            7 jours
          </button>
          <button aria-pressed={range === 'MONTH'} onClick={() => setRange('MONTH')} className={`rounded-lg px-3 py-2 font-semibold transition ${range === 'MONTH' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
            4 semaines
          </button>
        </div>
      </div>
      {hasActivity ? (
        <div className="mt-5 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 5" vertical={false} />
              <XAxis axisLine={false} tickLine={false} dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={value => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(value)} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 12px 30px rgba(15, 23, 42, .12)' }}
              />
              <Area type="monotone" dataKey="recettes" name="Recettes" stroke="#2563eb" strokeWidth={2.5} fill="url(#revenueFill)" activeDot={{ r: 5, strokeWidth: 0 }} />
              <Area type="monotone" dataKey="depenses" name="Dépenses" stroke="#f97316" strokeWidth={2.5} fill="url(#expenseFill)" activeDot={{ r: 5, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-empty-state mt-5 flex h-48 flex-col items-center justify-center rounded-2xl px-6 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm"><TrendingUp className="h-5 w-5" /></span>
          <p className="mt-3 text-sm font-semibold text-slate-700">Aucune opération sur cette période</p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Les courbes se dessineront ici dès que des recettes ou des dépenses seront enregistrées.</p>
        </div>
      )}
    </section>
  );
};
