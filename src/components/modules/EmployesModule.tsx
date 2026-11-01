/**
 * N.O.B BUSINESS - Module 5: Employés, RH & Discipline
 * Requirements:
 * - RF-55 : Fiches employés avec calcul du salaire net (Base + Primes - Amendes)
 * - RF-58 : Saisie des retenues/amendes motivées (retards, erreurs caisse, dégradation)
 * - RF-60 : Gestion des décisions disciplinaires (Avertissement, Suspension, Radiation)
 * - Pointage biométrique / présence en temps réel
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Depense, Employe, PrimeAmende } from '../../types';
import {
  Users2,
  UserPlus,
  Clock,
  Award,
  AlertOctagon,
  FileText,
  CheckCircle2,
  XCircle,
  Coins,
  Search,
  Filter,
  LogIn,
  LogOut,
  History,
  CalendarClock,
  ShieldCheck,
  UserCheck,
  Mail,
  MapPin,
  MessageCircle,
  Phone
} from 'lucide-react';
import { getTelephoneUrl, getWhatsAppUrl } from '../../utils/contactLinks';

export const EmployesModule: React.FC = () => {
  const {
    employes,
    primesAmendes,
    depenses,
    pointerEmploye,
    ajouterEmploye,
    ajouterPrimeAmende,
    changerStatutEmploye,
    radierEmploye,
    enregistrerPaiementEmploye,
    formatCurrency,
    setReceiptModalData,
    showNotification,
    logsAudit,
    departementActif,
    userRole
  } = useApp();

  const [selectedEmploye, setSelectedEmploye] = useState<Employe | null>(null);
  const [primeAmendeModalOpen, setPrimeAmendeModalOpen] = useState(false);
  const [bulletinModalOpen, setBulletinModalOpen] = useState(false);
  const [payrollModalOpen, setPayrollModalOpen] = useState(false);
  const [payrollType, setPayrollType] = useState<NonNullable<Depense['type_paie']>>('PAIEMENT');
  const [payrollAmount, setPayrollAmount] = useState(0);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [radiationModalOpen, setRadiationModalOpen] = useState(false);
  const [radiationMotif, setRadiationMotif] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const initialEmployeeForm = {
    nom_complet: '',
    telephone: '',
    poste: 'Laveur' as Employe['poste'],
    departement: 'LAVAGE' as NonNullable<Employe['departement']>,
    rythme_paie: '1_15' as NonNullable<Employe['rythme_paie']>,
    salaire_base: 250000,
    date_embauche: new Date().toISOString().slice(0, 10),
    email: '',
    adresse: '',
    date_naissance: '',
    numero_piece_identite: '',
    contact_urgence_nom: '',
    contact_urgence_telephone: '',
    type_contrat: 'CDI' as NonNullable<Employe['type_contrat']>,
    qualification: '',
    notes_rh: ''
  };
  const [employeeForm, setEmployeeForm] = useState(initialEmployeeForm);
  
  // Clock In/Out Terminal state
  const [terminalEmpId, setTerminalEmpId] = useState<number>(employes[0]?.id || 1);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [currentSecondsTime, setCurrentSecondsTime] = useState<string>('');

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSecondsTime(new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    }, 1000);
    setCurrentSecondsTime(new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));
    return () => clearInterval(timer);
  }, []);

  // Form for prime / amende
  const [acteType, setActeType] = useState<'PRIME' | 'AMENDE'>('PRIME');
  const [acteMontant, setActeMontant] = useState<number>(15000);
  const [acteMotif, setActeMotif] = useState('');
  const [actePreuve, setActePreuve] = useState('');

  const calculateSalaryBreakdown = (emp: Employe) => {
    const payrollMonth = new Date().toISOString().slice(0, 7);
    const actes = primesAmendes.filter(p => p.employe_id === emp.id && !p.annulee && p.date_enregistrement.slice(0, 7) === payrollMonth);
    const totalPrimes = actes.filter(p => p.type_acte === 'PRIME').reduce((sum, p) => sum + p.montant, 0);
    const totalAmendes = actes.filter(p => p.type_acte === 'AMENDE').reduce((sum, p) => sum + p.montant, 0);
    const salaireNet = emp.salaire_base + totalPrimes - totalAmendes;
    return { totalPrimes, totalAmendes, salaireNet, actes };
  };

  const handlePayrollSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedEmploye) return;
    if (enregistrerPaiementEmploye(selectedEmploye.id, Number(payrollAmount), payrollType)) {
      setPayrollModalOpen(false);
      setSelectedEmploye(null);
      setPayrollAmount(0);
    }
  };

  const getProratedSalary = (emp: Employe) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const hireDate = new Date(`${emp.date_embauche}T00:00:00`);
    const startDate = hireDate > monthStart ? hireDate : monthStart;
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const toUtcDay = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const daysPayable = startDate > today ? 0 : Math.round((toUtcDay(today) - toUtcDay(startDate)) / 86400000) + 1;
    return { daysPayable, daysInMonth, amount: Math.round(emp.salaire_base * daysPayable / daysInMonth) };
  };

  const handleRadiationSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedEmploye) return;
    if (radierEmploye(selectedEmploye.id, radiationMotif)) {
      setRadiationModalOpen(false);
      setRadiationMotif('');
      setSelectedEmploye(null);
    }
  };

  const handlePrimeAmendeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmploye) return;
    if (!acteMotif.trim() || !acteMontant) {
      showNotification('Motif et montant obligatoires', 'warning');
      return;
    }

    ajouterPrimeAmende(
      selectedEmploye.id,
      acteType,
      Number(acteMontant),
      acteMotif.trim(),
      actePreuve.trim() || undefined
    );

    setPrimeAmendeModalOpen(false);
    setActeMotif('');
    setActePreuve('');
  };

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.nom_complet.trim() || !employeeForm.telephone.trim() || !employeeForm.date_embauche) {
      showNotification('Nom complet, téléphone et date d’embauche sont obligatoires.', 'warning');
      return;
    }
    if (!Number.isFinite(employeeForm.salaire_base) || employeeForm.salaire_base < 0) {
      showNotification('Le salaire de base doit être un montant positif ou nul.', 'warning');
      return;
    }

    ajouterEmploye({
      ...employeeForm,
      nom_complet: employeeForm.nom_complet.trim(),
      telephone: employeeForm.telephone.trim(),
      email: employeeForm.email.trim() || undefined,
      adresse: employeeForm.adresse.trim() || undefined,
      date_naissance: employeeForm.date_naissance || undefined,
      numero_piece_identite: employeeForm.numero_piece_identite.trim() || undefined,
      contact_urgence_nom: employeeForm.contact_urgence_nom.trim() || undefined,
      contact_urgence_telephone: employeeForm.contact_urgence_telephone.trim() || undefined,
      qualification: employeeForm.qualification.trim() || undefined,
      notes_rh: employeeForm.notes_rh.trim() || undefined
    });
    setEmployeeModalOpen(false);
    setEmployeeForm(initialEmployeeForm);
  };

  const departmentOfEmployee = (employee: Employe) => employee.departement || (
    employee.poste === 'Coiffeur' ? 'SALON'
      : employee.poste === 'Laveur' ? 'LAVAGE'
        : employee.poste === 'Agent Parking' || employee.poste === 'Gardien' ? 'PARKING'
          : employee.poste === 'Mécanicien' || employee.poste === "Chef d'Atelier" ? 'MECANIQUE'
            : undefined
  );
  const filteredEmployes = employes.filter(e =>
    (departementActif === 'GLOBAL' || departmentOfEmployee(e) === departementActif) &&
    (e.nom_complet.toLowerCase().includes(filterQuery.toLowerCase()) ||
      e.poste.toLowerCase().includes(filterQuery.toLowerCase()) ||
      e.telephone.includes(filterQuery) ||
      (e.email || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
      (e.numero_piece_identite || '').toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <Users2 className="w-4 h-4" />
            <span>Module RH, Paie & Discipline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Gestion du Personnel, Primes & Retenues
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Pointage en direct, calcul automatique du salaire net (RF-55) et traçabilité des amendes (RF-58/60).
          </p>
        </div>

        <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEmployeeModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500"
            >
              <UserPlus className="h-4 w-4" /> Ajouter un employé
            </button>
            <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher employé..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Dedicated Clock In / Out Terminal Interface & Payroll Audit Trail */}
      <div className="bg-slate-900 border border-blue-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        {/* Soft blue background glow */}
        <div className="absolute top-0 right-1/4 w-80 h-28 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-0.5">
              <CalendarClock className="w-4 h-4" />
              <span>Badgeuse Virtuelle & Pointage Paie</span>
            </div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>Terminal 'Clock In / Out' (Pointage Horodaté)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-200 border border-blue-600/40">
                Piste d'Audit Active
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enregistre instantanément l'arrivée et le départ des salariés dans la piste d'audit immuable pour le calcul des heures et des retenues de paie.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-center font-mono">
              <span className="text-[10px] text-slate-500 uppercase block font-sans">Heure Système</span>
              <span className="text-sm font-black text-blue-300">{currentSecondsTime || '08:00:00'}</span>
            </div>

            <button
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                showAuditTrail
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Afficher les horodatages récents consignés dans l'audit de paie"
            >
              <History className="w-3.5 h-3.5" />
              <span>Piste d'Audit ({logsAudit.filter(l => l.action === 'CLOCK_IN' || l.action === 'CLOCK_OUT' || l.action === 'POINTAGE_RH').length})</span>
            </button>
          </div>
        </div>

        {/* Action Row: Employee Selection & Clock Buttons */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
          <div className="flex-1 max-w-md">
            <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
              <span>Sélectionner le salarié à pointer :</span>
              {(() => {
                const emp = employes.find(e => e.id === terminalEmpId);
                return emp ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    emp.present_aujourdhui ? 'bg-blue-950 text-blue-200 border border-blue-500/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {emp.present_aujourdhui ? `Présent (${emp.heure_pointage || '07:30'})` : 'Absent'}
                  </span>
                ) : null;
              })()}
            </label>
            <select
              value={terminalEmpId}
              onChange={(e) => setTerminalEmpId(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {employes.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.nom_complet} — {emp.poste} ({emp.present_aujourdhui ? '● Actuellement Présent' : '○ Absent'})
                </option>
              ))}
            </select>
          </div>

          {/* Large Clock In / Out Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => pointerEmploye(terminalEmpId, 'IN')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition hover:scale-105 cursor-pointer"
              title="Enregistrer l'arrivée et consigner le timestamp dans l'audit de paie"
            >
              <LogIn className="w-4 h-4" />
              <span>Clock In (Arrivée)</span>
            </button>

            <button
              onClick={() => pointerEmploye(terminalEmpId, 'OUT')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-blue-500/40 font-extrabold text-xs flex items-center gap-2 shadow-lg transition hover:scale-105 cursor-pointer"
              title="Enregistrer le départ et consigner le timestamp dans l'audit de paie"
            >
              <LogOut className="w-4 h-4" />
              <span>Clock Out (Départ)</span>
            </button>
          </div>
        </div>

        {/* Collapsible Audit Trail Drawer */}
        {showAuditTrail && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
              <span className="flex items-center gap-1.5 text-blue-300">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Journal des Pointages Horodatés pour la Paie (Piste d'Audit)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Immuable • Traçabilité Système</span>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {logsAudit
                .filter(l => l.action === 'CLOCK_IN' || l.action === 'CLOCK_OUT' || l.action === 'POINTAGE_RH')
                .length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500 italic bg-slate-950/60 rounded-xl">
                  Aucun pointage enregistré dans la session courante.
                </div>
              ) : (
                logsAudit
                  .filter(l => l.action === 'CLOCK_IN' || l.action === 'CLOCK_OUT' || l.action === 'POINTAGE_RH')
                  .map(log => (
                    <div key={log.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          log.action === 'CLOCK_IN'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-blue-200 border border-blue-500/30'
                        }`}>
                          {log.action === 'CLOCK_IN' ? 'CLOCK IN' : 'CLOCK OUT'}
                        </span>
                        <div>
                          <span className="font-bold text-white">{log.entite}</span>
                          <p className="text-[11px] text-slate-400">{log.details}</p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 shrink-0">
                        {log.date}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {radiationModalOpen && selectedEmploye && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <form onSubmit={handleRadiationSubmit} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div>
                <h2 className="text-base font-bold text-slate-900">Radier {selectedEmploye.nom_complet}</h2>
                <p className="mt-1 text-xs text-slate-600">La date de radiation est aujourd’hui. Le calcul porte sur les jours calendaires employés ce mois-ci, en tenant compte de la date d’embauche.</p>
              </div>
              {(() => {
                const { daysPayable, daysInMonth, amount } = getProratedSalary(selectedEmploye);
                const percentage = daysInMonth > 0 ? daysPayable / daysInMonth * 100 : 0;
                return (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
                    <p>{daysPayable} / {daysInMonth} jours · {percentage.toFixed(1)} % du salaire mensuel</p>
                    <p className="mt-1 font-black">{formatCurrency(amount)} · base proratisée indicative</p>
                  </div>
                );
              })()}
              <label className="block text-xs font-semibold text-slate-700">
                Motif obligatoire
                <textarea required minLength={3} rows={3} value={radiationMotif} onChange={event => setRadiationMotif(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" />
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setRadiationModalOpen(false)} className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700">Retour</button>
                <button type="submit" className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700">Confirmer la radiation</button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Staff Directory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployes.map((emp) => {
          const { totalPrimes, totalAmendes, salaireNet } = calculateSalaryBreakdown(emp);
          const payrollMonth = new Date().toISOString().slice(0, 7);
          const paidThisMonth = depenses.filter(expense =>
            expense.employe_id === emp.id &&
            expense.categorie === 'Salaires & commissions' &&
            (expense.periode_paie || expense.created_at.slice(0, 7)) === payrollMonth
          ).reduce((sum, expense) => sum + expense.montant, 0);
          const salaryRemaining = Math.max(0, salaireNet - paidThisMonth);

          return (
            <div
              key={emp.id}
              className={`bg-slate-900 border rounded-2xl p-5 space-y-3 transition flex flex-col justify-between ${
                emp.statut === 'ACTIF'
                  ? 'border-slate-800 hover:border-violet-500/50'
                  : emp.statut === 'SUSPENDU'
                  ? 'border-amber-600/50 bg-amber-950/20'
                  : 'border-red-600/50 bg-red-950/20 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-white">
                      {emp.nom_complet}
                    </h3>
                    <p className="text-xs font-semibold text-violet-300">
                      {emp.poste}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    emp.statut === 'ACTIF'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : emp.statut === 'SUSPENDU'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {emp.statut}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-400">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <a href={getTelephoneUrl(emp.telephone) || undefined} className="flex items-center gap-1.5 font-mono hover:text-blue-300">
                      <Phone className="h-3 w-3" /> {emp.telephone}
                    </a>
                    {getWhatsAppUrl(emp.telephone, `Bonjour ${emp.nom_complet}`) && (
                      <a
                        href={getWhatsAppUrl(emp.telephone, `Bonjour ${emp.nom_complet}`) || undefined}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200"
                      >
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </a>
                    )}
                  </div>
                  {emp.email && <a href={`mailto:${emp.email}`} className="flex items-center gap-1.5 hover:text-blue-300"><Mail className="h-3 w-3" />{emp.email}</a>}
                  {emp.adresse && <div className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3 w-3 shrink-0" />{emp.adresse}</div>}
                  <div className="font-mono">🗓️ Embauche: {emp.date_embauche}</div>
                  {emp.type_contrat && <div>Contrat : {emp.type_contrat}</div>}
                  <div>Activité : {departmentOfEmployee(emp) || 'Non rattaché'}</div>
                  <div>Rythme de paie : {emp.rythme_paie === 'AVANCE_25_FIN_MOIS' ? '25 % d’avance, solde fin de mois' : '1er et 15'}</div>
                  {emp.qualification && <div>Qualification : {emp.qualification}</div>}
                  {emp.contact_urgence_nom && (
                    <div className="pt-1">
                      Urgence : {emp.contact_urgence_nom}
                      {emp.contact_urgence_telephone && ` · ${emp.contact_urgence_telephone}`}
                    </div>
                  )}
                </div>

                {/* Clock In / Out Button Interface with Audit Horodatage */}
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Pointage Salarié :</span>
                    {emp.present_aujourdhui ? (
                      <span className="font-mono text-blue-300 font-bold flex items-center gap-1 text-[11px] bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/40">
                        <CheckCircle2 className="w-3 h-3 text-blue-400" />
                        Pointé à {emp.heure_pointage || '07:30'}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium text-[11px]">Non pointé (Absent)</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => pointerEmploye(emp.id, 'IN')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                        emp.present_aujourdhui
                          ? 'bg-blue-950 text-blue-200 border border-blue-600/50 hover:bg-blue-900/70'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                      title="Enregistrer l'arrivée et consigner le timestamp dans la piste d'audit paie"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Clock In</span>
                    </button>

                    <button
                      onClick={() => pointerEmploye(emp.id, 'OUT')}
                      disabled={!emp.present_aujourdhui}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        !emp.present_aujourdhui
                          ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-blue-500/40 cursor-pointer'
                      }`}
                      title="Enregistrer le départ et consigner le timestamp dans la piste d'audit paie"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Clock Out</span>
                    </button>
                  </div>
                </div>

                {/* Salary breakdown preview */}
                <div className="mt-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Salaire de base :</span>
                    <span className="font-mono text-slate-200">{formatCurrency(emp.salaire_base)}</span>
                  </div>
                  <div className="flex justify-between text-blue-300">
                    <span>Primes / Rendement :</span>
                    <span className="font-mono">+{formatCurrency(totalPrimes)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Amendes / Retenues :</span>
                    <span className="font-mono text-slate-300">-{formatCurrency(totalAmendes)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-white pt-1 border-t border-slate-800">
                    <span>Net à Payer (RF-55) :</span>
                    <span className="font-mono text-blue-300">{formatCurrency(salaireNet)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-300">
                    <span>Déjà payé ce mois :</span><span className="font-mono">{formatCurrency(paidThisMonth)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-amber-200">
                    <span>Reste à payer :</span><span className="font-mono">{formatCurrency(salaryRemaining)}</span>
                  </div>
                  <p className="pt-1 text-[10px] text-slate-400">
                    {emp.rythme_paie === 'AVANCE_25_FIN_MOIS'
                      ? `Avance maximale : ${formatCurrency(Math.round(salaireNet * 0.25))} (25 %), puis solde en fin de mois.`
                      : 'Paie prévue les 1er et 15 ; les montants des deux versements restent à définir par le gérant.'}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSelectedEmploye(emp);
                    setPrimeAmendeModalOpen(true);
                  }}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer text-center"
                >
                  ± Prime / Amende
                </button>

                <button
                  onClick={() => {
                    setSelectedEmploye(emp);
                    setBulletinModalOpen(true);
                  }}
                  className="py-1.5 px-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-xs font-bold transition cursor-pointer text-center"
                >
                  Bulletin de Paie
                </button>
                {emp.statut === 'ACTIF' && userRole === 'GERANT' && (
                  <button
                    onClick={() => {
                      const now = new Date();
                      const initialType = emp.rythme_paie === 'AVANCE_25_FIN_MOIS'
                        ? 'AVANCE_25'
                        : now.getDate() <= 15 ? 'PREMIERE_QUINZAINE' : 'SECONDE_QUINZAINE';
                      setSelectedEmploye(emp);
                      setPayrollType(initialType);
                      setPayrollAmount(emp.rythme_paie === 'AVANCE_25_FIN_MOIS'
                        ? Math.min(salaryRemaining, Math.max(0, Math.round(salaireNet * 0.25) - depenses
                          .filter(expense => expense.employe_id === emp.id && expense.type_paie === 'AVANCE_25' && (expense.periode_paie || expense.created_at.slice(0, 7)) === payrollMonth)
                          .reduce((sum, expense) => sum + expense.montant, 0)))
                        : salaryRemaining);
                      setPayrollModalOpen(true);
                    }}
                    className="col-span-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20"
                  >
                    Enregistrer un paiement de paie
                  </button>
                )}
                {emp.statut !== 'RADIE' && (
                  <button
                    onClick={() => {
                      setSelectedEmploye(emp);
                      setRadiationMotif('');
                      setRadiationModalOpen(true);
                    }}
                    className="col-span-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-500/20"
                  >
                    Radier l’employé
                  </button>
                )}
                {emp.statut === 'RADIE' && emp.salaire_prorata_radiation !== undefined && (
                  <div className="col-span-2 rounded-lg bg-rose-950/30 p-2 text-[11px] text-rose-200">
                    Radiation {emp.date_radiation} · Solde de base calculé : {formatCurrency(emp.salaire_prorata_radiation)}
                    {emp.motif_radiation && <span className="block">Motif : {emp.motif_radiation}</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {employeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-create-title"
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between border-b border-slate-700 pb-3">
              <div>
                <h2 id="employee-create-title" className="text-lg font-black text-white">Créer une fiche employé</h2>
                <p className="mt-1 text-xs text-slate-400">Coordonnées, poste, contrat, rémunération et contact d’urgence.</p>
              </div>
              <button type="button" onClick={() => setEmployeeModalOpen(false)} aria-label="Fermer" className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-800">✕</button>
            </div>

            <form onSubmit={handleEmployeeSubmit} className="space-y-5">
              <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-300">Identité et coordonnées</legend>
                <label className="text-xs font-semibold text-slate-300">Nom complet *
                  <input required value={employeeForm.nom_complet} onChange={e => setEmployeeForm(prev => ({ ...prev, nom_complet: e.target.value }))} autoComplete="name" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
                </label>
                <label className="text-xs font-semibold text-slate-300">Téléphone principal *
                  <input required type="tel" value={employeeForm.telephone} onChange={e => setEmployeeForm(prev => ({ ...prev, telephone: e.target.value }))} autoComplete="tel" placeholder="+242 06..." className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
                </label>
                <label className="text-xs font-semibold text-slate-300">Adresse e-mail
                  <input type="email" value={employeeForm.email} onChange={e => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))} autoComplete="email" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
                </label>
                <label className="text-xs font-semibold text-slate-300">Adresse / quartier
                  <input value={employeeForm.adresse} onChange={e => setEmployeeForm(prev => ({ ...prev, adresse: e.target.value }))} autoComplete="street-address" placeholder="Quartier, rue, ville" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
                </label>
                <label className="text-xs font-semibold text-slate-300">Date de naissance
                  <input type="date" value={employeeForm.date_naissance} onChange={e => setEmployeeForm(prev => ({ ...prev, date_naissance: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
                </label>
                <label className="text-xs font-semibold text-slate-300">N° pièce d’identité
                  <input value={employeeForm.numero_piece_identite} onChange={e => setEmployeeForm(prev => ({ ...prev, numero_piece_identite: e.target.value }))} autoComplete="off" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
                </label>
              </fieldset>

              <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-300">Informations professionnelles</legend>
                <label className="text-xs font-semibold text-slate-300">Poste *
                  <select value={employeeForm.poste} onChange={e => {
                    const poste = e.target.value as Employe['poste'];
                    const departement = poste === 'Coiffeur' ? 'SALON'
                      : poste === 'Laveur' ? 'LAVAGE'
                        : poste === 'Agent Parking' || poste === 'Gardien' ? 'PARKING'
                          : poste === 'Mécanicien' || poste === "Chef d'Atelier" ? 'MECANIQUE'
                            : employeeForm.departement;
                    setEmployeeForm(prev => ({ ...prev, poste, departement }));
                  }} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
                    <option>Mécanicien</option><option>Laveur</option><option>Coiffeur</option><option>Agent Parking</option><option>Gardien</option><option>Caissier</option><option>Chef d'Atelier</option><option>Réceptionniste</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-300">Activité de rattachement
                  <select value={employeeForm.departement} onChange={event => setEmployeeForm(prev => ({ ...prev, departement: event.target.value as NonNullable<Employe['departement']> }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
                    <option value="LAVAGE">Lavage</option><option value="SALON">Salon</option><option value="MECANIQUE">Garage / mécanique</option><option value="PARKING">Parking / gardiennage</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-300">Type de contrat
                  <select value={employeeForm.type_contrat} onChange={e => setEmployeeForm(prev => ({ ...prev, type_contrat: e.target.value as NonNullable<Employe['type_contrat']> }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
                    <option value="CDI">CDI</option><option value="CDD">CDD</option><option value="JOURNALIER">Journalier</option><option value="PRESTATAIRE">Prestataire</option><option value="STAGE">Stage</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-300">Date d’embauche *
                  <input required type="date" value={employeeForm.date_embauche} onChange={e => setEmployeeForm(prev => ({ ...prev, date_embauche: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
                </label>
                <label className="text-xs font-semibold text-slate-300">Salaire de base (FCFA) *
                  <input required type="number" min="0" step="1000" value={employeeForm.salaire_base} onChange={e => setEmployeeForm(prev => ({ ...prev, salaire_base: Number(e.target.value) }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
                </label>
                <label className="text-xs font-semibold text-slate-300">Rythme de paie
                  <select value={employeeForm.rythme_paie} onChange={event => setEmployeeForm(previous => ({ ...previous, rythme_paie: event.target.value as NonNullable<Employe['rythme_paie']> }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
                    <option value="1_15">Paiement les 1er et 15</option>
                    <option value="AVANCE_25_FIN_MOIS">Avance de 25 %, solde en fin de mois</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-slate-300 sm:col-span-2">Diplômes, qualifications ou compétences
                  <input value={employeeForm.qualification} onChange={e => setEmployeeForm(prev => ({ ...prev, qualification: e.target.value }))} placeholder="Ex. mécanique auto, permis B, caisse…" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
                </label>
              </fieldset>

              <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-300">Contact en cas d’urgence</legend>
                <label className="text-xs font-semibold text-slate-300">Nom du contact
                  <input value={employeeForm.contact_urgence_nom} onChange={e => setEmployeeForm(prev => ({ ...prev, contact_urgence_nom: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
                </label>
                <label className="text-xs font-semibold text-slate-300">Téléphone du contact
                  <input type="tel" value={employeeForm.contact_urgence_telephone} onChange={e => setEmployeeForm(prev => ({ ...prev, contact_urgence_telephone: e.target.value }))} placeholder="+242 06..." className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
                </label>
                <label className="text-xs font-semibold text-slate-300 sm:col-span-2">Notes RH
                  <textarea rows={2} value={employeeForm.notes_rh} onChange={e => setEmployeeForm(prev => ({ ...prev, notes_rh: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
                </label>
              </fieldset>

              <div className="flex justify-end gap-2 border-t border-slate-700 pt-4">
                <button type="button" onClick={() => setEmployeeModalOpen(false)} className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700">Annuler</button>
                <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"><UserPlus className="h-4 w-4" /> Créer la fiche</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* MODAL 1: ATTRIBUTION PRIME OU AMENDE (RF-58) */}
      {primeAmendeModalOpen && selectedEmploye && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  acteType === 'PRIME' ? 'bg-emerald-600/30 text-emerald-400' : 'bg-red-600/30 text-red-400'
                }`}>
                  {acteType === 'PRIME' ? <Award className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {acteType === 'PRIME' ? 'Attribuer une Prime' : 'Imputer une Retenue / Amende'}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedEmploye.nom_complet} ({selectedEmploye.poste})</p>
                </div>
              </div>
              <button
                onClick={() => setPrimeAmendeModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePrimeAmendeSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setActeType('PRIME')}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    acteType === 'PRIME'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  ✓ Prime Rendement
                </button>

                <button
                  type="button"
                  onClick={() => setActeType('AMENDE')}
                  className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    acteType === 'AMENDE'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  ✕ Amende Disciplinaire
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Montant en FCFA *
                </label>
                <input
                  type="number"
                  required
                  value={acteMontant}
                  onChange={(e) => setActeMontant(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl font-mono text-sm font-bold text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Motif précis de l'acte *
                </label>
                <textarea
                  required
                  rows={2}
                  value={acteMotif}
                  onChange={(e) => setActeMotif(e.target.value)}
                  placeholder={
                    acteType === 'PRIME'
                      ? 'Ex: Rendement exceptionnel 65 véhicules lavés dans le mois'
                      : 'Ex: Retard répété sans justification valable le matin du 28/10'
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Justificatif / Preuve numérique (Optionnel)
                </label>
                <input
                  type="text"
                  value={actePreuve}
                  onChange={(e) => setActePreuve(e.target.value)}
                  placeholder="Ex: Relevé biométrique 08:35 ou Photo dégât carter"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              {/* Status suspension option */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Modifier statut employé :</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => changerStatutEmploye(selectedEmploye.id, 'ACTIF')}
                    className="text-[10px] px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40"
                  >
                    Actif
                  </button>
                  <button
                    type="button"
                    onClick={() => changerStatutEmploye(selectedEmploye.id, 'SUSPENDU')}
                    className="text-[10px] px-2 py-0.5 rounded bg-amber-600/30 text-amber-300 border border-amber-500/40"
                  >
                    Suspendu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrimeAmendeModalOpen(false);
                      setRadiationMotif('');
                      setRadiationModalOpen(true);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-rose-600/30 text-rose-300 border border-rose-500/40"
                  >
                    Radier…
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPrimeAmendeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold cursor-pointer ${
                    acteType === 'PRIME' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                  }`}
                >
                  Enregistrer l'Acte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULLETIN DE SALAIRE INDIVIDUEL (RF-55) */}
      {bulletinModalOpen && selectedEmploye && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Bulletin de Salaire Net (RF-55)</h3>
                  <p className="text-xs text-slate-400">Période : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
              <button
                onClick={() => setBulletinModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {(() => {
              const { totalPrimes, totalAmendes, salaireNet, actes } = calculateSalaryBreakdown(selectedEmploye);
              return (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Nom & Prénom :</span>
                      <span className="font-bold text-white">{selectedEmploye.nom_complet}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Poste / Fonction :</span>
                      <span className="font-semibold text-blue-300">{selectedEmploye.poste}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Salaire de base contractuel :</span>
                      <span className="font-mono text-slate-200">{formatCurrency(selectedEmploye.salaire_base)}</span>
                    </div>
                  </div>

                  {/* Actes list */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 mb-2">Historique des Primes & Amendes du Mois :</h4>
                    {actes.length === 0 ? (
                      <div className="text-xs text-slate-500 italic p-3 text-center bg-slate-950/40 rounded-xl">
                        Aucune prime ni retenue enregistrée.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {actes.map(a => (
                          <div key={a.id} className="p-2 rounded bg-slate-950/80 border border-slate-800 text-xs flex justify-between items-center">
                            <div>
                              <div className="font-medium text-slate-200">{a.motif}</div>
                              <div className="text-[10px] text-slate-500">{a.date_enregistrement}</div>
                            </div>
                            <span className={`font-mono font-bold ${a.type_acte === 'PRIME' ? 'text-blue-300' : 'text-slate-300'}`}>
                              {a.type_acte === 'PRIME' ? '+' : '-'}{formatCurrency(a.montant)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {payrollModalOpen && selectedEmploye && (() => {
                      const { salaireNet } = calculateSalaryBreakdown(selectedEmploye);
                      const payrollMonth = new Date().toISOString().slice(0, 7);
                      const alreadyPaid = depenses.filter(expense =>
                        expense.employe_id === selectedEmploye.id &&
                        expense.categorie === 'Salaires & commissions' &&
                        (expense.periode_paie || expense.created_at.slice(0, 7)) === payrollMonth
                      ).reduce((sum, expense) => sum + expense.montant, 0);
                      const remaining = Math.max(0, salaireNet - alreadyPaid);
                      const advanceUsed = depenses.filter(expense =>
                        expense.employe_id === selectedEmploye.id &&
                        expense.type_paie === 'AVANCE_25' &&
                        (expense.periode_paie || expense.created_at.slice(0, 7)) === payrollMonth
                      ).reduce((sum, expense) => sum + expense.montant, 0);
                      const advanceAvailable = Math.max(0, Math.round(salaireNet * 0.25) - advanceUsed);
                      const isAdvanceSchedule = selectedEmploye.rythme_paie === 'AVANCE_25_FIN_MOIS';
                      return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                          <form onSubmit={handlePayrollSubmit} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
                            <div>
                              <h2 className="text-lg font-bold text-white">Paiement de paie · {selectedEmploye.nom_complet}</h2>
                              <p className="mt-1 text-xs text-slate-400">Mois : {payrollMonth} · Net restant : {formatCurrency(remaining)}</p>
                            </div>
                            <label className="block text-xs font-semibold text-slate-300">Échéance
                              <select value={payrollType} onChange={event => {
                                const selectedType = event.target.value as NonNullable<Depense['type_paie']>;
                                setPayrollType(selectedType);
                                if (selectedType === 'AVANCE_25') setPayrollAmount(advanceAvailable);
                                else if (selectedType === 'SOLDE') setPayrollAmount(remaining);
                                else setPayrollAmount(remaining);
                              }} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white">
                                {isAdvanceSchedule ? (
                                  <>
                                    <option value="AVANCE_25">Avance de 25 % (maximum {formatCurrency(advanceAvailable)})</option>
                                    <option value="SOLDE">Solde de fin de mois</option>
                                  </>
                                ) : (
                                  <>
                                    <option value="PREMIERE_QUINZAINE">Paie du 1er au 15</option>
                                    <option value="SECONDE_QUINZAINE">Paie du 16 à la fin du mois</option>
                                  </>
                                )}
                              </select>
                            </label>
                            <label className="block text-xs font-semibold text-slate-300">Montant réellement payé (FCFA)
                              <input required type="number" min="1" max={remaining} step="1" value={payrollAmount} onChange={event => setPayrollAmount(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 font-mono text-lg font-bold text-white" />
                            </label>
                            <p className="rounded-lg bg-slate-800 p-3 text-xs leading-5 text-slate-300">
                              {isAdvanceSchedule
                                ? `L’avance est plafonnée à 25 % (${formatCurrency(advanceAvailable)} encore disponible). Le solde est calculé après les paiements déjà enregistrés.`
                                : 'Le salaire est payé sur les deux échéances prévues. Aucun partage 50/50 n’est imposé : saisissez le montant réellement remis.'}
                            </p>
                            <div className="flex justify-end gap-2">
                              <button type="button" onClick={() => setPayrollModalOpen(false)} className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200">Annuler</button>
                              <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500">Enregistrer le paiement</button>
                            </div>
                          </form>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Total Net */}
                  <div className="bg-gradient-to-r from-blue-950/70 to-slate-950 p-4 rounded-xl border border-blue-500/40 flex justify-between items-center">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                        Net à Virement / Espèces
                      </span>
                      <span className="text-[10px] text-slate-500">Imputable sur le grand livre des salaires</span>
                    </div>
                    <span className="text-xl font-black text-white font-mono">
                      {formatCurrency(salaireNet)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => setBulletinModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Fermer
                    </button>
                    <button
                      onClick={() => {
                        setBulletinModalOpen(false);
                        setReceiptModalData({ visible: true, type: 'PAIE', data: { employe: selectedEmploye, breakdown: { totalPrimes, totalAmendes, salaireNet, actes } } });
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Imprimer Fiche de Paie
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
