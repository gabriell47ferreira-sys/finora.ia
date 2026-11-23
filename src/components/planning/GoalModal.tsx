import React, { useState } from 'react';
import { X, Target, Trash2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Goal } from '../../types/finance';
import { toCents, fromCents } from '../../utils/formatters';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingGoal?: Goal | null;
}

export const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, editingGoal }) => {
  const { addGoal, updateGoal, deleteGoal } = useFinance();

  const [title, setTitle] = useState(editingGoal?.title || '');
  const [targetAmountStr, setTargetAmountStr] = useState(
    editingGoal ? (editingGoal.targetAmount / 100).toFixed(2) : ''
  );
  const [currentAmountStr, setCurrentAmountStr] = useState(
    editingGoal ? (editingGoal.currentAmount / 100).toFixed(2) : '0.00'
  );
  const [deadline, setDeadline] = useState(editingGoal?.deadline || '');
  const [color, setColor] = useState(editingGoal?.color || '#B7FF35');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCents = toCents(targetAmountStr);
    const currentCents = toCents(currentAmountStr);

    if (targetCents <= 0) {
      alert('Informe um valor de objetivo válido.');
      return;
    }

    if (editingGoal) {
      await updateGoal(editingGoal.id, {
        title: title.trim(),
        targetAmount: targetCents,
        currentAmount: currentCents,
        deadline: deadline || undefined,
        color,
      });
    } else {
      await addGoal({
        title: title.trim(),
        targetAmount: targetCents,
        currentAmount: currentCents,
        deadline: deadline || undefined,
        color,
      });
    }

    onClose();
  };

  const handleDelete = async () => {
    if (!editingGoal) return;
    if (confirm('Deseja excluir esta meta?')) {
      await deleteGoal(editingGoal.id);
      onClose();
    }
  };

  const colors = ['#B7FF35', '#38BDF8', '#FBBF24', '#EC4899', '#A855F7', '#32D583'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#151515] border border-[#292929] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-[#B7FF35]" />
            {editingGoal ? 'Editar Meta' : 'Nova Meta de Economia'}
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
              Título do Objetivo
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Reserva de emergência, Viagem, Carro"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-[#292929] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#B7FF35]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#A1A1A1] mb-1.5">
                Valor Alvo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="Ex: 5000,00"
                value={targetAmountStr}
                onChange={(e) => setTargetAmountStr(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-[#292929] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#B7FF35]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1A1A1] mb-1.5">
                Já Guardado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={currentAmountStr}
                onChange={(e) => setCurrentAmountStr(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-[#292929] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#B7FF35]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A1A1A1] mb-1.5">
              Prazo Desejado (Opcional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-[#292929] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#B7FF35]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A1A1A1] mb-1.5">
              Cor de Destaque
            </label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                    color === c ? 'scale-125 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            {editingGoal && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-12 h-11 rounded-2xl bg-[#261515] border border-[#FF6464]/30 text-[#FF6464] hover:bg-[#FF6464]/20 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-[#B7FF35] text-black text-xs font-bold hover:opacity-95 active:scale-98 transition-all shadow-lg shadow-[#B7FF35]/20 cursor-pointer text-center"
            >
              {editingGoal ? 'Salvar Meta' : 'Criar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
