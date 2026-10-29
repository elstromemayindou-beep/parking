import { TARIFS_SERVICES_PAR_DEFAUT } from './tarifs';

export const calculerMontantParking = (
  dureeMinutes: number,
  tarifPremiereHeure: number,
  tarifQuartHeureSupplementaire: number
): number => {
  const tranchesDeQuartHeure = Math.ceil(Math.max(15, dureeMinutes) / 15);
  return tarifPremiereHeure
    + Math.max(0, tranchesDeQuartHeure - 4) * tarifQuartHeureSupplementaire;
};

export const tarifParkingTicket = (ticket: {
  tarif_premiere_heure?: number;
  tarif_quart_heure_supplementaire?: number;
}) => ({
  premiereHeure: ticket.tarif_premiere_heure ?? TARIFS_SERVICES_PAR_DEFAUT.parkingPremiereHeure,
  quartHeureSupplementaire: ticket.tarif_quart_heure_supplementaire
    ?? TARIFS_SERVICES_PAR_DEFAUT.parkingQuartHeureSupplementaire
});
