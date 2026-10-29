/**
 * AutoGestion Pro v3.0 - Global Application Context
 * Implements Edge Offline-first resilience, RBAC permissions, and real-time state updates
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  UserRole,
  Succursale,
  Employe,
  PrimeAmende,
  Client,
  Vehicule,
  Facture,
  Encaissement,
  Depense,
  PlaceParking,
  TicketParking,
  LavageItem,
  OrdreReparation,
  PieceStock,
  TransfertStock,
  DemandeReservation,
  DemandeConsommableLavage,
  SessionCaisse,
  LogAudit,
  AlerteFraude,
  ActiveModule,
  PaymentMethod,
  EtapeKanban,
  EtapeLavageDomicile,
  ProfilGerant,
  GerantProfileData,
  TarifsServices,
  CapacitesParking,
  ZoneParking,
  MouvementStock
} from '../types';

let lastGeneratedOperationId = 0;

const nextOperationId = () => {
  lastGeneratedOperationId = Math.max(Date.now(), lastGeneratedOperationId + 1);
  return lastGeneratedOperationId;
};
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { normaliserTarifsServices, TARIFS_SERVICES_PAR_DEFAUT } from '../utils/tarifs';
import { calculerMontantParking, tarifParkingTicket } from '../utils/parkingPricing';

export type AuthStatus = 'loading' | 'unconfigured' | 'signed_out' | 'needs_branch' | 'ready' | 'error';

interface BranchMembership {
  branch: Succursale;
  role: UserRole;
}

interface NewBranch {
  name: string;
  city: string;
  country: string;
  address: string;
  phone: string;
}

interface AppContextType {
  authStatus: AuthStatus;
  authError: string | null;
  userEmail: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createBranch: (branch: NewBranch) => Promise<void>;
  databaseStatus: 'connecting' | 'connected' | 'error';
  // Navigation & Environment
  activeModule: ActiveModule;
  setActiveModule: (module: ActiveModule) => void;
  userRole: UserRole;
  authUserId: string | null;
  gerantProfile: GerantProfileData | null;
  saveGerantProfile: (profile: GerantProfileData) => void;
  tarifsServices: TarifsServices;
  updateTarifsServices: (tarifs: TarifsServices) => void;
  currentSuccursale: Succursale;
  setCurrentSuccursale: (succursale: Succursale) => void;
  succursales: Succursale[];
  formatCurrency: (amount: number) => string;
  addAuditLog: (action: string, entite: string, details: string, type?: 'INFO' | 'AVERTISSEMENT' | 'CRITIQUE') => void;

  // Data Collections
  employes: Employe[];
  primesAmendes: PrimeAmende[];
  clients: Client[];
  vehicules: Vehicule[];
  factures: Facture[];
  encaissements: Encaissement[];
  depenses: Depense[];
  placesParking: PlaceParking[];
  ticketsParking: TicketParking[];
  lavages: LavageItem[];
  demandesConsommablesLavage: DemandeConsommableLavage[];
  garageOrs: OrdreReparation[];
  piecesStock: PieceStock[];
  mouvementsStock: MouvementStock[];
  transfertsStock: TransfertStock[];
  demandesReservations: DemandeReservation[];
  sessionCaisse: SessionCaisse;
  logsAudit: LogAudit[];
  alertesFraude: AlerteFraude[];

  // Parking Actions
  initialiserPlacesParking: (capacites: CapacitesParking) => boolean;
  modifierPlacesParking: (capacites: CapacitesParking) => boolean;
  creerTicketParking: (plaque: string, zone: ZoneParking, typeClient: 'HORAIRE' | 'ABONNE_VIP' | 'CLIENT_GARAGE', scanSource: 'CAMERA_OCR' | 'MANUEL', marqueModele?: string, typeVehicule?: 'VOITURE' | 'MOTO') => TicketParking | null;
  cloturerTicketParking: (ticketId: number, modePaiement: PaymentMethod) => void;
  arreterTicketParking: (ticketId: number, motif: string, modePaiement?: PaymentMethod) => boolean;

  // Lavage Actions
  ajouterLavage: (
    plaque: string,
    clientNom: string,
    telephone: string,
    formule: 'SIMPLE' | 'COMPLET' | 'VIP_DETAILING',
    laveurId?: number,
    desc?: string,
    domicile?: { adresse: string; date: string; heure: string; instructions: string },
    laveurIds?: number[],
    typeVehicule?: 'VOITURE' | 'MOTO'
  ) => void;
  affecterLaveursLavage: (lavageId: number, laveurIds: number[]) => void;
  annulerLavage: (lavageId: number, motif: string) => boolean;
  mettreAJourLavageDomicile: (
    lavageId: number,
    update: { laveur_id?: number; etape_domicile?: EtapeLavageDomicile; kit_prepare?: string[] }
  ) => void;
  changerStatutLavage: (lavageId: number, nouveauStatut: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE' | 'LIVRE_PAYE') => void;
  terminerLavage: (lavageId: number, consommations: { piece_id: number; quantite: number }[], prestations: string[]) => boolean;
  signalerProduitLavage: (laveurId: number, pieceId: number) => void;
  traiterDemandeConsommableLavage: (demandeId: number, decision: 'REMIS' | 'REFUSEE') => void;

  // Garage Actions
  ajouterOrdreReparation: (orData: Omit<OrdreReparation, 'id' | 'numero_or'>) => OrdreReparation;
  changerEtapeGarage: (orId: number, nouvelleEtape: EtapeKanban) => void;
  validerDevisGarage: (orId: number) => void;

  // Caisse & Facturation Actions
  encaisserFacture: (factureId: number, montantVerse: number, modePaiement: PaymentMethod, refPaiement: string) => void;
  creerFactureDirecte: (facture: Omit<Facture, 'id' | 'numero' | 'created_at'>) => Facture;
  annulerFacture: (factureId: number, motif: string) => boolean;
  effectuerClotureAveugle: (comptageEspeces: number, comptageMoMo: number, comptageAirtel: number, motifEcart?: string) => { ecart: number; session: SessionCaisse } | null;

  // Dépenses Actions
  ajouterDepense: (motif: string, montant: number, categorie: Depense['categorie'], justificatif?: string) => void;
  validerDepenseGerant: (depenseId: number) => void;
  validerDepenseProprietaire: (depenseId: number) => void;

  // RH Actions
  pointerEmploye: (employeId: number, type?: 'IN' | 'OUT') => void;
  ajouterEmploye: (employe: Omit<Employe, 'id' | 'succursale_id' | 'statut' | 'present_aujourdhui'>) => void;
  ajouterPrimeAmende: (employeId: number, type: 'PRIME' | 'AMENDE', montant: number, motif: string, preuve?: string) => void;
  changerStatutEmploye: (employeId: number, statut: 'ACTIF' | 'SUSPENDU') => void;
  radierEmploye: (employeId: number, motif: string) => boolean;

  // Stocks Actions
  ajouterStockPiece: (piece: Omit<PieceStock, 'id'>) => void;
  commanderStock: (pieceId: number, quantite: number, motif?: string) => void;
  ajusterStockPiece: (pieceId: number, nouvelleQuantite: number, motif: string) => boolean;
  creerTransfertStock: (pieceId: number, succursaleDestId: number, quantite: number) => void;

  // Demandes Mobiles Actions
  traiterDemandeReservation: (demandeId: number, action: 'ACCEPTEE' | 'REPORTEE' | 'REFUSEE', reponse?: string) => void;

  // Relances & Clients
  enregistrerVersementDette: (factureId: number, montant: number, mode: PaymentMethod) => void;
  ajouterClient: (nom: string, telephone: string, plafondCredit: number, email?: string) => Client;
  ajouterVehicule: (vehicule: Omit<Vehicule, 'id'>) => Vehicule | null;

  // Modale active pour l'impression de reçu
  receiptModalData: { visible: boolean; type: 'PARKING' | 'LAVAGE' | 'GARAGE' | 'CLOTURE' | 'PAIE'; data: any } | null;
  setReceiptModalData: (data: { visible: boolean; type: 'PARKING' | 'LAVAGE' | 'GARAGE' | 'CLOTURE' | 'PAIE'; data: any } | null) => void;
  notification: { message: string; type: 'success' | 'warning' | 'info' } | null;
  showNotification: (message: string, type?: 'success' | 'warning' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('HUB');
  const [authStatus, setAuthStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'unconfigured');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [databaseStatus, setDatabaseStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [userRole, setUserRole] = useState<UserRole>('GERANT');
  const [tarifsServices, setTarifsServices] = useState<TarifsServices>({ ...TARIFS_SERVICES_PAR_DEFAUT });
  const [profilsGerants, setProfilsGerants] = useState<ProfilGerant[]>([]);
  const [succursales, setSuccursales] = useState<Succursale[]>([]);
  const [currentSuccursale, setCurrentSuccursaleState] = useState<Succursale>({
    id: 0,
    nom: '',
    ville: '',
    pays: '',
    adresse: '',
    telephone: '',
    devise: 'FCFA'
  });
  const [memberships, setMemberships] = useState<BranchMembership[]>([]);
  const [loadedBranchId, setLoadedBranchId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);
  const [receiptModalData, setReceiptModalData] = useState<{ visible: boolean; type: 'PARKING' | 'LAVAGE' | 'GARAGE' | 'CLOTURE' | 'PAIE'; data: any } | null>(null);

  const [employes, setEmployes] = useState<Employe[]>([]);
  const [primesAmendes, setPrimesAmendes] = useState<PrimeAmende[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicules, setVehicules] = useState<Vehicule[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [encaissements, setEncaissements] = useState<Encaissement[]>([]);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [placesParking, setPlacesParking] = useState<PlaceParking[]>([]);
  const [ticketsParking, setTicketsParking] = useState<TicketParking[]>([]);
  const [lavages, setLavages] = useState<LavageItem[]>([]);
  const [demandesConsommablesLavage, setDemandesConsommablesLavage] = useState<DemandeConsommableLavage[]>([]);
  const [garageOrs, setGarageOrs] = useState<OrdreReparation[]>([]);
  const [piecesStock, setPiecesStock] = useState<PieceStock[]>([]);
  const [mouvementsStock, setMouvementsStock] = useState<MouvementStock[]>([]);
  const [transfertsStock, setTransfertsStock] = useState<TransfertStock[]>([]);
  const [demandesReservations, setDemandesReservations] = useState<DemandeReservation[]>([]);
  const [sessionCaisse, setSessionCaisse] = useState<SessionCaisse>(() => ({
    date: new Date().toISOString().slice(0, 10),
    succursale_id: 0,
    statut: 'OUVERTE',
    recettes_especes_theorique: 0,
    recettes_momo_theorique: 0,
    recettes_airtel_theorique: 0,
    depenses_validees: 0,
    solde_net_theorique: 0
  }));
  const [logsAudit, setLogsAudit] = useState<LogAudit[]>([]);
  const [alertesFraude, setAlertesFraude] = useState<AlerteFraude[]>([]);
  const authUserIdRef = useRef<string | null>(null);
  const persistedSnapshot = useRef<{ branchId: number; values: Record<string, unknown> } | null>(null);

  const showNotification = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const setCurrentSuccursale = (branch: Succursale) => {
    setCurrentSuccursaleState(branch);
    const membership = memberships.find(item => item.branch.id === branch.id);
    if (membership) setUserRole(membership.role);
    setLoadedBranchId(null);
    setAuthStatus('loading');
    setDatabaseStatus('connecting');
  };

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setAuthStatus('unconfigured');
      return;
    }

    let active = true;
    const initializeSession = async () => {
      const { data, error } = await client.auth.getSession();
      if (!active) return;
      if (error) {
        setAuthError(error.message);
        setAuthStatus('error');
        setDatabaseStatus('error');
        return;
      }
      const sessionUserId = data.session?.user.id ?? null;
      authUserIdRef.current = sessionUserId;
      setAuthUserId(sessionUserId);
      setUserEmail(data.session?.user.email ?? null);
      if (!data.session) setAuthStatus('signed_out');
    };

    void initializeSession();
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      const sessionUserId = session?.user.id ?? null;
      const userChanged = authUserIdRef.current !== sessionUserId;
      authUserIdRef.current = sessionUserId;
      setAuthUserId(sessionUserId);
      setUserEmail(session?.user.email ?? null);
      if (!session) {
        setAuthStatus('signed_out');
        setSuccursales([]);
        setMemberships([]);
        setLoadedBranchId(null);
      } else if (userChanged) {
        setLoadedBranchId(null);
        setAuthStatus('loading');
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client || !authUserId) return;
    let active = true;

    const loadBranches = async () => {
      setAuthError(null);
      const { data: memberRows, error: memberError } = await client
        .from('branch_members')
        .select('branch_id, role')
        .eq('user_id', authUserId);
      if (!active) return;
      if (memberError) {
        setAuthError(memberError.message);
        setAuthStatus('error');
        setDatabaseStatus('error');
        return;
      }
      if (!memberRows?.length) {
        setSuccursales([]);
        setMemberships([]);
        setAuthStatus('needs_branch');
        return;
      }

      const branchIds = memberRows.map(row => Number(row.branch_id));
      const { data: branchRows, error: branchError } = await client
        .from('branches')
        .select('id, name, city, country, address, phone, currency')
        .in('id', branchIds);
      if (!active) return;
      if (branchError) {
        setAuthError(branchError.message);
        setAuthStatus('error');
        setDatabaseStatus('error');
        return;
      }

      const branchById = new Map((branchRows || []).map(row => [Number(row.id), row]));
      const nextMemberships = memberRows.flatMap(row => {
        const branch = branchById.get(Number(row.branch_id));
        if (!branch) return [];
        return [{
          branch: {
            id: Number(branch.id),
            nom: branch.name,
            ville: branch.city,
            pays: branch.country,
            adresse: branch.address || '',
            telephone: branch.phone || '',
            devise: branch.currency || 'XAF'
          },
          role: row.role as UserRole
        }];
      });

      if (!nextMemberships.length) {
        setAuthError('Aucun établissement accessible pour ce compte.');
        setAuthStatus('error');
        setDatabaseStatus('error');
        return;
      }
      setMemberships(nextMemberships);
      setSuccursales(nextMemberships.map(item => item.branch));
      const selected = nextMemberships.find(item => item.branch.id === currentSuccursale.id) || nextMemberships[0];
      setCurrentSuccursaleState(selected.branch);
      setUserRole(selected.role);
    };

    void loadBranches();
    return () => { active = false; };
  }, [authUserId]);

  useEffect(() => {
    const branchId = currentSuccursale.id;
    const client = supabase;
    if (!client || !authUserId || branchId <= 0) return;
    let active = true;
    setLoadedBranchId(null);
    setDatabaseStatus('connecting');
    persistedSnapshot.current = null;

    const loadBranchData = async () => {
      const { data, error } = await client
        .from('branch_data')
        .select('collection, payload')
        .eq('branch_id', branchId);
      if (!active) return;
      if (error) {
        setAuthError(error.message);
        setAuthStatus('error');
        setDatabaseStatus('error');
        return;
      }

      const values = new Map((data || []).map(row => [row.collection, row.payload]));
      const asArray = <T,>(key: string): T[] => {
        const value = values.get(key);
        return Array.isArray(value) ? value as T[] : [];
      };
      setEmployes(asArray<Employe>('employes'));
      setPrimesAmendes(asArray<PrimeAmende>('primes_amendes'));
      setClients(asArray<Client>('clients'));
      setVehicules(asArray<Vehicule>('vehicules'));
      setFactures(asArray<Facture>('factures'));
      setEncaissements(asArray<Encaissement>('encaissements'));
      setDepenses(asArray<Depense>('depenses'));
      setPlacesParking(asArray<PlaceParking>('places_parking'));
      setTicketsParking(asArray<TicketParking>('tickets_parking'));
      setLavages(asArray<LavageItem>('lavages'));
      setDemandesConsommablesLavage(asArray<DemandeConsommableLavage>('demandes_consommables_lavage'));
      setGarageOrs(asArray<OrdreReparation>('garage_ors'));
      setPiecesStock(asArray<PieceStock>('pieces_stock'));
      setMouvementsStock(asArray<MouvementStock>('mouvements_stock'));
      setTransfertsStock(asArray<TransfertStock>('transferts_stock'));
      setDemandesReservations(asArray<DemandeReservation>('demandes_reservations'));
      setLogsAudit(asArray<LogAudit>('logs_audit'));
      setAlertesFraude(asArray<AlerteFraude>('alertes_fraude'));
      setTarifsServices(normaliserTarifsServices(values.get('tarifs_services')));
      setProfilsGerants(asArray<ProfilGerant>('profils_gerants'));
      const currentDate = new Date().toISOString().slice(0, 10);
      const savedSession = values.get('session_caisse') as SessionCaisse | undefined;
      setSessionCaisse(savedSession?.date === currentDate ? savedSession : {
        date: currentDate,
        succursale_id: branchId,
        statut: 'OUVERTE',
        recettes_especes_theorique: 0,
        recettes_momo_theorique: 0,
        recettes_airtel_theorique: 0,
        depenses_validees: 0,
        solde_net_theorique: 0
      });
      setLoadedBranchId(branchId);
      setDatabaseStatus('connected');
      setAuthStatus('ready');
    };

    void loadBranchData();
    return () => { active = false; };
  }, [authUserId, currentSuccursale.id]);

  const collectionValues: Record<string, unknown> = {
    employes,
    primes_amendes: primesAmendes,
    clients,
    vehicules,
    factures,
    encaissements,
    depenses,
    places_parking: placesParking,
    tickets_parking: ticketsParking,
    lavages,
    demandes_consommables_lavage: demandesConsommablesLavage,
    garage_ors: garageOrs,
    pieces_stock: piecesStock,
    mouvements_stock: mouvementsStock,
    transferts_stock: transfertsStock,
    demandes_reservations: demandesReservations,
    session_caisse: sessionCaisse,
    logs_audit: logsAudit,
    alertes_fraude: alertesFraude,
    tarifs_services: tarifsServices,
    profils_gerants: profilsGerants
  };

  useEffect(() => {
    const branchId = currentSuccursale.id;
    const client = supabase;
    if (!client || !authUserId || loadedBranchId !== branchId || branchId <= 0) return;
    const previous = persistedSnapshot.current;
    const changedKeys = Object.keys(collectionValues).filter(
      key => !previous || previous.branchId !== branchId || previous.values[key] !== collectionValues[key]
    );
    persistedSnapshot.current = { branchId, values: { ...collectionValues } };
    if (!changedKeys.length) return;

    void Promise.all(changedKeys.map(async collection => {
      const { error } = await client
        .from('branch_data')
        .upsert(
          { branch_id: branchId, collection, payload: collectionValues[collection], updated_at: new Date().toISOString() },
          { onConflict: 'branch_id,collection' }
        );
      if (error) throw new Error(`${collection}: ${error.message}`);
    })).catch(error => {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      setDatabaseStatus('error');
      setAuthError(`Échec de l’enregistrement dans Supabase (${message}).`);
      setAuthStatus('error');
    });
  }, [
    authUserId,
    currentSuccursale.id,
    loadedBranchId,
    employes,
    primesAmendes,
    clients,
    vehicules,
    factures,
    encaissements,
    depenses,
    placesParking,
    ticketsParking,
    lavages,
    demandesConsommablesLavage,
    garageOrs,
    piecesStock,
    mouvementsStock,
    transfertsStock,
    demandesReservations,
    sessionCaisse,
    logsAudit,
    alertesFraude,
    tarifsServices,
    profilsGerants
  ]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase n’est pas configuré.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase n’est pas configuré.');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error('Compte créé. Confirmez votre adresse e-mail, puis connectez-vous.');
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    setCurrentSuccursaleState({ id: 0, nom: '', ville: '', pays: '', adresse: '', telephone: '', devise: 'FCFA' });
  };

  const gerantProfileLink = profilsGerants.find(profile =>
    profile.user_id === authUserId && profile.branch_id === currentSuccursale.id
  ) ?? null;
  const profileEmployee = gerantProfileLink
    ? employes.find(employee => employee.id === gerantProfileLink.employe_id)
    : undefined;
  const gerantProfile: GerantProfileData | null = profileEmployee
    ? {
      nom_complet: profileEmployee.nom_complet,
      telephone: profileEmployee.telephone,
      salaire_base: profileEmployee.salaire_base,
      date_embauche: profileEmployee.date_embauche,
      photo_url: profileEmployee.photo_url,
      email: profileEmployee.email,
      adresse: profileEmployee.adresse,
      date_naissance: profileEmployee.date_naissance,
      numero_piece_identite: profileEmployee.numero_piece_identite,
      contact_urgence_nom: profileEmployee.contact_urgence_nom,
      contact_urgence_telephone: profileEmployee.contact_urgence_telephone,
      type_contrat: profileEmployee.type_contrat,
      qualification: profileEmployee.qualification,
      notes_rh: profileEmployee.notes_rh
    }
    : null;

  const updateTarifsServices = (tarifs: TarifsServices) => {
    if (userRole !== 'GERANT' && userRole !== 'PROPRIETAIRE') {
      showNotification('Seuls le gérant et le propriétaire peuvent modifier les tarifs.', 'warning');
      return;
    }
    if (Object.values(tarifs).some(amount => !Number.isFinite(amount) || amount < 0)) {
      showNotification('Chaque tarif doit être un montant positif ou nul.', 'warning');
      return;
    }
    setTarifsServices(tarifs);
    addAuditLog('MODIFICATION_TARIFS', 'Tarifs des services', 'Les tarifs de lavage, parking et main-d’œuvre ont été mis à jour.');
    showNotification('Les nouveaux tarifs sont enregistrés pour cette succursale.');
  };

  const saveGerantProfile = (profile: GerantProfileData) => {
    if (userRole !== 'GERANT' && userRole !== 'PROPRIETAIRE') {
      showNotification('Seuls le gérant et le propriétaire peuvent modifier ce profil.', 'warning');
      return;
    }
    if (!authUserId || currentSuccursale.id <= 0) {
      showNotification('Connectez-vous à un établissement avant de modifier le profil.', 'warning');
      return;
    }
    if (!profile.nom_complet.trim() || !profile.telephone.trim() || !profile.date_embauche) {
      showNotification('Le nom, le téléphone et la date d’embauche sont obligatoires.', 'warning');
      return;
    }
    if (!Number.isFinite(profile.salaire_base) || profile.salaire_base < 0) {
      showNotification('Le salaire de base doit être un montant positif ou nul.', 'warning');
      return;
    }

    const savedProfile = profilsGerants.find(item =>
      item.user_id === authUserId && item.branch_id === currentSuccursale.id
    );
    const linkedEmployee = (savedProfile
      ? employes.find(employee => employee.id === savedProfile.employe_id)
      : undefined) ?? (profile.email
      ? employes.find(employee => employee.email?.trim().toLowerCase() === profile.email?.trim().toLowerCase())
      : undefined);
    const employeId = linkedEmployee?.id ?? Date.now();
    const employee: Employe = {
      ...linkedEmployee,
      ...profile,
      id: employeId,
      succursale_id: currentSuccursale.id,
      poste: 'Gérant',
      statut: linkedEmployee?.statut ?? 'ACTIF',
      present_aujourdhui: linkedEmployee?.present_aujourdhui ?? false
    };
    const updatedProfile: ProfilGerant = {
      user_id: authUserId,
      branch_id: currentSuccursale.id,
      employe_id: employeId
    };

    setEmployes(previous => linkedEmployee
      ? previous.map(item => item.id === employeId ? employee : item)
      : [employee, ...previous]
    );
    setProfilsGerants(previous => [
      ...previous.filter(item => item.user_id !== authUserId || item.branch_id !== currentSuccursale.id),
      updatedProfile
    ]);
    addAuditLog('MISE_A_JOUR_PROFIL_GERANT', profile.nom_complet, 'Profil du gérant synchronisé avec sa fiche employé.');
    showNotification('Profil du gérant et fiche employé mis à jour.');
  };

  const createBranch = async (branch: NewBranch) => {
    if (!supabase) throw new Error('Supabase n’est pas configuré.');
    const { data, error } = await supabase.rpc('create_branch_with_owner', {
      branch_name: branch.name,
      branch_city: branch.city,
      branch_country: branch.country,
      branch_address: branch.address,
      branch_phone: branch.phone
    });
    if (error) throw new Error(error.message);
    const branchId = Number(data);
    const { data: row, error: branchError } = await supabase
      .from('branches')
      .select('id, name, city, country, address, phone, currency')
      .eq('id', branchId)
      .single();
    if (branchError) throw new Error(branchError.message);
    const createdBranch: Succursale = {
      id: Number(row.id),
      nom: row.name,
      ville: row.city,
      pays: row.country,
      adresse: row.address || '',
      telephone: row.phone || '',
      devise: row.currency || 'XAF'
    };
    const ownerMembership = { branch: createdBranch, role: 'PROPRIETAIRE' as UserRole };
    setMemberships([ownerMembership]);
    setSuccursales([createdBranch]);
    setCurrentSuccursaleState(createdBranch);
    setUserRole('PROPRIETAIRE');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0
    }).format(amount).replace('XAF', 'FCFA');
  };

  const addAuditLog = (action: string, entite: string, details: string, type: 'INFO' | 'AVERTISSEMENT' | 'CRITIQUE' = 'INFO') => {
    const newLog: LogAudit = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 19),
      utilisateur: userRole === 'PROPRIETAIRE' ? 'Propriétaire Direction' : userRole === 'GERANT' ? 'Gérant Principal' : `${userRole} en poste`,
      role: userRole,
      action,
      entite,
      details,
      type
    };
    setLogsAudit(prev => [newLog, ...prev]);
  };

  const addEncaissement = (
    factureId: number,
    montant: number,
    modePaiement: PaymentMethod,
    referencePaiement: string,
    motif?: string
  ) => {
    const newPayment: Encaissement = {
      id: nextOperationId(),
      facture_id: factureId,
      succursale_id: currentSuccursale.id,
      montant,
      mode_paiement: modePaiement,
      reference_paiement: referencePaiement,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      motif
    };
    setEncaissements(prev => [newPayment, ...prev]);
  };

  const enregistrerMouvementStock = (
    piece: PieceStock,
    type: MouvementStock['type'],
    quantite: number,
    quantiteApres: number,
    motif: string,
    referenceOperation?: string
  ) => {
    setMouvementsStock(prev => [{
      id: nextOperationId(),
      piece_id: piece.id,
      piece_nom: piece.nom,
      reference_piece: piece.reference,
      type,
      quantite,
      quantite_avant: piece.quantite_disponible,
      quantite_apres: quantiteApres,
      motif,
      responsable: userRole === 'PROPRIETAIRE' ? 'Propriétaire' : 'Gérant',
      reference_operation: referenceOperation,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
    }, ...prev]);
  };

  const annulerFacture = (factureId: number, motif: string): boolean => {
    const facture = factures.find(item => item.id === factureId);
    if (!facture || facture.statut === 'ANNULEE') {
      showNotification('Cette facture est introuvable ou déjà annulée.', 'warning');
      return false;
    }
    if (!motif.trim()) {
      showNotification('Le motif d’annulation est obligatoire.', 'warning');
      return false;
    }
    if (userRole !== 'GERANT' && userRole !== 'PROPRIETAIRE') {
      showNotification('Seul le gérant ou le propriétaire peut annuler une transaction.', 'warning');
      return false;
    }

    const paiements = encaissements.filter(payment => payment.facture_id === factureId && payment.montant > 0);
    const totalEncaisse = paiements.length
      ? paiements.reduce((sum, payment) => sum + payment.montant, 0)
      : facture.montant_paye;
    const dateAnnulation = new Date().toISOString().replace('T', ' ').slice(0, 19);
    if (totalEncaisse > 0) {
      if (paiements.length > 0) {
        paiements.forEach(payment => addEncaissement(
          factureId,
          -payment.montant,
          payment.mode_paiement,
          `ANNULATION-${facture.numero}-${payment.id}`,
          motif.trim()
        ));
      } else if (facture.mode_paiement) {
        addEncaissement(
          factureId,
          -Math.min(totalEncaisse, facture.montant_paye),
          facture.mode_paiement,
          `ANNULATION-${facture.numero}`,
          motif.trim()
        );
      }
    }

    setFactures(prev => prev.map(item => item.id === factureId ? {
      ...item,
      statut: 'ANNULEE',
      annulation_motif: motif.trim(),
      annulee_le: dateAnnulation
    } : item));

    const lavage = lavages.find(item => item.facture_id === factureId || item.id === facture.source_lavage_id);
    if (lavage && lavage.statut !== 'ANNULE') {
      setLavages(prev => prev.map(item => item.id === lavage.id ? {
        ...item,
        statut: 'ANNULE',
        motif_annulation: motif.trim(),
        annule_le: dateAnnulation
      } : item));
      setPrimesAmendes(prev => prev.map(item => item.lavage_id === lavage.id ? { ...item, annulee: true } : item));
      const laveurIds = lavage.laveur_ids?.length ? lavage.laveur_ids : lavage.laveur_id ? [lavage.laveur_id] : [];
      setEmployes(prev => prev.map(employee => laveurIds.includes(employee.id)
        ? { ...employee, total_vehicules_mois: Math.max(0, (employee.total_vehicules_mois || 0) - 1) }
        : employee));
    }

    const ticket = ticketsParking.find(item => item.id === facture.source_ticket_parking_id);
    if (ticket?.statut === 'ACTIF') {
      setTicketsParking(prev => prev.map(item => item.id === ticket.id ? {
        ...item,
        statut: 'ABANDONNE',
        heure_sortie: dateAnnulation.slice(0, 16),
        montant_final: 0,
        motif_arret: motif.trim(),
        arrete_sans_encaissement: true
      } : item));
      setPlacesParking(prev => prev.map(place => place.numero === ticket.place_numero
        ? { ...place, statut: 'LIBRE', ticket_en_cours: undefined }
        : place));
    }

    addAuditLog('ANNULATION_FACTURE', facture.numero,
      `Transaction annulée : ${motif.trim()}. Remboursement caisse : ${formatCurrency(totalEncaisse)}. Ticket conservé.`, 'AVERTISSEMENT');
    showNotification(`Transaction ${facture.numero} annulée. Remboursement enregistré : ${formatCurrency(totalEncaisse)}.`);
    return true;
  };

  // Recalculate daily theoretical cash session whenever factures or depenses change
  useEffect(() => {
    let especes = 0;
    let momo = 0;
    let airtel = 0;
    const dateSession = sessionCaisse.date;

    encaissements.forEach(payment => {
      if (payment.created_at.slice(0, 10) === dateSession) {
        if (payment.mode_paiement === 'ESPECES') especes += payment.montant;
        else if (payment.mode_paiement === 'MTN_MOMO') momo += payment.montant;
        else if (payment.mode_paiement === 'AIRTEL_MONEY') airtel += payment.montant;
      }
    });

    const totalDepenses = depenses
      .filter(d => d.created_at.slice(0, 10) === dateSession && d.valide_par_gerant && (!d.accord_proprietaire_requis || d.valide_par_proprietaire))
      .reduce((sum, d) => sum + d.montant, 0);

    setSessionCaisse(prev => ({
      ...prev,
      recettes_especes_theorique: especes,
      recettes_momo_theorique: momo,
      recettes_airtel_theorique: airtel,
      depenses_validees: totalDepenses,
      solde_net_theorique: (especes + momo + airtel) - totalDepenses
    }));
  }, [encaissements, depenses, sessionCaisse.date]);

  // Parking Methods
  const initialiserPlacesParking = (capacites: CapacitesParking): boolean => {
    if (placesParking.length > 0) {
      showNotification('Les places du parking sont déjà configurées.', 'warning');
      return false;
    }

    const zones: ZoneParking[] = ['A', 'B', 'VIP', 'OUVERTE'];
    if (zones.some(zone => !Number.isInteger(capacites[zone]) || capacites[zone] < 0 || capacites[zone] > 200)) {
      showNotification('Chaque zone doit avoir entre 0 et 200 places.', 'warning');
      return false;
    }
    if (zones.every(zone => capacites[zone] === 0)) {
      showNotification('Ajoutez au moins une place pour configurer le parking.', 'warning');
      return false;
    }

    const nouvellesPlaces = zones.flatMap(zone =>
      Array.from({ length: capacites[zone] }, (_, index): PlaceParking => ({
        numero: `${zone}-${String(index + 1).padStart(2, '0')}`,
        zone,
        statut: 'LIBRE'
      }))
    );
    setPlacesParking(nouvellesPlaces);
    addAuditLog('CONFIGURATION_PARKING', 'Places parking', `${nouvellesPlaces.length} places créées`);
    showNotification(`${nouvellesPlaces.length} places de parking configurées.`);
    return true;
  };

  const modifierPlacesParking = (capacites: CapacitesParking): boolean => {
    if (userRole !== 'GERANT' && userRole !== 'PROPRIETAIRE') {
      showNotification('Seul le gérant ou le propriétaire peut modifier les places du parking.', 'warning');
      return false;
    }

    const zones: ZoneParking[] = ['A', 'B', 'VIP', 'OUVERTE'];
    if (zones.some(zone => !Number.isInteger(capacites[zone]) || capacites[zone] < 0 || capacites[zone] > 200)) {
      showNotification('Chaque zone doit avoir entre 0 et 200 places.', 'warning');
      return false;
    }
    if (zones.every(zone => capacites[zone] === 0)) {
      showNotification('Le parking doit conserver au moins une place.', 'warning');
      return false;
    }

    const placesRetirees = new Set<string>();
    for (const zone of zones) {
      const zonePlaces = placesParking.filter(place => place.zone === zone);
      const nonLibres = zonePlaces.filter(place => place.statut !== 'LIBRE').length;
      if (capacites[zone] < nonLibres) {
        showNotification(
          `Impossible de réduire la zone ${zone} à ${capacites[zone]} place(s) : ${nonLibres} emplacement(s) sont occupés ou indisponibles.`,
          'warning'
        );
        return false;
      }

      const placesLibres = zonePlaces
        .filter(place => place.statut === 'LIBRE')
        .sort((a, b) => Number(b.numero.split('-').pop()) - Number(a.numero.split('-').pop()));
      const placesAEnlever = Math.max(0, zonePlaces.length - capacites[zone]);
      placesLibres.slice(0, placesAEnlever).forEach(place => placesRetirees.add(place.numero));
    }

    const nouvellesPlaces = placesParking.filter(place => !placesRetirees.has(place.numero));
    for (const zone of zones) {
      const count = placesParking.filter(place => place.zone === zone).length;
      const aAjouter = capacites[zone] - count + [...placesRetirees].filter(numero => numero.startsWith(`${zone}-`)).length;
      if (aAjouter <= 0) continue;

      const numerosExistants = placesParking
        .filter(place => place.zone === zone)
        .map(place => Number(place.numero.split('-').pop()))
        .filter(Number.isFinite);
      let prochainNumero = Math.max(0, ...numerosExistants) + 1;
      for (let index = 0; index < aAjouter; index += 1) {
        nouvellesPlaces.push({
          numero: `${zone}-${String(prochainNumero++).padStart(2, '0')}`,
          zone,
          statut: 'LIBRE'
        });
      }
    }

    setPlacesParking(nouvellesPlaces);
    addAuditLog(
      'MODIFICATION_PARKING',
      'Places parking',
      `Capacités mises à jour : ${zones.map(zone => `${zone} ${capacites[zone]}`).join(', ')}. Places libres retirées : ${placesRetirees.size}.`
    );
    showNotification('La configuration des places du parking a été mise à jour.');
    return true;
  };

  const creerTicketParking = (
    plaque: string,
    zone: ZoneParking,
    typeClient: 'HORAIRE' | 'ABONNE_VIP' | 'CLIENT_GARAGE',
    scanSource: 'CAMERA_OCR' | 'MANUEL',
    marqueModele: string = 'Véhicule standard',
    typeVehicule: 'VOITURE' | 'MOTO' = 'VOITURE'
  ): TicketParking | null => {
    // Find available place in zone
    const dispoPlace = placesParking.find(p => p.zone === zone && p.statut === 'LIBRE');
    if (ticketsParking.some(ticket => ticket.plaque === plaque.toUpperCase().trim() && ticket.statut === 'ACTIF')) {
      showNotification(`Un ticket actif existe déjà pour ${plaque.toUpperCase().trim()}.`, 'warning');
      return null;
    }
    if (!dispoPlace) {
      showNotification(`Aucune place libre disponible en zone ${zone}`, 'warning');
      return null;
    }

    const placeNum = dispoPlace.numero;

    const newTicket: TicketParking = {
      id: Date.now(),
      code_ticket: `TKT-${Date.now()}`,
      plaque: plaque.toUpperCase().trim(),
      marque_modele: marqueModele,
      type_vehicule: typeVehicule,
      client_id: vehicules.find(vehicle => vehicle.plaque.toUpperCase().trim() === plaque.toUpperCase().trim())?.client_id,
      place_numero: placeNum,
      heure_entree: new Date().toISOString().replace('T', ' ').slice(0, 16),
      type_client: typeClient,
      statut: 'ACTIF',
      scan_source: scanSource,
      montant_estime: typeClient === 'ABONNE_VIP' || typeClient === 'CLIENT_GARAGE' ? 0 : tarifsServices.parkingPremiereHeure,
      tarif_premiere_heure: tarifsServices.parkingPremiereHeure,
      tarif_quart_heure_supplementaire: tarifsServices.parkingQuartHeureSupplementaire
    };

    setTicketsParking(prev => [newTicket, ...prev]);

    // Update spot status
    setPlacesParking(prev => prev.map(p => p.numero === placeNum ? { ...p, statut: 'OCCUPE', ticket_en_cours: newTicket } : p));

    addAuditLog('ENTREE_PARKING', `Ticket ${newTicket.code_ticket}`, `Entrée du véhicule ${plaque} (Place ${placeNum}, source: ${scanSource})`);
    showNotification(`Ticket émis avec succès pour ${plaque} (Place ${placeNum})`);

    // Show printable ticket receipt modal
    setReceiptModalData({ visible: true, type: 'PARKING', data: newTicket });

    return newTicket;
  };

  const cloturerTicketParking = (ticketId: number, modePaiement: PaymentMethod) => {
    const ticket = ticketsParking.find(t => t.id === ticketId);
    if (!ticket || ticket.statut !== 'ACTIF') {
      showNotification('Ce ticket est introuvable ou déjà clôturé.', 'warning');
      return;
    }

    // Calculate duration in 15min increments
    const entree = new Date(ticket.heure_entree.replace(' ', 'T')).getTime();
    const sortie = Date.now();
    const diffMinutes = Math.max(15, Math.ceil((sortie - entree) / (1000 * 60)));
    let montant = 0;
    if (ticket.type_client === 'HORAIRE') {
      const tarif = tarifParkingTicket(ticket);
      montant = calculerMontantParking(
        diffMinutes,
        tarif.premiereHeure,
        tarif.quartHeureSupplementaire
      );
    }

    const heureSortie = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const updatedTicket: TicketParking = {
      ...ticket,
      statut: 'PAYE_SORTI',
      heure_sortie: heureSortie,
      montant_final: montant,
      mode_paiement: modePaiement
    };

    setTicketsParking(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
    setPlacesParking(prev => prev.map(p => p.numero === ticket.place_numero ? { ...p, statut: 'LIBRE', ticket_en_cours: undefined } : p));

    // Register invoice
    if (montant > 0) {
      const factureId = Date.now();
      const referencePaiement = `${modePaiement.slice(0, 4)}-${factureId.toString().slice(-4)}`;
      const newFacture: Facture = {
        id: factureId,
        numero: `FACT-PK-${factureId.toString().slice(-4)}`,
        client_id: ticket.client_id || 1,
        succursale_id: currentSuccursale.id,
        type_service: 'PARKING',
        description: `Stationnement véhicule ${ticket.plaque} (${diffMinutes} min, Place ${ticket.place_numero})`,
        montant_total: montant,
        montant_paye: montant,
        statut: 'PAYE',
        mode_paiement: modePaiement,
        reference_paiement: referencePaiement,
        created_at: heureSortie,
        source_ticket_parking_id: ticket.id
      };
      setFactures(prev => [newFacture, ...prev]);
      addEncaissement(factureId, montant, modePaiement, referencePaiement);
    }

    addAuditLog('SORTIE_PARKING', `Ticket ${ticket.code_ticket}`, `Sortie de ${ticket.plaque}. Montant perçu: ${formatCurrency(montant)} (${modePaiement})`);
    showNotification(`Sortie validée pour ${ticket.plaque}. Encaissé: ${formatCurrency(montant)}`);
    setReceiptModalData({ visible: true, type: 'PARKING', data: updatedTicket });
  };

  const arreterTicketParking = (ticketId: number, motif: string, modePaiement?: PaymentMethod): boolean => {
    const ticket = ticketsParking.find(item => item.id === ticketId && item.statut === 'ACTIF');
    if (!ticket || !motif.trim()) {
      showNotification(ticket ? 'Le motif d’arrêt est obligatoire.' : 'Ce ticket est introuvable ou déjà clôturé.', 'warning');
      return false;
    }
    if (userRole !== 'GERANT' && userRole !== 'PROPRIETAIRE') {
      showNotification('Seul le gérant ou le propriétaire peut arrêter un stationnement.', 'warning');
      return false;
    }

    if (modePaiement) {
      cloturerTicketParking(ticketId, modePaiement);
      setTicketsParking(prev => prev.map(item => item.id === ticketId ? { ...item, motif_arret: motif.trim() } : item));
      addAuditLog('ARRET_PARKING_AVEC_ENCAISSEMENT', ticket.code_ticket, `Arrêt du stationnement avec encaissement (${modePaiement}). Motif : ${motif.trim()}`);
      return true;
    }

    const entree = new Date(ticket.heure_entree.replace(' ', 'T')).getTime();
    const minutes = Math.max(15, Math.ceil((Date.now() - entree) / 60000));
    const tarif = tarifParkingTicket(ticket);
    const montant = ticket.type_client === 'HORAIRE'
      ? calculerMontantParking(minutes, tarif.premiereHeure, tarif.quartHeureSupplementaire)
      : 0;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const factureId = Date.now();
    const facture: Facture = {
      id: factureId,
      numero: `FACT-PK-ANN-${factureId.toString().slice(-5)}`,
      client_id: ticket.client_id || 1,
      succursale_id: currentSuccursale.id,
      type_service: 'PARKING',
      description: `Stationnement annulé ${ticket.plaque} (${ticket.place_numero})`,
      montant_total: montant,
      montant_paye: 0,
      statut: 'ANNULEE',
      annulation_motif: motif.trim(),
      annulee_le: now,
      created_at: now,
      source_ticket_parking_id: ticket.id
    };
    setFactures(prev => [facture, ...prev]);
    setTicketsParking(prev => prev.map(item => item.id === ticketId ? {
      ...item,
      statut: 'ABANDONNE',
      heure_sortie: now.slice(0, 16),
      montant_final: 0,
      motif_arret: motif.trim(),
      arrete_sans_encaissement: true
    } : item));
    setPlacesParking(prev => prev.map(place => place.numero === ticket.place_numero
      ? { ...place, statut: 'LIBRE', ticket_en_cours: undefined }
      : place));
    addAuditLog('ARRET_PARKING_SANS_ENCAISSEMENT', ticket.code_ticket,
      `Ticket annulé et place libérée sans encaissement (${formatCurrency(montant)} abandonnés). Motif : ${motif.trim()}`, 'AVERTISSEMENT');
    showNotification(`Stationnement arrêté sans encaissement. Place ${ticket.place_numero} libérée.`);
    return true;
  };

  // Lavage Methods
  const ajouterLavage = (
    plaque: string,
    clientNom: string,
    telephone: string,
    formule: 'SIMPLE' | 'COMPLET' | 'VIP_DETAILING',
    laveurId?: number,
    desc: string = 'Véhicule standard',
    domicile?: { adresse: string; date: string; heure: string; instructions: string },
    laveurIds?: number[],
    typeVehicule: 'VOITURE' | 'MOTO' = 'VOITURE'
  ) => {
    const tarifs = {
      SIMPLE: tarifsServices.lavageSimple,
      COMPLET: tarifsServices.lavageComplet,
      VIP_DETAILING: tarifsServices.lavageVipDetailing
    };
    const prix = tarifs[formule];
    const shampConso = formule === 'VIP_DETAILING' ? 250 : formule === 'COMPLET' ? 180 : 100;
    const cireConso = formule === 'VIP_DETAILING' ? 80 : formule === 'COMPLET' ? 30 : 0;

    const now = new Date();
    const heureReception = now.toTimeString().slice(0, 5);
    const finEstimee = new Date(now.getTime() + (formule === 'VIP_DETAILING' ? 90 : formule === 'COMPLET' ? 45 : 25) * 60000).toTimeString().slice(0, 5);
    const activeLaveurs = employes.filter(e => e.poste === 'Laveur' && e.statut === 'ACTIF');
    const workloads = activeLaveurs.map(laveur => ({
      id: laveur.id,
      count: lavages.filter(l => (l.laveur_ids || [l.laveur_id]).includes(laveur.id) && (l.statut === 'EN_ATTENTE' || l.statut === 'EN_COURS')).length
    }));
    const autoAssignedLaveurId = workloads.sort((a, b) => a.count - b.count)[0]?.id;
    const requestedIds = [...new Set([...(laveurIds || []), ...(laveurId ? [laveurId] : [])])]
      .filter(id => activeLaveurs.some(employee => employee.id === id));
    const assignedIds = requestedIds.length ? requestedIds : autoAssignedLaveurId ? [autoAssignedLaveurId] : [];
    const normalizedPhone = telephone.replace(/\D/g, '');
    let client = clients.find(item => item.telephone.replace(/\D/g, '') === normalizedPhone && normalizedPhone.length > 0);
    if (!client && normalizedPhone.length > 0) {
      client = {
        id: Date.now() + 1,
        nom: clientNom.trim(),
        telephone: telephone.trim(),
        plafond_credit: 0,
        bloque_credit: false
      };
      setClients(prev => [...prev, client!]);
      addAuditLog('CREATION_CLIENT_SERVICE', client.nom, `Fiche client créée depuis une prestation de lavage (${client.telephone}).`);
    }

    const newLavage: LavageItem = {
      id: Date.now(),
      code_lavage: `LAV-${Date.now().toString().slice(-5)}`,
      plaque: plaque.toUpperCase().trim(),
      vehicule_desc: desc,
      client_nom: clientNom,
      client_id: client?.id,
      client_telephone: telephone,
      type_vehicule: typeVehicule,
      formule,
      prix,
      laveur_id: assignedIds[0],
      laveur_ids: assignedIds,
      statut: 'EN_ATTENTE',
      heure_reception: heureReception,
      heure_fin_estimee: finEstimee,
      conso_shampoing_ml: shampConso,
      conso_cire_ml: cireConso,
      mode_prestation: domicile ? 'DOMICILE' : 'CENTRE',
      adresse_intervention: domicile?.adresse,
      date_rendez_vous: domicile?.date,
      heure_rendez_vous: domicile?.heure,
      instructions_client: domicile?.instructions,
      etape_domicile: domicile ? 'PLANIFIEE' : undefined,
      kit_prepare: domicile ? [] : undefined
    };

    setLavages(prev => [newLavage, ...prev]);

    const serviceLabel = domicile ? 'lavage à domicile' : 'lavage';
    addAuditLog('ENREGISTREMENT_LAVAGE', `Lavage ${newLavage.code_lavage}`, `Enregistrement ${serviceLabel} ${formule} pour ${plaque} (${clientNom})`);
    showNotification(domicile
      ? `Intervention à domicile planifiée pour ${plaque}.`
      : `Véhicule ${plaque} ajouté à la file d'attente lavage`);
  };

  const affecterLaveursLavage = (lavageId: number, laveurIds: number[]) => {
    const item = lavages.find(lavage => lavage.id === lavageId);
    if (!item || item.statut === 'LIVRE_PAYE' || item.statut === 'ANNULE') {
      showNotification('Ce lavage ne peut plus recevoir d’affectation.', 'warning');
      return;
    }
    const uniqueIds = [...new Set(laveurIds)];
    if (uniqueIds.some(id => !employes.some(employee => employee.id === id && employee.poste === 'Laveur' && employee.statut === 'ACTIF'))) {
      showNotification('Sélectionnez uniquement des laveurs actifs.', 'warning');
      return;
    }
    setLavages(prev => prev.map(lavage => lavage.id === lavageId ? {
      ...lavage,
      laveur_ids: uniqueIds,
      laveur_id: uniqueIds[0]
    } : lavage));
    addAuditLog('AFFECTATION_LAVEURS', item.code_lavage, `Laveurs affectés : ${uniqueIds.map(id => employes.find(employee => employee.id === id)?.nom_complet).filter(Boolean).join(', ') || 'aucun'}`);
    showNotification('Affectation des laveurs mise à jour.');
  };

  const mettreAJourLavageDomicile = (
    lavageId: number,
    update: { laveur_id?: number; etape_domicile?: EtapeLavageDomicile; kit_prepare?: string[] }
  ) => {
    const item = lavages.find(lavage => lavage.id === lavageId);
    if (!item || item.mode_prestation !== 'DOMICILE') {
      showNotification('Intervention à domicile introuvable.', 'warning');
      return;
    }

    if (update.etape_domicile === 'EN_ROUTE' || update.etape_domicile === 'SUR_PLACE') {
      if (!(item.laveur_ids?.length || item.laveur_id || update.laveur_id)) {
        showNotification('Affectez un laveur avant de préparer son départ.', 'warning');
        return;
      }
      if (update.etape_domicile === 'EN_ROUTE' && item.kit_prepare?.length !== 4) {
        showNotification('Le kit doit être entièrement vérifié avant le départ.', 'warning');
        return;
      }
    }

    setLavages(prev => prev.map(lavage => lavage.id === lavageId ? { ...lavage, ...update } : lavage));
    const worker = employes.find(employee => employee.id === (update.laveur_id ?? item.laveur_id));
    const stageLabel: Record<EtapeLavageDomicile, string> = {
      PLANIFIEE: 'Rendez-vous planifié',
      KIT_A_PREPARER: 'Préparation du kit',
      EN_ROUTE: 'Laveur en route',
      SUR_PLACE: 'Laveur arrivé chez le client',
      TERMINEE: 'Intervention terminée'
    };
    const stage = update.etape_domicile;
    addAuditLog(
      'SUIVI_LAVAGE_DOMICILE',
      `Lavage ${item.code_lavage}`,
      `${stage ? stageLabel[stage] : 'Mise à jour de la fiche'}${worker ? ` — ${worker.nom_complet}` : ''}`
    );
    if (stage === 'SUR_PLACE') {
      setLavages(prev => prev.map(lavage => lavage.id === lavageId
        ? { ...lavage, ...update, statut: 'EN_COURS' }
        : lavage
      ));
    }
    showNotification(stage ? stageLabel[stage] : 'Intervention mise à jour.');
  };

  const changerStatutLavage = (lavageId: number, nouveauStatut: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE' | 'LIVRE_PAYE') => {
    const item = lavages.find(l => l.id === lavageId);
    if (!item || item.statut === 'ANNULE') return;
    if (item.statut === nouveauStatut) return;
    if (nouveauStatut === 'EN_COURS' && item.statut !== 'EN_ATTENTE') {
      showNotification('Seul un véhicule en attente peut démarrer une prestation.', 'warning');
      return;
    }
    if (nouveauStatut === 'EN_COURS' && !(item.laveur_ids?.length || item.laveur_id)) {
      showNotification('Affectez un laveur avant de démarrer la prestation.', 'warning');
      return;
    }
    if (nouveauStatut === 'LIVRE_PAYE' && item.statut !== 'TERMINE') {
      showNotification('Le lavage doit être marqué prêt avant sa clôture en caisse.', 'warning');
      return;
    }

    setLavages(prev => prev.map(l => l.id === lavageId ? { ...l, statut: nouveauStatut } : l));

    // When paid & delivered, register invoice & washer commission
    if (nouveauStatut === 'LIVRE_PAYE') {
      const factureId = Date.now();
      const newFacture: Facture = {
        id: factureId,
        numero: `FACT-LAV-${Date.now().toString().slice(-4)}`,
        client_id: item.client_id || 1,
        succursale_id: currentSuccursale.id,
        type_service: 'LAVAGE',
        description: `Prestation lavage ${item.formule} (${item.plaque})`,
        montant_total: item.prix,
        montant_paye: item.prix,
        statut: 'PAYE',
        mode_paiement: 'ESPECES',
        reference_paiement: `ESP-LAV-${Date.now().toString().slice(-4)}`,
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
        source_lavage_id: item.id
      };
      setFactures(prev => [newFacture, ...prev]);
      addEncaissement(
        newFacture.id,
        item.prix,
        'ESPECES',
        newFacture.reference_paiement || ''
      );
      setLavages(prev => prev.map(lavage => lavage.id === item.id ? { ...lavage, facture_id: newFacture.id } : lavage));

      // Share the established commission equally across assigned washers.
      const assignedLaveurIds = [...new Set(item.laveur_ids?.length ? item.laveur_ids : item.laveur_id ? [item.laveur_id] : [])];
      if (assignedLaveurIds.length) {
        const commMontant = item.formule === 'VIP_DETAILING' ? 1500 : 500;
        const baseCommission = Math.floor(commMontant / assignedLaveurIds.length);
        const remainder = commMontant % assignedLaveurIds.length;
        const primes = assignedLaveurIds.map((employeId, index): PrimeAmende => ({
          id: Date.now() + index,
          employe_id: employeId,
          type_acte: 'PRIME',
          montant: baseCommission + (index === 0 ? remainder : 0),
          motif: `Commission partagée sur lavage ${item.formule} (${item.plaque})`,
          date_enregistrement: new Date().toISOString().replace('T', ' ').slice(0, 16),
          enregistre_par: 'Système Automatique Lavage',
          lavage_id: item.id
        }));
        setPrimesAmendes(prev => [...primes, ...prev]);
        setEmployes(prev => prev.map(employee => assignedLaveurIds.includes(employee.id)
          ? { ...employee, total_vehicules_mois: (employee.total_vehicules_mois || 0) + 1 }
          : employee));
      }

      setReceiptModalData({ visible: true, type: 'LAVAGE', data: item });
    }

    addAuditLog('CHANGEMENT_STATUT_LAVAGE', `Lavage ${item.code_lavage}`, `Statut passé à ${nouveauStatut} pour ${item.plaque}`);
  };

  const annulerLavage = (lavageId: number, motif: string): boolean => {
    const item = lavages.find(lavage => lavage.id === lavageId);
    if (!item || item.statut === 'ANNULE') {
      showNotification('Ce lavage est introuvable ou déjà annulé.', 'warning');
      return false;
    }
    if (userRole !== 'GERANT' && userRole !== 'PROPRIETAIRE') {
      showNotification('Seul le gérant ou le propriétaire peut annuler un lavage.', 'warning');
      return false;
    }
    if (!motif.trim()) {
      showNotification('Le motif d’annulation est obligatoire.', 'warning');
      return false;
    }
    if (item.facture_id) return annulerFacture(item.facture_id, motif.trim());

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setLavages(prev => prev.map(lavage => lavage.id === lavageId ? {
      ...lavage,
      statut: 'ANNULE',
      motif_annulation: motif.trim(),
      annule_le: now
    } : lavage));
    addAuditLog('ANNULATION_LAVAGE', item.code_lavage, `Lavage annulé avant encaissement. Motif : ${motif.trim()}`, 'AVERTISSEMENT');
    showNotification(`Lavage ${item.code_lavage} annulé. Le ticket reste dans l’historique.`);
    return true;
  };

  const terminerLavage = (
    lavageId: number,
    consommations: { piece_id: number; quantite: number }[],
    prestations: string[]
  ) => {
    const item = lavages.find(l => l.id === lavageId);
    if (!item || item.statut !== 'EN_COURS') {
      showNotification('Ce lavage n’est pas en cours ou est introuvable.', 'warning');
      return false;
    }
    if (prestations.length === 0 || prestations.some(prestation => !prestation.trim())) {
      showNotification('La checklist de prestation doit être renseignée avant la clôture.', 'warning');
      return false;
    }

    const quantites = new Map<number, number>();
    for (const consommation of consommations) {
      if (!Number.isInteger(consommation.quantite) || consommation.quantite < 0) {
        showNotification('Les quantités consommées doivent être des nombres entiers positifs ou nuls.', 'warning');
        return false;
      }
      quantites.set(
        consommation.piece_id,
        (quantites.get(consommation.piece_id) || 0) + consommation.quantite
      );
    }

    const insuffisant = [...quantites.entries()].find(([pieceId, quantite]) => {
      const piece = piecesStock.find(p => p.id === pieceId);
      return quantite > 0 && (!piece || piece.quantite_disponible < quantite);
    });

    if (insuffisant) {
      const piece = piecesStock.find(p => p.id === insuffisant[0]);
      showNotification(`Stock insuffisant pour ${piece ? piece.nom : 'ce produit'} pour le lavage ${item.plaque}.`, 'warning');
      return false;
    }

    setPiecesStock(prev => prev.map(piece => {
      const used = quantites.get(piece.id) ?? 0;
      return used > 0 ? { ...piece, quantite_disponible: Math.max(0, piece.quantite_disponible - used) } : piece;
    }));
    quantites.forEach((used, pieceId) => {
      if (used <= 0) return;
      const piece = piecesStock.find(item => item.id === pieceId);
      if (piece) enregistrerMouvementStock(piece, 'SORTIE', used, piece.quantite_disponible - used, `Consommation lavage ${item.code_lavage}`, item.code_lavage);
    });

    setLavages(prev => prev.map(l => l.id === lavageId ? {
      ...l,
      statut: 'TERMINE',
      prestations_effectuees: prestations,
      etape_domicile: l.mode_prestation === 'DOMICILE' ? 'TERMINEE' : l.etape_domicile,
      consommables_utilises: [...quantites.entries()]
        .filter(([, quantite]) => quantite > 0)
        .map(([pieceId, quantite]) => {
          const piece = piecesStock.find(p => p.id === pieceId);
          return { piece_id: pieceId, nom: piece?.nom || 'Produit', quantite };
        })
    } : l));

    const consommablesDetails = [...quantites.entries()]
      .filter(([, quantite]) => quantite > 0)
      .map(([pieceId, quantite]) => `${quantite}x ${piecesStock.find(p => p.id === pieceId)?.nom || 'Produit'}`)
      .join(', ') || 'Aucun consommable déclaré';
    addAuditLog(
      'TERMINAISON_LAVAGE',
      `Lavage ${item.code_lavage}`,
      `Prestations validées: ${prestations.join(', ')}. Consommables déduits: ${consommablesDetails}`
    );
    showNotification(`Véhicule ${item.plaque} prêt : le réceptionniste peut prévenir le client.`);
    return true;
  };

  const signalerProduitLavage = (laveurId: number, pieceId: number) => {
    const laveur = employes.find(e => e.id === laveurId);
    const piece = piecesStock.find(p => p.id === pieceId);
    if (!laveur || !piece) {
      showNotification('Produit ou employé introuvable pour la demande de réapprovisionnement.', 'warning');
      return;
    }
    if (demandesConsommablesLavage.some(d =>
      d.laveur_id === laveurId && d.piece_id === pieceId && d.statut === 'EN_ATTENTE'
    )) {
      showNotification(`Une demande pour ${piece.nom} est déjà en attente.`, 'info');
      return;
    }

    const demande: DemandeConsommableLavage = {
      id: Date.now(),
      laveur_id: laveurId,
      piece_id: pieceId,
      piece_nom: piece.nom,
      quantite_demandee: 1,
      date_demande: new Date().toISOString().replace('T', ' ').slice(0, 16),
      statut: 'EN_ATTENTE'
    };

    setDemandesConsommablesLavage(prev => [demande, ...prev]);
    addAuditLog('ALERTE_PRODUIT_LAVAGE', piece.nom, `Le laveur ${laveur.nom_complet} signale un produit fini et demande un réapprovisionnement.`);
    showNotification(`Demande de réapprovisionnement enregistrée pour ${piece.nom}.`, 'warning');
  };

  const traiterDemandeConsommableLavage = (demandeId: number, decision: 'REMIS' | 'REFUSEE') => {
    if (userRole !== 'GERANT' && userRole !== 'PROPRIETAIRE') {
      showNotification('Seul le gérant ou le propriétaire peut traiter une demande de stock.', 'warning');
      return;
    }
    const demande = demandesConsommablesLavage.find(d => d.id === demandeId);
    if (!demande || demande.statut !== 'EN_ATTENTE') return;

    const piece = piecesStock.find(p => p.id === demande.piece_id);
    if (!piece) {
      showNotification(`Le produit ${demande.piece_nom} n’existe plus dans le stock.`, 'warning');
      return;
    }
    if (decision === 'REMIS' && piece.quantite_disponible < demande.quantite_demandee) {
      showNotification(`Stock insuffisant pour remettre ${demande.piece_nom} au laveur.`, 'warning');
      return;
    }

    setDemandesConsommablesLavage(prev => prev.map(d => d.id === demandeId ? { ...d, statut: decision } : d));

    if (decision === 'REMIS') {
      enregistrerMouvementStock(
        piece,
        'SORTIE',
        demande.quantite_demandee,
        piece.quantite_disponible - demande.quantite_demandee,
        `Remise au laveur ${employes.find(employee => employee.id === demande.laveur_id)?.nom_complet || demande.laveur_id}`
      );
      setPiecesStock(prev => prev.map(piece => piece.id === demande.piece_id
        ? { ...piece, quantite_disponible: piece.quantite_disponible - demande.quantite_demandee }
        : piece
      ));
      addAuditLog('REMISE_CONSOMMABLE_LAVAGE', demande.piece_nom, `Remise au laveur #${demande.laveur_id} : ${demande.quantite_demandee} unité(s) déduite(s) du stock magasin.`);
      showNotification(`${demande.piece_nom} remis au laveur (${demande.quantite_demandee} unité).`);
    } else {
      addAuditLog('DEMANDE_REBUTEE_LAVAGE', demande.piece_nom, `Demande de réapprovisionnement refusée pour le laveur #${demande.laveur_id}.`);
      showNotification(`Demande de ${demande.piece_nom} refusée.`, 'info');
    }
  };

  // Garage Methods
  const ajouterOrdreReparation = (orData: Omit<OrdreReparation, 'id' | 'numero_or'>): OrdreReparation => {
    const newOr: OrdreReparation = {
      ...orData,
      id: Date.now(),
      numero_or: `OR-${new Date().getFullYear()}-${Date.now()}`
    };

    setGarageOrs(prev => [newOr, ...prev]);
    addAuditLog('CREATION_OR', newOr.numero_or, `Création OR pour ${newOr.plaque} (${newOr.modele}) - Symptômes: ${newOr.symptomes_client}`);
    showNotification(`Ordre de Réparation ${newOr.numero_or} créé`);
    return newOr;
  };

  const changerEtapeGarage = (orId: number, nouvelleEtape: EtapeKanban) => {
    const orItem = garageOrs.find(o => o.id === orId);
    if (!orItem) return;

    setGarageOrs(prev => prev.map(o => o.id === orId ? { ...o, etape: nouvelleEtape } : o));

    if (nouvelleEtape === 'PRET_FACTURE') {
      // Auto-create invoice
      const newFacture: Facture = {
        id: Date.now(),
        numero: `FACT-GAR-${Date.now().toString().slice(-4)}`,
        client_id: orItem.client_id,
        succursale_id: currentSuccursale.id,
        type_service: 'GARAGE',
        description: `Réparations atelier selon OR ${orItem.numero_or} (${orItem.plaque})`,
        montant_total: orItem.montant_total_estime,
        montant_paye: 0,
        statut: 'IMPAYE',
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
        lignes: [
          ...orItem.pieces_demandees.map(p => ({
            description: `${p.nom} (Réf: ${p.ref})`,
            quantite: p.qte,
            prix_unitaire: p.prix,
            total: p.qte * p.prix
          })),
          {
            description: 'Main d\'œuvre atelier mécanique & diagnostic',
            quantite: 1,
            prix_unitaire: orItem.main_oeuvre_montant,
            total: orItem.main_oeuvre_montant
          }
        ]
      };
      setFactures(prev => [newFacture, ...prev]);
      showNotification(`Facture générée pour l'OR ${orItem.numero_or}`);
    }

    addAuditLog('ETAPE_GARAGE_CHANGEE', orItem.numero_or, `OR passé à l'étape: ${nouvelleEtape}`);
  };

  const validerDevisGarage = (orId: number) => {
    const orItem = garageOrs.find(o => o.id === orId);
    if (!orItem || orItem.devis_valide_gerant || orItem.etape !== 'DEVIS_EN_ATTENTE') return;
    if (userRole !== 'GERANT' && userRole !== 'PROPRIETAIRE') {
      showNotification('Seul le gérant ou le propriétaire peut valider un devis.', 'warning');
      return;
    }

    const piecesToDeduct = orItem.pieces_demandees.filter(p => !p.deduit);
    const quantitiesByPiece = new Map<number, { piece: PieceStock; quantite: number }>();
    for (const orderedPiece of piecesToDeduct) {
      const stockPiece = piecesStock.find(piece =>
        piece.id === orderedPiece.piece_id || piece.reference === orderedPiece.ref
      );
      if (!stockPiece) {
        showNotification(`La pièce ${orderedPiece.nom} (${orderedPiece.ref}) est introuvable dans le stock.`, 'warning');
        return;
      }
      if (!Number.isInteger(orderedPiece.qte) || orderedPiece.qte <= 0) {
        showNotification(`La quantité demandée pour ${orderedPiece.nom} est invalide.`, 'warning');
        return;
      }
      const current = quantitiesByPiece.get(stockPiece.id);
      quantitiesByPiece.set(stockPiece.id, {
        piece: stockPiece,
        quantite: (current?.quantite || 0) + orderedPiece.qte
      });
    }

    const insufficientStock = [...quantitiesByPiece.values()].find(({ piece, quantite }) =>
      piece.quantite_disponible < quantite
    );
    if (insufficientStock) {
      showNotification(
        `Stock insuffisant pour ${insufficientStock.piece.nom} : ${insufficientStock.piece.quantite_disponible} disponible(s), ${insufficientStock.quantite} requis.`,
        'warning'
      );
      return;
    }

    quantitiesByPiece.forEach(({ piece, quantite }) => {
      enregistrerMouvementStock(
        piece,
        'SORTIE',
        quantite,
        piece.quantite_disponible - quantite,
        `Pièces utilisées pour l’ordre ${orItem.numero_or}`,
        orItem.numero_or
      );
    });

    setPiecesStock(prev => prev.map(stockPiece => {
      const quantity = quantitiesByPiece.get(stockPiece.id)?.quantite;
      if (quantity === undefined) return stockPiece;
      return { ...stockPiece, quantite_disponible: stockPiece.quantite_disponible - quantity };
    }));

    // Mark pieces as deducted and set devis_valide_gerant to true
    setGarageOrs(prev => prev.map(o => o.id === orId ? {
      ...o,
      devis_valide_gerant: true,
      etape: 'EN_REPARATION',
      pieces_demandees: o.pieces_demandees.map(p => ({ ...p, deduit: true }))
    } : o));

    addAuditLog('VALIDATION_DEVIS_OR', orItem.numero_or, `Devis validé par le Gérant (${formatCurrency(orItem.montant_total_estime)}). Pièces réservées et déduites du stock en magasin.`);
    showNotification(`Devis ${orItem.numero_or} validé ! Pièces déduites du stock.`);
  };

  // Caisse Methods
  const encaisserFacture = (factureId: number, montantVerse: number, modePaiement: PaymentMethod, refPaiement: string) => {
    const facture = factures.find(f => f.id === factureId);
    if (!facture) return;
    const resteDu = facture.montant_total - facture.montant_paye;
    if (!Number.isFinite(montantVerse) || montantVerse <= 0 || montantVerse > resteDu) {
      showNotification(`Le versement doit être compris entre 1 et ${formatCurrency(Math.max(0, resteDu))}.`, 'warning');
      return;
    }

    const nouveauMontantPaye = facture.montant_paye + montantVerse;
    const nouveauStatut = nouveauMontantPaye >= facture.montant_total ? 'PAYE' : 'PARTIEL';

    setFactures(prev => prev.map(f => f.id === factureId ? {
      ...f,
      montant_paye: nouveauMontantPaye,
      statut: nouveauStatut,
      mode_paiement: modePaiement,
      reference_paiement: refPaiement
    } : f));
    addEncaissement(factureId, montantVerse, modePaiement, refPaiement);

    addAuditLog('ENCAISSEMENT', facture.numero, `Règlement de ${formatCurrency(montantVerse)} via ${modePaiement} (Réf: ${refPaiement}). Reste dû: ${formatCurrency(Math.max(0, facture.montant_total - nouveauMontantPaye))}`);
    showNotification(`Encaissement de ${formatCurrency(montantVerse)} enregistré (${modePaiement})`);
  };

  const creerFactureDirecte = (factureData: Omit<Facture, 'id' | 'numero' | 'created_at'>): Facture => {
    if (factureData.montant_paye > 0 && !factureData.mode_paiement) {
      throw new Error('Un mode de paiement est obligatoire pour un encaissement.');
    }
    const id = Date.now();
    const createdAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newFacture: Facture = {
      ...factureData,
      id,
      numero: `FACT-${id}`,
      created_at: createdAt
    };
    const modePaiement = newFacture.montant_paye > 0 ? newFacture.mode_paiement : undefined;
    if (newFacture.montant_paye > 0 && !modePaiement) {
      throw new Error('Un mode de paiement est obligatoire pour un encaissement.');
    }

    setFactures(prev => [newFacture, ...prev]);
    if (newFacture.montant_paye > 0 && modePaiement) {
      addEncaissement(
        newFacture.id,
        newFacture.montant_paye,
        modePaiement,
        newFacture.reference_paiement || `FACT-${newFacture.id}`
      );
    }
    addAuditLog('CREATION_FACTURE', newFacture.numero, `Création facture ${newFacture.description} - ${formatCurrency(newFacture.montant_total)}`);
    return newFacture;
  };

  // RF-47: Procédure de clôture de caisse quotidienne avec comptage à l'aveugle et détection d'écarts
  const effectuerClotureAveugle = (
    comptageEspeces: number,
    comptageMoMo: number,
    comptageAirtel: number,
    motifEcart?: string
  ) => {
    if (sessionCaisse.statut === 'CLOTUREE') {
      showNotification('Cette session de caisse est déjà clôturée.', 'warning');
      return null;
    }
    if (![comptageEspeces, comptageMoMo, comptageAirtel].every(value => Number.isFinite(value) && value >= 0)) {
      showNotification('Les montants comptés doivent être des nombres positifs ou nuls.', 'warning');
      return null;
    }

    const totalSaisi = comptageEspeces + comptageMoMo + comptageAirtel;
    const totalRecettesTheorique = sessionCaisse.recettes_especes_theorique + sessionCaisse.recettes_momo_theorique + sessionCaisse.recettes_airtel_theorique;
    
    // Écart net entre ce qui a été compté en caisse et le théorique
    const ecart = totalSaisi - totalRecettesTheorique;

    const heureCloture = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updatedSession: SessionCaisse = {
      ...sessionCaisse,
      statut: 'CLOTUREE',
      comptage_especes_saisi: comptageEspeces,
      comptage_momo_saisi: comptageMoMo,
      comptage_airtel_saisi: comptageAirtel,
      ecart_total: ecart,
      motif_ecart: motifEcart || (ecart === 0 ? 'Conforme sans écart' : ecart < 0 ? 'Déficit constaté' : 'Excédent constaté'),
      heure_cloture: heureCloture,
      cloture_par: userRole === 'PROPRIETAIRE' ? 'Propriétaire Direction' : 'Gérant Site'
    };

    setSessionCaisse(updatedSession);

    // If major discrepancy, raise an alert in AI fraud detector (RF-95)
    if (Math.abs(ecart) > 5000) {
      const newAlert: AlerteFraude = {
        id: `FRD-${Date.now().toString().slice(-3)}`,
        date: heureCloture,
        type: 'ECART_CAISSE',
        severite: Math.abs(ecart) > 20000 ? 'CRITIQUE' : 'MOYENNE',
        description: `Écart de caisse lors de la clôture à l'aveugle : ${formatCurrency(ecart)}`,
        valeur_suspecte: `Théorique: ${formatCurrency(totalRecettesTheorique)}, Saisi: ${formatCurrency(totalSaisi)}`,
        statut: 'A_VERIFIER'
      };
      setAlertesFraude(prev => [newAlert, ...prev]);
    }

    addAuditLog('CLOTURE_CAISSE_AVEUGLE', `Session ${sessionCaisse.date}`, `Clôture effectuée. Recettes saisies: ${formatCurrency(totalSaisi)}, Théorique: ${formatCurrency(totalRecettesTheorique)}. Écart: ${formatCurrency(ecart)}`, Math.abs(ecart) > 5000 ? 'AVERTISSEMENT' : 'INFO');
    showNotification(`Clôture de caisse enregistrée. Écart: ${formatCurrency(ecart)}`, ecart === 0 ? 'success' : 'warning');

    setReceiptModalData({ visible: true, type: 'CLOTURE', data: updatedSession });
    return { ecart, session: updatedSession };
  };

  // Dépenses Methods
  const ajouterDepense = (motif: string, montant: number, categorie: Depense['categorie'], justificatif?: string) => {
    const accordProprietaireRequis = montant > 50000;
    const newDepense: Depense = {
      id: Date.now(),
      succursale_id: currentSuccursale.id,
      motif,
      montant,
      categorie,
      justificatif_url: justificatif,
      valide_par_gerant: true,
      accord_proprietaire_requis: accordProprietaireRequis,
      valide_par_proprietaire: !accordProprietaireRequis, // if < 50k, auto validated
      auteur: userRole === 'PROPRIETAIRE' ? 'Propriétaire' : userRole === 'GERANT' ? 'Gérant' : 'Caissier',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    setDepenses(prev => [newDepense, ...prev]);
    addAuditLog('SAISIE_DEPENSE', `Dépense #${newDepense.id}`, `Saisie dépense: ${motif} (${formatCurrency(montant)}). Accord propriétaire requis: ${accordProprietaireRequis ? 'OUI (> 50k)' : 'NON'}`);
    showNotification(`Dépense de ${formatCurrency(montant)} enregistrée`);
  };

  const validerDepenseGerant = (depenseId: number) => {
    setDepenses(prev => prev.map(d => d.id === depenseId ? { ...d, valide_par_gerant: true } : d));
    addAuditLog('VALIDATION_DEPENSE_GERANT', `Dépense #${depenseId}`, 'Validation gérant accordée');
  };

  const validerDepenseProprietaire = (depenseId: number) => {
    setDepenses(prev => prev.map(d => d.id === depenseId ? { ...d, valide_par_proprietaire: true } : d));
    addAuditLog('ACCORD_DEPENSE_PROPRIETAIRE', `Dépense #${depenseId}`, 'Accord de la Direction Propriétaire validé');
    showNotification('Dépense validée par la Direction');
  };

  // RH Methods
  const pointerEmploye = (employeId: number, type?: 'IN' | 'OUT') => {
    const emp = employes.find(e => e.id === employeId);
    if (!emp) return;

    const nouveauStatutPresence = type !== undefined ? (type === 'IN') : !emp.present_aujourdhui;
    const now = new Date();
    const heureExacte = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const heureAffichee = now.toTimeString().slice(0, 5);

    setEmployes(prev => prev.map(e => e.id === employeId ? {
      ...e,
      present_aujourdhui: nouveauStatutPresence,
      heure_pointage: nouveauStatutPresence ? heureAffichee : undefined
    } : e));

    const action = nouveauStatutPresence ? 'CLOCK_IN' : 'CLOCK_OUT';
    const actionLabel = nouveauStatutPresence ? 'ARRIVÉE (Clock In)' : 'DÉPART (Clock Out)';
    const details = `Pointage ${actionLabel} horodaté à ${heureExacte} pour ${emp.nom_complet} (${emp.poste}) - Enregistré dans la piste d'audit pour le calcul de paie`;

    addAuditLog(action, emp.nom_complet, details, 'INFO');
    showNotification(`${actionLabel} : ${emp.nom_complet} pointé à ${heureExacte}`, nouveauStatutPresence ? 'success' : 'info');
  };

  const ajouterEmploye = (
    employeData: Omit<Employe, 'id' | 'succursale_id' | 'statut' | 'present_aujourdhui'>
  ) => {
    const newEmploye: Employe = {
      ...employeData,
      id: Date.now(),
      succursale_id: currentSuccursale.id,
      statut: 'ACTIF',
      present_aujourdhui: false
    };
    setEmployes(prev => [newEmploye, ...prev]);
    addAuditLog('CREATION_EMPLOYE', newEmploye.nom_complet, `Nouvel employé enregistré comme ${newEmploye.poste}. Contrat: ${newEmploye.type_contrat || 'non renseigné'}.`);
    showNotification(`Fiche de ${newEmploye.nom_complet} créée.`);
  };

  const ajouterPrimeAmende = (employeId: number, type: 'PRIME' | 'AMENDE', montant: number, motif: string, preuve?: string) => {
    const emp = employes.find(e => e.id === employeId);
    if (!emp) return;

    const newActe: PrimeAmende = {
      id: Date.now(),
      employe_id: employeId,
      type_acte: type,
      montant,
      motif,
      date_enregistrement: new Date().toISOString().replace('T', ' ').slice(0, 16),
      enregistre_par: userRole === 'PROPRIETAIRE' ? 'Propriétaire Direction' : 'Gérant',
      preuve_url: preuve
    };

    setPrimesAmendes(prev => [newActe, ...prev]);
    addAuditLog(`ENREGISTREMENT_${type}`, emp.nom_complet, `${type === 'PRIME' ? 'Bonus/Prime' : 'Retenue/Amende'} de ${formatCurrency(montant)} - Motif: ${motif}`, type === 'AMENDE' ? 'AVERTISSEMENT' : 'INFO');
    showNotification(`${type === 'PRIME' ? 'Prime' : 'Amende'} de ${formatCurrency(montant)} imputée à ${emp.nom_complet}`);
  };

  const changerStatutEmploye = (employeId: number, statut: 'ACTIF' | 'SUSPENDU') => {
    const emp = employes.find(e => e.id === employeId);
    if (!emp) return;

    setEmployes(prev => prev.map(e => e.id === employeId ? { ...e, statut } : e));
    addAuditLog('STATUT_EMPLOYE_MODIFIE', emp.nom_complet, `Statut RH passé à : ${statut}`, 'AVERTISSEMENT');
    showNotification(`Statut de ${emp.nom_complet} mis à jour : ${statut}`);
  };

  const radierEmploye = (employeId: number, motif: string): boolean => {
    const emp = employes.find(employee => employee.id === employeId);
    if (!emp || emp.statut === 'RADIE') {
      showNotification('Employé introuvable ou déjà radié.', 'warning');
      return false;
    }
    if (userRole !== 'GERANT' && userRole !== 'PROPRIETAIRE') {
      showNotification('Seul le gérant ou le propriétaire peut radier un employé.', 'warning');
      return false;
    }
    if (!motif.trim()) {
      showNotification('Le motif de radiation est obligatoire.', 'warning');
      return false;
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const hireDate = new Date(`${emp.date_embauche}T00:00:00`);
    if (!Number.isFinite(hireDate.getTime())) {
      showNotification('La date d’embauche de cet employé est invalide ; corrigez sa fiche avant la radiation.', 'warning');
      return false;
    }
    const startDate = hireDate > monthStart ? hireDate : monthStart;
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const toUtcDay = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const daysPayable = startDate > today ? 0 : Math.round((toUtcDay(today) - toUtcDay(startDate)) / 86400000) + 1;
    const ratio = daysPayable / daysInMonth;
    const proratedSalary = Math.round(emp.salaire_base * ratio);
    const dateRadiation = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    setEmployes(prev => prev.map(employee => employee.id === employeId ? {
      ...employee,
      statut: 'RADIE',
      present_aujourdhui: false,
      date_radiation: dateRadiation,
      motif_radiation: motif.trim(),
      salaire_prorata_radiation: proratedSalary
    } : employee));
    addAuditLog(
      'RADIATION_EMPLOYE',
      emp.nom_complet,
      `Radiation au ${dateRadiation}. Motif : ${motif.trim()}. Solde indicatif de salaire : ${daysPayable}/${daysInMonth} jours (${(ratio * 100).toFixed(2)} %) = ${formatCurrency(proratedSalary)}.`,
      'CRITIQUE'
    );
    showNotification(`Employé radié. Salaire de base proratisé : ${formatCurrency(proratedSalary)}.`);
    return true;
  };

  // Stocks Methods
  const ajouterStockPiece = (pieceData: Omit<PieceStock, 'id'>) => {
    if (userRole !== 'GERANT' && userRole !== 'PROPRIETAIRE') {
      showNotification('Seul le gérant ou le propriétaire peut ajouter un article au stock.', 'warning');
      return;
    }
    if (!Number.isInteger(pieceData.quantite_disponible) || pieceData.quantite_disponible < 0 ||
      !Number.isInteger(pieceData.seuil_alerte) || pieceData.seuil_alerte < 0 ||
      pieceData.prix_achat < 0 || pieceData.prix_vente < 0) {
      showNotification('Vérifiez les quantités, le seuil et les prix de l’article.', 'warning');
      return;
    }
    const newPiece: PieceStock = {
      ...pieceData,
      id: Date.now()
    };
    setPiecesStock(prev => [newPiece, ...prev]);
    if (newPiece.quantite_disponible > 0) {
      enregistrerMouvementStock(
        { ...newPiece, quantite_disponible: 0 },
        'ENTREE',
        newPiece.quantite_disponible,
        newPiece.quantite_disponible,
        'Stock initial'
      );
    }
    addAuditLog('AJOUT_PIECE_STOCK', newPiece.reference, `Ajout pièce ${newPiece.nom} (${newPiece.quantite_disponible} en stock)`);
    showNotification(`Nouvelle pièce ajoutée au magasin`);
  };

  const commanderStock = (pieceId: number, quantite: number, motif = 'Réapprovisionnement fournisseur') => {
    if (userRole !== 'GERANT' && userRole !== 'PROPRIETAIRE') {
      showNotification('Seul le gérant ou le propriétaire peut enregistrer un réapprovisionnement.', 'warning');
      return;
    }
    const piece = piecesStock.find(p => p.id === pieceId);
    if (!piece || !Number.isInteger(quantite) || quantite <= 0) {
      showNotification('Saisissez une quantité entière positive pour le réapprovisionnement.', 'warning');
      return;
    }

    enregistrerMouvementStock(piece, 'ENTREE', quantite, piece.quantite_disponible + quantite, motif);
    setPiecesStock(prev => prev.map(p => p.id === pieceId ? { ...p, quantite_disponible: p.quantite_disponible + quantite } : p));
    addAuditLog('COMMANDE_STOCK', piece.reference, `Bon de commande reçu : +${quantite} unités pour ${piece.nom}`);
    showNotification(`Réapprovisionnement de +${quantite} ${piece.nom} enregistré`);
  };

  const ajusterStockPiece = (pieceId: number, nouvelleQuantite: number, motif: string): boolean => {
    const piece = piecesStock.find(item => item.id === pieceId);
    if (userRole !== 'GERANT' && userRole !== 'PROPRIETAIRE') {
      showNotification('Seul le gérant ou le propriétaire peut ajuster le stock.', 'warning');
      return false;
    }
    if (!piece || !Number.isInteger(nouvelleQuantite) || nouvelleQuantite < 0 || !motif.trim()) {
      showNotification('Choisissez une quantité entière positive ou nulle et renseignez le motif.', 'warning');
      return false;
    }
    if (nouvelleQuantite === piece.quantite_disponible) {
      showNotification('La quantité saisie est identique au stock actuel.', 'info');
      return false;
    }
    const delta = nouvelleQuantite - piece.quantite_disponible;
    enregistrerMouvementStock(piece, 'AJUSTEMENT', Math.abs(delta), nouvelleQuantite, motif.trim());
    setPiecesStock(prev => prev.map(item => item.id === pieceId ? { ...item, quantite_disponible: nouvelleQuantite } : item));
    addAuditLog('AJUSTEMENT_STOCK', piece.reference, `Stock ajusté de ${piece.quantite_disponible} à ${nouvelleQuantite}. Motif : ${motif.trim()}.`, 'AVERTISSEMENT');
    showNotification(`Stock de ${piece.nom} ajusté.`);
    return true;
  };

  const creerTransfertStock = (pieceId: number, succursaleDestId: number, quantite: number) => {
    if (userRole !== 'GERANT' && userRole !== 'PROPRIETAIRE') {
      showNotification('Seul le gérant ou le propriétaire peut transférer du stock.', 'warning');
      return;
    }
    const piece = piecesStock.find(p => p.id === pieceId);
    const destination = succursales.find(branch => branch.id === succursaleDestId);
    if (!piece || !destination || destination.id === currentSuccursale.id ||
      !Number.isInteger(quantite) || quantite <= 0 || piece.quantite_disponible < quantite) {
      showNotification('Vérifiez la succursale de destination et la quantité disponible pour ce transfert.', 'warning');
      return;
    }

    // Deduct from current branch
    enregistrerMouvementStock(piece, 'TRANSFERT', quantite, piece.quantite_disponible - quantite, `Transfert vers succursale #${succursaleDestId}`);
    setPiecesStock(prev => prev.map(p => p.id === pieceId ? { ...p, quantite_disponible: p.quantite_disponible - quantite } : p));

    const newTransfert: TransfertStock = {
      id: Date.now(),
      reference_bon: `TRF-2026-${Date.now().toString().slice(-3)}`,
      piece_id: pieceId,
      piece_nom: piece.nom,
      succursale_source_id: currentSuccursale.id,
      succursale_dest_id: succursaleDestId,
      quantite,
      statut: 'EN_TRANSIT',
      date_transfert: new Date().toISOString().replace('T', ' ').slice(0, 16),
      responsable: userRole === 'PROPRIETAIRE' ? 'Direction' : 'Gérant'
    };

    setTransfertsStock(prev => [newTransfert, ...prev]);
    addAuditLog('TRANSFERT_INTER_SUCCURSALES', newTransfert.reference_bon, `Transfert de ${quantite}x ${piece.nom} vers succursale #${succursaleDestId}`);
    showNotification(`Bon de transfert émis vers succursale #${succursaleDestId}`);
  };

  // Demandes Mobiles
  const traiterDemandeReservation = (demandeId: number, action: 'ACCEPTEE' | 'REPORTEE' | 'REFUSEE', reponse?: string) => {
    setDemandesReservations(prev => prev.map(d => d.id === demandeId ? { ...d, statut: action, reponse_gerant: reponse } : d));
    addAuditLog('DECISION_RESERVATION_MOBILE', `Demande #${demandeId}`, `Statut: ${action}. Message client: ${reponse || 'Sans commentaire'}`);
    showNotification(`Demande de réservation mise à jour : ${action}`);
  };

  // Dettes & Recouvrement
  const enregistrerVersementDette = (factureId: number, montant: number, mode: PaymentMethod) => {
    const facture = factures.find(f => f.id === factureId);
    if (!facture) return;
    const resteDu = facture.montant_total - facture.montant_paye;
    if (!Number.isFinite(montant) || montant <= 0 || montant > resteDu) {
      showNotification(`Le versement doit être compris entre 1 et ${formatCurrency(Math.max(0, resteDu))}.`, 'warning');
      return;
    }

    const nouveauPaye = facture.montant_paye + montant;
    const nouveauStatut = nouveauPaye >= facture.montant_total ? 'PAYE' : 'PARTIEL';
    const reference = `VERSEMENT-${Date.now()}`;

    setFactures(prev => prev.map(f => f.id === factureId ? {
      ...f,
      montant_paye: nouveauPaye,
      statut: nouveauStatut,
      mode_paiement: mode,
      reference_paiement: reference
    } : f));
    addEncaissement(factureId, montant, mode, reference);

    addAuditLog('VERSEMENT_DETTE_CLIENT', facture.numero, `Versement échelonné de ${formatCurrency(montant)} par client #${facture.client_id}. Reste: ${formatCurrency(Math.max(0, facture.montant_total - nouveauPaye))}`);
    showNotification(`Acompte de ${formatCurrency(montant)} enregistré avec succès`);
  };

  const ajouterClient = (nom: string, telephone: string, plafondCredit: number, email?: string): Client => {
    const newClient: Client = {
      id: Date.now(),
      nom,
      telephone,
      email,
      plafond_credit: plafondCredit,
      bloque_credit: false
    };
    setClients(prev => [...prev, newClient]);
    addAuditLog('CREATION_CLIENT', newClient.nom, `Nouveau client enregistré. Plafond crédit accordé: ${formatCurrency(plafondCredit)}`);
    return newClient;
  };

  const ajouterVehicule = (vehiculeData: Omit<Vehicule, 'id'>): Vehicule | null => {
    const plaque = vehiculeData.plaque.toUpperCase().trim();
    if (vehicules.some(vehicle => vehicle.plaque.toUpperCase().trim() === plaque)) {
      showNotification(`Le véhicule ${plaque} est déjà enregistré.`, 'warning');
      return null;
    }

    const newVehicule: Vehicule = {
      ...vehiculeData,
      id: Date.now(),
      plaque
    };
    setVehicules(prev => [newVehicule, ...prev]);
    setClients(prev => prev.map(client => client.id === newVehicule.client_id
      ? { ...client, vehicules_ids: [...new Set([...(client.vehicules_ids || []), newVehicule.id])] }
      : client
    ));
    addAuditLog('CREATION_VEHICULE', newVehicule.plaque, `Véhicule ${newVehicule.marque} ${newVehicule.modele} enregistré par le gérant.`);
    showNotification(`Véhicule ${newVehicule.plaque} enregistré.`);
    return newVehicule;
  };

  return (
    <AppContext.Provider
      value={{
        authStatus,
        authError,
        userEmail,
        signIn,
        signUp,
        signOut,
        createBranch,
        databaseStatus,
        activeModule,
        setActiveModule,
        userRole,
        authUserId,
        gerantProfile,
        saveGerantProfile,
        tarifsServices,
        updateTarifsServices,
        currentSuccursale,
        setCurrentSuccursale,
        succursales,
        formatCurrency,
        addAuditLog,

        employes,
        primesAmendes,
        clients,
        vehicules,
        factures,
        encaissements,
        depenses,
        placesParking,
        ticketsParking,
        lavages,
        demandesConsommablesLavage,
        garageOrs,
        piecesStock,
        mouvementsStock,
        transfertsStock,
        demandesReservations,
        sessionCaisse,
        logsAudit,
        alertesFraude,

        initialiserPlacesParking,
        modifierPlacesParking,
        creerTicketParking,
        cloturerTicketParking,
        arreterTicketParking,

        ajouterLavage,
        affecterLaveursLavage,
        annulerLavage,
        mettreAJourLavageDomicile,
        changerStatutLavage,
        terminerLavage,
        signalerProduitLavage,
        traiterDemandeConsommableLavage,

        ajouterOrdreReparation,
        changerEtapeGarage,
        validerDevisGarage,

        encaisserFacture,
        creerFactureDirecte,
        annulerFacture,
        effectuerClotureAveugle,

        ajouterDepense,
        validerDepenseGerant,
        validerDepenseProprietaire,

        pointerEmploye,
        ajouterEmploye,
        ajouterPrimeAmende,
        changerStatutEmploye,
        radierEmploye,

        ajouterStockPiece,
        commanderStock,
        ajusterStockPiece,
        creerTransfertStock,

        traiterDemandeReservation,

        enregistrerVersementDette,
        ajouterClient,
        ajouterVehicule,

        receiptModalData,
        setReceiptModalData,
        notification,
        showNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
