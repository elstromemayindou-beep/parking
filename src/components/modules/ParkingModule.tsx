/**
 * AutoGestion Pro v3.0 - Module 1: Parking & Scan ANPR / OCR
 * Requirements:
 * - RF-28 : Cartographie dynamique du parking (places libres, occupées, hors service)
 * - RF-36 : Scan optique ANPR de plaque d'immatriculation via appareil photo
 * - RF-38 : Correction manuelle de la plaque si celle-ci est sale ou masquée
 * - RNF-02 : Reconnaissance de plaque ANPR < 2 secondes
 * - Calcul de durée au quart d'heure et encaissement Mobile Money/Espèces
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CapacitesParking, PlaceParking, TicketParking, PaymentMethod, ZoneParking } from '../../types';
import { calculerMontantParking, tarifParkingTicket } from '../../utils/parkingPricing';
import {
  ParkingSquare,
  Camera,
  Car,
  QrCode,
  Clock,
  AlertCircle,
  Search,
  Filter,
  DollarSign,
  Edit3,
  Settings
} from 'lucide-react';

export const ParkingModule: React.FC = () => {
  const {
    placesParking,
    ticketsParking,
    initialiserPlacesParking,
    modifierPlacesParking,
    creerTicketParking,
    cloturerTicketParking,
    arreterTicketParking,
    tarifsServices,
    formatCurrency,
    setReceiptModalData,
    showNotification,
    userRole
  } = useApp();

  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);
  const [parkingCapacities, setParkingCapacities] = useState<Record<ZoneParking, string>>({
    A: '',
    B: '',
    VIP: '',
    OUVERTE: ''
  });
  const [plaqueInput, setPlaqueInput] = useState('');
  const [modeleInput, setModeleInput] = useState('');
  const [typeVehicule, setTypeVehicule] = useState<'VOITURE' | 'MOTO'>('VOITURE');
  const [selectedZone, setSelectedZone] = useState<ZoneParking>('A');
  const [typeClient, setTypeClient] = useState<'HORAIRE' | 'ABONNE_VIP' | 'CLIENT_GARAGE'>('HORAIRE');
  const [filterQuery, setFilterQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState<'ALL' | ZoneParking>('ALL');

  // Payment checkout modal
  const [checkoutTicket, setCheckoutTicket] = useState<TicketParking | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('MTN_MOMO');
  const [checkoutClock, setCheckoutClock] = useState(Date.now());
  const [ticketToStop, setTicketToStop] = useState<TicketParking | null>(null);
  const [stopReason, setStopReason] = useState('');
  const [stopWithPayment, setStopWithPayment] = useState(true);
  const [stopPaymentMethod, setStopPaymentMethod] = useState<PaymentMethod>('ESPECES');

  useEffect(() => {
    if (!checkoutTicket) return;
    const timer = setInterval(() => setCheckoutClock(Date.now()), 15000);
    return () => clearInterval(timer);
  }, [checkoutTicket]);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plaqueInput.trim()) {
      showNotification('Veuillez saisir ou scanner une plaque d\'immatriculation', 'warning');
      return;
    }

    const ticket = creerTicketParking(
      plaqueInput.trim(),
      selectedZone,
      typeClient,
      'MANUEL',
      modeleInput || (typeVehicule === 'MOTO' ? 'Moto' : 'Véhicule standard'),
      typeVehicule
    );
    if (!ticket) return;

    setScanModalOpen(false);
    setPlaqueInput('');
    setModeleInput('');
    setTypeVehicule('VOITURE');
  };

  const handleStopTicket = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ticketToStop) return;
    if (arreterTicketParking(ticketToStop.id, stopReason, stopWithPayment ? stopPaymentMethod : undefined)) {
      setTicketToStop(null);
      setStopReason('');
    }
  };

  const getTicketAmount = (ticket: TicketParking, now = Date.now()) => {
    if (ticket.type_client !== 'HORAIRE') return 0;
    const tarif = tarifParkingTicket(ticket);
    const entree = new Date(ticket.heure_entree.replace(' ', 'T')).getTime();
    const minutes = Math.max(15, Math.ceil((now - entree) / 60000));
    return calculerMontantParking(minutes, tarif.premiereHeure, tarif.quartHeureSupplementaire);
  };

  const handleInitializeParking = (e: React.FormEvent) => {
    e.preventDefault();
    const values = [parkingCapacities.A, parkingCapacities.B, parkingCapacities.VIP, parkingCapacities.OUVERTE];
    const counts = values.map(value => value.trim() === '' ? 0 : Number(value));
    if (counts.some(count => !Number.isInteger(count) || count < 0 || count > 200)) {
      showNotification('Saisissez un nombre entier entre 0 et 200 pour chaque zone.', 'warning');
      return;
    }

    const capacities: CapacitesParking = {
      A: counts[0],
      B: counts[1],
      VIP: counts[2],
      OUVERTE: counts[3]
    };
    const saved = placesParking.length === 0
      ? initialiserPlacesParking(capacities)
      : modifierPlacesParking(capacities);
    if (saved) setCapacityModalOpen(false);
  };

  const openParkingConfiguration = () => {
    const counts: Record<ZoneParking, string> = { A: '0', B: '0', VIP: '0', OUVERTE: '0' };
    placesParking.forEach(place => {
      if (place.zone in counts) counts[place.zone as ZoneParking] = String(Number(counts[place.zone as ZoneParking]) + 1);
    });
    setParkingCapacities(placesParking.length > 0 ? counts : { A: '', B: '', VIP: '', OUVERTE: '' });
    setCapacityModalOpen(true);
  };

  const handleCheckoutConfirm = () => {
    if (!checkoutTicket) return;
    cloturerTicketParking(checkoutTicket.id, selectedPaymentMethod);
    setCheckoutTicket(null);
  };

  const checkoutAmount = checkoutTicket ? getTicketAmount(checkoutTicket, checkoutClock) : 0;

  // Filtered tickets
  const activeTickets = ticketsParking.filter(t => t.statut === 'ACTIF');
  const filteredActiveTickets = activeTickets.filter(t => {
    const matchesQuery = t.plaque.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (t.marque_modele && t.marque_modele.toLowerCase().includes(filterQuery.toLowerCase())) ||
      t.place_numero.toLowerCase().includes(filterQuery.toLowerCase());
    
    if (zoneFilter === 'ALL') return matchesQuery;
    return matchesQuery && t.place_numero.startsWith(zoneFilter);
  });

  const capacityFields: { zone: ZoneParking; label: string }[] = [
    { zone: 'A', label: 'Zone A' },
    { zone: 'B', label: 'Zone B' },
    { zone: 'VIP', label: 'Zone VIP' },
    { zone: 'OUVERTE', label: 'Zone libre' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <ParkingSquare className="w-4 h-4" />
            <span>Module Parking</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Gestion du parking et des entrées
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Suivez les places disponibles, les tickets actifs et les sorties à encaisser.
          </p>
        </div>

        {placesParking.length === 0 ? (
          <button
            onClick={openParkingConfiguration}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            <span>Configurer les places</span>
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(userRole === 'GERANT' || userRole === 'PROPRIETAIRE') && (
              <button
                onClick={openParkingConfiguration}
                className="px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Modifier les places</span>
              </button>
            )}
            <button
              onClick={() => setScanModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition hover:scale-105 cursor-pointer"
            >
              <Car className="w-4 h-4" />
              <span>+ Enregistrer une entrée</span>
            </button>
          </div>
        )}
      </div>

      <div className="glass-panel flex gap-3 rounded-2xl border border-blue-100/80 bg-blue-50/70 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><Edit3 className="h-4 w-4" /></span>
          <div>
            <p className="text-sm font-bold text-slate-900">Saisie manuelle disponible au poste gérant</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-600">En cas d’indisponibilité d’un agent ou de son appareil, le gérant peut enregistrer l’entrée du véhicule ici. La saisie se fait sans scan automatique.</p>
          </div>
        </div>
      </div>

      {/* Interactive Parking Map (RF-28) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white">
              Cartographie Dynamique des Places (Plan de Masse RF-28)
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span> Libre
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Occupé
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Réservé VIP
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span> Hors Service
            </span>
          </div>
        </div>

        {/* Spots Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {placesParking.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-slate-600 p-6 text-center">
              <p className="text-sm font-bold text-white">Aucun emplacement n’est configuré.</p>
              <p className="mt-1 text-xs text-slate-400">Définissez le nombre de places par zone pour pouvoir enregistrer des entrées.</p>
              <button
                onClick={() => setCapacityModalOpen(true)}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
              >
                Configurer le parking
              </button>
            </div>
          )}
          {ticketToStop && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <form onSubmit={handleStopTicket} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-700 bg-white p-6 shadow-2xl">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Arrêt motivé du stationnement</h2>
                  <p className="mt-1 text-xs text-slate-600">{ticketToStop.code_ticket} · {ticketToStop.plaque} · Place {ticketToStop.place_numero}</p>
                </div>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-950">
                  Montant normal estimé à cet instant : <strong>{formatCurrency(getTicketAmount(ticketToStop))}</strong>
                </div>
                <fieldset className="space-y-2 text-xs text-slate-800">
                  <legend className="mb-2 font-bold">Traitement du montant</legend>
                  <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3">
                    <input type="radio" name="stop-payment" checked={stopWithPayment} onChange={() => setStopWithPayment(true)} />
                    <span>Encaisser le tarif normal et libérer la place</span>
                  </label>
                  <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3">
                    <input type="radio" name="stop-payment" checked={!stopWithPayment} onChange={() => setStopWithPayment(false)} />
                    <span>Annuler sans encaissement, conserver le motif et la trace d’audit</span>
                  </label>
                </fieldset>
                {stopWithPayment && (
                  <label className="block text-xs font-semibold text-slate-700">
                    Mode de paiement
                    <select value={stopPaymentMethod} onChange={event => setStopPaymentMethod(event.target.value as PaymentMethod)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
                      <option value="ESPECES">Espèces</option>
                      <option value="MTN_MOMO">MTN MoMo</option>
                      <option value="AIRTEL_MONEY">Airtel Money</option>
                      <option value="VIREMENT">Virement</option>
                    </select>
                  </label>
                )}
                <label className="block text-xs font-semibold text-slate-700">
                  Motif obligatoire
                  <textarea required minLength={3} rows={3} value={stopReason} onChange={event => setStopReason(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" placeholder="Indiquez pourquoi le stationnement est arrêté" />
                </label>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setTicketToStop(null)} className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">Retour</button>
                  <button type="submit" className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700">Confirmer l’arrêt</button>
                </div>
              </form>
            </div>
          )}
          {placesParking.map((place) => {
            const ticket = ticketsParking.find(t => t.place_numero === place.numero && t.statut === 'ACTIF');
            const isOccupied = place.statut === 'OCCUPE';
            const isReserved = place.statut === 'RESERVE';
            const isHorsService = place.statut === 'HORS_SERVICE';

            return (
              <div
                key={place.numero}
                className={`p-3.5 rounded-xl border transition flex flex-col justify-between min-h-[110px] ${
                  isOccupied
                    ? 'bg-blue-950/70 border-blue-500 text-white shadow-md shadow-blue-950/40'
                    : isReserved
                    ? 'bg-blue-900/30 border-blue-400/50 text-blue-200'
                    : isHorsService
                    ? 'bg-slate-900 border-slate-800 text-slate-500 opacity-60'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-blue-400 hover:bg-blue-950/20 cursor-pointer'
                }`}
                onClick={() => {
                  if (!isOccupied && !isHorsService) {
                    setPlaqueInput('');
                    setSelectedZone(place.zone === 'LAVAGE_WAIT' ? 'A' : place.zone);
                    setScanModalOpen(true);
                  } else if (ticket) {
                    setCheckoutTicket(ticket);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black tracking-wider px-2 py-0.5 rounded bg-black/40">
                    {place.numero}
                  </span>
                  <span className="text-[10px] font-bold uppercase">
                    {place.zone === 'OUVERTE' ? 'Zone libre' : place.zone === 'LAVAGE_WAIT' ? 'Zone lavage' : `Zone ${place.zone}`}
                  </span>
                </div>

                <div className="my-1.5">
                  {ticket ? (
                    <div>
                      <div className="font-mono text-xs font-black text-white truncate">
                        {ticket.plaque}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {ticket.marque_modele || 'En stationnement'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      {isReserved ? 'Réservé VIP' : isHorsService ? 'Maintenance' : 'Emplacement libre'}
                    </div>
                  )}
                </div>

                <div className="text-[10px] flex items-center justify-between text-slate-400 pt-1 border-t border-white/5">
                  {ticket ? (
                    <>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        {ticket.heure_entree.slice(-5)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCheckoutTicket(ticket);
                        }}
                        className="text-blue-400 hover:text-white font-bold underline cursor-pointer"
                      >
                        Sortie →
                      </button>
                    </>
                  ) : (
                    <span>{isHorsService ? 'Inactif' : 'Cliquer pour garer'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Tickets List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <QrCode className="w-4 h-4 text-cyan-400" />
              <span>Tickets Actifs en Cours ({filteredActiveTickets.length})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Tarification par quart d'heure avec génération de QR code thermique
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher plaque, place..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value as 'ALL' | ZoneParking)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="ALL">Toutes Zones</option>
              <option value="A">Zone A</option>
              <option value="B">Zone B</option>
              <option value="VIP">Zone VIP</option>
              <option value="OUVERTE">Zone libre</option>
            </select>
          </div>
        </div>

        {filteredActiveTickets.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-xs">
            Aucun ticket actif ne correspond aux critères.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Ticket N°</th>
                  <th className="py-2.5 px-3">Plaque & Véhicule</th>
                  <th className="py-2.5 px-3">Place</th>
                  <th className="py-2.5 px-3">Entrée</th>
                  <th className="py-2.5 px-3">Formule</th>
                  <th className="py-2.5 px-3">Source Scan</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredActiveTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-bold text-blue-400">
                      {t.code_ticket}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-mono font-extrabold text-white text-sm">
                        {t.plaque}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {t.type_vehicule === 'MOTO' ? 'Moto' : 'Voiture'} · {t.marque_modele || 'Non renseigné'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                        {t.place_numero}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {t.heure_entree}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        t.type_client === 'ABONNE_VIP'
                          ? 'bg-purple-500/20 text-purple-300'
                          : t.type_client === 'CLIENT_GARAGE'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {t.type_client}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        {t.scan_source === 'CAMERA_OCR' ? (
                          <>
                            <Camera className="w-3 h-3 text-emerald-400" />
                            <span>OCR Automatique</span>
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-3 h-3 text-amber-400" />
                            <span>Saisie Manuelle</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => setReceiptModalData({ visible: true, type: 'PARKING', data: t })}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                        title="Imprimer ticket QR"
                      >
                        <QrCode className="w-3.5 h-3.5 inline mr-1" />
                        Ticket
                      </button>
                      <button
                        onClick={() => setCheckoutTicket(t)}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm cursor-pointer"
                      >
                        Sortie & Paiement
                      </button>
                      <button
                        onClick={() => {
                          setTicketToStop(t);
                          setStopReason('');
                          setStopWithPayment(true);
                        }}
                        className="rounded border border-amber-400/40 px-2.5 py-1 text-[10px] font-bold text-amber-200 hover:bg-amber-500/10"
                      >
                        Arrêt motivé
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: SCAN OCR & ENTRÉE PARKING (RF-36 & RF-38) */}
      {capacityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3 border-b border-slate-200 pb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <ParkingSquare className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">{placesParking.length === 0 ? 'Configurer les places du parking' : 'Modifier les places du parking'}</h3>
                <p className="text-xs text-slate-600">Indiquez le nombre souhaité de places pour chaque zone.</p>
              </div>
            </div>

            <form onSubmit={handleInitializeParking} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {capacityFields.map(({ zone, label }) => (
                  <label key={zone} className="block text-xs font-semibold text-slate-700">
                    {label}
                    <input
                      type="number"
                      min="0"
                      max="200"
                      step="1"
                      inputMode="numeric"
                      value={parkingCapacities[zone]}
                      onChange={event => setParkingCapacities(current => ({ ...current, [zone]: event.target.value }))}
                      placeholder="0"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                ))}
              </div>

              <p className="rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-900">
                {placesParking.length === 0
                  ? 'Les emplacements seront enregistrés pour votre établissement. Laissez une zone à 0 si vous ne l’utilisez pas.'
                  : 'Les places occupées ou indisponibles sont conservées. Une réduction ne peut retirer que des places libres ; les places supprimées ne pourront plus être réutilisées.'}
              </p>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setCapacityModalOpen(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  {placesParking.length === 0 ? 'Enregistrer les places' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SCAN OCR & ENTRÉE PARKING (RF-36 & RF-38) */}
      {scanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Enregistrer une entrée
                  </h3>
                  <p className="text-xs text-slate-400">
                    Saisissez les informations du véhicule et attribuez une place libre.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setScanModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
              La reconnaissance de plaques et l’application mobile des agents ne sont pas encore connectées. Saisissez la plaque manuellement.
            </div>

            {/* Entry Form with Manual Override (RF-38) */}
            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    Numéro de plaque
                  </label>
                  <span className="text-[10px] text-slate-400">Ex: 452-EZ-02</span>
                </div>
                <input
                  type="text"
                  required
                  value={plaqueInput}
                  onChange={(e) => {
                    setPlaqueInput(e.target.value.toUpperCase());
                  }}
                  placeholder="EX: 452-EZ-02"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-sm font-bold text-white tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-300">Type de véhicule *</label>
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
                  Marque & Modèle du Véhicule
                </label>
                <input
                  type="text"
                  value={modeleInput}
                  onChange={(e) => setModeleInput(e.target.value)}
                  placeholder="Ex: Toyota Land Cruiser Prado"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Zone de Stationnement
                  </label>
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value as ZoneParking)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="A">Zone A (Standard)</option>
                    <option value="B">Zone B (Standard)</option>
                    <option value="VIP">Zone VIP (Couvert & Sécurisé)</option>
                    <option value="OUVERTE">Zone libre</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Profil Client
                  </label>
                  <select
                    value={typeClient}
                    onChange={(e) => setTypeClient(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="HORAIRE">Client horaire ({formatCurrency(tarifsServices.parkingPremiereHeure)} première heure + {formatCurrency(tarifsServices.parkingQuartHeureSupplementaire)}/15 min)</option>
                    <option value="ABONNE_VIP">Abonné Mensuel VIP (0 F)</option>
                    <option value="CLIENT_GARAGE">Client Garage (Gratuit)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setScanModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition hover:scale-105 cursor-pointer"
                >
                  Émettre Ticket & Ouvrir Barrière
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHECKOUT & ENCAISSEMENT SORTIE PARKING */}
      {checkoutTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Sortie & Encaissement Parking
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ticket {checkoutTicket.code_ticket} - Place {checkoutTicket.place_numero}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutTicket(null)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Véhicule :</span>
                <span className="font-mono font-bold text-white">{checkoutTicket.plaque} ({checkoutTicket.marque_modele})</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Heure d'entrée :</span>
                <span className="font-mono text-slate-300">{checkoutTicket.heure_entree}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Type de tarif :</span>
                <span className="font-semibold text-blue-400">{checkoutTicket.type_client}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-300">Montant total dû :</span>
                <span className="text-lg font-black text-emerald-400">
                  {checkoutTicket.type_client === 'HORAIRE' ? formatCurrency(checkoutAmount) : '0 FCFA (Abonné)'}
                </span>
              </div>
            </div>

            {checkoutTicket.type_client === 'HORAIRE' && (
              <div className="mb-4">
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Mode de Paiement (RF-41)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('MTN_MOMO')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      selectedPaymentMethod === 'MTN_MOMO'
                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>MTN MoMo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('AIRTEL_MONEY')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      selectedPaymentMethod === 'AIRTEL_MONEY'
                        ? 'bg-red-500/20 border-red-500 text-red-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>Airtel Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('ESPECES')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                      selectedPaymentMethod === 'ESPECES'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    <span>Espèces</span>
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setCheckoutTicket(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleCheckoutConfirm}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition hover:scale-105 cursor-pointer"
              >
                Valider Sortie & Imprimer Reçu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
