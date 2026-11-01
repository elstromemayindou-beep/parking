import React, { useMemo, useState } from 'react';
import { Scissors, Receipt, CircleDollarSign } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'MTN_MOMO', label: 'MTN MoMo' },
  { value: 'AIRTEL_MONEY', label: 'Airtel Money' },
  { value: 'VIREMENT', label: 'Virement' }
];

const emptyAmounts: Record<PaymentMethod, number> = {
  ESPECES: 0,
  MTN_MOMO: 0,
  AIRTEL_MONEY: 0,
  VIREMENT: 0
};

export const SalonModule: React.FC = () => {
  const {
    employes,
    factures,
    primesAmendes,
    piecesStock,
    sessionCaisse,
    enregistrerRecetteJournaliereSalon,
    formatCurrency,
    showNotification,
    setActiveModule,
    setDepartementActif
  } = useApp();
  const coiffeurs = employes.filter(employee => employee.poste === 'Coiffeur' && employee.statut === 'ACTIF');
  const [coiffeurId, setCoiffeurId] = useState('');
  const [montants, setMontants] = useState<Record<PaymentMethod, number>>(emptyAmounts);
  const [saving, setSaving] = useState(false);
  const today = sessionCaisse.date;
  const sales = useMemo(() => factures
    .filter(invoice => invoice.type_service === 'SALON')
    .sort((a, b) => b.created_at.localeCompare(a.created_at)), [factures]);
  const todaysSales = sales.filter(invoice =>
    (invoice.salon_date_recette || invoice.created_at.slice(0, 10)) === today && invoice.statut !== 'ANNULEE'
  );
  const totalToday = todaysSales.reduce((sum, invoice) => sum + invoice.montant_paye, 0);
  const todaysInvoiceIds = new Set(todaysSales.map(invoice => invoice.id));
  const commissionToday = primesAmendes
    .filter(act => act.type_acte === 'PRIME' && !act.annulee && act.facture_id !== undefined && todaysInvoiceIds.has(act.facture_id))
    .reduce((sum, act) => sum + act.montant, 0);
  const salonStock = piecesStock.filter(piece => piece.departement === 'SALON' || piece.categorie === 'Salon & Coiffure');
  const recetteDejaEnregistree = factures.some(invoice =>
    invoice.type_service === 'SALON' && invoice.salon_date_recette === today && invoice.statut !== 'ANNULEE'
  );
  const totalSaisi = paymentMethods.reduce((sum, method) => sum + (montants[method.value] || 0), 0);

  const submitDailyReceipt = (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!coiffeurId) {
      showNotification('Choisissez le coiffeur concerné par la recette de la journée.', 'warning');
      return;
    }
    setSaving(true);
    try {
      const invoice = enregistrerRecetteJournaliereSalon(today, montants, Number(coiffeurId));
      if (invoice) {
        setCoiffeurId('');
        setMontants(emptyAmounts);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pink-300"><Scissors className="h-4 w-4" /> Module salon</p>
          <h1 className="mt-1 text-2xl font-black text-white">Salon de coiffure</h1>
          <p className="mt-1 text-sm text-slate-400">Saisissez la recette globale à la fin de la journée, sans enregistrer chaque client. La commission du coiffeur choisi est calculée à 40 %.</p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs font-bold uppercase text-slate-400">Recette salon du jour · {today}</p>
          <p className="mt-2 text-2xl font-black text-emerald-300">{formatCurrency(totalToday)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs font-bold uppercase text-slate-400">Commission enregistrée</p>
          <p className="mt-2 text-2xl font-black text-blue-300">{formatCurrency(commissionToday)}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white">Stock du salon</h2>
            <p className="mt-1 text-xs text-slate-400">{salonStock.length} article(s) · {salonStock.filter(piece => piece.quantite_disponible <= piece.seuil_alerte).length} sous le seuil</p>
          </div>
          <button type="button" onClick={() => {
            setDepartementActif('SALON');
            setActiveModule('STOCKS');
          }} className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">
            Gérer le stock salon
          </button>
        </div>
        {salonStock.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {salonStock.slice(0, 8).map(piece => (
              <span key={piece.id} className={`rounded-lg px-3 py-1.5 text-xs ${piece.quantite_disponible <= piece.seuil_alerte ? 'bg-amber-950/50 text-amber-200' : 'bg-slate-800 text-slate-200'}`}>
                {piece.nom} · {piece.quantite_disponible}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <form onSubmit={submitDailyReceipt} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="flex items-center gap-2 text-base font-bold text-white"><CircleDollarSign className="h-4 w-4 text-emerald-300" /> Clôture de la recette journalière</h2>
          <p className="text-xs text-slate-400">Date de caisse : {today}. Saisissez les totaux de la journée ventilés par moyen de paiement.</p>
          {coiffeurs.length === 0 && (
            <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-3 text-sm text-amber-200">
              Ajoutez un employé avec le poste « Coiffeur » dans la gestion du personnel.
            </div>
          )}
          {recetteDejaEnregistree ? (
            <div role="status" className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 p-3 text-sm text-emerald-200">
              La recette de cette journée est déjà enregistrée. Pour la corriger, annulez d’abord la transaction avec son motif dans la caisse.
            </div>
          ) : (
            <>
              <label className="block text-xs font-semibold text-slate-300">Coiffeur concerné
                <select required value={coiffeurId} onChange={event => setCoiffeurId(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white">
                  <option value="">Choisir un coiffeur</option>
                  {coiffeurs.map(employee => <option key={employee.id} value={employee.id}>{employee.nom_complet}</option>)}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {paymentMethods.map(method => (
                  <label key={method.value} className="block text-xs font-semibold text-slate-300">{method.label} (FCFA)
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={montants[method.value]}
                      onChange={event => setMontants(previous => ({ ...previous, [method.value]: Number(event.target.value) }))}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 font-mono text-sm text-white"
                    />
                  </label>
                ))}
              </div>
              <p className="rounded-lg bg-slate-800 p-3 text-xs text-slate-300">
                Total à enregistrer : <strong className="text-white">{formatCurrency(totalSaisi)}</strong> · Commission coiffeur (40 %) : <strong className="text-blue-200">{formatCurrency(Math.round(totalSaisi * 0.4))}</strong>
              </p>
              <button type="submit" disabled={saving || coiffeurs.length === 0 || totalSaisi <= 0} className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? 'Enregistrement…' : 'Enregistrer la recette du jour'}
              </button>
            </>
          )}
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-800 p-4 text-sm font-bold text-white"><Receipt className="h-4 w-4 text-blue-300" /> Historique des recettes du salon</div>
          <div className="max-h-[28rem] overflow-auto">
            {sales.length === 0 ? <p className="p-5 text-sm text-slate-400">Aucune recette enregistrée.</p> : sales.map(invoice => (
              <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/70 p-4 text-sm">
                <div><p className="font-semibold text-white">{invoice.description}</p><p className="mt-1 text-xs text-slate-400">{invoice.salon_date_recette || invoice.created_at.slice(0, 10)} · {invoice.numero} · {invoice.statut}</p></div>
                <span className="font-mono font-bold text-emerald-300">{formatCurrency(invoice.montant_paye)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
