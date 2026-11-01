import React, { useState } from 'react';
import { Building2, Car, CircleDollarSign, Database, LoaderCircle, LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const WorkspaceGate: React.FC = () => {
  const {
    authStatus,
    authError,
    userEmail,
    signIn,
    signUp,
    signOut,
    createBranch
  } = useApp();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branchName, setBranchName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setError('');
    setBusy(true);
    try {
      await action();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Une erreur inattendue est survenue.');
    } finally {
      setBusy(false);
    }
  };

  const submitAuth = (event: React.FormEvent) => {
    event.preventDefault();
    void run(() => isSignUp ? signUp(email, password) : signIn(email, password));
  };

  const submitBranch = (event: React.FormEvent) => {
    event.preventDefault();
    void run(() => createBranch({ name: branchName, city, country, address, phone }));
  };

  if (authStatus === 'loading') {
    return (
      <GateFrame>
        <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-4 text-sm text-slate-600">Connexion à l’espace de gestion…</p>
      </GateFrame>
    );
  }

  if (authStatus === 'unconfigured') {
    return (
      <GateFrame>
        <Database className="mx-auto h-9 w-9 text-blue-600" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Connecter la base de données</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Ajoutez l’URL de votre projet Supabase et sa clé publishable dans le fichier <code>.env.local</code>,
          puis appliquez la migration SQL du dossier <code>supabase/migrations</code>.
        </p>
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-left text-xs leading-5 text-amber-900">
          N’ajoutez jamais de clé <code>service_role</code> ou de mot de passe de base de données dans l’application web.
        </p>
      </GateFrame>
    );
  }

  if (authStatus === 'error') {
    return (
      <GateFrame>
        <Database className="mx-auto h-9 w-9 text-rose-600" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Connexion à Supabase impossible</h1>
        <p className="mt-2 text-sm text-slate-600">{authError || 'Vérifiez la configuration et réessayez.'}</p>
        {userEmail && <p className="mt-2 text-xs text-slate-500">Compte : {userEmail}</p>}
        <button onClick={() => void signOut()} className="mt-5 text-sm font-semibold text-blue-700 hover:text-blue-800">
          Se déconnecter
        </button>
      </GateFrame>
    );
  }

  if (authStatus === 'signed_out') {
    return (
      <GateFrame>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">{isSignUp ? 'Nouveau compte' : 'Espace sécurisé'}</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">{isSignUp ? 'Créer votre accès' : 'Bon retour'}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{isSignUp ? 'Configurez votre accès gérant pour commencer.' : 'Connectez-vous pour retrouver votre espace de gestion.'}</p>
        <form onSubmit={submitAuth} className="mt-6 space-y-4 text-left">
          <label className="block text-sm font-medium text-slate-700">
            Adresse e-mail
            <input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Mot de passe
            <input required minLength={8} type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} value={password} onChange={event => setPassword(event.target.value)} className={inputClass} />
          </label>
          {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <button disabled={busy} className="button-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : isSignUp ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
            {isSignUp ? 'Créer le compte' : 'Se connecter'}
          </button>
        </form>
        <button type="button" onClick={() => { setError(''); setIsSignUp(value => !value); }} className="mt-4 text-sm font-medium text-blue-700 hover:text-blue-800">
          {isSignUp ? 'J’ai déjà un compte' : 'Créer le premier compte'}
        </button>
      </GateFrame>
    );
  }

  return (
    <GateFrame>
      <Building2 className="mx-auto h-9 w-9 text-blue-600" />
      <h1 className="mt-4 text-xl font-bold text-slate-900">Créer votre établissement</h1>
      <p className="mt-2 text-sm text-slate-600">Aucune succursale n’est encore associée à ce compte. Créez le site à gérer.</p>
      <form onSubmit={submitBranch} className="mt-6 space-y-3 text-left">
        <label className="block text-sm font-medium text-slate-700">Nom de l’établissement<input required value={branchName} onChange={event => setBranchName(event.target.value)} className={inputClass} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-slate-700">Ville<input required value={city} onChange={event => setCity(event.target.value)} className={inputClass} /></label>
          <label className="block text-sm font-medium text-slate-700">Pays<input required value={country} onChange={event => setCountry(event.target.value)} className={inputClass} /></label>
        </div>
        <label className="block text-sm font-medium text-slate-700">Adresse (facultatif)<input value={address} onChange={event => setAddress(event.target.value)} className={inputClass} /></label>
        <label className="block text-sm font-medium text-slate-700">Téléphone (facultatif)<input value={phone} onChange={event => setPhone(event.target.value)} className={inputClass} /></label>
        {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <button disabled={busy} className="button-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
          Créer l’établissement
        </button>
        <button type="button" onClick={() => void signOut()} className="w-full py-2 text-sm text-slate-500 hover:text-slate-800">Se déconnecter ({userEmail})</button>
      </form>
    </GateFrame>
  );
};

const inputClass = 'mt-1 block w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/80';

const GateFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main className="gate-canvas relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 py-10 sm:p-8">
    <span className="ambient-orb -left-40 -top-32 -z-10 h-[28rem] w-[28rem] bg-blue-200/50" />
    <span className="ambient-orb -bottom-48 -right-36 -z-10 h-[34rem] w-[34rem] bg-indigo-200/40" />
    <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
      <aside className="order-2 px-2 text-center lg:order-1 lg:px-0 lg:text-left">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-700/25 lg:mx-0">
          <Car className="h-8 w-8" />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-blue-800">N.O.B BUSINESS · Espace gérant</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl">
          Votre établissement,<br />
          <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">enfin sous contrôle.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 lg:mx-0">
          Une vue claire pour piloter la caisse, suivre les opérations et organiser votre activité automobile au quotidien.
        </p>
        <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
          <Feature icon={<CircleDollarSign className="h-4 w-4" />} title="Caisse prioritaire" detail="Recettes, dépenses et clôture réunies." />
          <Feature icon={<Building2 className="h-4 w-4" />} title="Un seul espace" detail="Garage, lavage, parking et stocks." />
          <Feature icon={<ShieldCheck className="h-4 w-4" />} title="Données maîtrisées" detail="Accès sécurisé par votre compte." />
        </div>
      </aside>
      <section className="glass-panel order-1 w-full rounded-[1.75rem] border border-white/80 bg-white/80 p-6 text-center shadow-2xl shadow-blue-950/10 sm:p-9 lg:order-2">
        {children}
      </section>
    </div>
  </main>
);

const Feature: React.FC<{ icon: React.ReactNode; title: string; detail: string }> = ({ icon, title, detail }) => (
  <div className="glass-panel rounded-2xl border border-white/70 bg-white/60 p-4">
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">{icon}</div>
    <h2 className="mt-3 text-sm font-bold text-slate-900">{title}</h2>
    <p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p>
  </div>
);
