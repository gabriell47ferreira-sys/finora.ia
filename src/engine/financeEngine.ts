import {
  Transaction,
  CategoryBudget,
  FinancialSummary,
} from '../types/finance';
import { getCurrentYearMonth, getRelativeYearMonth } from '../utils/formatters';

export interface DateFilter {
  yearMonth?: string; // 'YYYY-MM'
  startDate?: string;
  endDate?: string;
}

/**
 * Checks if a transaction falls within a given yearMonth 'YYYY-MM'
 */
export function isInYearMonth(dateStr: string, yearMonth: string): boolean {
  return dateStr.startsWith(yearMonth);
}

/**
 * Calculates current real balance:
 * initialBalance + sum(paid incomes) - sum(paid expenses)
 * Note: Pending transactions are strictly excluded from current real balance.
 */
export function calculateCurrentBalance(
  transactions: Transaction[],
  initialBalanceCents: number = 0
): number {
  return transactions.reduce((acc, tx) => {
    if (tx.status !== 'paid') return acc;
    if (tx.type === 'income') return acc + tx.amount;
    if (tx.type === 'expense') return acc - tx.amount;
    return acc;
  }, initialBalanceCents);
}

/**
 * Calculates projected balance including both paid and pending transactions
 */
export function calculateProjectedBalance(
  transactions: Transaction[],
  initialBalanceCents: number = 0
): number {
  return transactions.reduce((acc, tx) => {
    if (tx.type === 'income') return acc + tx.amount;
    if (tx.type === 'expense') return acc - tx.amount;
    return acc;
  }, initialBalanceCents);
}

/**
 * Filters transactions by yearMonth ('YYYY-MM')
 */
export function filterTransactionsByMonth(
  transactions: Transaction[],
  yearMonth: string
): Transaction[] {
  return transactions.filter((tx) => isInYearMonth(tx.date, yearMonth));
}

/**
 * Calculates total income for given transactions, separated by paid and pending
 */
export function calculateIncome(transactions: Transaction[]): {
  paid: number;
  pending: number;
  total: number;
} {
  let paid = 0;
  let pending = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') {
      if (tx.status === 'paid') paid += tx.amount;
      else pending += tx.amount;
    }
  }

  return {
    paid,
    pending,
    total: paid + pending,
  };
}

/**
 * Calculates total expenses for given transactions, separated by paid and pending
 */
export function calculateExpenses(transactions: Transaction[]): {
  paid: number;
  pending: number;
  total: number;
} {
  let paid = 0;
  let pending = 0;

  for (const tx of transactions) {
    if (tx.type === 'expense') {
      if (tx.status === 'paid') paid += tx.amount;
      else pending += tx.amount;
    }
  }

  return {
    paid,
    pending,
    total: paid + pending,
  };
}

/**
 * Groups expenses by category with percentages and optional budget comparison
 */
