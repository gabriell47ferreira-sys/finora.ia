import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const RecentActivity: React.FC = () => {
  const { transactions, setActiveTab, openTransactionModal } = useFinance();

  // Sort descending by date & created
  const sorted = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[11px] font-bold tracking-wider text-[#A1A1A1] uppercase">
          Últimas Atividades
        </h2>
        <button
          onClick={() => setActiveTab('transactions')}
          className="text-xs text-[#B7FF35] hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
        >
          Histórico <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-[#151515] border border-[#262626] rounded-3xl p-6 text-center text-xs text-[#666]">
          Nenhuma movimentação registrada até o momento.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((tx) => {
            const isIncome = tx.type === 'income';
            const isPending = tx.status === 'pending';

            return (
              <div
                key={tx.id}
                onClick={() => openTransactionModal(tx.type, tx)}
                className="group bg-[#151515] hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#383838] rounded-2xl p-3.5 flex items-center justify-between transition-all cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-[#32D583]/15 text-[#32D583] border border-[#32D583]/20'
                        : 'bg-[#FF6464]/15 text-[#FF6464] border border-[#FF6464]/20'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-[#B7FF35] transition-colors">
                      {tx.description}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#A1A1A1] mt-0.5">
                      <span>{tx.category}</span>
                      <span>•</span>
                      <span>{formatDate(tx.date, 'short')}</span>
                      {isPending && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-[#FBBF24]">
                            <Clock className="w-2.5 h-2.5" /> Pendente
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-xs font-bold ${
                      isIncome ? 'text-[#32D583]' : 'text-white'
                    }`}
                  >
                    {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                  </div>
                  <div className="text-[10px] text-[#666] capitalize">
                    {tx.paymentMethod}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
