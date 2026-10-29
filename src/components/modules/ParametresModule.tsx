import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { GerantProfileData, TarifsServices } from '../../types';

type ProfilForm = GerantProfileData;

const creerProfilInitial = (email?: string | null): ProfilForm => ({
  nom_complet: '',
  telephone: '',
  email: email || '',
  adresse: '',
  date_naissance: '',
  numero_piece_identite: '',
  contact_urgence_nom: '',
  contact_urgence_telephone: '',
  type_contrat: 'CDI',
  date_embauche: new Date().toISOString().slice(0, 10),
  salaire_base: 0,
  qualification: '',
  notes_rh: ''
});

const champsTarifs: { key: keyof TarifsServices; label: string; aide: string }[] = [
  { key: 'lavageSimple', label: 'Lavage express', aide: 'Prix de la formule extérieure simple' },
  { key: 'lavageComplet', label: 'Lavage complet', aide: 'Prix de la formule intérieur et extérieur' },
  { key: 'lavageVipDetailing', label: 'Lavage VIP detailing', aide: 'Prix de la formule detailing' },
  { key: 'parkingPremiereHeure', label: 'Parking — première heure', aide: 'Tarif appliqué jusqu’à 4 quarts d’heure' },
  { key: 'parkingQuartHeureSupplementaire', label: 'Parking — quart d’heure supplémentaire', aide: 'Tarif de chaque tranche entamée après la première heure' },
  { key: 'garageMainOeuvre', label: 'Garage — forfait main-d’œuvre par défaut', aide: 'Montant proposé lors de la création d’un devis' }
];

