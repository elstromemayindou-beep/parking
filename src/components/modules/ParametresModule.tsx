import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConfigurationEntreprise, GerantProfileData, TarifsServices } from '../../types';

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
    configurationEntreprise,
    updateConfigurationEntreprise,
    userEmail,
    userRole,
    showNotification
  } = useApp();
  const [activeTab, setActiveTab] = useState<'TARIFS' | 'ENTREPRISE' | 'PROFIL'>('TARIFS');
  const [tarifs, setTarifs] = useState<TarifsServices>(tarifsServices);
  const [configuration, setConfiguration] = useState<ConfigurationEntreprise>(configurationEntreprise);
  const [profil, setProfil] = useState<ProfilForm>(creerProfilInitial(userEmail));

  useEffect(() => setTarifs(tarifsServices), [tarifsServices]);
  useEffect(() => setConfiguration(configurationEntreprise), [configurationEntreprise]);
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

  const saveConfiguration = (event: React.FormEvent) => {
    event.preventDefault();
    if (updateConfigurationEntreprise(configuration)) setConfiguration(savedConfiguration => ({
      ...savedConfiguration,
      tarifGardiennageNuit: configuration.tarifGardiennageNuit,
      categoriesVehicules: [...configuration.categoriesVehicules],
      servicesLavage: configuration.servicesLavage.map(service => ({
        ...service,
        prix_par_categorie: { ...service.prix_par_categorie }
      }))
    }));
  };

  const ajouterCategorieVehicule = () => {
    const category = window.prompt('Nom de la catégorie (ex. SUV, Taxi, Coaster)');
    if (!category?.trim()) return;
    const normalized = category.trim();
    if (configuration.categoriesVehicules.some(item => item.toLocaleLowerCase() === normalized.toLocaleLowerCase())) {
      showNotification('Cette catégorie existe déjà.', 'warning');
      return;
    }
    setConfiguration(previous => ({
      ...previous,
      categoriesVehicules: [...previous.categoriesVehicules, normalized],
      servicesLavage: previous.servicesLavage.map(service => ({
        ...service,
        prix_par_categorie: { ...service.prix_par_categorie, [normalized]: 0 }
      }))
    }));
  };

  const ajouterServiceLavage = () => {
    const name = window.prompt('Nom de la prestation de lavage (ex. lavage moteur)');
    if (!name?.trim()) return;
    const normalized = name.trim();
    if (configuration.servicesLavage.some(service => service.nom.toLocaleLowerCase() === normalized.toLocaleLowerCase())) {
      showNotification('Cette prestation existe déjà.', 'warning');
      return;
    }
    const id = `lavage-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    setConfiguration(previous => ({
      ...previous,
      servicesLavage: [...previous.servicesLavage, {
        id,
        nom: normalized,
        prix_par_categorie: Object.fromEntries(previous.categoriesVehicules.map(category => [category, 0])),
        actif: true
      }]
    }));
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
          ['ENTREPRISE', 'N.O.B et catalogue lavage'],
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
        ) : activeTab === 'ENTREPRISE' ? (
          <form onSubmit={saveConfiguration} className="space-y-7">
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Identité et organisation</h2>
                <p className="mt-1 text-sm text-slate-600">Coordonnées utilisées dans l’application et périodes de service jour/nuit.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-800">
                  Nom de la structure *
                  <input required value={configuration.nom} onChange={event => setConfiguration(previous => ({ ...previous, nom: event.target.value }))} className={inputClass} />
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Adresse *
                  <input required value={configuration.adresse} onChange={event => setConfiguration(previous => ({ ...previous, adresse: event.target.value }))} className={inputClass} />
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  WhatsApp du PDG
                  <input type="tel" value={configuration.telephonePdgWhatsapp} onChange={event => setConfiguration(previous => ({ ...previous, telephonePdgWhatsapp: event.target.value }))} className={inputClass} placeholder="+242 ..." />
                  <span className="mt-1 block text-xs font-normal text-slate-500">Utilisé pour préparer les rapports ; le message sera envoyé manuellement.</span>
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {([
                  ['debutJour', 'Début du service jour'],
                  ['finJour', 'Fin du service jour'],
                  ['debutNuit', 'Début du service nuit'],
                  ['finNuit', 'Fin du service nuit']
                ] as const).map(([field, label]) => (
                  <label key={field} className="text-sm font-semibold text-slate-800">
                    {label}
                    <input type="time" required value={configuration[field]} onChange={event => setConfiguration(previous => ({ ...previous, [field]: event.target.value }))} className={inputClass} />
                  </label>
                ))}
              </div>
              <p className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-900">Le service jour est prévu de 06:00 à 18:00 et le service nuit de 18:00 à 06:00. Les heures restent configurables.</p>
              <label className="block max-w-md text-sm font-semibold text-slate-800">
                Tarif forfaitaire du gardiennage de nuit (FCFA)
                <input type="number" min="0" step="1" value={configuration.tarifGardiennageNuit} onChange={event => setConfiguration(previous => ({ ...previous, tarifGardiennageNuit: Number(event.target.value) }))} className={inputClass} />
                <span className="mt-1 block text-xs font-normal text-slate-500">Ce montant s’ajoute au stationnement uniquement si le service de gardiennage est sélectionné à l’entrée.</span>
              </label>
            </section>

            <section className="space-y-4 border-t border-slate-100 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Catégories de véhicules</h2>
                  <p className="mt-1 text-sm text-slate-600">Les tarifs du lavage sont définis par catégorie et prestation.</p>
                </div>
                <button type="button" onClick={ajouterCategorieVehicule} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50">Ajouter une catégorie</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {configuration.categoriesVehicules.map(category => (
                  <span key={category} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800">
                    {category}
                    <button type="button" aria-label={`Supprimer la catégorie ${category}`} onClick={() => {
                      if (configuration.categoriesVehicules.length <= 1) {
                        showNotification('Gardez au moins une catégorie de véhicules.', 'warning');
                        return;
                      }
                      setConfiguration(previous => ({
                        ...previous,
                        categoriesVehicules: previous.categoriesVehicules.filter(item => item !== category),
                        servicesLavage: previous.servicesLavage.map(service => {
                          const prices = { ...service.prix_par_categorie };
                          delete prices[category];
                          return { ...service, prix_par_categorie: prices };
                        })
                      }));
                    }} className="font-black text-slate-500 hover:text-rose-700">×</button>
                  </span>
                ))}
              </div>
            </section>

            <section className="space-y-4 border-t border-slate-100 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Catalogue et grille des prix de lavage</h2>
                  <p className="mt-1 text-sm text-slate-600">Ajoutez les prestations proposées et saisissez leur prix selon le véhicule. Plusieurs prestations pourront être regroupées sur un même ticket.</p>
                </div>
                <button type="button" onClick={ajouterServiceLavage} className="rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-50">Ajouter une prestation</button>
              </div>
              {configuration.servicesLavage.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Aucune prestation de lavage configurée.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-max text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="p-3">Prestation</th>
                        {configuration.categoriesVehicules.map(category => <th key={category} className="p-3 text-right">{category} · FCFA</th>)}
                        <th className="p-3">Statut</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {configuration.servicesLavage.map(service => (
                        <tr key={service.id}>
                          <td className="p-3">
                            <input aria-label={`Nom de la prestation ${service.nom}`} value={service.nom} onChange={event => setConfiguration(previous => ({
                              ...previous,
                              servicesLavage: previous.servicesLavage.map(item => item.id === service.id ? { ...item, nom: event.target.value } : item)
                            }))} className="w-48 rounded-lg border border-slate-200 px-2.5 py-2 text-slate-900" />
                          </td>
                          {configuration.categoriesVehicules.map(category => (
                            <td key={category} className="p-3">
                              <input aria-label={`${service.nom} pour ${category}`} type="number" min="0" step="1" value={service.prix_par_categorie[category] ?? 0} onChange={event => setConfiguration(previous => ({
                                ...previous,
                                servicesLavage: previous.servicesLavage.map(item => item.id === service.id ? {
                                  ...item,
                                  prix_par_categorie: { ...item.prix_par_categorie, [category]: Number(event.target.value) }
                                } : item)
                              }))} className="w-28 rounded-lg border border-slate-200 px-2.5 py-2 text-right text-slate-900" />
                            </td>
                          ))}
                          <td className="p-3">
                            <button type="button" onClick={() => setConfiguration(previous => ({
                              ...previous,
                              servicesLavage: previous.servicesLavage.map(item => item.id === service.id ? { ...item, actif: !item.actif } : item)
                            }))} className={`rounded-full px-2.5 py-1 font-bold ${service.actif ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                              {service.actif ? 'Actif' : 'Inactif'}
                            </button>
                          </td>
                          <td className="p-3">
                            <button type="button" onClick={() => setConfiguration(previous => ({
                              ...previous,
                              servicesLavage: previous.servicesLavage.filter(item => item.id !== service.id)
                            }))} className="font-semibold text-rose-700 hover:text-rose-900">Supprimer</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs leading-5 text-amber-800">Le montant négocié d’un ticket de lavage ne devra pas descendre sous 1 000 FCFA. Ces réglages ne modifieront pas les tickets déjà enregistrés.</p>
            </section>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button type="submit" className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800">Enregistrer la configuration</button>
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
