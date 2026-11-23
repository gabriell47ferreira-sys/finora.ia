import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar, CreditCard, Tag, FileText, Check, Clock, Repeat } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { TransactionType, PaymentMethod, TransactionStatus, RecurrenceFrequency } from '../../types/finance';
import { toCents, fromCents } from '../../utils/formatters';

export const TransactionModal: React.FC = () => {
  const {
    isTransactionModalOpen,
    closeTransactionModal,
    transactionModalInitialType,
    editingTransaction,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    categories,
  } = useFinance();

  const [type, setType] = useState<TransactionType>(transactionModalInitialType);
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<TransactionStatus>('paid');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceFrequency>('monthly');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDescription(editingTransaction.description);
      setAmountStr((editingTransaction.amount / 100).toFixed(2));
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod);
      setStatus(editingTransaction.status);
      setNotes(editingTransaction.notes || '');
      setIsRecurring(!!editingTransaction.isRecurring);
      setRecurrenceRule(editingTransaction.recurrenceRule || 'monthly');
    } else {
      setType(transactionModalInitialType);
      setDescription('');
      setAmountStr('');
      const filtered = categories.filter((c) => c.type === transactionModalInitialType);
      setCategory(filtered[0]?.name || (transactionModalInitialType === 'income' ? 'Salário' : 'Alimentação'));
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('pix');
      setStatus('paid');
      setNotes('');
      setIsRecurring(false);
      setRecurrenceRule('monthly');
    }
  }, [editingTransaction, transactionModalInitialType, isTransactionModalOpen, categories]);

  if (!isTransactionModalOpen) return null;

  const currentCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cents = toCents(amountStr);
    if (cents <= 0) {
      alert('Por favor, informe um valor válido maior que zero.');
      return;
    }
    if (!description.trim()) {
      alert('Por favor, informe uma descrição.');
      return;
    }

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, {
        description: description.trim(),
        amount: cents,
        type,
        category,
        date,
        paymentMethod,
        status,
        notes: notes.trim(),
        isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : 'none',
      });
    } else {
      await addTransaction({
        description: description.trim(),
        amount: cents,
        type,
        category,
        date,
        paymentMethod,
        status,
        notes: notes.trim(),
        isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : 'none',
      });
    }

    closeTransactionModal();
  };

  const handleDelete = async () => {
    if (!editingTransaction) return;
    if (confirm('Tem certeza que deseja excluir esta movimentação?')) {
      await deleteTransaction(editingTransaction.id);
      closeTransactionModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#151515] border border-[#292929] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
          <h2 className="text-sm font-bold text-white">
            {editingTransaction ? 'Editar Movimentação' : 'Nova Movimentação'}
          </h2>
          <button
            onClick={closeTransactionModal}
            className="w-8 h-8 rounded-full bg-[#202020] text-[#A1A1A1] hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Toggle: Receita vs Despesa */}
          <div className="grid grid-cols-2 gap-2 bg-[#202020] p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const expCats = categories.filter((c) => c.type === 'expense');
                setCategory(expCats[0]?.name || 'Alimentação');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-[#FF6464] text-white shadow-md'
                  : 'text-[#A1A1A1] hover:text-white'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                const incCats = categories.filter((c) => c.type === 'income');
                setCategory(incCats[0]?.name || 'Salário');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-[#B7FF35] text-black shadow-md'
                  : 'text-[#A1A1A1] hover:text-white'
              }`}
            >
              Receita
            </button>
          </div>

          {/* Value input (Big & clear) */}
          <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl p-4 text-center focus-within:border-[#B7FF35] transition-colors">
            <label className="block text-[11px] font-semibold text-[#A1A1A1] mb-1">
              VALOR EM REAIS
            </label>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-xl font-bold text-[#A1A1A1]">R$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-48 text-center text-3xl font-extrabold text-white bg-transparent focus:outline-none placeholder-[#444]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#A1A1A1] mb-1.5">
              Descrição
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Supermercado, Salário, Uber"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-[#292929] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#B7FF35]"
            />
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#A1A1A1] mb-1.5">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-[#292929] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#B7FF35] cursor-pointer"
              >
                {currentCategories.map((cat) => (
                  <option key={cat.id} value={cat.name} className="bg-[#151515]">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1A1A1] mb-1.5">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-[#1c1c1c] border border-[#292929] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#B7FF35] cursor-pointer"
              >
                <option value="pix" className="bg-[#151515]">PIX</option>
                <option value="credit" className="bg-[#151515]">Cartão de Crédito</option>
                <option value="debit" className="bg-[#151515]">Cartão de Débito</option>
                <option value="transfer" className="bg-[#151515]">Transferência</option>
                <option value="cash" className="bg-[#151515]">Dinheiro</option>
                <option value="other" className="bg-[#151515]">Outro</option>
              </select>
            </div>
          </div>

          {/* Date & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#A1A1A1] mb-1.5">
                Data
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-[#292929] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#B7FF35] cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#A1A1A1] mb-1.5">
                Status
              </label>
              <div className="grid grid-cols-2 gap-1 bg-[#1c1c1c] p-1 border border-[#292929] rounded-xl">
                <button
                  type="button"
                  onClick={() => setStatus('paid')}
                  className={`py-1 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                    status === 'paid'
                      ? 'bg-[#32D583] text-black'
                      : 'text-[#888]'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" /> Pago
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  className={`py-1 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer ${
                    status === 'pending'
                      ? 'bg-[#FBBF24] text-black'
                      : 'text-[#888]'
                  }`}
                >
                  <Clock className="w-3 h-3 stroke-[3]" /> Pendente
                </button>
              </div>
            </div>
          </div>

          {/* Recurrence Toggle */}
          <div className="bg-[#1c1c1c] border border-[#292929] rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-[#A1A1A1]" />
              <div>
                <div className="text-xs font-semibold text-white">Movimentação Recorrente</div>
                <div className="text-[10px] text-[#777]">Repete todo mês automaticamente</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 accent-[#B7FF35] cursor-pointer"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#A1A1A1] mb-1.5">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Compra parcelada, reembolso, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#1c1c1c] border border-[#292929] rounded-xl px-3.5 py-2 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#B7FF35]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            {editingTransaction && (
              <button
                type="button"
                onClick={handleDelete}
                className="w-12 h-11 rounded-2xl bg-[#261515] border border-[#FF6464]/30 text-[#FF6464] hover:bg-[#FF6464]/20 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Excluir movimentação"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-2xl bg-[#B7FF35] text-black text-xs font-bold hover:opacity-95 active:scale-98 transition-all shadow-lg shadow-[#B7FF35]/20 cursor-pointer text-center"
            >
              {editingTransaction ? 'Salvar Alterações' : 'Salvar Movimentação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
