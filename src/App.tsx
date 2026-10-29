/**
 * AutoGestion Pro v3.0 - Main Application Entrypoint
 * Integrated Automobile Complex Enterprise OS
 * Reference: AGP-SPEC-2026-V3
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DesktopHeader } from './components/DesktopHeader';
import { LiveWidgetsBar } from './components/LiveWidgetsBar';
import { DashboardHub } from './components/DashboardHub';
import { ParkingModule } from './components/modules/ParkingModule';
import { LavageModule } from './components/modules/LavageModule';
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
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { WorkspaceGate } from './components/WorkspaceGate';

const MainLayout: React.FC = () => {
  const { activeModule, notification, authStatus } = useApp();

  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [helpSpecsOpen, setHelpSpecsOpen] = useState(false);

  if (authStatus !== 'ready') {
    return <WorkspaceGate />;
  }

  return (
    <div className="app-canvas min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* 1. Desktop Executive Window Bar & Role Switcher */}
      <DesktopHeader
        onOpenAudit={() => setAuditModalOpen(true)}
        onOpenHelp={() => setHelpSpecsOpen(true)}
      />
      <DesktopUpdateNotice />

      {/* 2. Live Dynamic Widgets Bar (Section 2.2) */}
      <LiveWidgetsBar />

      {/* 3. Main Workspace Area */}
      <main className="flex-1 pb-16">
        {activeModule === 'HUB' && (
          <DashboardHub />
        )}

        {activeModule === 'PARKING' && <ParkingModule />}
        {activeModule === 'LAVAGE' && <LavageModule />}
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
