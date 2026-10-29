/**
 * AutoGestion Pro v3.0 - Type Definitions
 * Based on AGP-SPEC-2026-V3 Specification & PostgreSQL Schema
 */

export type UserRole = 
  | 'PROPRIETAIRE'
  | 'GERANT'
  | 'RECEPTIONNISTE'
  | 'MECANICIEN'
  | 'LAVEUR'
  | 'AGENT_PARKING'
  | 'CAISSIER';

export interface Succursale {
  id: number;
  nom: string;
  ville: string;
  pays: string;
  adresse: string;
  telephone: string;
  devise: string;
}

export interface Employe {
  id: number;
  succursale_id: number;
  nom_complet: string;
  telephone: string;
  poste: 'Mécanicien' | 'Laveur' | 'Agent Parking' | 'Caissier' | 'Chef d\'Atelier' | 'Réceptionniste' | 'Gérant';
  salaire_base: number;
  statut: 'ACTIF' | 'SUSPENDU' | 'RADIE';
  date_embauche: string;
  present_aujourdhui: boolean;
  heure_pointage?: string;
  total_vehicules_mois?: number;
  photo_url?: string;
  email?: string;
  adresse?: string;
  date_naissance?: string;
  numero_piece_identite?: string;
  contact_urgence_nom?: string;
  contact_urgence_telephone?: string;
  type_contrat?: 'CDI' | 'CDD' | 'JOURNALIER' | 'PRESTATAIRE' | 'STAGE';
  qualification?: string;
  notes_rh?: string;
  date_radiation?: string;
  motif_radiation?: string;
  salaire_prorata_radiation?: number;
}

export interface PrimeAmende {
  id: number;
  employe_id: number;
  type_acte: 'PRIME' | 'AMENDE';
  montant: number;
  motif: string;
  date_enregistrement: string;
  enregistre_par: string;
  preuve_url?: string;
  lavage_id?: number;
  annulee?: boolean;
}

export interface Client {
  id: number;
  nom: string;
  telephone: string;
  email?: string;
  plafond_credit: number;
  bloque_credit: boolean;
  notes?: string;
  vehicules_ids?: number[];
}

export interface Vehicule {
  id: number;
  client_id: number;
  plaque: string;
  marque: string;
  modele: string;
  type_vehicule?: 'VOITURE' | 'MOTO';
  couleur?: string;
  kilometrage?: number;
}

export type PaymentMethod = 'ESPECES' | 'MTN_MOMO' | 'AIRTEL_MONEY' | 'VIREMENT';

export interface Facture {
  id: number;
  numero: string;
  client_id: number;
  succursale_id: number;
  type_service: 'PARKING' | 'LAVAGE' | 'GARAGE' | 'VENTE_PIECE';
  description: string;
  montant_total: number;
  montant_paye: number;
  statut: 'PAYE' | 'PARTIEL' | 'IMPAYE' | 'ANNULEE';
  mode_paiement?: PaymentMethod;
  reference_paiement?: string;
  created_at: string;
  echeance?: string;
  lignes?: { description: string; quantite: number; prix_unitaire: number; total: number }[];
  annulation_motif?: string;
  annulee_le?: string;
  source_lavage_id?: number;
  source_ticket_parking_id?: number;
}

export interface Encaissement {
  id: number;
  facture_id: number;
  succursale_id: number;
  montant: number;
  mode_paiement: PaymentMethod;
  reference_paiement: string;
  created_at: string;
  motif?: string;
}

export interface Depense {
  id: number;
  succursale_id: number;
  motif: string;
  montant: number;
  categorie: 'Carburant' | 'Consommables & Pièces' | 'Équipements & Outils' | 'Alimentation & Eau' | 'Loyer & Électricité' | 'Petite Caisse / Imprévus';
  justificatif_url?: string;
  valide_par_gerant: boolean;
  accord_proprietaire_requis: boolean;
  valide_par_proprietaire: boolean;
  auteur: string;
  created_at: string;
}

// 1. Parking
export type ZoneParking = 'A' | 'B' | 'VIP' | 'OUVERTE';

