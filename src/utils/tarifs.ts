import { TarifsServices } from '../types';

export const TARIFS_SERVICES_PAR_DEFAUT: TarifsServices = {
  lavageSimple: 2500,
  lavageComplet: 5000,
  lavageVipDetailing: 15000,
  parkingPremiereHeure: 500,
  parkingQuartHeureSupplementaire: 250,
  garageMainOeuvre: 45000
};

export const normaliserTarifsServices = (value: unknown): TarifsServices => {
  if (!value || typeof value !== 'object') return { ...TARIFS_SERVICES_PAR_DEFAUT };
  const saved = value as Partial<TarifsServices>;
  const amount = (key: keyof TarifsServices): number => {
    const savedAmount = saved[key];
    return typeof savedAmount === 'number' && Number.isFinite(savedAmount) && savedAmount >= 0
      ? savedAmount
      : TARIFS_SERVICES_PAR_DEFAUT[key];
  };
  return {
    lavageSimple: amount('lavageSimple'),
    lavageComplet: amount('lavageComplet'),
    lavageVipDetailing: amount('lavageVipDetailing'),
    parkingPremiereHeure: amount('parkingPremiereHeure'),
    parkingQuartHeureSupplementaire: amount('parkingQuartHeureSupplementaire'),
    garageMainOeuvre: amount('garageMainOeuvre')
  };
};
