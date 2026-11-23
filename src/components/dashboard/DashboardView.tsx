import React from 'react';
import { BalanceCard } from './BalanceCard';
import { QuickActions } from './QuickActions';
import { SpendingChart } from './SpendingChart';
import { MonthlyBudgetsCard } from './MonthlyBudgetsCard';
import { ContextualInsightCard } from './ContextualInsightCard';
import { AiInviteCard } from './AiInviteCard';
import { RecentActivity } from './RecentActivity';

export const DashboardView: React.FC = () => {
  return (
    <div className="space-y-1 animate-fadeIn">
      {/* 1. Visão Financeira (Hero Balance & Month Results) */}
      <BalanceCard />

      {/* 2. Ações Rápidas */}
      <QuickActions />

      {/* 3. Card de Análise Contextual com Inteligência */}
      <ContextualInsightCard />

      {/* 4. Gráfico de Fluxo de Gastos com Recharts */}
      <SpendingChart />

      {/* 5. Acesso Convidativo ao Agente IA */}
      <AiInviteCard />

      {/* 6. Orçamento Mensal & Progresso */}
      <MonthlyBudgetsCard />

      {/* 7. Atividades Recentes e Contas */}
      <RecentActivity />
    </div>
  );
};