export interface CapacitesParking {
  A: number;
  B: number;
  VIP: number;
  OUVERTE: number;
}

export interface PlaceParking {
  numero: string;
  zone: ZoneParking | 'LAVAGE_WAIT';
  statut: 'LIBRE' | 'OCCUPE' | 'RESERVE' | 'HORS_SERVICE';
  ticket_en_cours?: TicketParking;
}

export interface TicketParking {
  id: number;
  code_ticket: string;
  plaque: string;
  marque_modele?: string;
  type_vehicule?: 'VOITURE' | 'MOTO';
  client_id?: number;
  place_numero: string;
  heure_entree: string;
  heure_sortie?: string;
  type_client: 'HORAIRE' | 'ABONNE_VIP' | 'CLIENT_GARAGE';
  statut: 'ACTIF' | 'PAYE_SORTI' | 'ABANDONNE';
  scan_source: 'CAMERA_OCR' | 'MANUEL';
  montant_estime: number;
  montant_final?: number;
  mode_paiement?: PaymentMethod;
  tarif_premiere_heure?: number;
  tarif_quart_heure_supplementaire?: number;
  motif_arret?: string;
  arrete_sans_encaissement?: boolean;
}

export interface TarifsServices {
  lavageSimple: number;
  lavageComplet: number;
  lavageVipDetailing: number;
  parkingPremiereHeure: number;
  parkingQuartHeureSupplementaire: number;
  garageMainOeuvre: number;
}

export type GerantProfileData = Omit<Employe, 'id' | 'succursale_id' | 'poste' | 'statut' | 'present_aujourdhui'>;

export interface ProfilGerant {
  user_id: string;
  branch_id: number;
  employe_id: number;
}

// 2. Lavage
export type EtapeLavageDomicile =
  | 'PLANIFIEE'
  | 'KIT_A_PREPARER'
  | 'EN_ROUTE'
  | 'SUR_PLACE'
  | 'TERMINEE';

export interface LavageItem {
  id: number;
  code_lavage: string;
  plaque: string;
  vehicule_desc: string;
  client_nom: string;
  client_id?: number;
  client_telephone: string;
  formule: 'SIMPLE' | 'COMPLET' | 'VIP_DETAILING';
  prix: number;
  laveur_id?: number;
  laveur_ids?: number[];
  statut: 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE' | 'LIVRE_PAYE' | 'ANNULE';
  facture_id?: number;
  motif_annulation?: string;
  annule_le?: string;
  type_vehicule?: 'VOITURE' | 'MOTO';
  heure_reception: string;
  heure_fin_estimee: string;
  conso_shampoing_ml: number;
  conso_cire_ml: number;
  consommables_utilises?: { piece_id: number; nom: string; quantite: number }[];
  prestations_effectuees?: string[];
  mode_prestation?: 'CENTRE' | 'DOMICILE';
  adresse_intervention?: string;
  date_rendez_vous?: string;
  heure_rendez_vous?: string;
  instructions_client?: string;
  etape_domicile?: EtapeLavageDomicile;
  kit_prepare?: string[];
}

export interface DemandeConsommableLavage {
  id: number;
  laveur_id: number;
  piece_id: number;
  piece_nom: string;
  quantite_demandee: number;
  date_demande: string;
  statut: 'EN_ATTENTE' | 'REMIS' | 'REFUSEE';
}

// 3. Garage (Kanban 5 étapes)
export type EtapeKanban = 
  | 'RECEPTION'
  | 'DIAGNOSTIC'
  | 'DEVIS_EN_ATTENTE'
  | 'EN_REPARATION'
  | 'PRET_FACTURE';

