export const renderCanvasPage = () => `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:">
  <title>AutoGestion Pro — Suivi du projet</title>
  <style>
    :root { color-scheme: light; font-family: system-ui, sans-serif; background: #f3f6fb; color: #172033; }
    body { margin: 0; padding: 1.5rem; }
    main { max-width: 880px; margin: auto; }
    header, article { background: white; border: 1px solid #dce4ef; border-radius: 1rem; padding: 1.25rem; }
    header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    header img { width: 3.5rem; height: 3.5rem; }
    h1 { margin: 0; font-size: 1.35rem; }
    h2 { margin: 0 0 .45rem; font-size: 1.05rem; }
    p { margin: .4rem 0 0; color: #526078; line-height: 1.55; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: .85rem; }
    article { display: flex; flex-direction: column; min-height: 155px; }
    .meta { margin-top: .75rem; font-size: .85rem; color: #43536e; }
    .state { margin-top: auto; padding-top: 1rem; font-size: .85rem; font-weight: 650; color: #334155; }
    button { align-self: flex-start; margin-top: .8rem; border: 0; border-radius: .65rem; padding: .65rem .85rem; background: #1d4ed8; color: white; font: inherit; font-size: .85rem; font-weight: 700; cursor: pointer; }
    button:hover { background: #1e40af; }
    button:focus-visible { outline: 3px solid #93c5fd; outline-offset: 3px; }
    [role="status"], [role="alert"] { min-height: 1.4rem; margin: 0 0 1rem; }
    [role="alert"] { color: #9f1239; font-weight: 650; }
    .logo-preview { max-width: 100%; width: 120px; height: 120px; object-fit: contain; margin-top: .8rem; }
    @media (max-width: 520px) { body { padding: .8rem; } header { align-items: flex-start; } }
  </style>
</head>
<body>
  <main>
    <header>
      <img src="/logo.svg" alt="Logo AutoGestion Pro">
      <div>
        <h1>Suivi AutoGestion Pro</h1>
        <p>Tarifs, profil du gérant, identité visuelle et préparation des releases.</p>
      </div>
    </header>
    <p id="feedback" role="status" aria-live="polite"></p>
    <section class="grid" aria-label="État des fonctionnalités et de publication">
      <article>
        <h2>Tarifs des services</h2>
        <p>Réglages par succursale dans Supabase, repris pour les nouveaux lavages, tickets et devis. Les opérations existantes gardent leur montant.</p>
        <p class="state" id="tarifs-state"></p>
        <button type="button" data-task="tarifs">Marquer comme vérifié</button>
      </article>
      <article>
        <h2>Profil du gérant</h2>
        <p>Profil rattaché à l’identifiant Supabase et synchronisé avec une fiche employé unique.</p>
        <p class="state" id="profil-state"></p>
        <button type="button" data-task="profil">Marquer comme vérifié</button>
      </article>
      <article>
        <h2>Logo de l’application</h2>
        <p>Le même logo est utilisé dans l’en-tête, le navigateur, l’application Windows et l’installateur.</p>
        <img class="logo-preview" src="/logo.svg" alt="Aperçu du logo AutoGestion Pro">
        <p class="meta" id="logo-assets"></p>
        <p class="state" id="logo-state"></p>
        <button type="button" data-task="logo">Marquer comme vérifié</button>
      </article>
      <article>
        <h2>Publication Windows</h2>
        <p id="release-description">Chargement de la configuration de publication…</p>
        <p class="meta" id="release-version"></p>
        <p class="state" id="release-state"></p>
        <button type="button" data-task="release">Marquer comme vérifié</button>
      </article>
    </section>
  </main>
  <script src="/client.js" defer></script>
</body>
</html>`;

export const renderCanvasClient = () => `const tasks = ['tarifs', 'profil', 'logo', 'release'];
const feedback = document.getElementById('feedback');
const labels = {
  tarifs: 'Configuration Supabase',
  profil: 'Compte Supabase et fiche employé',
  logo: 'Icône SVG et Windows',
  release: 'Release GitHub publique'
};

const load = async () => {
  const response = await fetch('/api/status');
  if (!response.ok) throw new Error('Impossible de charger l’état du projet.');
  const data = await response.json();
  document.getElementById('logo-assets').textContent =
    (data.svgLogoReady ? 'Logo de l’application présent' : 'Logo SVG absent') + ' · ' +
    (data.windowsIconReady ? 'Icône Windows présente' : 'Icône Windows absente');
  document.getElementById('release-description').textContent = data.workflowReady
    ? 'Le workflow de release est présent. Poussez un tag correspondant à la version pour publier le setup.'
    : 'Le workflow de release est absent.';
  document.getElementById('release-version').textContent = 'Version du projet : ' + data.version;
  for (const task of tasks) {
    const done = data.checklist[task];
    document.getElementById(task + '-state').textContent = done ? 'Vérifié' : 'À vérifier';
    const button = document.querySelector('[data-task="' + task + '"]');
    button.textContent = done ? 'Annuler la vérification' : 'Marquer comme vérifié';
    button.setAttribute('aria-pressed', String(done));
    button.setAttribute('aria-label', (done ? 'Annuler : ' : 'Vérifier : ') + labels[task]);
  }
};

for (const button of document.querySelectorAll('button[data-task]')) {
  button.addEventListener('click', async () => {
    const task = button.dataset.task;
    const checked = button.getAttribute('aria-pressed') !== 'true';
    try {
      const response = await fetch('/api/checklist', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ task, checked })
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Enregistrement refusé.');
      await load();
      feedback.setAttribute('role', 'status');
      feedback.textContent = 'État mis à jour.';
    } catch (error) {
      feedback.setAttribute('role', 'alert');
      feedback.textContent = error.message;
    }
  });
}

load().catch(error => {
  feedback.setAttribute('role', 'alert');
  feedback.textContent = error.message;
});`;
