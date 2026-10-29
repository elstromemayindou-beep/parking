/**
 * AutoGestion Pro v3.0 - Module 3: Garage & Mécanique / Atelier
 * Requirements:
 * - RF-13 : Ordre de Réparation (OR) avec diagnostic et photos des dommages
 * - RF-15 : Devis détaillé (pièces + main-d'œuvre) soumis à validation gérant
 * - RF-18 : Déduction automatique des pièces détachées réservées dès validation devis
 * - Vue Kanban à 5 étapes : Réception -> Diagnostic -> Devis en attente -> En réparation -> Prêt/Facturé
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { OrdreReparation, EtapeKanban, PieceStock } from '../../types';
import {
  Wrench,
  PlusCircle,
  FileCheck,
  AlertCircle,
  Clock,
  Car,
  User,
  CheckCircle,
  Layers,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Camera,
  Coins,
  ClipboardPlus,
  UserPlus
} from 'lucide-react';

export const GarageModule: React.FC = () => {
  const {
    garageOrs,
    employes,
    piecesStock,
    clients,
    vehicules,
    userRole,
    ajouterOrdreReparation,
    changerEtapeGarage,
    validerDevisGarage,
    ajouterClient,
    ajouterVehicule,
    tarifsServices,
    formatCurrency,
    setReceiptModalData,
    showNotification
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [selectedOrForDevis, setSelectedOrForDevis] = useState<OrdreReparation | null>(null);

  // New OR Form state
  const [selectedVehiculeId, setSelectedVehiculeId] = useState<number | ''>('');
  const [kilometrage, setKilometrage] = useState<number>(0);
  const [niveauCarburant, setNiveauCarburant] = useState<'1/4' | '1/2' | '3/4' | 'Plein' | 'Réserve'>('1/2');
  const [symptomes, setSymptomes] = useState('');
  const [selectedMecanicienId, setSelectedMecanicienId] = useState<number | ''>(0);
  const [dommagePreexistant, setDommagePreexistant] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleType, setVehicleType] = useState<'VOITURE' | 'MOTO'>('VOITURE');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehicleMileage, setVehicleMileage] = useState<number>(0);
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');

  // Devis creation state
  const [mainOeuvre, setMainOeuvre] = useState<number>(0);
  const [diagnosticText, setDiagnosticText] = useState('');
  const [selectedPiecesToAdd, setSelectedPiecesToAdd] = useState<{ piece_id: number; nom: string; ref: string; qte: number; prix: number; deduit: boolean }[]>([]);

  const mecaniciens = employes.filter(e => (e.poste === 'Mécanicien' || e.poste === 'Chef d\'Atelier') && e.statut === 'ACTIF');

  const etapes: { id: EtapeKanban; label: string; color: string; badgeColor: string }[] = [
    { id: 'RECEPTION', label: '1. Réception', color: 'border-slate-300', badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200' },
    { id: 'DIAGNOSTIC', label: '2. Diagnostic & Photos', color: 'border-sky-400', badgeColor: 'bg-sky-50 text-sky-800 border border-sky-200' },
    { id: 'DEVIS_EN_ATTENTE', label: '3. Devis à Valider', color: 'border-amber-400', badgeColor: 'bg-amber-50 text-amber-800 border border-amber-200 font-bold' },
    { id: 'EN_REPARATION', label: '4. En Réparation', color: 'border-indigo-400', badgeColor: 'bg-indigo-50 text-indigo-800 border border-indigo-200' },
    { id: 'PRET_FACTURE', label: '5. Prêt & Facturé', color: 'border-emerald-400', badgeColor: 'bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200' }
  ];

  const handleCreateOr = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicules.find(item => item.id === selectedVehiculeId);
    if (!vehicle) {
      showNotification('Enregistrez ou sélectionnez un véhicule avant d’ouvrir un ordre de réparation.', 'warning');
      return;
    }
    const client = clients.find(item => item.id === vehicle.client_id);
    if (!client) {
      showNotification('Le propriétaire associé à ce véhicule est introuvable. Vérifiez la fiche du véhicule.', 'warning');
      return;
    }

    ajouterOrdreReparation({
      client_id: client.id,
      vehicule_id: vehicle.id,
      plaque: vehicle.plaque,
      modele: `${vehicle.marque} ${vehicle.modele}`.trim(),
      type_vehicule: vehicle.type_vehicule ?? 'VOITURE',
      kilometrage: Number(kilometrage) || 0,
      niveau_carburant: niveauCarburant,
      dommages_constates: dommagePreexistant ? [dommagePreexistant] : ['Aucun dommage carrosserie préexistant'],
      mecanicien_id: Number(selectedMecanicienId) || mecaniciens[0]?.id || 0,
      etape: 'RECEPTION',
      symptomes_client: symptomes,
      pieces_demandees: [],
      main_oeuvre_montant: 0,
      montant_total_estime: 0,
      devis_valide_gerant: false,
      date_entree: new Date().toISOString().replace('T', ' ').slice(0, 16),
      date_livraison_prevue: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10)
    });

    setModalOpen(false);
    setSelectedVehiculeId('');
    setKilometrage(0);
    setSymptomes('');
    setDommagePreexistant('');
  };

  const handleRegisterVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPlate = vehiclePlate.toUpperCase().trim();
    if (vehicules.some(vehicle => vehicle.plaque.toUpperCase().trim() === normalizedPlate)) {
      showNotification(`Le véhicule ${normalizedPlate} est déjà enregistré.`, 'warning');
      return;
    }

    const existingOwner = clients.find(client => client.telephone.trim() === ownerPhone.trim());
    const owner = existingOwner || ajouterClient(ownerName.trim(), ownerPhone.trim(), 0);
    const createdVehicle = ajouterVehicule({
      client_id: owner.id,
      plaque: normalizedPlate,
      type_vehicule: vehicleType,
      marque: vehicleMake.trim(),
      modele: vehicleModel.trim(),
      couleur: vehicleColor.trim() || undefined,
      kilometrage: Number(vehicleMileage) || 0
    });
    if (!createdVehicle) return;

    setSelectedVehiculeId(createdVehicle.id);
    setKilometrage(createdVehicle.kilometrage || 0);
    setVehicleModalOpen(false);
    setVehiclePlate('');
    setVehicleType('VOITURE');
    setVehicleMake('');
    setVehicleModel('');
    setVehicleColor('');
    setVehicleMileage(0);
    setOwnerName('');
    setOwnerPhone('');
  };

  const openNewOr = () => {
    setSelectedVehiculeId('');
    setModalOpen(true);
  };

  const openOrForVehicle = (vehicleId: number) => {
    const vehicle = vehicules.find(item => item.id === vehicleId);
    if (!vehicle) return;
    setSelectedVehiculeId(vehicle.id);
    setKilometrage(vehicle.kilometrage || 0);
    setModalOpen(true);
  };

  const handleOpenDevisModal = (orItem: OrdreReparation) => {
    setSelectedOrForDevis(orItem);
    setMainOeuvre(orItem.main_oeuvre_montant || tarifsServices.garageMainOeuvre);
    setDiagnosticText(orItem.diagnostic_atelier || orItem.symptomes_client);
    setSelectedPiecesToAdd(orItem.pieces_demandees || []);
  };

  const addPieceToDevis = (piece: PieceStock) => {
    const existing = selectedPiecesToAdd.find(p => p.piece_id === piece.id);
    if (existing) {
      setSelectedPiecesToAdd(selectedPiecesToAdd.map(p => p.piece_id === piece.id ? { ...p, qte: p.qte + 1 } : p));
    } else {
      setSelectedPiecesToAdd([
        ...selectedPiecesToAdd,
        {
          piece_id: piece.id,
          nom: piece.nom,
          ref: piece.reference,
          qte: 1,
          prix: piece.prix_vente,
          deduit: false
        }
      ]);
    }
  };

  const removePieceFromDevis = (pieceId: number) => {
    setSelectedPiecesToAdd(selectedPiecesToAdd.filter(p => p.piece_id !== pieceId));
  };

  const saveDevisAndSubmit = () => {
    if (!selectedOrForDevis) return;
    const totalPieces = selectedPiecesToAdd.reduce((sum, p) => sum + (p.prix * p.qte), 0);
    const totalEstime = totalPieces + Number(mainOeuvre);

    selectedOrForDevis.diagnostic_atelier = diagnosticText;
    selectedOrForDevis.pieces_demandees = selectedPiecesToAdd;
    selectedOrForDevis.main_oeuvre_montant = Number(mainOeuvre);
    selectedOrForDevis.montant_total_estime = totalEstime;
    selectedOrForDevis.etape = 'DEVIS_EN_ATTENTE';

    changerEtapeGarage(selectedOrForDevis.id, 'DEVIS_EN_ATTENTE');
    setSelectedOrForDevis(null);
    showNotification(`Devis ${selectedOrForDevis.numero_or} soumis pour validation (${formatCurrency(totalEstime)})`);
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-4 sm:p-6 lg:p-9">
      <div className="glass-panel flex flex-col justify-between gap-4 rounded-3xl border border-white/80 bg-white/80 p-5 sm:flex-row sm:items-center sm:p-6">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-700">
            <Wrench className="h-4 w-4" />
            <span>Espace garage & atelier</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">
            Centre de gestion du garage
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-600">
            Véhicules clients, réception atelier, diagnostics, devis, réparations et facturation réunis au même endroit.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setVehicleModalOpen(true)} className="glass-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-violet-900">
            <Car className="h-4 w-4" />
            Enregistrer un véhicule
          </button>
          <button onClick={openNewOr} className="button-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white">
            <PlusCircle className="h-4 w-4" />
            Ouvrir un ordre atelier
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GarageSummary icon={<Car className="h-4 w-4" />} label="Véhicules enregistrés" value={vehicules.length} />
        <GarageSummary icon={<ClipboardPlus className="h-4 w-4" />} label="Dossiers atelier" value={garageOrs.length} />
        <GarageSummary icon={<Clock className="h-4 w-4" />} label="En cours" value={garageOrs.filter(order => order.etape !== 'PRET_FACTURE').length} />
        <GarageSummary icon={<FileCheck className="h-4 w-4" />} label="Devis à valider" value={garageOrs.filter(order => order.etape === 'DEVIS_EN_ATTENTE' && !order.devis_valide_gerant).length} />
      </section>

      <section className="glass-panel rounded-3xl border border-white/80 bg-white/75 p-5 sm:p-6">
        <div className="mb-4">
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-950">Parc de véhicules clients</h2>
            <p className="mt-1 text-xs text-slate-500">Fiches saisies au garage et véhicules prêts pour une réception atelier.</p>
          </div>
        </div>
        {vehicules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center">
            <Car className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-700">Aucun véhicule dans le fichier</p>
            <p className="mt-1 text-xs text-slate-500">Utilisez « Enregistrer un véhicule » en haut de l’espace pour créer une fiche et ouvrir ensuite un ordre atelier.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {vehicules.map(vehicle => {
              const owner = clients.find(client => client.id === vehicle.client_id);
              return (
                <article key={vehicle.id} className="flex flex-col justify-between gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Car className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{vehicle.type_vehicule === 'MOTO' ? 'Moto' : 'Voiture'} · {vehicle.marque} {vehicle.modele}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-violet-800">{vehicle.plaque}</span>
                        {vehicle.couleur && ` · ${vehicle.couleur}`}
                        {` · ${(vehicle.kilometrage || 0).toLocaleString('fr-FR')} km`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                    <span className="text-xs text-slate-600">{owner ? `${owner.nom} · ${owner.telephone}` : 'Propriétaire à vérifier'}</span>
                    <button disabled={!owner} onClick={() => openOrForVehicle(vehicle.id)} className="glass-button inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold text-violet-900 disabled:cursor-not-allowed disabled:opacity-50">
                      <PlusCircle className="h-3.5 w-3.5" /> Ouvrir un ordre
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section aria-label="Suivi des ordres de réparation" className="grid grid-cols-1 items-start gap-3.5 md:grid-cols-5">
        {etapes.map((col) => {
          const orsInCol = garageOrs.filter(o => o.etape === col.id);

          return (
            <div
              key={col.id}
              className={`glass-panel flex min-h-[360px] flex-col rounded-2xl border border-white/80 border-t-4 bg-white/75 p-3.5 sm:min-h-[480px] ${col.color}`}
            >
              <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h3 className="truncate text-xs font-bold text-slate-900">{col.label}</h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                  {orsInCol.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {orsInCol.length === 0 ? (
                  <div className="py-10 text-center text-xs italic text-slate-500">
                    Aucun OR
                  </div>
                ) : (
                  orsInCol.map((orItem) => {
                    const mecano = employes.find(e => e.id === orItem.mecanicien_id);
                    return (
                      <div
                        key={orItem.id}
                        className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-300 hover:bg-blue-50/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-extrabold text-blue-700">
                            {orItem.numero_or}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-black text-slate-900">
                            {orItem.plaque}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-slate-800">
                          {orItem.modele}
                        </div>

                        <div className="line-clamp-2 text-[11px] italic text-slate-600">
                          "{orItem.symptomes_client}"
                        </div>

                        {/* Diagnostics & Parts summary */}
                        {orItem.pieces_demandees && orItem.pieces_demandees.length > 0 && (
                          <div className="rounded bg-slate-50 p-1.5 text-[10px] text-slate-600">
                            <span className="font-bold text-amber-700">{orItem.pieces_demandees.length} pièce(s) :</span>{' '}
                            {orItem.pieces_demandees.map(p => p.nom).join(', ').slice(0, 45)}...
                          </div>
                        )}

                        {orItem.montant_total_estime > 0 && (
                          <div className="flex items-center justify-between border-t border-slate-200 pt-1 text-xs font-bold">
                            <span className="text-slate-500">Total :</span>
                            <span className="font-mono text-emerald-700">
                              {formatCurrency(orItem.montant_total_estime)}
                            </span>
                          </div>
                        )}

                        {/* Status specific actions */}
                        <div className="flex flex-col gap-1.5 border-t border-slate-200 pt-2">
                          {col.id === 'RECEPTION' && (
                            <button
                              onClick={() => changerEtapeGarage(orItem.id, 'DIAGNOSTIC')}
                              className="w-full cursor-pointer rounded-lg bg-blue-600 py-1.5 text-center text-xs font-bold text-white transition hover:bg-blue-700"
                            >
                              Lancer Diagnostic →
                            </button>
                          )}

                          {col.id === 'DIAGNOSTIC' && (
                            <button
                              onClick={() => handleOpenDevisModal(orItem)}
                              className="w-full cursor-pointer rounded-lg bg-amber-600 py-1.5 text-center text-xs font-bold text-white transition hover:bg-amber-500"
                            >
                              Établir Devis Pièces & MO →
                            </button>
                          )}

                          {col.id === 'DEVIS_EN_ATTENTE' && (
                            <div className="space-y-1">
                              {!orItem.devis_valide_gerant ? (
                                <button
                                  onClick={() => validerDevisGarage(orItem.id)}
                                  className="w-full cursor-pointer rounded-lg bg-emerald-600 py-1.5 text-center text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
                                  title="Valider devis et déduire automatiquement les pièces du stock (RF-18)"
                                >
                                  ✓ Valider Devis & Déstocker
                                </button>
                              ) : (
                                <span className="block text-center text-[10px] font-bold text-emerald-700">
                                  ✓ Validé par Gérant
                                </span>
                              )}
                              <button
                                onClick={() => handleOpenDevisModal(orItem)}
                                className="w-full py-1 text-center text-[10px] font-semibold text-slate-500 hover:text-blue-700"
                              >
                                Modifier pièces/MO
                              </button>
                            </div>
                          )}

                          {col.id === 'EN_REPARATION' && (
                            <button
                              onClick={() => changerEtapeGarage(orItem.id, 'PRET_FACTURE')}
                              className="w-full cursor-pointer rounded-lg bg-blue-600 py-1.5 text-center text-xs font-bold text-white transition hover:bg-blue-700"
                            >
                              Terminer & Prêt Facturation →
                            </button>
                          )}

                          {col.id === 'PRET_FACTURE' && (
                            <button
                              onClick={() => setReceiptModalData({ visible: true, type: 'GARAGE', data: orItem })}
                              className="glass-button w-full cursor-pointer rounded-lg py-1.5 text-center text-xs font-semibold text-slate-700 transition"
                            >
                              Imprimer Devis / OR
                            </button>
                          )}
                        </div>

                        {/* Footer card */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>{mecano ? mecano.nom_complet : 'Non attribué'}</span>
                          <span className="font-mono">{orItem.kilometrage} km</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </section>

      {vehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <section className="glass-panel w-full max-w-xl rounded-3xl border border-white/80 bg-white p-6 shadow-2xl">
            <header className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700">Fichier véhicules</p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-950">Enregistrer un véhicule</h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">Le gérant peut saisir la fiche directement à l’accueil, sans dépendre de l’appareil d’un agent.</p>
              </div>
              <button type="button" onClick={() => setVehicleModalOpen(false)} aria-label="Fermer" className="glass-button rounded-lg px-3 py-2 text-sm text-slate-700">✕</button>
            </header>
            <form onSubmit={handleRegisterVehicle} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700">
                  Plaque d’immatriculation *
                  <input required value={vehiclePlate} onChange={event => setVehiclePlate(event.target.value.toUpperCase())} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm font-bold text-slate-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" placeholder="Ex. 452-EZ-02" />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Type de véhicule *
                  <select value={vehicleType} onChange={event => setVehicleType(event.target.value as 'VOITURE' | 'MOTO')} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900">
                    <option value="VOITURE">Voiture</option>
                    <option value="MOTO">Moto</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Marque *
                  <input required value={vehicleMake} onChange={event => setVehicleMake(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" placeholder="Toyota" />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Modèle *
                  <input required value={vehicleModel} onChange={event => setVehicleModel(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" placeholder="Land Cruiser" />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Couleur
                  <input value={vehicleColor} onChange={event => setVehicleColor(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" placeholder="Noir" />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Kilométrage
                  <input min={0} type="number" value={vehicleMileage} onChange={event => setVehicleMileage(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                </label>
                <span className="hidden sm:block" />
                <label className="text-xs font-semibold text-slate-700">
                  Nom du propriétaire *
                  <input required value={ownerName} onChange={event => setOwnerName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" placeholder="Nom complet" />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Téléphone *
                  <input required type="tel" value={ownerPhone} onChange={event => setOwnerPhone(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100" placeholder="+242 ..." />
                </label>
              </div>
              <div className="flex flex-col-reverse justify-end gap-2 border-t border-slate-200 pt-4 sm:flex-row">
                <button type="button" onClick={() => setVehicleModalOpen(false)} className="glass-button rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700">Annuler</button>
                <button type="submit" className="button-primary inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white">
                  <UserPlus className="h-4 w-4" /> Enregistrer le véhicule
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* MODAL 1: NOUVEL ORDRE DE RÉPARATION (RF-13) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600/30 text-amber-400 flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Ouverture d'un Ordre de Réparation (RF-13)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Symptômes client, kilométrage, niveau jauge et inspection carrosserie
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setModalOpen(false); setVehicleModalOpen(true); }} className="glass-button inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-bold text-violet-900">
                  <Car className="h-3.5 w-3.5" /> Nouveau véhicule
                </button>
                <button type="button" onClick={() => setModalOpen(false)} aria-label="Fermer" className="glass-button rounded-lg px-3 py-2 text-sm text-slate-700">✕</button>
              </div>
            </div>

            <form onSubmit={handleCreateOr} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-300">Véhicule enregistré *</label>
                <select
                  required
                  value={selectedVehiculeId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const selected = vehicules.find(vehicle => vehicle.id === id);
                    setSelectedVehiculeId(id || '');
                    setKilometrage(selected?.kilometrage || 0);
                  }}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">Sélectionner un véhicule enregistré</option>
                  {vehicules.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plaque} · {vehicle.marque} {vehicle.modele}
                    </option>
                  ))}
                </select>
                {vehicules.length === 0 ? (
                  <button type="button" onClick={() => { setModalOpen(false); setVehicleModalOpen(true); }} className="mt-2 text-xs font-semibold text-blue-700 underline underline-offset-2">
                    Enregistrer un véhicule maintenant
                  </button>
                ) : (
                  <p className="mt-1 text-[10px] text-slate-400">
                    {vehicules.find(vehicle => vehicle.id === selectedVehiculeId)?.plaque || 'Choisissez un véhicule de votre fichier.'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Kilométrage compteur
                  </label>
                  <input
                    type="number"
                    value={kilometrage}
                    onChange={(e) => setKilometrage(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Niveau Carburant
                  </label>
                  <select
                    value={niveauCarburant}
                    onChange={(e) => setNiveauCarburant(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="1/4">1/4 réservoir</option>
                    <option value="1/2">1/2 réservoir</option>
                    <option value="3/4">3/4 réservoir</option>
                    <option value="Plein">Plein complet</option>
                    <option value="Réserve">En Réserve</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Symptômes décrits par le client (Plainte initiale) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={symptomes}
                  onChange={(e) => setSymptomes(e.target.value)}
                  placeholder="Ex: Bruit métallique à l'avant droit en freinant + fumée noire à l'accélération..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Dommages carrosserie constatés à l'entrée (Protection juridique)
                </label>
                <input
                  type="text"
                  value={dommagePreexistant}
                  onChange={(e) => setDommagePreexistant(e.target.value)}
                  placeholder="Ex: Rayure profonde portière arrière droite, pare-chocs avant fissuré"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Mécanicien assigné au dossier
                </label>
                <select
                  value={selectedMecanicienId}
                  onChange={(e) => setSelectedMecanicienId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value={0}>À attribuer</option>
                  {mecaniciens.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nom_complet} ({m.poste})
                    </option>
                  ))}
                </select>
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
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 cursor-pointer"
                >
                  Ouvrir Ordre de Réparation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CRÉATION & ÉDITION DEVIS ATELIER (RF-15 & RF-18) */}
      {selectedOrForDevis && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Devis Atelier - {selectedOrForDevis.numero_or} ({selectedOrForDevis.plaque})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sélection des pièces en stock magasin & forfait main-d'œuvre
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrForDevis(null)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Diagnostic Technique Atelier
                </label>
                <textarea
                  rows={2}
                  value={diagnosticText}
                  onChange={(e) => setDiagnosticText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  placeholder="Résultat démontage et analyse atelier..."
                />
              </div>

              {/* Add pieces from inventory */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Ajouter Pièces depuis le Stock Magasin :
                  </label>
                  <span className="text-[10px] text-slate-400">Déduction auto dès validation</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                  {piecesStock.map(piece => (
                    <button
                      key={piece.id}
                      type="button"
                      onClick={() => addPieceToDevis(piece)}
                      className="text-left p-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs transition flex justify-between items-center cursor-pointer"
                    >
                      <div className="truncate pr-2">
                        <div className="font-bold text-slate-200 truncate">{piece.nom}</div>
                        <div className="text-[10px] text-slate-400">{piece.reference} • Stock: {piece.quantite_disponible}</div>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold whitespace-nowrap text-[11px]">
                        +{formatCurrency(piece.prix_vente)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected pieces table */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Pièces incluses dans le devis ({selectedPiecesToAdd.length})
                </label>
                {selectedPiecesToAdd.length === 0 ? (
                  <div className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-xl text-center border border-slate-800">
                    Aucune pièce ajoutée pour le moment.
                  </div>
                ) : (
                  <div className="bg-slate-950/80 rounded-xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="p-2">Désignation</th>
                          <th className="p-2 text-center">Quantité</th>
                          <th className="p-2 text-right">P.U.</th>
                          <th className="p-2 text-right">Total</th>
                          <th className="p-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {selectedPiecesToAdd.map((p, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-medium">{p.nom}</td>
                            <td className="p-2 text-center font-mono">{p.qte}</td>
                            <td className="p-2 text-right font-mono">{formatCurrency(p.prix)}</td>
                            <td className="p-2 text-right font-mono font-bold text-emerald-400">
                              {formatCurrency(p.prix * p.qte)}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => removePieceFromDevis(p.piece_id)}
                                className="text-red-400 hover:text-red-300 font-bold cursor-pointer"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Labor cost */}
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Forfait Main d'Œuvre Mécanique (FCFA)
                  </label>
                  <input
                    type="number"
                    value={mainOeuvre}
                    onChange={(e) => setMainOeuvre(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-sm font-bold text-white focus:outline-none"
                  />
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-right">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Total Devis Estimé TTC
                  </span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    {formatCurrency(
                      selectedPiecesToAdd.reduce((sum, p) => sum + p.prix * p.qte, 0) + Number(mainOeuvre)
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedOrForDevis(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={saveDevisAndSubmit}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 cursor-pointer"
                >
                  Enregistrer & Soumettre Devis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const GarageSummary: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <div className="glass-panel flex items-center gap-3 rounded-2xl border border-white/80 bg-white/70 p-4">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">{icon}</span>
    <span className="min-w-0">
      <span className="block truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="mt-1 block text-lg font-extrabold tabular-nums text-slate-950">{value}</span>
    </span>
  </div>
);