export function groupExpensesByCategory(
  transactions: Transaction[],
  budgets: CategoryBudget[] = []
): Array<{
  category: string;
  amount: number;
  percentage: number;
  color: string;
  budgetLimit?: number;
  isOverBudget?: boolean;
}> {
  const expenseMap = new Map<string, number>();
  let totalExpensePaid = 0;

  for (const tx of transactions) {
    // Only paid expenses count towards consumed category budget and category distribution
    if (tx.type === 'expense' && tx.status === 'paid') {
      const current = expenseMap.get(tx.category) || 0;
      expenseMap.set(tx.category, current + tx.amount);
      totalExpensePaid += tx.amount;
    }
  }

  // Pre-mapped colors for common categories
  const categoryColors: Record<string, string> = {
    'Alimentação': '#B7FF35',
    'Moradia': '#38BDF8',
    'Transporte': '#FB923C',
    'Saúde': '#F43F5E',
    'Educação': '#A855F7',
    'Lazer': '#FBBF24',
    'Compras': '#EC4899',
    'Assinaturas': '#6366F1',
    'Contas': '#14B8A6',
    'Outros': '#94A3B8',
  };

  const budgetMap = new Map<string, number>();
  for (const b of budgets) {
    budgetMap.set(b.category, b.monthlyLimit);
  }

  const result = Array.from(expenseMap.entries())
    .map(([category, amount]) => {
      const percentage = totalExpensePaid > 0 ? (amount / totalExpensePaid) * 100 : 0;
      const budgetLimit = budgetMap.get(category);
      const isOverBudget = budgetLimit !== undefined ? amount > budgetLimit : false;

      return {
        category,
        amount,
        percentage: Number(percentage.toFixed(1)),
        color: categoryColors[category] || '#B7FF35',
        budgetLimit,
        isOverBudget,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return result;
}

/**
 * Calculates monthly comparison growth rate percentage
 * Example: if prev = 1000, current = 1200 -> +20%
 */
export function calculateGrowthRate(currentVal: number, previousVal: number): number {
  if (previousVal === 0) {
    return currentVal > 0 ? 100 : 0;
  }
  return Number((((currentVal - previousVal) / previousVal) * 100).toFixed(1));
}

/**
 * Calculates a comprehensive financial summary for a given month
 */
export function generateFinancialSummary(
  allTransactions: Transaction[],
  budgets: CategoryBudget[] = [],
  initialBalance: number = 0,
  targetYearMonth?: string
): FinancialSummary {
  const currentMonth = targetYearMonth || getCurrentYearMonth();
  const prevMonth = getRelativeYearMonth(-1, currentMonth);

  // Filter transactions for target month
  const monthTransactions = filterTransactionsByMonth(allTransactions, currentMonth);
  const prevMonthTransactions = filterTransactionsByMonth(allTransactions, prevMonth);

  // Real balance calculation considering all transactions up to current state
  const currentBalance = calculateCurrentBalance(allTransactions, initialBalance);
  const projectedBalance = calculateProjectedBalance(allTransactions, initialBalance);

  // Incomes and Expenses for target month
  const monthInc = calculateIncome(monthTransactions);
  const monthExp = calculateExpenses(monthTransactions);

  // Previous month paid values for comparison
  const prevInc = calculateIncome(prevMonthTransactions);
  const prevExp = calculateExpenses(prevMonthTransactions);

  const expenseGrowth = calculateGrowthRate(monthExp.paid, prevExp.paid);
  const incomeGrowth = calculateGrowthRate(monthInc.paid, prevInc.paid);

  // Category breakdown
  const categoryExpenses = groupExpensesByCategory(monthTransactions, budgets);

  // Pending bills
  const pendingBills = monthTransactions.filter(
    (tx) => tx.type === 'expense' && tx.status === 'pending'
  );
  const pendingBillsCount = pendingBills.length;
  const pendingBillsTotal = pendingBills.reduce((acc, tx) => acc + tx.amount, 0);

  return {
    initialBalance,
    currentBalance,
    projectedBalance,
    monthIncomePaid: monthInc.paid,
    monthIncomePending: monthInc.pending,
    monthIncomeTotal: monthInc.total,
    monthExpensePaid: monthExp.paid,
    monthExpensePending: monthExp.pending,
    monthExpenseTotal: monthExp.total,
    monthNetResult: monthInc.paid - monthExp.paid,
    previousMonthExpensePaid: prevExp.paid,
    previousMonthIncomePaid: prevInc.paid,
    expenseGrowthRate: expenseGrowth,
    incomeGrowthRate: incomeGrowth,
    categoryExpenses,
    pendingBillsCount,
    pendingBillsTotal,
  };
}

/**
 * Simulates savings projection given an average monthly surplus and target horizon in months
 */
export function simulateSavings(
  monthlySurplusCents: number,
  months: number,
  currentAccumulatedCents: number = 0
): {
  projectedTotalCents: number;
  monthlyProjections: Array<{ monthIndex: number; projectedBalanceCents: number }>;
} {
  const projections: Array<{ monthIndex: number; projectedBalanceCents: number }> = [];
  let runningTotal = currentAccumulatedCents;

  for (let i = 1; i <= months; i++) {
    runningTotal += monthlySurplusCents;
    projections.push({
      monthIndex: i,
      projectedBalanceCents: runningTotal,
    });
  }

  return {
    projectedTotalCents: runningTotal,
    monthlyProjections: projections,
  };
}

/**
 * Generates automated contextual insights based on deterministic financial state
 */
export function generateContextualInsights(summary: FinancialSummary): string[] {
  const insights: string[] = [];

  // Insight 1: Net result
  if (summary.monthNetResult > 0) {
    insights.push(
      `Você está com saldo positivo de economia neste mês (+R$ ${(summary.monthNetResult / 100).toFixed(2)}). Ótimo momento para direcionar para suas metas.`
    );
  } else if (summary.monthNetResult < 0 && summary.monthExpensePaid > 0) {
    insights.push(
      `Atenção: seus gastos ultrapassaram as receitas em R$ ${(Math.abs(summary.monthNetResult) / 100).toFixed(2)} neste mês.`
    );
  }

  // Insight 2: Comparison with last month
  if (summary.previousMonthExpensePaid > 0) {
    if (summary.expenseGrowthRate > 15) {
      insights.push(
        `Seus gastos aumentaram ${summary.expenseGrowthRate}% em relação ao mês anterior.`
      );
    } else if (summary.expenseGrowthRate < -10) {
      insights.push(
        `Parabéns! Seus gastos reduziram ${Math.abs(summary.expenseGrowthRate)}% comparados ao mês passado.`
      );
    }
  }

  // Insight 3: Top spending category
  if (summary.categoryExpenses.length > 0) {
    const top = summary.categoryExpenses[0];
    if (top.percentage >= 35) {
      insights.push(
        `A categoria "${top.category}" representa ${top.percentage}% de todos os seus gastos do mês.`
      );
    }
  }

  // Insight 4: Pending bills
  if (summary.pendingBillsCount > 0) {
    insights.push(
      `Você possui ${summary.pendingBillsCount} conta(s) pendente(s) somando R$ ${(summary.pendingBillsTotal / 100).toFixed(2)} até o fim do mês.`
    );
  }

  return insights;
}
