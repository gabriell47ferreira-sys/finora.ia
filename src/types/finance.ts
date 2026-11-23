export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'cash' | 'transfer' | 'other';

export type TransactionStatus = 'paid' | 'pending';

export type RecurrenceFrequency = 'none' | 'monthly' | 'weekly' | 'yearly';

export interface Transaction {
  id: string;
  description: string;
  amount: number; // Stored in cents (e.g., R$ 150.50 -> 15050) to avoid floating-point errors
  type: TransactionType;
  category: string;
  date: string; // ISO date 'YYYY-MM-DD'
  paymentMethod: PaymentMethod;
  notes?: string;
  status: TransactionStatus;
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceFrequency;
  recurrenceGroupId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  isCustom?: boolean;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number; // in cents
  currentAmount: number; // in cents
  deadline?: string; // 'YYYY-MM-DD'
  category?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBudget {
  id: string;
  category: string;
  monthlyLimit: number; // in cents
  month?: string; // 'YYYY-MM' or undefined for all months
}

export interface UserProfile {
  id: string; // 'user_profile'
  name: string;
  initialBalance: number; // in cents
  currency: string; // 'BRL'
  aiExternalConsent: boolean; // explicit user opt-in required for sending to AI endpoint
  hasCompletedOnboarding: boolean;
  apiKeyCustom?: string; // optional user custom OpenAI key stored in client localStorage if Vercel serverless has none
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actionCards?: Array<{
    title: string;
    subtitle?: string;
    value?: string;
    type?: 'stat' | 'alert' | 'recommendation' | 'shortcut';
  }>;
}

export interface FinancialSummary {
  initialBalance: number; // in cents
  currentBalance: number; // in cents (initial + paid income - paid expenses)
  projectedBalance: number; // in cents (currentBalance + pending income - pending expenses)
  monthIncomePaid: number; // in cents
  monthIncomePending: number; // in cents
  monthIncomeTotal: number; // in cents
  monthExpensePaid: number; // in cents
  monthExpensePending: number; // in cents
  monthExpenseTotal: number; // in cents
  monthNetResult: number; // paid income - paid expenses
  previousMonthExpensePaid: number;
  previousMonthIncomePaid: number;
  expenseGrowthRate: number; // percentage vs previous month
  incomeGrowthRate: number; // percentage vs previous month
  categoryExpenses: Array<{
    category: string;
    amount: number; // in cents
    percentage: number; // 0 - 100
    color: string;
    budgetLimit?: number;
    isOverBudget?: boolean;
  }>;
  pendingBillsCount: number;
  pendingBillsTotal: number; // in cents
}
