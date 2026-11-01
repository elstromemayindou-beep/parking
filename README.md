# N.O.B BUSINESS

Application web de gestion d’un établissement automobile. Le poste du gérant centralise le parking, le lavage, le garage, la caisse, les dépenses, les dettes, les stocks, l’équipe et les rapports.

## Stack

- React, TypeScript et Vite
- Supabase Auth pour les comptes
- PostgreSQL via Supabase pour les données
- Row Level Security (RLS) pour isoler les données par établissement

Les données d’activité ne sont pas préchargées : un nouvel établissement commence vide. Les applications mobiles des agents et des clients, la reconnaissance de plaques et les intégrations d’envoi externe ne sont pas encore connectées.

## Parcours du gérant

Depuis le tableau de bord, les indicateurs du bandeau supérieur sont des informations de suivi. Les cartes **Espaces de travail** ouvrent, elles, le module complet : par exemple, **Garage** affiche le suivi des ordres et les étapes de diagnostic, devis et réparation.

Le gérant peut saisir manuellement une entrée depuis **Parking → Enregistrer une entrée**, notamment si l’appareil d’un agent n’est pas disponible. Pour une fiche véhicule conservée dans le fichier clients et réutilisée lors d’une réception atelier, utilisez **Garage → Enregistrer un véhicule**. Le nouveau véhicule peut ensuite être sélectionné à l’ouverture d’un ordre de réparation.

Dans **Lavage**, les véhicules suivent les étapes attente, en cours et prêts. Une prestation peut être affectée à plusieurs laveurs ; la commission prévue est partagée entre eux. La clôture demande de cocher les opérations de la formule et de saisir les quantités de consommables réellement utilisées ; ces quantités sont déduites du stock de la succursale. Un laveur peut signaler un produit fini depuis un lavage en cours, puis le gérant peut remettre une unité du stock magasin ou refuser la demande. Le gérant peut annuler une prestation avec un motif ; si elle a été encaissée, le remboursement est inscrit comme mouvement négatif en caisse et le ticket reste consultable.

Les services acceptent les voitures et les motos. Le module **Parking** enregistre les sorties normales ou un arrêt motivé, avec ou sans encaissement. Le module **Caisse** permet au gérant de consulter l’historique des paiements et d’annuler une transaction avec motif ; l’écriture de remboursement est conservée au lieu de supprimer le reçu original. Les remboursements apparaissent également dans le journal imprimable des rapports.

Le module **Stocks** conserve les informations de fournisseur, seuil et emplacement, ainsi qu’un historique des entrées, consommations, transferts et ajustements motivés. La liste des clients fidèles est calculée à partir des prestations terminées liées à leur fiche client ; le seuil est de cinq services. Lorsqu’un employé est radié avec motif, le dossier affiche le prorata indicatif du salaire de base selon les jours calendaires du mois ; ce calcul ne déclenche pas un paiement automatique.

Pour les interventions à domicile, les boutons de contact ouvrent le téléphone, une conversation WhatsApp préremplie ou un itinéraire Google Maps à partir du numéro et de l’adresse enregistrés.

Dans **Équipe**, **Ajouter un employé** permet de saisir une fiche RH détaillée : coordonnées, adresse, date de naissance, pièce d’identité, poste, contrat, date d’embauche, salaire, qualifications, notes et contact d’urgence. Les champs privés doivent être renseignés uniquement selon les besoins et les obligations applicables.

Dans **Paramètres → N.O.B et catalogue lavage**, le gérant peut renseigner l’identité de N.O.B BUSINESS, son adresse, le WhatsApp du PDG et les horaires jour/nuit. Il peut aussi gérer les catégories de véhicules et le catalogue des prestations de lavage, avec un prix par catégorie. Dans **Lavage**, plusieurs prestations peuvent être choisies pour un même véhicule ; le total convenu peut être ajusté, sans descendre sous 1 000 FCFA. Le ticket conserve les prestations et les tarifs appliqués au moment de la création. Ces réglages sont enregistrés par établissement dans `branch_data`. Le module **Tarifs et profil** conserve également le tarif du parking et le forfait de main-d’œuvre par défaut du garage. Le profil du gérant est rattaché à son identifiant Supabase et synchronisé avec une fiche **Gérant** dans l’équipe ; les montants déjà enregistrés sur les prestations et devis ne sont pas recalculés.

