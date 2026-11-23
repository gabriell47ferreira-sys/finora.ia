import React, { useMemo } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { generateContextualInsights } from '../../engine/financeEngine';

export const ContextualInsightCard: React.FC = () => {
  const { summary, setActiveTab } = useFinance();

  const insights = useMemo(() => {
    return generateContextualInsights(summary);
  }, [summary]);

  if (insights.length === 0) {
    return null;
  }

  const primaryInsight = insights[0];

  return (
    <div className="px-5 py-2">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#172211] via-[#151515] to-[#151515] border border-[#B7FF35]/30 rounded-3xl p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#B7FF35]/15 border border-[#B7FF35]/30 flex items-center justify-center shrink-0 text-[#B7FF35] mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#B7FF35]">
                Insight FINORA AI
              </span>
            </div>
            <p className="text-xs text-[#E0E0E0] leading-relaxed">
              "{primaryInsight}"
            </p>

            <button
              onClick={() => setActiveTab('agent')}
              className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#B7FF35] hover:text-[#d3ff75] transition-colors cursor-pointer"
            >
              Analisar com assistente <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
