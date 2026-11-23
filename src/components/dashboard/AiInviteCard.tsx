import React from 'react';
import { Sparkles, MessageSquare, ChevronRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const AiInviteCard: React.FC = () => {
  const { setActiveTab } = useFinance();

  return (
    <div className="px-5 py-2">
      <div
        onClick={() => setActiveTab('agent')}
        className="group relative overflow-hidden bg-gradient-to-r from-[#181818] via-[#1a1f14] to-[#181818] border border-[#2a2a2a] hover:border-[#B7FF35]/50 rounded-3xl p-4 transition-all duration-300 cursor-pointer shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#B7FF35] text-black flex items-center justify-center font-bold shadow-md shadow-[#B7FF35]/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Pergunte ao seu Assistente</span>
                <span className="text-[9px] bg-[#B7FF35]/20 text-[#B7FF35] px-1.5 py-0.2 rounded-full font-semibold">
                  IA
                </span>
              </div>
              <div className="text-[11px] text-[#A1A1A1] mt-0.5">
                "Onde estou gastando mais este mês?"
              </div>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-[#A1A1A1] group-hover:text-[#B7FF35] group-hover:border-[#B7FF35]/30 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
