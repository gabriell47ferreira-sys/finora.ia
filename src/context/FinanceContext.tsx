import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  initializeDatabase,
  DEFAULT_CATEGORIES,
} from '../db/database';
import {
  Transaction,
  Category,
  Goal,
  CategoryBudget,
  UserProfile,
  FinancialSummary,
  TransactionType,
} from '../types/finance';
import { generateFinancialSummary } from '../engine/financeEngine';
import { getCurrentYearMonth } from '../utils/formatters';

export type TabType = 'home' | 'transactions' | 'agent' | 'planning' | 'profile';

interface FinanceContextType {
  // Navigation & Month
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedMonth: string; // 'YYYY-MM'
  setSelectedMonth: (month: string) => void;

  // Live Data
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  budgets: CategoryBudget[];
  profile: UserProfile | null;
  summary: FinancialSummary;
  isLoading: boolean;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  toggleTransactionStatus: (id: string) => Promise<void>;

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addFundsToGoal: (id: string, amountCents: number) => Promise<void>;

  setCategoryBudget: (category: string, monthlyLimitCents: number) => Promise<void>;
  deleteCategoryBudget: (id: string) => Promise<void>;

  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  addCustomCategory: (cat: Omit<Category, 'id'>) => Promise<string>;

  // Quick Modal Controls
  isTransactionModalOpen: boolean;
  openTransactionModal: (type?: TransactionType, editItem?: Transaction) => void;
  closeTransactionModal: () => void;
  transactionModalInitialType: TransactionType;
  editingTransaction: Transaction | null;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth());
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Modal controls
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionModalInitialType, setTransactionModalInitialType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Initialize DB once on app mount
  useEffect(() => {
    initializeDatabase().then(() => {
      setIsInitialized(true);
    });
  }, []);

  // Live queries directly from Dexie
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) || DEFAULT_CATEGORIES;
  const goals = useLiveQuery(() => db.goals.toArray(), []) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray(), []) || [];
  const profileList = useLiveQuery(() => db.profile.toArray(), []) || [];
  const profile = profileList.length > 0 ? profileList[0] : null;

  // Calculate deterministic summary
  const summary = generateFinancialSummary(
    transactions,
    budgets,
    profile?.initialBalance || 0,
    selectedMonth
  );

  const openTransactionModal = (type: TransactionType = 'expense', editItem?: Transaction) => {
    setTransactionModalInitialType(type);
    setEditingTransaction(editItem || null);
    setIsTransactionModalOpen(true);
  };

  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  // Transaction mutations
  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await db.transactions.add(newTx);
    return id;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    await db.transactions.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteTransaction = async (id: string) => {
    await db.transactions.delete(id);
  };

  const toggleTransactionStatus = async (id: string) => {
    const tx = await db.transactions.get(id);
    if (tx) {
      const nextStatus = tx.status === 'paid' ? 'pending' : 'paid';
      await db.transactions.update(id, {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Goal mutations
  const addGoal = async (data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    await db.goals.add(newGoal);
    return id;
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    await db.goals.update(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteGoal = async (id: string) => {
    await db.goals.delete(id);
  };

  const addFundsToGoal = async (id: string, amountCents: number) => {
    const goal = await db.goals.get(id);
    if (goal) {
      const updatedAmount = Math.min(goal.targetAmount, goal.currentAmount + amountCents);
      await db.goals.update(id, {
        currentAmount: updatedAmount,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Budget mutations
  const setCategoryBudget = async (category: string, monthlyLimitCents: number) => {
    const existing = await db.budgets.where('category').equals(category).first();
    if (existing) {
      await db.budgets.update(existing.id, { monthlyLimit: monthlyLimitCents });
    } else {
      const id = `budget_${Date.now()}`;
      await db.budgets.add({
        id,
        category,
        monthlyLimit: monthlyLimitCents,
      });
    }
  };

  const deleteCategoryBudget = async (id: string) => {
    await db.budgets.delete(id);
  };

  // Profile mutations
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (profile) {
      await db.profile.update(profile.id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Custom Category
  const addCustomCategory = async (cat: Omit<Category, 'id'>) => {
    const id = `cat_custom_${Date.now()}`;
    await db.categories.add({
      ...cat,
      id,
      isCustom: true,
    });
    return id;
  };

  return (
    <FinanceContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedMonth,
        setSelectedMonth,
        transactions,
        categories,
        goals,
        budgets,
        profile,
        summary,
        isLoading: !isInitialized,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        toggleTransactionStatus,
        addGoal,
        updateGoal,
        deleteGoal,
        addFundsToGoal,
        setCategoryBudget,
        deleteCategoryBudget,
        updateProfile,
        addCustomCategory,
        isTransactionModalOpen,
        openTransactionModal,
        closeTransactionModal,
        transactionModalInitialType,
        editingTransaction,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
