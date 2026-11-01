/**
 * N.O.B BUSINESS - Module 2: Station de Lavage / Car Wash & Detailing
 * Requirements:
 * - RF-21 : Gestion de file d'attente avec attribution des laveurs et statut d'avancement
 * - Tarifs des formules configurés par succursale
 * - Décompte automatique shampooing & cire
 * - Attribution commissions laveurs automatiques
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LavageItem } from '../../types';
import {
  Sparkles,
  PlusCircle,
  Clock,
  User,
  Car,
  Droplet,
  CheckCircle2,
  DollarSign,
  Phone,
  Flame,
  Award,
  Home,
  MapPin,
  Navigation,
  PackageCheck,
  CalendarDays,
  MessageCircle
} from 'lucide-react';
import { getMapsDirectionsUrl, getTelephoneUrl, getWhatsAppUrl } from '../../utils/contactLinks';

export const LavageModule: React.FC = () => {
  const {
    lavages,
    employes,
    piecesStock,
    demandesConsommablesLavage,
    ajouterLavage,
    mettreAJourLavageDomicile,
    changerStatutLavage,
    terminerLavage,
    affecterLaveursLavage,
    annulerLavage,
    signalerProduitLavage,
    traiterDemandeConsommableLavage,
    configurationEntreprise,
    formatCurrency,
    showNotification
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [serviceMode, setServiceMode] = useState<'CENTRE' | 'DOMICILE'>('CENTRE');
  const [activeView, setActiveView] = useState<'CENTRE' | 'DOMICILE'>('CENTRE');
  const [plaque, setPlaque] = useState('');
  const [clientNom, setClientNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [vehiculeDesc, setVehiculeDesc] = useState('');
  const [typeVehicule, setTypeVehicule] = useState<'VOITURE' | 'MOTO'>('VOITURE');
  const [categorieVehicule, setCategorieVehicule] = useState(configurationEntreprise.categoriesVehicules[0] || 'Autre');
  const [servicesLavageSelectionnes, setServicesLavageSelectionnes] = useState<string[]>([]);
  const [prixLavageNegocie, setPrixLavageNegocie] = useState('0');
  const [selectedLaveurIds, setSelectedLaveurIds] = useState<number[]>([]);
  const [adresseIntervention, setAdresseIntervention] = useState('');
  const [dateRendezVous, setDateRendezVous] = useState(new Date().toISOString().slice(0, 10));
  const [heureRendezVous, setHeureRendezVous] = useState('09:00');
  const [instructionsClient, setInstructionsClient] = useState('');
  const [completionLavage, setCompletionLavage] = useState<LavageItem | null>(null);
  const [consommations, setConsommations] = useState<Record<number, number>>({});
  const [prestations, setPrestations] = useState<string[]>([]);
  const [productByLavage, setProductByLavage] = useState<Record<number, number>>({});
  const [washCancellation, setWashCancellation] = useState<LavageItem | null>(null);
  const [washCancellationReason, setWashCancellationReason] = useState('');

  const laveurs = employes.filter(e => e.poste === 'Laveur' && e.statut === 'ACTIF');
  const produitsLavage = piecesStock.filter(p => p.categorie === 'Consommables Lavage');
  const demandesEnAttente = demandesConsommablesLavage.filter(d => d.statut === 'EN_ATTENTE');
  const servicesLavageActifs = configurationEntreprise.servicesLavage.filter(service => service.actif);
  const servicesChoisis = servicesLavageActifs.filter(service => servicesLavageSelectionnes.includes(service.id));
  const totalCatalogueLavage = servicesChoisis.reduce(
    (total, service) => total + (service.prix_par_categorie[categorieVehicule] || 0),
    0
  );
  React.useEffect(() => {
    if (!configurationEntreprise.categoriesVehicules.includes(categorieVehicule)) {
      setCategorieVehicule(configurationEntreprise.categoriesVehicules[0] || 'Autre');
    }
  }, [configurationEntreprise.categoriesVehicules, categorieVehicule]);
  React.useEffect(() => {
    setPrixLavageNegocie(String(totalCatalogueLavage));
  }, [categorieVehicule, servicesLavageSelectionnes, totalCatalogueLavage]);
  const kitItems = [
    'Produits et consommables',
    'Microfibres propres',
    'Aspirateur portable',
    'Eau / batterie / nettoyeur'
  ];

  const getOperations = (item: LavageItem) => {
    const operations = [
      'Rinçage extérieur',
      'Application du shampoing',
      'Nettoyage des jantes et passages de roues',
      'Séchage carrosserie'
    ];
    if (item.formule !== 'SIMPLE') {
      operations.push(
        'Aspiration des sièges, tapis et coffre',
        'Nettoyage des vitres intérieures',
        'Dépoussiérage du tableau de bord'
      );
    }
    if (item.formule === 'VIP_DETAILING') {
      operations.push(
        'Nettoyage approfondi des sièges',
        'Lustrage de la carrosserie',
        'Graissage des charnières'
      );
    }
    return operations;
  };

  const submitWashCancellation = (event: React.FormEvent) => {
    event.preventDefault();
    if (!washCancellation) return;
    if (annulerLavage(washCancellation.id, washCancellationReason)) {
      setWashCancellation(null);
      setWashCancellationReason('');
    }
  };

  const selectedWorkers = (item: LavageItem) => {
    const ids = item.laveur_ids?.length ? item.laveur_ids : item.laveur_id ? [item.laveur_id] : [];
    return ids.map(id => employes.find(employee => employee.id === id)?.nom_complet).filter(Boolean).join(', ') || 'Aucun laveur affecté';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plaque.trim() || !clientNom.trim()) {
      showNotification('Plaque et nom du client requis', 'warning');
      return;
    }
    if (serviceMode === 'DOMICILE' && (!adresseIntervention.trim() || !dateRendezVous || !heureRendezVous)) {
      showNotification('Adresse et créneau du rendez-vous obligatoires pour une intervention à domicile.', 'warning');
      return;
    }
    if (serviceMode === 'DOMICILE' && selectedLaveurIds.length === 0) {
      showNotification('Choisissez un laveur pour planifier l’intervention à domicile.', 'warning');
      return;
    }
    if (servicesChoisis.length === 0) {
      showNotification('Sélectionnez au moins une prestation de lavage.', 'warning');
      return;
    }
    if (servicesChoisis.some(service => (service.prix_par_categorie[categorieVehicule] || 0) <= 0)) {
      showNotification('Renseignez le tarif de chaque prestation pour cette catégorie dans les paramètres.', 'warning');
      return;
    }
    if (!Number.isInteger(Number(prixLavageNegocie)) || Number(prixLavageNegocie) < 1000) {
      showNotification('Le montant négocié du lavage doit être au minimum de 1 000 FCFA.', 'warning');
      return;
    }

    ajouterLavage(
      plaque.trim(),
      clientNom.trim(),
      telephone.trim(),
      'PERSONNALISE',
      selectedLaveurIds[0],
      vehiculeDesc || 'Véhicule standard',
      serviceMode === 'DOMICILE'
        ? {
            adresse: adresseIntervention.trim(),
            date: dateRendezVous,
            heure: heureRendezVous,
            instructions: instructionsClient.trim()
          }
        : undefined,
      selectedLaveurIds,
      typeVehicule,
      servicesChoisis.map(service => ({
        service_id: service.id,
        nom: service.nom,
        montant: service.prix_par_categorie[categorieVehicule] || 0
      })),
      Number(prixLavageNegocie),
      categorieVehicule
    );

    setModalOpen(false);
    setActiveView(serviceMode);
    setPlaque('');
    setClientNom('');
    setTelephone('');
    setVehiculeDesc('');
    setTypeVehicule('VOITURE');
    setServicesLavageSelectionnes([]);
    setPrixLavageNegocie('0');
    setSelectedLaveurIds([]);
    setAdresseIntervention('');
    setInstructionsClient('');
  };

  const openCompletion = (item: LavageItem) => {
    setCompletionLavage(item);
    setConsommations({});
    setPrestations([]);
  };

  const handleFinishLavage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionLavage) return;
    const requiredOperations = getOperations(completionLavage);
    if (requiredOperations.some(operation => !prestations.includes(operation))) {
      showNotification('Cochez chaque opération réalisée avant de valider la fin du lavage.', 'warning');
      return;
    }
    const bundle = Object.entries(consommations).map(([pieceId, quantite]) => ({
      piece_id: Number(pieceId),
      quantite: Number(quantite)
    }));
    const committed = terminerLavage(completionLavage.id, bundle, prestations);
    if (committed) {
      setCompletionLavage(null);
    }
  };

  const handleProductOut = (item: LavageItem) => {
    const pieceId = productByLavage[item.id] ?? produitsLavage[0]?.id;
    if (!pieceId) {
      showNotification('Aucun produit de lavage disponible pour ce signalement.', 'warning');
      return;
    }
    if (!item.laveur_id) {
      showNotification('Ce lavage doit être affecté à un laveur avant de signaler un produit fini.', 'warning');
      return;
    }
    signalerProduitLavage(item.laveur_id, pieceId);
  };

  const getFormuleBadge = (f: LavageItem['formule']) => {
    switch (f) {
      case 'VIP_DETAILING':
        return <span className="bg-blue-900 text-white border border-blue-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 text-blue-300" /> VIP Detailing</span>;
      case 'COMPLET':
        return <span className="bg-blue-950 text-blue-200 border border-blue-600/50 text-[10px] font-bold px-2 py-0.5 rounded-full">Complet Int/Ext</span>;
      case 'SIMPLE':
        return <span className="bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Simple Express</span>;
      case 'PERSONNALISE':
        return <span className="bg-cyan-950 text-cyan-200 border border-cyan-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Prestations à la carte</span>;
    }
  };

  // Group by status
  const lavagesCentre = lavages.filter(l => (l.mode_prestation ?? 'CENTRE') === 'CENTRE');
  const lavagesDomicile = lavages.filter(l => l.mode_prestation === 'DOMICILE');
  const lavagesAnnules = lavages.filter(l => l.statut === 'ANNULE');
  const enAttente = lavagesCentre.filter(l => l.statut === 'EN_ATTENTE');
  const enCours = lavagesCentre.filter(l => l.statut === 'EN_COURS');
  const termines = lavagesCentre.filter(l => l.statut === 'TERMINE');
  const produitsEnAlerte = produitsLavage.filter(p => p.quantite_disponible <= p.seuil_alerte);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {produitsEnAlerte.length > 0 && (
        <div role="status" className="rounded-2xl border border-amber-500/50 bg-amber-950/40 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-200">
            <Flame className="h-4 w-4 text-amber-400" />
            Stock de lavage bas : le responsable doit réapprovisionner
          </div>
          <p className="mt-1 text-xs text-amber-100/80">
            {produitsEnAlerte.map(p => `${p.nom} (${p.quantite_disponible} restant(s), seuil ${p.seuil_alerte})`).join(' • ')}
          </p>
        </div>
      )}
      {demandesEnAttente.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-200 font-bold text-sm">
            <Flame className="w-4 h-4 text-amber-400" />
            Demandes de réapprovisionnement produits
          </div>
          <div className="space-y-2">
            {demandesEnAttente.map(d => (
              <div key={d.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-amber-600/50 bg-slate-900/80 p-3">
                <div>
                  <p className="text-xs font-bold text-white">{d.piece_nom}</p>
                  <p className="text-[11px] text-slate-400">
                    {employes.find(e => e.id === d.laveur_id)?.nom_complet || `Laveur #${d.laveur_id}`}
                    {' • '}Quantité demandée : {d.quantite_demandee}
                    {' • '}Stock magasin : {piecesStock.find(p => p.id === d.piece_id)?.quantite_disponible ?? 0}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => traiterDemandeConsommableLavage(d.id, 'REMIS')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                  >
                    Produit livré
                  </button>
                  <button
                    onClick={() => traiterDemandeConsommableLavage(d.id, 'REFUSEE')}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold cursor-pointer"
                  >
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {demandesConsommablesLavage.some(d => d.statut !== 'EN_ATTENTE') && (
        <details className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
          <summary className="cursor-pointer text-xs font-bold text-slate-300">
            Historique des demandes de produits ({demandesConsommablesLavage.filter(d => d.statut !== 'EN_ATTENTE').length})
          </summary>
          <div className="mt-3 space-y-2">
            {demandesConsommablesLavage.filter(d => d.statut !== 'EN_ATTENTE').map(d => (
              <div key={d.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950 px-3 py-2 text-[11px]">
                <span className="text-slate-300">{d.piece_nom} — {employes.find(e => e.id === d.laveur_id)?.nom_complet || `Laveur #${d.laveur_id}`}</span>
                <span className={d.statut === 'REMIS' ? 'font-semibold text-emerald-300' : 'font-semibold text-slate-400'}>
                  {d.statut === 'REMIS' ? 'Produit remis' : 'Refusée'}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Module Lavage & Detailing</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            File d'Attente & Gestion de la Station de Lavage
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Suivi des baies de lavage, affectation des laveurs et commissions automatiques (RF-21 & RF-55).
          </p>
        </div>

        <button
          onClick={() => {
            setServiceMode(activeView);
            setModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition hover:scale-105 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-white" />
          <span>{activeView === 'DOMICILE' ? '+ Planifier un lavage à domicile' : '+ Enregistrer Nouveau Véhicule'}</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveView('CENTRE')}
          aria-pressed={activeView === 'CENTRE'}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeView === 'CENTRE' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Sparkles className="h-4 w-4" /> Lavage au centre
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{lavagesCentre.filter(l => l.statut !== 'LIVRE_PAYE' && l.statut !== 'ANNULE').length}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView('DOMICILE')}
          aria-pressed={activeView === 'DOMICILE'}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeView === 'DOMICILE' ? 'bg-cyan-700 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Home className="h-4 w-4" /> Lavage à domicile
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{lavagesDomicile.filter(l => l.statut !== 'LIVRE_PAYE' && l.statut !== 'ANNULE').length}</span>
        </button>
      </div>

      {activeView === 'DOMICILE' && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-white p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-700 text-white"><Home className="h-5 w-5" /></span>
              <div>
                <h2 className="text-lg font-black text-slate-900">Interventions chez le client</h2>
                <p className="mt-1 text-sm text-slate-600">Planifiez le rendez-vous, affectez un laveur, vérifiez son kit et suivez son déplacement.</p>
              </div>
            </div>
          </div>

          {lavagesDomicile.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Home className="mx-auto h-8 w-8 text-cyan-700" />
              <p className="mt-3 font-bold text-slate-800">Aucune intervention à domicile planifiée</p>
              <p className="mt-1 text-sm text-slate-500">Créez un rendez-vous pour commencer à organiser les tournées.</p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {              lavagesDomicile.filter(l => l.statut !== 'LIVRE_PAYE' && l.statut !== 'ANNULE').map(item => {
                const checkedKit = item.kit_prepare || [];
                const kitComplete = kitItems.every(kitItem => checkedKit.includes(kitItem));
                const stage = item.etape_domicile || 'PLANIFIEE';
                const mapsUrl = getMapsDirectionsUrl(item.adresse_intervention || '');
                const telephoneUrl = getTelephoneUrl(item.client_telephone);
                const whatsappUrl = getWhatsAppUrl(
                  item.client_telephone,
                  `Bonjour ${item.client_nom}, je vous contacte au sujet du lavage de votre véhicule ${item.plaque}, prévu le ${item.date_rendez_vous} à ${item.heure_rendez_vous}.`
                );
                const actionByStage = {
                  PLANIFIEE: { label: 'Préparer le kit', next: 'KIT_A_PREPARER' as const },
                  KIT_A_PREPARER: { label: 'Confirmer le kit', next: 'EN_ROUTE' as const },
                  EN_ROUTE: { label: 'Confirmer arrivée chez le client', next: 'SUR_PLACE' as const },
                  SUR_PLACE: null,
                  TERMINEE: null
                };
                const stageAction = actionByStage[stage];

                return (
                  <article key={item.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-sm font-black text-white">{item.plaque}</span>
                          {getFormuleBadge(item.formule)}
                        </div>
                        <p className="mt-2 text-sm font-bold text-slate-900">                        {item.client_nom} · {item.type_vehicule === 'MOTO' ? 'Moto' : 'Voiture'} · {item.vehicule_desc}</p>
                        <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-600"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-700" />{item.adresse_intervention}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600"><CalendarDays className="h-3.5 w-3.5 text-cyan-700" />{item.date_rendez_vous} à {item.heure_rendez_vous}</p>
                      </div>
                      <span className="rounded-xl bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-900">{stage.replace(/_/g, ' ')}</span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-slate-700">
                        Laveurs affectés
                        <select
                          multiple
                          value={(item.laveur_ids?.length ? item.laveur_ids : item.laveur_id ? [item.laveur_id] : []).map(String)}
                          onChange={e => affecterLaveursLavage(item.id, Array.from(e.currentTarget.selectedOptions, option => Number(option.value)))}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                          {laveurs.map(laveur => <option key={laveur.id} value={laveur.id}>{laveur.nom_complet}</option>)}
                        </select>
                        <span className="mt-1 block text-[10px] text-slate-500">{selectedWorkers(item)}</span>
                      </label>
                      <div className="flex flex-wrap items-end gap-2">
                        {mapsUrl && (
                          <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-900 hover:bg-cyan-100">
                            <Navigation className="h-4 w-4" /> Ouvrir l’itinéraire
                          </a>
                        )}
                        {telephoneUrl && (
                          <a href={telephoneUrl} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
                            <Phone className="h-4 w-4" /> Appeler
                          </a>
                        )}
                        {whatsappUrl && (
                          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100">
                            <MessageCircle className="h-4 w-4" /> WhatsApp
                          </a>
                        )}
                      </div>
                    </div>

                    {item.instructions_client && (
                      <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-950">
                        <span className="font-bold">Consignes du client : </span>{item.instructions_client}
                      </div>
                    )}

                    <fieldset className="rounded-xl border border-slate-200 p-3">
                      <legend className="px-1 text-xs font-bold text-slate-700">Contrôle du kit mobile</legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {kitItems.map(kitItem => (
                          <label key={kitItem} className="flex items-center gap-2 text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={checkedKit.includes(kitItem)}
                              disabled={!(item.laveur_ids?.length || item.laveur_id) || stage !== 'PLANIFIEE' && stage !== 'KIT_A_PREPARER'}
                              onChange={e => mettreAJourLavageDomicile(item.id, {
                                etape_domicile: 'KIT_A_PREPARER',
                                kit_prepare: e.target.checked
                                  ? [...new Set([...checkedKit, kitItem])]
                                  : checkedKit.filter(value => value !== kitItem)
                              })}
                              className="accent-cyan-700"
                            />
                            {kitItem}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <span className="text-sm font-black text-slate-900">{formatCurrency(item.prix)}</span>
                      <div className="flex flex-wrap gap-2">
                      {stageAction ? (
                          <button
                          type="button"
                          disabled={!(item.laveur_ids?.length || item.laveur_id) || stageAction.next === 'EN_ROUTE' && !kitComplete}
                          onClick={() => mettreAJourLavageDomicile(item.id, { etape_domicile: stageAction.next })}
                          className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {stageAction.next === 'EN_ROUTE' ? <Navigation className="h-4 w-4" /> : <PackageCheck className="h-4 w-4" />}
                          {stageAction.label}
                        </button>
                      ) : stage === 'SUR_PLACE' ? (
                        <button type="button" onClick={() => openCompletion(item)} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
                          Saisir la prestation & terminer
                        </button>
                      ) : (
                        <button type="button" onClick={() => changerStatutLavage(item.id, 'LIVRE_PAYE')} className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800">
                          Encaisser & clôturer
                        </button>
                      )}
                      <button type="button" onClick={() => { setWashCancellation(item); setWashCancellationReason(''); }} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50">
                        Annuler
                      </button>
                      </div>
                    </div>
                    {stage === 'TERMINEE' && <p role="status" className="text-xs font-semibold text-emerald-800">Intervention terminée — prévenir le client pour la restitution.</p>}
                    {!(item.laveur_ids?.length || item.laveur_id) && <p className="text-xs text-amber-700">Affectez au moins un laveur pour démarrer la préparation.</p>}
                    {stage === 'KIT_A_PREPARER' && !kitComplete && <p className="text-xs text-amber-700">Cochez les quatre éléments avant d’autoriser le départ.</p>}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Live Baies / Columns */}
      {activeView === 'CENTRE' && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Colonne 1 : En attente */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
              <h3 className="text-sm font-bold text-white">1. File d'Attente</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-950 text-xs font-bold text-blue-200 border border-blue-800">
              {enAttente.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {enAttente.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Aucun véhicule en attente.
              </div>
            ) : (
              enAttente.map(item => (
                <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-blue-400 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-white px-2 py-0.5 rounded bg-blue-950 border border-blue-800">
                      {item.plaque}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      {formatCurrency(item.prix)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-medium truncate">
                    {item.client_nom} • <span className="text-slate-400">{item.vehicule_desc}</span>
                  </div>

                  <div>{getFormuleBadge(item.formule)}</div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-blue-400" />
                      Arrivé à {item.heure_reception}
                    </span>
                    <button
                      onClick={() => changerStatutLavage(item.id, 'EN_COURS')}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition cursor-pointer"
                    >
                      Lancer Lavage →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Colonne 2 : En cours de lavage */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
              <h3 className="text-sm font-bold text-white">2. En Cours de Lavage</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-950 text-xs font-bold text-blue-200 border border-blue-800">
              {enCours.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {enCours.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Aucun lavage actif sur les baies.
              </div>
            ) : (
              enCours.map(item => {
                return (
                  <div key={item.id} className="bg-slate-950 border border-blue-500/50 rounded-xl p-3.5 space-y-2.5 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black text-white px-2 py-0.5 rounded bg-blue-950 border border-blue-800">
                        {item.plaque}
                      </span>
                      <span className="text-xs font-bold text-white font-mono">
                        {formatCurrency(item.prix)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-medium">
                      {item.client_nom} • <span className="text-slate-400">{item.vehicule_desc}</span>
                    </div>

                    <div>{getFormuleBadge(item.formule)}</div>

                    <div className="bg-slate-900 p-2 rounded-lg text-[11px] text-slate-300 flex items-center justify-between border border-slate-800">
                      <span className="flex items-center gap-1.5 text-blue-300 font-semibold">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        {selectedWorkers(item)}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        Fin estimée : {item.heure_fin_estimee}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex flex-col gap-2 text-[11px]">
                      <span className="text-slate-400 text-[10px] flex items-center gap-1">
                        <Droplet className="w-3 h-3 text-blue-400" />
                        Prévision : {item.conso_shampoing_ml}ml shampoing
                      </span>
                      <div className="flex gap-2">
                        <select
                          aria-label={`Produit signalé fini pour ${item.plaque}`}
                          value={productByLavage[item.id] ?? produitsLavage[0]?.id ?? ''}
                          onChange={e => setProductByLavage(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-200"
                        >
                          {produitsLavage.length === 0 && <option value="">Aucun produit au stock</option>}
                          {produitsLavage.map(product => (
                            <option key={product.id} value={product.id}>{product.nom}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleProductOut(item)}
                          className="rounded-lg bg-amber-600 px-2 py-1 font-bold text-white transition hover:bg-amber-500"
                        >
                          Produit fini
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => openCompletion(item)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition cursor-pointer"
                    >
                      Saisir les opérations & terminer
                    </button>
                    <button
                      onClick={() => { setWashCancellation(item); setWashCancellationReason(''); }}
                      className="w-full rounded-lg border border-rose-500/40 px-2.5 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-500/10"
                    >
                      Annuler le lavage
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Colonne 3 : Terminés / En attente de retrait & paiement */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-full">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-300"></span>
              <h3 className="text-sm font-bold text-white">3. Véhicules Prêts (À Livrer)</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-950 text-xs font-bold text-white border border-blue-600">
              {termines.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {termines.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs">
                Aucun véhicule en attente de livraison.
              </div>
            ) : (
              termines.map(item => (
                <div key={item.id} className="bg-slate-950 border border-slate-800 hover:border-blue-400 rounded-xl p-3.5 space-y-2 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-white px-2 py-0.5 rounded bg-blue-950 border border-blue-800">
                      {item.plaque}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      {formatCurrency(item.prix)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-medium">
                    {item.client_nom} • <span className="text-slate-400">{item.client_telephone}</span>
                  </div>

                  <div>{getFormuleBadge(item.formule)}</div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <a
                      href={`tel:${item.client_telephone}`}
                      className="text-blue-400 hover:text-white text-[11px] flex items-center gap-1 font-medium"
                    >
                      <Phone className="w-3 h-3 text-blue-400" />
                      Appeler
                    </a>
                    <button
                      onClick={() => changerStatutLavage(item.id, 'LIVRE_PAYE')}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition cursor-pointer"
                    >
                      Encaisser & Clôturer →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      )}

      {completionLavage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="lavage-completion-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-700 pb-3">
              <div>
                <h2 id="lavage-completion-title" className="text-base font-bold text-white">
                  Clôture de la prestation — {completionLavage.plaque}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Cochez les tâches réalisées et saisissez les quantités réellement utilisées.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompletionLavage(null)}
                className="rounded-lg px-2 py-1 text-slate-300 hover:bg-slate-800"
                aria-label="Fermer la clôture de prestation"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFinishLavage} className="space-y-5">
              <fieldset className="space-y-2">
                <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-300">
                  Checklist — formule {completionLavage.formule.replace('_', ' ')}
                </legend>
                {getOperations(completionLavage).map(operation => (
                  <label key={operation} className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-950/60 p-2.5 text-xs text-slate-200">
                    <input
                      type="checkbox"
                      checked={prestations.includes(operation)}
                      onChange={e => setPrestations(prev => e.target.checked
                        ? [...prev, operation]
                        : prev.filter(value => value !== operation))}
                      className="mt-0.5 accent-blue-500"
                    />
                    {operation}
                  </label>
                ))}
              </fieldset>

              <fieldset className="space-y-2">
                <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-300">
                  Consommables utilisés (quantité en unités de stock)
                </legend>
                {produitsLavage.length === 0 ? (
                  <p className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-200">
                    Aucun consommable n’est configuré dans le stock. La checklist restera enregistrée, mais aucun décompte ne pourra être effectué.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {produitsLavage.map(product => (
                      <label key={product.id} className="rounded-lg border border-slate-700 bg-slate-950/60 p-3">
                        <span className="block truncate text-xs font-semibold text-slate-200">{product.nom}</span>
                        <span className="mt-1 block text-[10px] text-slate-400">
                          Disponible : {product.quantite_disponible}
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={product.quantite_disponible}
                          step="1"
                          value={consommations[product.id] ?? 0}
                          onChange={e => setConsommations(prev => ({
                            ...prev,
                            [product.id]: Math.max(0, Number(e.target.value))
                          }))}
                          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                          aria-label={`Quantité utilisée de ${product.nom}`}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>

              <div className="flex justify-end gap-2 border-t border-slate-700 pt-3">
                <button
                  type="button"
                  onClick={() => setCompletionLavage(null)}
                  className="rounded-lg bg-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
                >
                  Valider — véhicule prêt
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* MODAL: NOUVEAU BILLET DE LAVAGE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-600/30 text-cyan-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="text-base font-bold text-white">
                      {serviceMode === 'DOMICILE' ? 'Planifier un lavage à domicile' : 'Nouveau Billet de Lavage'}
                    </h3>
                    <p className="text-xs text-slate-400">Formule, rendez-vous et affectation du laveur</p>
                  </div>
                </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => setServiceMode('CENTRE')}
                  aria-pressed={serviceMode === 'CENTRE'}
                  className={`rounded-lg px-3 py-2 text-xs font-bold ${serviceMode === 'CENTRE' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
                >
                  Au centre
                </button>
                <button
                  type="button"
                  onClick={() => setServiceMode('DOMICILE')}
                  aria-pressed={serviceMode === 'DOMICILE'}
                  className={`rounded-lg px-3 py-2 text-xs font-bold ${serviceMode === 'DOMICILE' ? 'bg-cyan-700 text-white' : 'text-slate-300'}`}
                >
                  À domicile
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Plaque d'immatriculation *
                  </label>
                  <input
                    type="text"
                    required
                    value={plaque}
                    onChange={(e) => setPlaque(e.target.value.toUpperCase())}
                    placeholder="Ex: 671-BZ-02"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {serviceMode === 'DOMICILE' && (
                  <div className="space-y-3 rounded-xl border border-cyan-700/40 bg-cyan-950/20 p-3">
                    <p className="flex items-center gap-2 text-xs font-bold text-cyan-100"><MapPin className="h-4 w-4" />Informations d’intervention</p>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-300">Adresse exacte / quartier *</label>
                      <input
                        type="text"
                        required
                        value={adresseIntervention}
                        onChange={e => setAdresseIntervention(e.target.value)}
                        placeholder="Ex. Moungali, près du marché..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs font-bold text-slate-300">
                        Date souhaitée *
                        <input type="date" required min={new Date().toISOString().slice(0, 10)} value={dateRendezVous} onChange={e => setDateRendezVous(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white" />
                      </label>
                      <label className="text-xs font-bold text-slate-300">
                        Heure *
                        <input type="time" required value={heureRendezVous} onChange={e => setHeureRendezVous(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white" />
                      </label>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold text-slate-300">Consignes pour le laveur</label>
                      <textarea
                        rows={2}
                        value={instructionsClient}
                        onChange={e => setInstructionsClient(e.target.value)}
                        placeholder="Accès, indications, précautions..."
                        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Type de véhicule *</label>
                  <select
                    value={typeVehicule}
                    onChange={event => setTypeVehicule(event.target.value as 'VOITURE' | 'MOTO')}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white"
                  >
                    <option value="VOITURE">Voiture</option>
                    <option value="MOTO">Moto</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Véhicule (Marque / Modèle)
                  </label>
                  <input
                    type="text"
                    value={vehiculeDesc}
                    onChange={(e) => setVehiculeDesc(e.target.value)}
                    placeholder="Ex: Toyota Rav4"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Nom du Client *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientNom}
                    onChange={(e) => setClientNom(e.target.value)}
                    placeholder="Ex: M. Sylvain Samba"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Téléphone (pour notification)
                  </label>
                  <input
                    type="tel"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+242 06..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <section className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/50 p-3">
                <h3 className="text-xs font-bold text-white">Prestations de lavage à la carte</h3>
                <label className="block text-xs font-semibold text-slate-300">
                  Catégorie du véhicule
                  <select value={categorieVehicule} onChange={event => {
                    setCategorieVehicule(event.target.value);
                    setPrixLavageNegocie('0');
                  }} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
                    {configurationEntreprise.categoriesVehicules.map(category => <option key={category} value={category}>{category}</option>)}
                  </select>
                </label>
                {servicesLavageActifs.length === 0 ? (
                  <p className="rounded-lg bg-amber-950/40 p-3 text-xs leading-5 text-amber-200">Aucune prestation de lavage n’est configurée. Ajoutez les services et leurs tarifs dans Paramètres → N.O.B et catalogue lavage.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {servicesLavageActifs.map(service => (
                      <label key={service.id} className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-slate-200">
                        <input
                          type="checkbox"
                          checked={servicesLavageSelectionnes.includes(service.id)}
                          onChange={event => setServicesLavageSelectionnes(previous => event.target.checked
                            ? [...previous, service.id]
                            : previous.filter(id => id !== service.id))}
                          className="mt-0.5 accent-cyan-600"
                        />
                        <span className="flex-1">{service.nom}</span>
                        <span className="font-mono font-bold text-cyan-200">{formatCurrency(service.prix_par_categorie[categorieVehicule] || 0)}</span>
                      </label>
                    ))}
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-900 p-3">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">Total catalogue</p>
                    <p className="mt-1 font-mono text-lg font-black text-white">{formatCurrency(totalCatalogueLavage)}</p>
                  </div>
                  <label className="text-xs font-semibold text-slate-300">
                    Total convenu avec le client (minimum 1 000 FCFA)
                    <input type="number" min="1000" step="1" value={prixLavageNegocie} onChange={event => setPrixLavageNegocie(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-lg font-bold text-white" />
                  </label>
                </div>
              </section>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {serviceMode === 'DOMICILE' ? 'Laveurs responsables de l’intervention *' : 'Laveurs affectés (commission partagée)'}
                </label>
                <select
                  multiple
                  value={selectedLaveurIds.map(String)}
                  onChange={event => setSelectedLaveurIds(Array.from(event.currentTarget.selectedOptions, option => Number(option.value)))}
                  required={serviceMode === 'DOMICILE' && selectedLaveurIds.length === 0}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  {laveurs.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.nom_complet} ({l.total_vehicules_mois || 0} lavages ce mois)
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-400">
                  Maintenez Ctrl (Windows) pour sélectionner plusieurs laveurs. Sans sélection au centre, un laveur est attribué automatiquement.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-600/30 cursor-pointer"
                >
                  Valider Billet de Lavage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lavagesAnnules.length > 0 && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <h2 className="text-sm font-bold text-rose-900">Historique des lavages annulés ({lavagesAnnules.length})</h2>
          <div className="mt-3 space-y-2">
            {lavagesAnnules.map(item => (
              <div key={item.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-rose-100 bg-white p-3 text-xs">
                <div>
                  <span className="font-mono font-bold text-slate-900">{item.code_lavage} · {item.plaque}</span>
                  <p className="mt-1 text-slate-700">Motif : {item.motif_annulation || 'Non renseigné'}</p>
                </div>
                <span className="text-slate-500">{item.annule_le || ''}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {washCancellation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form onSubmit={submitWashCancellation} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-700 bg-white p-6 shadow-2xl">
            <div>
              <h2 className="text-base font-bold text-slate-900">Annuler le lavage</h2>
              <p className="mt-1 text-xs text-slate-600">{washCancellation.code_lavage} · {washCancellation.plaque}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
              {washCancellation.facture_id
                ? `La transaction encaissée de ${formatCurrency(washCancellation.prix)} sera remboursée et portée en négatif dans la caisse.`
                : 'Le ticket restera dans l’historique avec son motif d’annulation.'}
            </div>
            <label className="block text-xs font-semibold text-slate-700">
              Motif obligatoire
              <textarea
                required
                minLength={3}
                value={washCancellationReason}
                onChange={event => setWashCancellationReason(event.target.value)}
                rows={3}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="Expliquez la raison de l’annulation"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setWashCancellation(null)} className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">Retour</button>
              <button type="submit" className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700">Confirmer</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
