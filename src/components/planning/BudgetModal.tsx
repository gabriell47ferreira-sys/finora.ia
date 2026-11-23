import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { toCents } from '../../utils/formatters';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName?: string;
  currentLimitCents?: number;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  categoryName,
  currentLimitCents,
}) => {
  const { categories, setCategoryBudget } = useFinance();

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const [selectedCategory, setSelectedCategory] = useState(
    categoryName || expenseCategories[0]?.name || 'Alimentação'
  );
  const [limitStr, setLimitStr] = useState(
    currentLimitCents ? (currentLimitCents / 100).toFixed(2) : ''
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cents = toCents(limitStr);
    if (cents <= 0) {
      alert('Informe um limite mensal válido.');
      return;
    }

    await setCategoryBudget(selectedCategory, cents);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#151515] border border-[#292929] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#B7FF35]" />
            Definir Teto de Gastos
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#202020] text-[#A1A1A1] hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#A1A1A1] mb-1.5">
              Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={!!categoryName}
              className="w-full bg-[#1c1c1c] border border-[#292929] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#B7FF35] cursor-pointer disabled:opacity-60"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.name} className="bg-[#151515]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A1A1A1] mb-1.5">
              Limite Máximo Mensal (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              placeholder="Ex: 800,00"
              value={limitStr}
              onChange={(e) => setLimitStr(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-[#292929] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#B7FF35]"
            />
            <p className="text-[10px] text-[#666] mt-1">
              O FINORA alertará você assim que os gastos atingirem ou ultrapassarem esse teto.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-2xl bg-[#B7FF35] text-black text-xs font-bold hover:opacity-95 active:scale-98 transition-all shadow-lg shadow-[#B7FF35]/20 cursor-pointer text-center"
            >
              Salvar Limite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