export const ParametresModule: React.FC = () => {
  const {
    authUserId,
    currentSuccursale,
    gerantProfile,
    saveGerantProfile,
    tarifsServices,
    updateTarifsServices,
    userEmail,
    userRole,
    showNotification
  } = useApp();
  const [activeTab, setActiveTab] = useState<'TARIFS' | 'PROFIL'>('TARIFS');
  const [tarifs, setTarifs] = useState<TarifsServices>(tarifsServices);
  const [profil, setProfil] = useState<ProfilForm>(creerProfilInitial(userEmail));

  useEffect(() => setTarifs(tarifsServices), [tarifsServices]);
  useEffect(() => {
    setProfil(gerantProfile
      ? {
        nom_complet: gerantProfile.nom_complet,
        telephone: gerantProfile.telephone,
        email: gerantProfile.email || userEmail || '',
        adresse: gerantProfile.adresse || '',
        date_naissance: gerantProfile.date_naissance || '',
        numero_piece_identite: gerantProfile.numero_piece_identite || '',
        contact_urgence_nom: gerantProfile.contact_urgence_nom || '',
        contact_urgence_telephone: gerantProfile.contact_urgence_telephone || '',
        type_contrat: gerantProfile.type_contrat || 'CDI',
        date_embauche: gerantProfile.date_embauche,
        salaire_base: gerantProfile.salaire_base,
        qualification: gerantProfile.qualification || '',
        notes_rh: gerantProfile.notes_rh || ''
      }
      : creerProfilInitial(userEmail));
  }, [authUserId, currentSuccursale.id, gerantProfile, userEmail]);

  const canManage = userRole === 'GERANT' || userRole === 'PROPRIETAIRE';

  const saveTariffs = (event: React.FormEvent) => {
    event.preventDefault();
    if (Object.values(tarifs).some(amount => !Number.isFinite(amount) || amount < 0)) {
      showNotification('Saisissez un montant valide et positif ou nul pour chaque tarif.', 'warning');
      return;
    }
    updateTarifsServices(tarifs);
  };

  const saveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    if (!profil.nom_complet.trim() || !profil.telephone.trim() || !profil.date_embauche) {
      showNotification('Nom complet, téléphone et date d’embauche sont obligatoires.', 'warning');
      return;
    }
    saveGerantProfile({
      ...profil,
      nom_complet: profil.nom_complet.trim(),
      telephone: profil.telephone.trim(),
      email: profil.email?.trim() || undefined,
      adresse: profil.adresse?.trim() || undefined,
      numero_piece_identite: profil.numero_piece_identite?.trim() || undefined,
      contact_urgence_nom: profil.contact_urgence_nom?.trim() || undefined,
      contact_urgence_telephone: profil.contact_urgence_telephone?.trim() || undefined,
      qualification: profil.qualification?.trim() || undefined,
      notes_rh: profil.notes_rh?.trim() || undefined
    });
  };

  const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100';

  if (!canManage) {
    return (
      <section className="mx-auto max-w-3xl p-6">
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-medium text-amber-950">
          Seuls le gérant et le propriétaire peuvent modifier les tarifs ou le profil de gestion.
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Administration</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">Tarifs et profil du gérant</h1>
        <p className="mt-2 text-sm text-slate-600">
          Réglages enregistrés dans Supabase pour {currentSuccursale.nom || 'cet établissement'}.
        </p>
      </header>

      <div role="tablist" aria-label="Réglages de l’établissement" className="flex flex-wrap gap-2">
        {([
          ['TARIFS', 'Tarifs des services'],
          ['PROFIL', 'Profil et fiche employé']
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            id={`settings-tab-${tab.toLowerCase()}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls="settings-panel"
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              activeTab === tab ? 'bg-blue-700 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section
        id="settings-panel"
        role="tabpanel"
        aria-labelledby={`settings-tab-${activeTab.toLowerCase()}`}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      >
        {activeTab === 'TARIFS' ? (
          <form onSubmit={saveTariffs} className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Tarifs appliqués aux nouvelles prestations</h2>
              <p className="mt-1 text-sm text-slate-600">
                Une modification ne change pas les prix déjà enregistrés sur les lavages, tickets et devis existants.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {champsTarifs.map(({ key, label, aide }) => (
                <label key={key} className="text-sm font-semibold text-slate-800">
                  {label} <span className="font-normal text-slate-500">({currentSuccursale.devise || 'FCFA'})</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={tarifs[key]}
                    onChange={event => setTarifs(previous => ({ ...previous, [key]: Number(event.target.value) }))}
                    className={inputClass}
                  />
                  <span className="mt-1 block text-xs font-normal text-slate-500">{aide}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button type="submit" className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800">
                Enregistrer les tarifs
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={saveProfile} className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Informations du gérant</h2>
              <p className="mt-1 text-sm text-slate-600">
                Ce profil est lié à votre compte connecté et à une fiche employé unique dans l’équipe.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-800">
                Nom complet *
                <input required value={profil.nom_complet} onChange={event => setProfil(value => ({ ...value, nom_complet: event.target.value }))} className={inputClass} />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Téléphone *
                <input required type="tel" value={profil.telephone} onChange={event => setProfil(value => ({ ...value, telephone: event.target.value }))} className={inputClass} />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                E-mail
                <input type="email" value={profil.email || ''} onChange={event => setProfil(value => ({ ...value, email: event.target.value }))} className={inputClass} />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Adresse
                <input value={profil.adresse || ''} onChange={event => setProfil(value => ({ ...value, adresse: event.target.value }))} className={inputClass} />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Date de naissance
                <input type="date" value={profil.date_naissance || ''} onChange={event => setProfil(value => ({ ...value, date_naissance: event.target.value }))} className={inputClass} />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                N° de pièce d’identité
                <input value={profil.numero_piece_identite || ''} onChange={event => setProfil(value => ({ ...value, numero_piece_identite: event.target.value }))} className={inputClass} />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Date d’embauche *
                <input required type="date" value={profil.date_embauche} onChange={event => setProfil(value => ({ ...value, date_embauche: event.target.value }))} className={inputClass} />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Type de contrat
                <select value={profil.type_contrat || 'CDI'} onChange={event => setProfil(value => ({ ...value, type_contrat: event.target.value as NonNullable<ProfilForm['type_contrat']> }))} className={inputClass}>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="JOURNALIER">Journalier</option>
                  <option value="PRESTATAIRE">Prestataire</option>
                  <option value="STAGE">Stage</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Salaire de base ({currentSuccursale.devise || 'FCFA'})
                <input type="number" min="0" step="1" value={profil.salaire_base} onChange={event => setProfil(value => ({ ...value, salaire_base: Number(event.target.value) }))} className={inputClass} />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Qualification
                <input value={profil.qualification || ''} onChange={event => setProfil(value => ({ ...value, qualification: event.target.value }))} className={inputClass} />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Contact d’urgence
                <input value={profil.contact_urgence_nom || ''} onChange={event => setProfil(value => ({ ...value, contact_urgence_nom: event.target.value }))} className={inputClass} />
              </label>
              <label className="text-sm font-semibold text-slate-800">
                Téléphone d’urgence
                <input type="tel" value={profil.contact_urgence_telephone || ''} onChange={event => setProfil(value => ({ ...value, contact_urgence_telephone: event.target.value }))} className={inputClass} />
              </label>
              <label className="text-sm font-semibold text-slate-800 sm:col-span-2">
                Notes RH
                <textarea rows={3} value={profil.notes_rh || ''} onChange={event => setProfil(value => ({ ...value, notes_rh: event.target.value }))} className={inputClass} />
              </label>
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button type="submit" className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800">
                Enregistrer le profil et la fiche employé
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
