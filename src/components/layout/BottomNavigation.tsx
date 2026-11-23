import React, { useState, useEffect, useRef } from 'react';
import {
  Home,
  ArrowLeftRight,
  Sparkles,
  Target,
  User,
  X,
  Compass,
} from 'lucide-react';
import { useFinance, TabType } from '../../context/FinanceContext';

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();
  const [isExpanded, setIsExpanded] = useState(false);
  const autoCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navItems: Array<{
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'transactions', label: 'Movimentações', icon: ArrowLeftRight },
    { id: 'agent', label: 'Agente IA', icon: Sparkles },
    { id: 'planning', label: 'Planejamento', icon: Target },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  const activeItem = navItems.find((item) => item.id === activeTab) || navItems[0];
  const ActiveIcon = activeItem.icon;

  // Reset auto-collapse timer whenever menu is expanded
  useEffect(() => {
    if (isExpanded) {
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
      }
      // Automatically collapse back to bubble after 5 seconds of inactivity
      autoCollapseTimerRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 5000);
    }

    return () => {
      if (autoCollapseTimerRef.current) {
        clearTimeout(autoCollapseTimerRef.current);
      }
    };
  }, [isExpanded, activeTab]);

  const handleSelectTab = (tabId: TabType) => {
    setActiveTab(tabId);
    // Automatically return to bubble mode after selecting
    setIsExpanded(false);
  };

  return (
    <>
      {/* Backdrop overlay when menu is expanded to close on outside click */}
      {isExpanded && (
        <div
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] transition-opacity animate-fadeIn"
          aria-hidden="true"
        />
      )}

      <nav className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
        {/* COMPACT BUBBLE MODE */}
        {!isExpanded ? (
          <div className="pointer-events-auto animate-fadeIn">
            <button
              onClick={() => setIsExpanded(true)}
              className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#151515]/95 hover:bg-[#1c1c1c] border border-[#B7FF35]/40 hover:border-[#B7FF35] backdrop-blur-xl shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer glow-accent-subtle"
              aria-label="Abrir menu de navegação"
            >
              {/* Glowing active icon pill */}
              <div className="w-8 h-8 rounded-full bg-[#B7FF35] text-black flex items-center justify-center font-bold shadow-md shadow-[#B7FF35]/30">
                <ActiveIcon className="w-4 h-4" />
              </div>

              <div className="flex flex-col text-left pr-1">
                <span className="text-[10px] text-[#A1A1A1] uppercase tracking-wider font-semibold">
                  Navegar
                </span>
                <span className="text-xs font-bold text-white group-hover:text-[#B7FF35] transition-colors -mt-0.5">
                  {activeItem.label}
                </span>
              </div>

              {/* Pulsing indicator */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B7FF35] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B7FF35]" />
              </span>
            </button>
          </div>
        ) : (
          /* EXPANDED FULL NAVIGATION BAR */
          <div className="w-full max-w-md bg-[#151515]/95 backdrop-blur-xl border border-[#B7FF35]/30 rounded-3xl p-1.5 shadow-2xl flex items-center justify-between pointer-events-auto animate-fadeIn">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const isAgent = item.id === 'agent';
              const Icon = item.icon;

              if (isAgent) {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab('agent')}
                    className="relative -top-4 flex flex-col items-center group cursor-pointer focus:outline-none"
                    aria-label="Abrir Agente IA"
                  >
                    <div
                      className={`w-13 h-13 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                        isActive
                          ? 'bg-[#B7FF35] text-black ring-4 ring-[#B7FF35]/30 scale-105 shadow-[#B7FF35]/40'
                          : 'bg-[#B7FF35] text-black hover:scale-105 active:scale-95 shadow-[#B7FF35]/30'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <span
                      className={`text-[9px] font-medium tracking-tight mt-1 transition-colors ${
                        isActive ? 'text-[#B7FF35] font-semibold' : 'text-[#A1A1A1] group-hover:text-white'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 cursor-pointer ${
                    isActive ? 'text-white' : 'text-[#7A7A7A] hover:text-[#A1A1A1]'
                  }`}
                >
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isActive ? 'scale-110 text-[#B7FF35]' : ''
                      }`}
                    />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#B7FF35] rounded-full" />
                    )}
                  </div>
                  <span
                    className={`text-[9px] mt-1 tracking-tight transition-colors ${
                      isActive ? 'text-white font-medium' : 'text-[#7A7A7A]'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* Quick close button to collapse back to bubble */}
            <button
              onClick={() => setIsExpanded(false)}
              className="w-8 h-8 mr-1 rounded-full bg-[#202020] text-[#777] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Recolher para bolha"
              aria-label="Recolher menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </nav>
    </>
  );
};