Les espaces **Parking**, **Lavage**, **Salon** et **Garage** proposent une navigation interne vers la caisse, les dépenses, le personnel, les stocks et les rapports limités à l’activité choisie. Le nom de l’espace et de la page active reste affiché dans l’en-tête ; pour changer d’activité, revenez au tableau de bord et ouvrez son espace. Depuis le tableau de bord, les modules communs (**Caisse**, **Stocks**, **Personnel**, **Dépenses**, **Rapports**) s’ouvrent en vue globale, sans sélecteur de département sur ces pages. La clôture physique reste globale, même quand la caisse d’une activité est affichée. Les opérations récentes sont étiquetées automatiquement, tandis que les anciens stocks et factures sont classés à partir de leur catégorie ou de leur type de service quand c’est possible.

Le **Salon** n’enregistre pas les clients ni chaque prestation individuellement. À la fin de la journée, le gérant saisit une seule recette journalière, ventilée par moyen de paiement, et choisit le coiffeur auquel attribuer la commission de 40 %. Le total crée une entrée unique dans la caisse globale et la commission correspondante dans la paie. Une seule recette active peut être enregistrée par jour ; pour la corriger, annulez-la avec un motif dans la caisse, puis saisissez le récapitulatif corrigé. Le stock salon est géré dans Stocks avec le filtre **Salon**.

Au **Parking**, pendant le service de nuit configuré, le gérant peut ajouter un forfait de gardiennage au ticket. Un lavage demandé en plus reste une prestation distincte : créez également le ticket dans **Lavage** ; les deux encaissements sont consolidés dans la caisse globale et gardent leurs activités respectives.

Les fiches RH permettent de rattacher chaque employé à un département (dont le poste **Gardien**, affecté au parking) et de choisir un rythme de paie : les 1er et 15 (montants saisis selon le paiement réellement remis), ou une avance plafonnée à 25 % suivie du solde en fin de mois. Le gérant peut enregistrer les paiements ; ils apparaissent comme dépenses de salaires et commissions et sont limités au net mensuel restant.

Le module **Dépenses** permet de ventiler les coûts par activité, notamment l’électricité, le carburant et le dépannage du groupe électrogène. Les dépenses saisies par un autre rôle restent en attente ; seul le gérant peut autoriser leur imputation à la caisse. **Rapports** propose des synthèses financières, administratives et de stocks sur la journée, les sept derniers jours ou le mois en cours, par activité ou globalement. Le résumé à partager ouvre WhatsApp avec le rapport sélectionné prérempli au numéro du PDG ; l’envoi doit être confirmé manuellement.

Le module **Lavage → Lavage à domicile** permet au gérant de planifier une intervention avec adresse, date, heure et consignes, d’affecter un laveur, de vérifier un kit mobile et de suivre les étapes jusqu’à l’arrivée puis la fin de prestation. L’itinéraire ouvre une recherche d’adresse dans Google Maps. Ce parcours est actuellement dans l’application du gérant : il ne constitue pas encore une application mobile dédiée au laveur. Les prises de photos avant/après, les notifications externes, l’encaissement mobile, le mode hors ligne et la synchronisation différée restent à connecter.

## Mise en route

