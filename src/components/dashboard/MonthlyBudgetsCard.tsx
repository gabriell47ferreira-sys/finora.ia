import React from 'react';
import { Target, ChevronRight, AlertTriangle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

export const MonthlyBudgetsCard: React.FC = () => {
  const { summary, budgets, setActiveTab } = useFinance();

  const topCategories = summary.categoryExpenses.slice(0, 3);

  return (
    <div className="px-5 py-2">
      <div className="bg-[#151515] border border-[#262626] rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-[#A1A1A1] uppercase">
              Orçamento do Mês
            </span>
          </div>
          <button
            onClick={() => setActiveTab('planning')}
            className="text-xs text-[#B7FF35] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            Ver todos <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topCategories.length === 0 ? (
          <div className="text-center py-3 text-xs text-[#666]">
            Nenhum gasto por categoria registrado neste mês.
          </div>
        ) : (
          <div className="space-y-3.5">
            {topCategories.map((cat) => {
              const hasBudget = cat.budgetLimit && cat.budgetLimit > 0;
              const ratio = hasBudget ? Math.min(100, (cat.amount / cat.budgetLimit!) * 100) : cat.percentage;

              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium text-white">{cat.category}</span>
                      {cat.isOverBudget && (
                        <span className="flex items-center gap-1 text-[10px] text-[#FF6464] bg-[#FF6464]/10 px-1.5 py-0.2 rounded font-semibold">
                          <AlertTriangle className="w-2.5 h-2.5" /> Excedido
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-white">
                        {formatCurrency(cat.amount)}
                      </span>
                      {hasBudget && (
                        <span className="text-[10px] text-[#777] ml-1">
                          / {formatCurrency(cat.budgetLimit!)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sleek Progress bar */}
                  <div className="w-full h-2 bg-[#202020] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${ratio}%`,
                        backgroundColor: cat.isOverBudget ? '#FF6464' : cat.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