export interface OrdreReparation {
  id: number;
  numero_or: string;
  client_id: number;
  vehicule_id: number;
  plaque: string;
  modele: string;
  type_vehicule?: 'VOITURE' | 'MOTO';
  kilometrage: number;
  niveau_carburant: '1/4' | '1/2' | '3/4' | 'Plein' | 'Réserve';
  dommages_constates: string[];
  mecanicien_id: number;
  etape: EtapeKanban;
  symptomes_client: string;
  diagnostic_atelier?: string;
  pieces_demandees: { piece_id: number; nom: string; ref: string; qte: number; prix: number; deduit: boolean }[];
  main_oeuvre_montant: number;
  montant_total_estime: number;
  devis_valide_gerant: boolean;
  date_entree: string;
  date_livraison_prevue: string;
  photos_dommages?: string[];
}

// 6. Stocks
export interface PieceStock {
  id: number;
  succursale_id: number;
  reference: string;
  nom: string;
  categorie: 'Filtres & Vidange' | 'Freinage' | 'Suspension' | 'Pneumatiques' | 'Électricité & Batterie' | 'Consommables Lavage';
  quantite_disponible: number;
  seuil_alerte: number;
  prix_achat: number;
  prix_vente: number;
  fournisseur: string;
  emplacement: string;
}

export interface MouvementStock {
  id: number;
  piece_id: number;
  piece_nom: string;
  reference_piece: string;
  type: 'ENTREE' | 'SORTIE' | 'AJUSTEMENT' | 'TRANSFERT';
  quantite: number;
  quantite_avant: number;
  quantite_apres: number;
  motif: string;
  responsable: string;
  reference_operation?: string;
  created_at: string;
}

export interface TransfertStock {
  id: number;
  reference_bon: string;
  piece_id: number;
  piece_nom: string;
  succursale_source_id: number;
  succursale_dest_id: number;
  quantite: number;
  statut: 'EN_TRANSIT' | 'RECU' | 'ANNULE';
  date_transfert: string;
  responsable: string;
}

// 9. Demandes Mobiles
export interface DemandeReservation {
  id: number;
  code_demande: string;
  client_nom: string;
  telephone: string;
  plaque: string;
  type_service: 'GARAGE' | 'LAVAGE' | 'PARKING';
  date_souhaitee: string;
  creneau_heure: string;
  description_panne_demande: string;
  statut: 'NOUVELLE' | 'ACCEPTEE' | 'REPORTEE' | 'REFUSEE';
  reponse_gerant?: string;
  created_at: string;
}

// Clôture de Caisse (Aveugle)
export interface SessionCaisse {
  date: string;
  succursale_id: number;
  statut: 'OUVERTE' | 'CLOTUREE';
  recettes_especes_theorique: number;
  recettes_momo_theorique: number;
  recettes_airtel_theorique: number;
  depenses_validees: number;
  solde_net_theorique: number;
  // Saisies à l'aveugle par le caissier/gérant
  comptage_especes_saisi?: number;
  comptage_momo_saisi?: number;
  comptage_airtel_saisi?: number;
  ecart_total?: number;
  motif_ecart?: string;
  heure_cloture?: string;
  cloture_par?: string;
}

// Journal d'audit
export interface LogAudit {
  id: string;
  date: string;
  utilisateur: string;
  role: UserRole;
  action: string;
  entite: string;
  details: string;
  type: 'INFO' | 'AVERTISSEMENT' | 'CRITIQUE';
}

// Alerte Fraude IA
export interface AlerteFraude {
  id: string;
  date: string;
  type: 'REMISE_ANORMALE' | 'ECART_CAISSE' | 'SORTIE_SANS_TICKET' | 'DEVIS_MODIFIE_APRES_VALIDATION' | 'STOCK_FANTOME';
  severite: 'FAIBLE' | 'MOYENNE' | 'CRITIQUE';
  description: string;
  valeur_suspecte: string;
  statut: 'A_VERIFIER' | 'DISCULPE' | 'CONFIRME';
}

export type ActiveModule = 
  | 'HUB'
  | 'PARKING'
  | 'LAVAGE'
  | 'GARAGE'
  | 'CAISSE'
  | 'EMPLOYES'
  | 'STOCKS'
  | 'DEPENSES'
  | 'DETTES'
  | 'DEMANDES'
  | 'RAPPORTS'
  | 'PARAMETRES';
