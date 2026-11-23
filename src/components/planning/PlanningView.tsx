import React, { useState } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  Calculator,
  Shield,
  Check,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Goal, CategoryBudget } from '../../types/finance';
import { GoalModal } from './GoalModal';
import { BudgetModal } from './BudgetModal';
import { simulateSavings } from '../../engine/financeEngine';
import confetti from 'canvas-confetti';

export const PlanningView: React.FC = () => {
  const {
    goals,
    budgets,
    summary,
    transactions,
    addFundsToGoal,
    toggleTransactionStatus,
  } = useFinance();

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<string | undefined>();
  const [selectedBudgetLimit, setSelectedBudgetLimit] = useState<number | undefined>();

  // Quick contribute to goal modal
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeAmountStr, setContributeAmountStr] = useState('50');

  // Simulator state
  const [simMonthlySavings, setSimMonthlySavings] = useState(300);
  const [simMonths, setSimMonths] = useState(6);

  const simulation = simulateSavings(
    simMonthlySavings * 100,
    simMonths,
    summary.currentBalance
  );

  // Future pending bills
  const futurePendingBills = transactions
    .filter((tx) => tx.type === 'expense' && tx.status === 'pending')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleAddContribution = async (goalId: string) => {
    const amountFloat = parseFloat(contributeAmountStr);
    if (isNaN(amountFloat) || amountFloat <= 0) return;
    const cents = Math.round(amountFloat * 100);

    await addFundsToGoal(goalId, cents);

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#B7FF35', '#32D583', '#FFFFFF'],
    });

    setContributeGoalId(null);
    setContributeAmountStr('50');
  };

  return (
    <div className="px-5 py-2 space-y-5 animate-fadeIn pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Planejamento</h1>
          <p className="text-xs text-[#A1A1A1]">Metas, limites e compromissos futuros</p>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            setIsGoalModalOpen(true);
          }}
          className="h-10 px-3.5 bg-[#B7FF35] text-black font-bold text-xs rounded-2xl flex items-center gap-1.5 shadow-lg shadow-[#B7FF35]/20 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Meta</span>
        </button>
      </div>

      {/* 1. METAS DE ECONOMIA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-[#B7FF35]" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Metas de Economia ({goals.length})
            </h2>
          </div>
        </div>

        {goals.length === 0 ? (
          <div className="bg-[#151515] border border-[#262626] rounded-3xl p-6 text-center text-xs text-[#666]">
            Nenhuma meta cadastrada. Defina objetivos para acompanhar seu progresso!
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const progress = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
              const isCompleted = goal.currentAmount >= goal.targetAmount;

              return (
                <div
                  key={goal.id}
                  className="bg-[#151515] border border-[#262626] rounded-3xl p-4 shadow-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: goal.color || '#B7FF35' }}
                        />
                        <span className="text-sm font-bold text-white">{goal.title}</span>
                        {isCompleted && (
                          <span className="text-[10px] bg-[#32D583]/20 text-[#32D583] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Check className="w-2.5 h-2.5 stroke-[3]" /> Concluída!
                          </span>
                        )}
                      </div>
                      {goal.deadline && (
                        <div className="text-[10px] text-[#A1A1A1] mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#777]" /> Prazo:{' '}
                          {formatDate(goal.deadline, 'medium')}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setIsGoalModalOpen(true);
                      }}
                      className="text-xs text-[#888] hover:text-white transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-[#202020]"
                    >
                      Editar
                    </button>
                  </div>

                  {/* Numbers Breakdown */}
                  <div className="grid grid-cols-3 gap-2 bg-[#1c1c1c] p-2.5 rounded-2xl border border-[#262626]/50 text-center">
                    <div>
                      <span className="block text-[9px] text-[#888] uppercase">Objetivo</span>
                      <span className="text-xs font-bold text-white">
                        {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-[#888] uppercase">Acumulado</span>
                      <span className="text-xs font-bold text-[#B7FF35]">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-[#888] uppercase">Restante</span>
                      <span className="text-xs font-bold text-[#A1A1A1]">
                        {formatCurrency(remaining)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#A1A1A1]">
                      <span>Progresso</span>
                      <span className="font-bold text-white">{progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#202020] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: goal.color || '#B7FF35',
                        }}
                      />
                    </div>
                  </div>

                  {/* Quick Add Funds Action */}
                  {contributeGoalId === goal.id ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={contributeAmountStr}
                        onChange={(e) => setContributeAmountStr(e.target.value)}
                        placeholder="Valor R$"
                        className="flex-1 bg-[#202020] border border-[#333] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#B7FF35]"
                      />
                      <button
                        onClick={() => handleAddContribution(goal.id)}
                        className="px-3 py-1.5 bg-[#B7FF35] text-black font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setContributeGoalId(null)}
                        className="px-2 py-1.5 text-[#888] hover:text-white text-xs cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setContributeGoalId(goal.id)}
                      className="w-full py-2 bg-[#202020] hover:bg-[#252525] border border-[#2a2a2a] text-xs font-semibold text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#B7FF35]" /> Guardar Dinheiro Nesta Meta
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. LIMITES DE GASTOS POR CATEGORIA */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#38BDF8]" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Tetos por Categoria
            </h2>
          </div>
          <button
            onClick={() => {
              setSelectedBudgetCategory(undefined);
              setSelectedBudgetLimit(undefined);
              setIsBudgetModalOpen(true);
            }}
            className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Definir Limite
          </button>
        </div>

        <div className="bg-[#151515] border border-[#262626] rounded-3xl p-4 shadow-xl space-y-3">
          {summary.categoryExpenses.length === 0 ? (
            <div className="text-center py-2 text-xs text-[#666]">
              Nenhum gasto por categoria para comparar.
            </div>
          ) : (
            summary.categoryExpenses.map((cat) => {
              const hasBudget = cat.budgetLimit && cat.budgetLimit > 0;
              const ratio = hasBudget ? (cat.amount / cat.budgetLimit!) * 100 : 0;

              return (
                <div
                  key={cat.category}
                  onClick={() => {
                    setSelectedBudgetCategory(cat.category);
                    setSelectedBudgetLimit(cat.budgetLimit);
                    setIsBudgetModalOpen(true);
                  }}
                  className="p-3 bg-[#1c1c1c] hover:bg-[#222] border border-[#262626] rounded-2xl space-y-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-bold text-white">{cat.category}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-white">
                        {formatCurrency(cat.amount)}
                      </span>
                      {hasBudget ? (
                        <span className="text-[10px] text-[#888] ml-1">
                          de {formatCurrency(cat.budgetLimit!)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#38BDF8] ml-2 font-medium">
                          + Definir teto
                        </span>
                      )}
                    </div>
                  </div>

                  {hasBudget && (
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-[#292929] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, ratio)}%`,
                            backgroundColor: cat.isOverBudget ? '#FF6464' : '#32D583',
                          }}
                        />
                      </div>
                      {cat.isOverBudget && (
                        <div className="flex items-center gap-1 text-[10px] text-[#FF6464] font-semibold">
                          <AlertTriangle className="w-3 h-3" /> Limite estourado por{' '}
                          {formatCurrency(cat.amount - cat.budgetLimit!)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. CONTAS FUTURAS & COMPROMISSOS PENDENTES */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FBBF24]" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Contas Futuras Pendentes ({futurePendingBills.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-[#FBBF24]">
            Total: {formatCurrency(summary.pendingBillsTotal)}
          </span>
        </div>

        {futurePendingBills.length === 0 ? (
          <div className="bg-[#151515] border border-[#262626] rounded-3xl p-5 text-center text-xs text-[#666]">
            Nenhuma conta pendente no momento. Suas finanças estão em dia!
          </div>
        ) : (
          <div className="space-y-2">
            {futurePendingBills.map((bill) => (
              <div
                key={bill.id}
                className="bg-[#151515] border border-[#262626] rounded-2xl p-3.5 flex items-center justify-between shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FBBF24]/15 border border-[#FBBF24]/30 flex items-center justify-center text-[#FBBF24]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{bill.description}</div>
                    <div className="text-[10px] text-[#A1A1A1] flex items-center gap-1 mt-0.5">
                      <span>Vencimento: {formatDate(bill.date, 'medium')}</span>
                      <span>•</span>
                      <span>{bill.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-[#FF6464]">
                    {formatCurrency(bill.amount)}
                  </div>
                  <button
                    onClick={() => toggleTransactionStatus(bill.id)}
                    className="px-2.5 py-1.5 bg-[#32D583]/20 hover:bg-[#32D583]/30 text-[#32D583] border border-[#32D583]/30 rounded-xl text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Pagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. SIMULADOR INTELIGENTE DE ECONOMIA */}
      <div className="bg-gradient-to-b from-[#181818] to-[#121212] border border-[#2a2a2a] rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-[#B7FF35]" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Simulador de Projeção Financeira
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-[#888] mb-1">
              Economia Mensal (R$)
            </label>
            <input
              type="range"
              min="100"
              max="3000"
              step="50"
              value={simMonthlySavings}
              onChange={(e) => setSimMonthlySavings(Number(e.target.value))}
              className="w-full accent-[#B7FF35]"
            />
            <div className="text-xs font-bold text-white mt-1">
              R$ {simMonthlySavings.toLocaleString('pt-BR')}/mês
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#888] mb-1">
              Horizonte (Meses)
            </label>
            <input
              type="range"
              min="1"
              max="36"
              step="1"
              value={simMonths}
              onChange={(e) => setSimMonths(Number(e.target.value))}
              className="w-full accent-[#B7FF35]"
            />
            <div className="text-xs font-bold text-white mt-1">
              {simMonths} {simMonths === 1 ? 'mês' : 'meses'}
            </div>
          </div>
        </div>

        <div className="bg-[#1c1c1c] border border-[#282828] rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-[#A1A1A1]">Patrimônio Projetado</span>
            <span className="text-base font-extrabold text-[#B7FF35]">
              {formatCurrency(simulation.projectedTotalCents)}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[10px] text-[#888]">Acumulado novo</span>
            <span className="text-xs font-semibold text-white">
              +{formatCurrency(simMonthlySavings * simMonths * 100)}
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        editingGoal={editingGoal}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        categoryName={selectedBudgetCategory}
        currentLimitCents={selectedBudgetLimit}
      />
    </div>
  );
};
