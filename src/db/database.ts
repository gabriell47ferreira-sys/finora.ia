import Dexie, { type Table } from 'dexie';
import {
  Transaction,
  Category,
  Goal,
  CategoryBudget,
  UserProfile,
  ChatMessage,
} from '../types/finance';

export class FinoraDatabase extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  goals!: Table<Goal, string>;
  budgets!: Table<CategoryBudget, string>;
  profile!: Table<UserProfile, string>;
  chatMessages!: Table<ChatMessage, string>;

  constructor() {
    super('FinoraDB');

    this.version(1).stores({
      transactions: 'id, date, type, category, status, isRecurring, createdAt',
      categories: 'id, name, type, isCustom',
      goals: 'id, deadline, createdAt',
      budgets: 'id, category, month',
      profile: 'id',
      chatMessages: 'id, timestamp, role',
    });
  }
}

export const db = new FinoraDatabase();

export const DEFAULT_CATEGORIES: Category[] = [
  // Incomes
  { id: 'cat-inc-salario', name: 'Salário', type: 'income', color: '#B7FF35', icon: 'Briefcase' },
  { id: 'cat-inc-extra', name: 'Renda extra', type: 'income', color: '#32D583', icon: 'Sparkles' },
  { id: 'cat-inc-vendas', name: 'Vendas', type: 'income', color: '#10B981', icon: 'ShoppingBag' },
  { id: 'cat-inc-servicos', name: 'Serviços', type: 'income', color: '#38BDF8', icon: 'Layers' },
  { id: 'cat-inc-outros', name: 'Outros (Receita)', type: 'income', color: '#818CF8', icon: 'PlusCircle' },

  // Expenses
  { id: 'cat-exp-alim', name: 'Alimentação', type: 'expense', color: '#B7FF35', icon: 'Utensils' },
  { id: 'cat-exp-moradia', name: 'Moradia', type: 'expense', color: '#38BDF8', icon: 'Home' },
  { id: 'cat-exp-transp', name: 'Transporte', type: 'expense', color: '#FB923C', icon: 'Car' },
  { id: 'cat-exp-saude', name: 'Saúde', type: 'expense', color: '#F43F5E', icon: 'HeartPulse' },
  { id: 'cat-exp-educ', name: 'Educação', type: 'expense', color: '#A855F7', icon: 'GraduationCap' },
  { id: 'cat-exp-lazer', name: 'Lazer', type: 'expense', color: '#FBBF24', icon: 'Film' },
  { id: 'cat-exp-compras', name: 'Compras', type: 'expense', color: '#EC4899', icon: 'ShoppingBag' },
  { id: 'cat-exp-assin', name: 'Assinaturas', type: 'expense', color: '#6366F1', icon: 'Repeat' },
  { id: 'cat-exp-contas', name: 'Contas', type: 'expense', color: '#14B8A6', icon: 'FileText' },
  { id: 'cat-exp-outros', name: 'Outros (Despesa)', type: 'expense', color: '#94A3B8', icon: 'HelpCircle' },
];

/**
 * Initializes the database in a clean state with Gemini key configured.
 */
export async function initializeDatabase(): Promise<void> {
  const profile = await db.profile.get('user_profile');
  const GEMINI_DEFAULT_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';

  if (!profile) {
    const defaultProfile: UserProfile = {
      id: 'user_profile',
      name: 'Você',
      initialBalance: 0,
      currency: 'BRL',
      aiExternalConsent: true,
      apiKeyCustom: GEMINI_DEFAULT_KEY,
      hasCompletedOnboarding: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.profile.put(defaultProfile);
  } else {
    // If previous profile was created with demo name or balance, clean it up to pristine state and ensure Gemini key is set
    if (profile.name === 'John Smith' || profile.initialBalance === 3429050 || !profile.apiKeyCustom) {
      await db.profile.update('user_profile', {
        name: profile.name === 'John Smith' ? 'Você' : profile.name,
        initialBalance: profile.initialBalance === 3429050 ? 0 : profile.initialBalance,
        apiKeyCustom: GEMINI_DEFAULT_KEY,
        aiExternalConsent: true,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  // Purge any old demo seed transactions if present so the screen is completely clean
  const seedItem = await db.transactions.get('seed-tx-1');
  if (seedItem) {
    const all = await db.transactions.toArray();
    const seeds = all.filter((t) => t.id.startsWith('seed-tx-'));
    for (const s of seeds) {
      await db.transactions.delete(s.id);
    }
  }

  // Purge demo seed goals
  const seedGoal = await db.goals.get('goal-1');
  if (seedGoal) {
    await db.goals.delete('goal-1');
    await db.goals.delete('goal-2');
  }

  // Categories
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.bulkPut(DEFAULT_CATEGORIES);
  }
}

/**
 * Full JSON export of user data
 */
export async function exportDatabaseBackup(): Promise<string> {
  const [profile, transactions, categories, goals, budgets, chatMessages] = await Promise.all([
    db.profile.toArray(),
    db.transactions.toArray(),
    db.categories.toArray(),
    db.goals.toArray(),
    db.budgets.toArray(),
    db.chatMessages.toArray(),
  ]);

  const backupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'FINORA AI',
    data: {
      profile,
      transactions,
      categories,
      goals,
      budgets,
      chatMessages,
    },
  };

  return JSON.stringify(backupData, null, 2);
}

/**
 * Validates and restores a database backup from JSON
 */
export async function restoreDatabaseBackup(jsonStr: string): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(jsonStr);

    if (!parsed || !parsed.data || typeof parsed.data !== 'object') {
      return { success: false, message: 'Arquivo de backup inválido: formato incorreto.' };
    }

    const { transactions, categories, goals, budgets, profile, chatMessages } = parsed.data;

    await db.transaction('rw', [db.transactions, db.categories, db.goals, db.budgets, db.profile, db.chatMessages], async () => {
      if (Array.isArray(transactions)) {
        await db.transactions.clear();
        await db.transactions.bulkPut(transactions);
      }
      if (Array.isArray(categories)) {
        await db.categories.clear();
        await db.categories.bulkPut(categories);
      }
      if (Array.isArray(goals)) {
        await db.goals.clear();
        await db.goals.bulkPut(goals);
      }
      if (Array.isArray(budgets)) {
        await db.budgets.clear();
        await db.budgets.bulkPut(budgets);
      }
      if (Array.isArray(profile) && profile.length > 0) {
        await db.profile.clear();
        await db.profile.bulkPut(profile);
      }
      if (Array.isArray(chatMessages)) {
        await db.chatMessages.clear();
        await db.chatMessages.bulkPut(chatMessages);
      }
    });

    return { success: true, message: 'Dados restaurados com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Erro ao restaurar: ${err?.message || 'Arquivo corrompido'}` };
  }
}

/**
 * Safely clears all data and re-seeds basic defaults
 */
export async function resetDatabase(): Promise<void> {
  await Promise.all([
    db.transactions.clear(),
    db.categories.clear(),
    db.goals.clear(),
    db.budgets.clear(),
    db.profile.clear(),
    db.chatMessages.clear(),
  ]);
  await initializeDatabase();
}
