import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveModule, DepartementActivite } from '../../types';
import {
  ArrowRight,
  BarChart3,
  Boxes,
  CarFront,
  CircleDollarSign,
  Scissors,
  Sparkles,
  TrendingDown,
  UsersRound,
  Wrench
} from 'lucide-react';

interface ActivityWorkspaceNavProps {
  department: DepartementActivite;
  activityModule: ActiveModule;
}

const links: { module: ActiveModule; label: string; icon: React.ElementType; description: string }[] = [
  { module: 'CAISSE', label: 'Caisse', icon: CircleDollarSign, description: 'Encaissements et solde' },
  { module: 'DEPENSES', label: 'Dépenses', icon: TrendingDown, description: 'Sorties et validations' },
  { module: 'EMPLOYES', label: 'Personnel', icon: UsersRound, description: 'Équipe et paie' },
  { module: 'STOCKS', label: 'Stocks', icon: Boxes, description: 'Articles et mouvements' },
  { module: 'RAPPORTS', label: 'Rapports', icon: BarChart3, description: 'Résultats de l’activité' }
];

const activities: Record<DepartementActivite, { label: string; icon: React.ElementType }> = {
  PARKING: { label: 'Parking', icon: CarFront },
  LAVAGE: { label: 'Lavage', icon: Sparkles },
  SALON: { label: 'Salon', icon: Scissors },
  MECANIQUE: { label: 'Garage', icon: Wrench }
};

export const ActivityWorkspaceNav: React.FC<ActivityWorkspaceNavProps> = ({ department, activityModule }) => {
  const { activeModule, setActiveModule, setDepartementActif } = useApp();

  const openWorkspace = (module: ActiveModule) => {
    setDepartementActif(department);
    setActiveModule(module);
  };

  const activity = activities[department];
  const ActivityIcon = activity.icon;
  const activityIsActive = activeModule === activityModule;

  return (
    <nav aria-label={`Espace ${activity.label}`} className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-white shadow-md shadow-blue-900/15">
            <ActivityIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-700">Espace de travail</p>
            <p className="truncate text-sm font-extrabold text-slate-900">{activity.label} <span className="font-medium text-slate-500">· gestion dédiée</span></p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 text-[11px] font-semibold text-slate-500 sm:inline-flex">
          Naviguez sans quitter cet espace <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
      <div className="overflow-x-auto px-3 py-3 sm:px-4">
        <div className="flex min-w-max gap-2" role="group" aria-label="Pages de l’activité">
          <NavButton
            label={activity.label}
            description="Opérations de l’activité"
            icon={activity.icon}
            active={activityIsActive}
            onClick={() => openWorkspace(activityModule)}
          />
          <span aria-hidden="true" className="mx-1 my-1 w-px self-stretch bg-slate-200" />
          {links.map(link => (
            <NavButton
              key={link.module}
              label={link.label}
              description={link.description}
              icon={link.icon}
              active={activeModule === link.module}
              onClick={() => openWorkspace(link.module)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
};

const NavButton: React.FC<{
  label: string;
  description: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}> = ({ label, description, icon: Icon, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    title={description}
    className={`group flex min-w-[118px] items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
      active
        ? 'border-blue-700 bg-blue-700 text-white shadow-md shadow-blue-900/15'
        : 'border-transparent bg-slate-50 text-slate-700 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-800'
    }`}
  >
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
      active ? 'bg-white/15 text-white' : 'bg-white text-slate-500 shadow-sm group-hover:text-blue-700'
    }`}>
      <Icon className="h-4 w-4" aria-hidden="true" />
    </span>
    <span className="min-w-0">
      <span className="block text-xs font-extrabold leading-4">{label}</span>
      <span className={`mt-0.5 block text-[9px] font-medium leading-3 ${
        active ? 'text-blue-100' : 'text-slate-500 group-hover:text-blue-600'
      }`}>{description}</span>
    </span>
  </button>
);
