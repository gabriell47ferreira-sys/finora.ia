import React from 'react';
import { Plus, Minus, Sparkles, Target } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const QuickActions: React.FC = () => {
  const { openTransactionModal, setActiveTab } = useFinance();

  return (
    <div className="px-5 py-2">
      <div className="grid grid-cols-4 gap-2.5">
        {/* Receita (+ Entrada) */}
        <button
          onClick={() => openTransactionModal('income')}
          className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-[#B7FF35] text-black hover:opacity-95 active:scale-95 transition-all shadow-lg shadow-[#B7FF35]/20 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xs font-bold tracking-tight">Receita</span>
        </button>

        {/* Despesa (- Saída) */}
        <button
          onClick={() => openTransactionModal('expense')}
          className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-[#151515] border border-[#292929] text-white hover:border-[#383838] active:scale-95 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center mb-1 text-[#FF6464] group-hover:scale-110 transition-transform">
            <Minus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xs font-medium text-[#E5E5E5] tracking-tight">Despesa</span>
        </button>

        {/* Agente IA */}
        <button
          onClick={() => setActiveTab('agent')}
          className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-[#151515] border border-[#292929] text-white hover:border-[#B7FF35]/40 active:scale-95 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center mb-1 text-[#B7FF35] group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-[#E5E5E5] tracking-tight">Assistente</span>
        </button>

        {/* Metas / Planejamento */}
        <button
          onClick={() => setActiveTab('planning')}
          className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-[#151515] border border-[#292929] text-white hover:border-[#383838] active:scale-95 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-[#202020] flex items-center justify-center mb-1 text-[#38BDF8] group-hover:scale-110 transition-transform">
            <Target className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-[#E5E5E5] tracking-tight">Metas</span>
        </button>
      </div>
    </div>
  );
};
