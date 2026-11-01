/**
 * N.O.B BUSINESS - Main Application Entrypoint
 * Integrated Automobile Complex Enterprise OS
 * Reference: AGP-SPEC-2026-V3
 */

import React, { useState } from 'react';
import { ActiveModule, DepartementActivite } from './types';
import { AppProvider, useApp } from './context/AppContext';
import { DesktopHeader } from './components/DesktopHeader';
import { LiveWidgetsBar } from './components/LiveWidgetsBar';
import { DashboardHub } from './components/DashboardHub';
import { ParkingModule } from './components/modules/ParkingModule';
import { LavageModule } from './components/modules/LavageModule';
import { SalonModule } from './components/modules/SalonModule';
import { GarageModule } from './components/modules/GarageModule';
import { CaisseModule } from './components/modules/CaisseModule';
import { EmployesModule } from './components/modules/EmployesModule';
import { StocksModule } from './components/modules/StocksModule';
import { DepensesModule } from './components/modules/DepensesModule';
import { DettesModule } from './components/modules/DettesModule';
import { DemandesModule } from './components/modules/DemandesModule';
import { RapportsModule } from './components/modules/RapportsModule';
import { ParametresModule } from './components/modules/ParametresModule';
import { DesktopUpdateNotice } from './components/DesktopUpdateNotice';
import { ReceiptModal } from './components/common/ReceiptModal';
import { AuditLogModal } from './components/common/AuditLogModal';
import { HelpSpecsModal } from './components/common/HelpSpecsModal';
import { ActivityWorkspaceNav } from './components/common/ActivityWorkspaceNav';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { WorkspaceGate } from './components/WorkspaceGate';

const MainLayout: React.FC = () => {
  const { activeModule, notification, authStatus, departementActif } = useApp();
  const activityModuleByDepartment: Record<DepartementActivite, ActiveModule> = {
    PARKING: 'PARKING',
    LAVAGE: 'LAVAGE',
    SALON: 'SALON',
    MECANIQUE: 'GARAGE'
  } as const;
  const modulesInActivityWorkspace: ActiveModule[] = ['PARKING', 'LAVAGE', 'SALON', 'GARAGE', 'CAISSE', 'DEPENSES', 'EMPLOYES', 'STOCKS', 'RAPPORTS'];
  const moduleTitles: Record<ActiveModule, string> = {
    HUB: 'Tableau de bord',
    PARKING: 'Parking',
    LAVAGE: 'Lavage',
    SALON: 'Salon de coiffure',
    GARAGE: 'Garage / mécanique',
    CAISSE: 'Caisse',
    EMPLOYES: 'Personnel',
    STOCKS: 'Stocks',
    DEPENSES: 'Dépenses',
    DETTES: 'Dettes',
    DEMANDES: 'Demandes',
    RAPPORTS: 'Rapports',
    PARAMETRES: 'Paramètres'
  };
  const activityTitles: Record<DepartementActivite, string> = {
    PARKING: 'Parking',
    LAVAGE: 'Lavage',
    SALON: 'Salon',
    MECANIQUE: 'Garage / mécanique'
  };
  const isActivityWorkspace = departementActif !== 'GLOBAL' && modulesInActivityWorkspace.includes(activeModule);
  const pageTitle = isActivityWorkspace
    ? activeModule === activityModuleByDepartment[departementActif]
      ? activityTitles[departementActif]
      : `${moduleTitles[activeModule]} · ${activityTitles[departementActif]}`
    : activeModule === 'CAISSE'
      ? 'Caisse globale'
      : activeModule === 'STOCKS'
        ? 'Stocks globaux'
        : moduleTitles[activeModule];

  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [helpSpecsOpen, setHelpSpecsOpen] = useState(false);

  if (authStatus !== 'ready') {
    return <WorkspaceGate />;
  }

  return (
    <div className="app-canvas min-h-screen flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* 1. Desktop Executive Window Bar & Role Switcher */}
      <DesktopHeader
        onOpenAudit={() => setAuditModalOpen(true)}
        onOpenHelp={() => setHelpSpecsOpen(true)}
      />
      <DesktopUpdateNotice />

      {/* 2. Live Dynamic Widgets Bar (Section 2.2) */}
      <LiveWidgetsBar />

      {/* 3. Main Workspace Area */}
      <main className="workspace-main flex-1 pb-16">
        {activeModule !== 'HUB' && (
          <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
            <header className="workspace-page-heading mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3.5 sm:px-5">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-700">
                  {isActivityWorkspace ? `Gestion · ${activityTitles[departementActif]}` : 'Pilotage général'}
                </p>
                <h1 className="mt-0.5 truncate text-lg font-extrabold tracking-tight text-white sm:text-xl">{pageTitle}</h1>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-[11px] font-bold text-blue-200">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                {isActivityWorkspace ? `Espace ${activityTitles[departementActif]}` : 'Vue globale'}
              </span>
            </header>
          </div>
        )}
        {isActivityWorkspace && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ActivityWorkspaceNav
              department={departementActif}
              activityModule={activityModuleByDepartment[departementActif]}
            />
          </div>
        )}
        {activeModule === 'HUB' && (
          <DashboardHub />
        )}

        {activeModule === 'PARKING' && <ParkingModule />}
        {activeModule === 'LAVAGE' && <LavageModule />}
        {activeModule === 'SALON' && <SalonModule />}
        {activeModule === 'GARAGE' && <GarageModule />}
        {activeModule === 'CAISSE' && <CaisseModule />}
        {activeModule === 'EMPLOYES' && <EmployesModule />}
        {activeModule === 'STOCKS' && <StocksModule />}
        {activeModule === 'DEPENSES' && <DepensesModule />}
        {activeModule === 'DETTES' && <DettesModule />}
        {activeModule === 'DEMANDES' && <DemandesModule />}
        {activeModule === 'RAPPORTS' && <RapportsModule />}
        {activeModule === 'PARAMETRES' && <ParametresModule />}
      </main>

      {/* Toast Notification */}
      {notification && (
        <div className="glass-panel fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-xs font-semibold text-slate-900 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
          {notification.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Common Modals */}
      <ReceiptModal />
      <AuditLogModal isOpen={auditModalOpen} onClose={() => setAuditModalOpen(false)} />
      <HelpSpecsModal isOpen={helpSpecsOpen} onClose={() => setHelpSpecsOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
