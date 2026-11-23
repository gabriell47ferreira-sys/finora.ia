import React from 'react';
import { Bell, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatDate } from '../../utils/formatters';

export const Header: React.FC = () => {
  const { profile, setActiveTab } = useFinance();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <header className="relative z-10 px-5 pt-6 pb-4 flex items-center justify-between">
      {/* Left: User Avatar + Personalized Greeting */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => setActiveTab('profile')}
          className="relative w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-[#B7FF35] to-[#292929] cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="w-full h-full bg-[#151515] rounded-full flex items-center justify-center font-bold text-sm text-[#B7FF35]">
            {profile?.name ? profile.name.slice(0, 2).toUpperCase() : 'FI'}
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#32D583] border-2 border-[#080808] rounded-full" />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#A1A1A1] font-normal">{getGreeting()},</span>
            <span className="text-xs font-semibold text-white">{profile?.name || 'Usuário'}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B7FF35]" />
              <span className="text-[11px] font-bold tracking-wider text-white">FINORA <span className="text-[#B7FF35]">AI</span></span>
            </div>
            <span className="text-[10px] text-[#666]">•</span>
            <span className="text-[10px] text-[#A1A1A1]">{formatDate(todayStr, 'short')}</span>
          </div>
        </div>
      </div>

      {/* Right: Quick Settings Pill / AI notification */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTab('profile')}
          className="w-10 h-10 rounded-full bg-[#151515] border border-[#292929] flex items-center justify-center text-[#A1A1A1] hover:text-white hover:border-[#383838] transition-colors cursor-pointer"
          aria-label="Configurações e Perfil"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
