import { ConfigurationEntreprise, ServiceLavage } from '../types';

const categoriesInitiales = ['Taxi', 'Bus', 'Coaster', 'Hilux', 'V8', 'Moto', 'Autre'];
const servicesInitiaux = ['Lavage à pression', 'Lavage au compresseur à mousse', 'Lavage de coque', 'Lavage de moteur'];

const normaliserServices = (value: unknown, categories: string[]): ServiceLavage[] => {
  if (!Array.isArray(value)) {
    return servicesInitiaux.map((nom, index) => ({
      id: `lavage-${index + 1}`,
      nom,
      prix_par_categorie: Object.fromEntries(categories.map(category => [category, 0])),
      actif: true
    }));
  }

  return value.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') return [];
    const service = entry as Partial<ServiceLavage>;
    if (typeof service.nom !== 'string' || !service.nom.trim()) return [];
    const savedPrices = service.prix_par_categorie && typeof service.prix_par_categorie === 'object'
      ? service.prix_par_categorie
      : {};
    return [{
      id: typeof service.id === 'string' && service.id ? service.id : `lavage-${index + 1}`,
      nom: service.nom.trim(),
      prix_par_categorie: Object.fromEntries(categories.map(category => {
        const price = (savedPrices as Record<string, unknown>)[category];
        return [category, typeof price === 'number' && Number.isFinite(price) && price >= 0 ? price : 0];
      })),
      actif: service.actif !== false
    }];
  });
};

export const CONFIGURATION_ENTREPRISE_PAR_DEFAUT: ConfigurationEntreprise = {
  nom: 'N.O.B BUSINESS',
  adresse: '12 avenue des problemes quartier mikalou',
  telephonePdgWhatsapp: '',
  debutJour: '06:00',
  finJour: '18:00',
  debutNuit: '18:00',
  finNuit: '06:00',
  tarifGardiennageNuit: 0,
  categoriesVehicules: categoriesInitiales,
  servicesLavage: normaliserServices(undefined, categoriesInitiales)
};

export const normaliserConfigurationEntreprise = (value: unknown): ConfigurationEntreprise => {
  if (!value || typeof value !== 'object') {
    return {
      ...CONFIGURATION_ENTREPRISE_PAR_DEFAUT,
      categoriesVehicules: [...CONFIGURATION_ENTREPRISE_PAR_DEFAUT.categoriesVehicules],
      servicesLavage: CONFIGURATION_ENTREPRISE_PAR_DEFAUT.servicesLavage.map(service => ({
        ...service,
        prix_par_categorie: { ...service.prix_par_categorie }
      }))
    };
  }
  const saved = value as Partial<ConfigurationEntreprise>;
  const categories = Array.isArray(saved.categoriesVehicules)
    ? [...new Set(saved.categoriesVehicules.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean))]
    : categoriesInitiales;
  const validCategories = categories.length ? categories : categoriesInitiales;
  const validTime = (time: unknown, fallback: string) =>
    typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : fallback;
  return {
    nom: typeof saved.nom === 'string' && saved.nom.trim() ? saved.nom.trim() : CONFIGURATION_ENTREPRISE_PAR_DEFAUT.nom,
    adresse: typeof saved.adresse === 'string' ? saved.adresse.trim() : CONFIGURATION_ENTREPRISE_PAR_DEFAUT.adresse,
    telephonePdgWhatsapp: typeof saved.telephonePdgWhatsapp === 'string' ? saved.telephonePdgWhatsapp.trim() : '',
    debutJour: validTime(saved.debutJour, '06:00'),
    finJour: validTime(saved.finJour, '18:00'),
    debutNuit: validTime(saved.debutNuit, '18:00'),
    finNuit: validTime(saved.finNuit, '06:00'),
    tarifGardiennageNuit: typeof saved.tarifGardiennageNuit === 'number' && Number.isFinite(saved.tarifGardiennageNuit) && saved.tarifGardiennageNuit >= 0
      ? saved.tarifGardiennageNuit
      : 0,
    categoriesVehicules: validCategories,
    servicesLavage: normaliserServices(saved.servicesLavage, validCategories)
  };
};

export const determinerPeriodeTravail = (
  date: Date,
  configuration: ConfigurationEntreprise
): 'JOUR' | 'NUIT' => {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const isWithin = (start: string, end: string) => {
    const startMinutes = toMinutes(start);
    const endMinutes = toMinutes(end);
    return startMinutes < endMinutes
      ? currentMinutes >= startMinutes && currentMinutes < endMinutes
      : currentMinutes >= startMinutes || currentMinutes < endMinutes;
  };
  return isWithin(configuration.debutJour, configuration.finJour) ? 'JOUR' : 'NUIT';
};