1. Créez un projet Supabase et copiez `.env.example` vers `.env.local`.
2. Renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` avec les valeurs du projet.
3. Dans l’éditeur SQL Supabase, exécutez `supabase/migrations/20261028000000_initial_schema.sql`.
4. Installez les dépendances avec `bun install` ou `npm install`.
5. Lancez `npm run desktop:dev` pour ouvrir l’application dans une fenêtre de bureau pendant le développement.
6. Dans l’application, créez un compte ou connectez-vous, puis créez l’établissement à gérer.

La connexion à un compte est nécessaire pour accéder aux modules. Un nouvel établissement démarre avec des collections vides : aucune donnée d’exemple ou simulation n’est injectée. Lors de la première utilisation du module **Parking**, configurez le nombre réel de places pour les zones A, B, VIP et zone libre ; cette configuration est enregistrée pour l’établissement dans Supabase et nécessaire avant d’enregistrer une entrée. La clé publishable est destinée au client et doit être protégée par les politiques RLS de la migration. Ne placez jamais une clé `service_role`, un mot de passe de base de données ou un secret serveur dans une variable `VITE_`.

## Installation sur un PC Windows

L’application de bureau est empaquetée avec Electron : le PC du gérant n’a pas besoin de Node.js ni d’un navigateur séparé. Pour générer l’installateur Windows :

1. Configurez `.env.local` avec l’URL Supabase et la clé publishable du projet.
2. Depuis Windows, lancez `npm run desktop:dist`.
3. Récupérez l’installateur `N.O.B BUSINESS Setup <version>.exe` dans le dossier `release/`, puis exécutez-le sur le PC cible.

L’installateur utilise le logo N.O.B BUSINESS, crée des raccourcis dans le menu Démarrer et sur le bureau et permet de choisir le dossier d’installation. Il n’est pas signé numériquement : Windows peut afficher un avertissement SmartScreen. L’application a besoin d’Internet pour se connecter à Supabase et rechercher les mises à jour. Toute modification des variables Supabase nécessite de générer un nouvel installateur. La clé publishable est incluse dans l’application installée ; elle ne doit jamais être une clé secrète ou `service_role`. Pour bénéficier des mises à jour automatiques, installez le setup téléchargé depuis une release GitHub créée par le workflow ; un build local sans dépôt GitHub configuré ne connaît pas le flux de mise à jour.

### Publication et mises à jour automatiques

Le workflow `.github/workflows/release.yml` construit l’installateur Windows et publie les fichiers de mise à jour dans une release GitHub publique à chaque tag `v*`. Pour publier une nouvelle version :

1. Envoyez le projet vers un dépôt GitHub public et assurez-vous que les Actions peuvent créer des releases (`contents: write` est déjà déclaré dans le workflow).
2. Dans **Settings → Secrets and variables → Actions → Variables**, ajoutez `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`, avec les mêmes valeurs publiques que dans `.env.local`. Ne configurez jamais une clé `service_role`.
3. Incrémentez `version` dans `package.json`.
4. Créez et poussez le tag correspondant, par exemple `v1.0.3` si `package.json` indique `1.0.3` : `git tag v1.0.3`, puis `git push origin v1.0.3`.
5. Vérifiez la fin du workflow dans l’onglet **Actions** du dépôt. La release contient l’installateur et le manifeste utilisés par l’application.

Les versions installées avec l’ancien setup **1.0.0** ne contiennent pas le module de mise à jour ; les versions ultérieures le recherchent au démarrage. Après publication d’une release GitHub valide, l’application télécharge la nouvelle version et propose de redémarrer pour l’installer. Une modification locale n’est pas publiée automatiquement : elle doit d’abord être incluse dans une release GitHub. Les postes doivent avoir accès à Internet et le dépôt doit rester public pour permettre le téléchargement sans secret embarqué.

## Persistance

Les adhésions et établissements sont stockés dans `branches` et `branch_members`. Les collections métier sont persistées dans `branch_data`, une ligne JSONB par collection et par établissement. Cette première couche permet à l’espace du gérant de lire et d’écrire réellement dans PostgreSQL, sans données d’exemple. La normalisation des collections métier et les droits fins par rôle restent à mettre en place avant d’ouvrir l’accès aux applications agents ou clients.

Les migrations versionnées sont conservées dans `supabase/migrations/`.
