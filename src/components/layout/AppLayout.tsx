import React from 'react';
import { Header } from './Header';
import { BottomNavigation } from './BottomNavigation';
import { useFinance } from '../../context/FinanceContext';
import { DashboardView } from '../dashboard/DashboardView';
import { TransactionsView } from '../transactions/TransactionsView';
import { AgentView } from '../agent/AgentView';
import { PlanningView } from '../planning/PlanningView';
import { ProfileView } from '../profile/ProfileView';
import { TransactionModal } from '../transactions/TransactionModal';

export const AppLayout: React.FC = () => {
  const { activeTab, isLoading } = useFinance();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#B7FF35] text-black flex items-center justify-center font-extrabold text-xl animate-pulse">
            F
          </div>
          <span className="text-xs font-semibold text-[#A1A1A1] tracking-wider uppercase">
            Carregando FINORA AI...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white flex justify-center font-sans">
      {/* Mobile-first maximum width wrapper */}
      <div className="w-full max-w-md min-h-screen relative flex flex-col bg-[#080808] border-x border-[#1a1a1a]/60 shadow-2xl">
        {/* Subtle Ambient Glowing Gradients from reference image */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-96 pointer-events-none glow-ambient-top z-0" />
        <div className="absolute top-1/3 right-0 w-60 h-60 bg-[#B7FF35]/5 rounded-full blur-3xl pointer-events-none z-0" />

        {/* Top Header */}
        <Header />

        {/* Main Content Area with bottom padding to ensure zero content overlap */}
        <main className="flex-1 relative z-10 pb-28">
          {activeTab === 'home' && <DashboardView />}
          {activeTab === 'transactions' && <TransactionsView />}
          {activeTab === 'agent' && <AgentView />}
          {activeTab === 'planning' && <PlanningView />}
          {activeTab === 'profile' && <ProfileView />}
        </main>

        {/* Global Transaction Modal (Add/Edit) */}
        <TransactionModal />

        {/* Floating Bubble Bottom Navigation */}
        <BottomNavigation />
      </div>
    </div>
  );
};
