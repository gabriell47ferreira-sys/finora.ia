import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Eye, EyeOff } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

export const BalanceCard: React.FC = () => {
  const { summary } = useFinance();
  const [showValues, setShowValues] = React.useState(true);

  const isNetPositive = summary.monthNetResult >= 0;

  return (
    <div className="px-5 pt-2 pb-4">
      <div className="relative overflow-hidden bg-gradient-to-b from-[#181818] to-[#121212] border border-[#262626] rounded-3xl p-5 shadow-2xl">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-[#B7FF35]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Tag & Privacy Eye */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium tracking-wide text-[#A1A1A1] uppercase">Saldo Atual Líquido</span>
            <button
              onClick={() => setShowValues(!showValues)}
              className="text-[#666] hover:text-[#A1A1A1] transition-colors cursor-pointer"
              aria-label="Alternar visibilidade de valores"
            >
              {showValues ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Growth rate vs previous month */}
          <div
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              summary.incomeGrowthRate >= 0
                ? 'bg-[#32D583]/15 text-[#32D583] border border-[#32D583]/20'
                : 'bg-[#FF6464]/15 text-[#FF6464] border border-[#FF6464]/20'
            }`}
          >
            {summary.incomeGrowthRate >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{formatPercentage(summary.incomeGrowthRate)} vs mês ant.</span>
          </div>
        </div>

        {/* Big Balance Number */}
        <div className="flex items-baseline gap-2 mb-5">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            {showValues ? formatCurrency(summary.currentBalance) : 'R$ ••••••'}
          </h1>
        </div>

        {/* Income / Expense / Result Mini Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#232323]">
          {/* Receitas */}
          <div className="bg-[#181818]/80 rounded-2xl p-2.5 border border-[#262626]/60">
            <div className="flex items-center gap-1 text-[10px] text-[#A1A1A1] mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#32D583]" />
              <span>Receitas</span>
            </div>
            <div className="text-xs font-bold text-[#32D583] truncate">
              {showValues ? formatCurrency(summary.monthIncomePaid) : '••••'}
            </div>
            {summary.monthIncomePending > 0 && (
              <div className="text-[9px] text-[#777] truncate mt-0.5">
                +{formatCurrency(summary.monthIncomePending)} a rec.
              </div>
            )}
          </div>

          {/* Despesas */}
          <div className="bg-[#181818]/80 rounded-2xl p-2.5 border border-[#262626]/60">
            <div className="flex items-center gap-1 text-[10px] text-[#A1A1A1] mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6464]" />
              <span>Despesas</span>
            </div>
            <div className="text-xs font-bold text-[#FF6464] truncate">
              {showValues ? formatCurrency(summary.monthExpensePaid) : '••••'}
            </div>
            {summary.monthExpensePending > 0 && (
              <div className="text-[9px] text-[#777] truncate mt-0.5">
                +{formatCurrency(summary.monthExpensePending)} a pagar
              </div>
            )}
          </div>

          {/* Resultado Mensal */}
          <div className="bg-[#181818]/80 rounded-2xl p-2.5 border border-[#262626]/60">
            <div className="flex items-center gap-1 text-[10px] text-[#A1A1A1] mb-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isNetPositive ? 'bg-[#B7FF35]' : 'bg-[#FF6464]'
                }`}
              />
              <span>Resultado</span>
            </div>
            <div
              className={`text-xs font-bold truncate ${
                isNetPositive ? 'text-[#B7FF35]' : 'text-[#FF6464]'
              }`}
            >
              {showValues ? formatCurrency(summary.monthNetResult) : '••••'}
            </div>
            <div className="text-[9px] text-[#777] truncate mt-0.5">
              {isNetPositive ? 'Economizado' : 'Déficit'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
