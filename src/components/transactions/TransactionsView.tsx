import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  formatCurrency,
  formatDate,
  getDateGroupLabel,
  formatMonthYear,
  getRelativeYearMonth,
} from '../../utils/formatters';
import { Transaction, TransactionType } from '../../types/finance';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    selectedMonth,
    setSelectedMonth,
    openTransactionModal,
    toggleTransactionStatus,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'paid' | 'pending'>('all');

  // Month selector list
  const availableMonths = useMemo(() => {
    const list = [];
    for (let i = 1; i >= -5; i--) {
      list.push(getRelativeYearMonth(i));
    }
    return list;
  }, []);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Month match
      if (!tx.date.startsWith(selectedMonth)) return false;

      // Type match
      if (selectedType !== 'all' && tx.type !== selectedType) return false;

      // Category match
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;

      // Status match
      if (selectedStatus !== 'all' && tx.status !== selectedStatus) return false;

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = tx.description.toLowerCase().includes(query);
        const matchesCat = tx.category.toLowerCase().includes(query);
        const matchesNotes = tx.notes ? tx.notes.toLowerCase().includes(query) : false;
        if (!matchesDesc && !matchesCat && !matchesNotes) return false;
      }

      return true;
    });
  }, [transactions, selectedMonth, selectedType, selectedCategory, selectedStatus, searchQuery]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    // Sort descending by date
    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const groups: Record<string, Transaction[]> = {};
    for (const tx of sorted) {
      if (!groups[tx.date]) {
        groups[tx.date] = [];
      }
      groups[tx.date].push(tx);
    }
    return groups;
  }, [filteredTransactions]);

  // Month summary metrics for top cards
  const monthIncome = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'income' && tx.status === 'paid' && tx.date.startsWith(selectedMonth))
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactions, selectedMonth]);

  const monthExpense = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'expense' && tx.status === 'paid' && tx.date.startsWith(selectedMonth))
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [transactions, selectedMonth]);

  // Unique categories in current month
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const tx of transactions) {
      set.add(tx.category);
    }
    return Array.from(set);
  }, [transactions]);

  return (
    <div className="px-5 py-2 space-y-4 animate-fadeIn pb-24">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Movimentações</h1>
          <p className="text-xs text-[#A1A1A1]">Histórico e controle detalhado</p>
        </div>

        <button
          onClick={() => openTransactionModal('expense')}
          className="h-10 px-3.5 bg-[#B7FF35] text-black font-bold text-xs rounded-2xl flex items-center gap-1.5 shadow-lg shadow-[#B7FF35]/20 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo</span>
        </button>
      </div>

      {/* Month Selector Pill */}
      <div className="flex items-center justify-between bg-[#151515] border border-[#262626] rounded-2xl px-4 py-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#B7FF35]" />
          <span className="text-xs font-semibold text-white">Mês de Referência:</span>
        </div>
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="appearance-none bg-[#202020] border border-[#292929] text-xs font-semibold text-white px-3 py-1.5 pr-7 rounded-xl focus:outline-none focus:border-[#B7FF35] cursor-pointer"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m} className="bg-[#151515] text-white">
                {formatMonthYear(m, true)}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#A1A1A1] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Income & Expense Summary Cards (Like in Reference Image Screen 2) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Income Card */}
        <div className="bg-[#151515] border border-[#262626] rounded-2xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-[#A1A1A1]">Receitas</span>
            <span className="text-[10px] font-bold text-[#32D583] flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> Pago
            </span>
          </div>
          <div className="text-sm font-extrabold text-[#32D583]">
            +{formatCurrency(monthIncome)}
          </div>
          {/* Mini aesthetic sparkline curve */}
          <div className="w-full h-1 bg-[#202020] rounded-full mt-2.5 overflow-hidden">
            <div className="h-full bg-[#32D583] rounded-full w-3/4" />
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-[#151515] border border-[#262626] rounded-2xl p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-[#A1A1A1]">Despesas</span>
            <span className="text-[10px] font-bold text-[#FF6464] flex items-center gap-0.5">
              <ArrowDownLeft className="w-3 h-3" /> Pago
            </span>
          </div>
          <div className="text-sm font-extrabold text-white">
            -{formatCurrency(monthExpense)}
          </div>
          {/* Mini aesthetic sparkline curve */}
          <div className="w-full h-1 bg-[#202020] rounded-full mt-2.5 overflow-hidden">
            <div className="h-full bg-[#FF6464] rounded-full w-2/3" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[#666] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por descrição ou categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151515] border border-[#262626] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#B7FF35]"
          />
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 cursor-pointer transition-colors ${
              selectedType === 'all'
                ? 'bg-[#B7FF35] text-black font-semibold'
                : 'bg-[#151515] text-[#A1A1A1] border border-[#262626]'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setSelectedType('income')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 cursor-pointer transition-colors ${
              selectedType === 'income'
                ? 'bg-[#32D583] text-black font-semibold'
                : 'bg-[#151515] text-[#A1A1A1] border border-[#262626]'
            }`}
          >
            Receitas
          </button>
          <button
            onClick={() => setSelectedType('expense')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 cursor-pointer transition-colors ${
              selectedType === 'expense'
                ? 'bg-[#FF6464] text-white font-semibold'
                : 'bg-[#151515] text-[#A1A1A1] border border-[#262626]'
            }`}
          >
            Despesas
          </button>
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'pending' ? 'all' : 'pending')}
            className={`px-3 py-1.5 rounded-xl font-medium shrink-0 cursor-pointer transition-colors ${
              selectedStatus === 'pending'
                ? 'bg-[#FBBF24] text-black font-semibold'
                : 'bg-[#151515] text-[#A1A1A1] border border-[#262626]'
            }`}
          >
            Pendentes
          </button>

          {/* Category Dropdown Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#151515] border border-[#262626] text-[#A1A1A1] px-2.5 py-1.5 rounded-xl text-xs focus:outline-none focus:border-[#B7FF35] shrink-0"
          >
            <option value="all">Categorias (Todas)</option>
            {availableCategories.map((c) => (
              <option key={c} value={c} className="bg-[#151515] text-white">
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grouped Chronological List */}
      {Object.keys(groupedTransactions).length === 0 ? (
        <div className="bg-[#151515] border border-[#262626] rounded-3xl p-8 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#202020] text-[#666] flex items-center justify-center mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <div className="text-xs font-semibold text-white">Nenhuma movimentação encontrada</div>
          <p className="text-[11px] text-[#666]">
            Altere os filtros acima ou registre uma nova movimentação.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([dateStr, items]) => (
            <div key={dateStr} className="space-y-2">
              {/* Date Group Label (TODAY, YESTERDAY, etc.) */}
              <div className="text-[11px] font-extrabold tracking-wider text-[#A1A1A1] uppercase px-1">
                {getDateGroupLabel(dateStr)}
              </div>

              {/* Transactions in group */}
              <div className="space-y-2">
                {items.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const isPending = tx.status === 'pending';

                  return (
                    <div
                      key={tx.id}
                      className="group bg-[#151515] hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#383838] rounded-2xl p-3.5 flex items-center justify-between transition-all shadow-md"
                    >
                      <div
                        onClick={() => openTransactionModal(tx.type, tx)}
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                      >
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
                            <span className="capitalize">{tx.paymentMethod}</span>
                            {tx.isRecurring && (
                              <>
                                <span>•</span>
                                <span className="text-[#38BDF8]">Recorrente</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => openTransactionModal(tx.type, tx)}
                          className="text-right cursor-pointer"
                        >
                          <div
                            className={`text-xs font-bold ${
                              isIncome ? 'text-[#32D583]' : 'text-white'
                            }`}
                          >
                            {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                          </div>
                          <div className="text-[9px] text-[#666]">
                            {formatDate(tx.date, 'short')}
                          </div>
                        </div>

                        {/* Quick Status Toggle Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTransactionStatus(tx.id);
                          }}
                          title={isPending ? 'Clique para marcar como PAGO' : 'Clique para marcar como PENDENTE'}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                            isPending
                              ? 'bg-[#FBBF24]/20 text-[#FBBF24] hover:bg-[#FBBF24]/30'
                              : 'bg-[#32D583]/20 text-[#32D583] hover:bg-[#32D583]/30'
                          }`}
                        >
                          {isPending ? (
                            <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
