import { describe, it, expect } from 'vitest';
import {
  calculateCurrentBalance,
  calculateProjectedBalance,
  calculateIncome,
  calculateExpenses,
  groupExpensesByCategory,
  calculateGrowthRate,
  generateFinancialSummary,
  simulateSavings,
} from './financeEngine';
import { Transaction, CategoryBudget } from '../types/finance';

describe('FINORA Financial Engine (Deterministic Calculations)', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      description: 'Salário Empresa',
      amount: 500000, // R$ 5.000,00
      type: 'income',
      category: 'Salário',
      date: '2026-11-05',
      paymentMethod: 'pix',
      status: 'paid',
      createdAt: '2026-11-05T10:00:00Z',
      updatedAt: '2026-11-05T10:00:00Z',
    },
    {
      id: 'tx-2',
      description: 'Supermercado Central',
      amount: 45000, // R$ 450,00
      type: 'expense',
      category: 'Alimentação',
      date: '2026-11-08',
      paymentMethod: 'credit',
      status: 'paid',
      createdAt: '2026-11-08T15:00:00Z',
      updatedAt: '2026-11-08T15:00:00Z',
    },
    {
      id: 'tx-3',
      description: 'Aluguel do Mês',
      amount: 150000, // R$ 1.500,00
      type: 'expense',
      category: 'Moradia',
      date: '2026-11-10',
      paymentMethod: 'transfer',
      status: 'paid',
      createdAt: '2026-11-10T12:00:00Z',
      updatedAt: '2026-11-10T12:00:00Z',
    },
    {
      id: 'tx-4',
      description: 'Conta de Luz Prevista',
      amount: 25000, // R$ 250,00 (PENDING / CONTA FUTURA)
      type: 'expense',
      category: 'Contas',
      date: '2026-11-28',
      paymentMethod: 'pix',
      status: 'pending',
      createdAt: '2026-11-01T10:00:00Z',
      updatedAt: '2026-11-01T10:00:00Z',
    },
    {
      id: 'tx-5',
      description: 'Freelance a Receber',
      amount: 100000, // R$ 1.000,00 (PENDING RECEITA)
      type: 'income',
      category: 'Serviços',
      date: '2026-11-30',
      paymentMethod: 'pix',
      status: 'pending',
      createdAt: '2026-11-01T10:00:00Z',
      updatedAt: '2026-11-01T10:00:00Z',
    },
    // Previous month (Outubro 2026)
    {
      id: 'tx-prev-1',
      description: 'Salário Outubro',
      amount: 500000,
      type: 'income',
      category: 'Salário',
      date: '2026-10-05',
      paymentMethod: 'pix',
      status: 'paid',
      createdAt: '2026-10-05T10:00:00Z',
      updatedAt: '2026-10-05T10:00:00Z',
    },
    {
      id: 'tx-prev-2',
      description: 'Despesas Outubro',
      amount: 180000, // R$ 1.800,00
      type: 'expense',
      category: 'Moradia',
      date: '2026-10-10',
      paymentMethod: 'transfer',
      status: 'paid',
      createdAt: '2026-10-10T12:00:00Z',
      updatedAt: '2026-10-10T12:00:00Z',
    },
  ];

  it('calculates current balance strictly considering only PAID transactions and initial balance', () => {
    const initialBalance = 100000; // R$ 1.000,00
    // Paid Nov: +500000 (inc), -45000 (exp), -150000 (exp) = +305000
    // Paid Oct: +500000 (inc), -180000 (exp) = +320000
    // Pending items (+100000, -25000) MUST NOT affect current balance!
    const balance = calculateCurrentBalance(mockTransactions, initialBalance);
    expect(balance).toBe(100000 + 305000 + 320000); // 725000
  });

  it('calculates projected balance including pending future bills and pending income', () => {
    const initialBalance = 100000;
    // Current balance = 725000
    // Pending income: +100000
    // Pending expense: -25000
    // Projected = 725000 + 75000 = 800000
    const projected = calculateProjectedBalance(mockTransactions, initialBalance);
    expect(projected).toBe(800000);
  });

  it('separates paid and pending expenses cleanly', () => {
    const novTx = mockTransactions.filter((tx) => tx.date.startsWith('2026-11'));
    const exp = calculateExpenses(novTx);
    expect(exp.paid).toBe(195000); // 45000 + 150000
    expect(exp.pending).toBe(25000); // 25000
    expect(exp.total).toBe(220000);
  });

  it('separates paid and pending income cleanly', () => {
    const novTx = mockTransactions.filter((tx) => tx.date.startsWith('2026-11'));
    const inc = calculateIncome(novTx);
    expect(inc.paid).toBe(500000);
    expect(inc.pending).toBe(100000);
    expect(inc.total).toBe(600000);
  });

  it('groups expenses by category and identifies budget limit overages', () => {
    const novTx = mockTransactions.filter((tx) => tx.date.startsWith('2026-11'));
    const budgets: CategoryBudget[] = [
      { id: 'b1', category: 'Alimentação', monthlyLimit: 40000 }, // R$ 400 limit, spent 450 -> OVER BUDGET!
      { id: 'b2', category: 'Moradia', monthlyLimit: 200000 }, // R$ 2000 limit, spent 1500 -> OK
    ];

    const grouped = groupExpensesByCategory(novTx, budgets);
    expect(grouped.length).toBe(2); // Moradia and Alimentação (only paid ones)

    const alimentacao = grouped.find((g) => g.category === 'Alimentação');
    expect(alimentacao).toBeDefined();
    expect(alimentacao?.amount).toBe(45000);
    expect(alimentacao?.isOverBudget).toBe(true);

    const moradia = grouped.find((g) => g.category === 'Moradia');
    expect(moradia).toBeDefined();
    expect(moradia?.amount).toBe(150000);
    expect(moradia?.isOverBudget).toBe(false);
  });

  it('calculates growth rate percentage correctly and handles edge cases safely', () => {
    expect(calculateGrowthRate(120, 100)).toBe(20.0);
    expect(calculateGrowthRate(80, 100)).toBe(-20.0);
    expect(calculateGrowthRate(100, 0)).toBe(100);
    expect(calculateGrowthRate(0, 0)).toBe(0);
  });

  it('generates a full monthly summary with correct net result', () => {
    const summary = generateFinancialSummary(mockTransactions, [], 0, '2026-11');
    expect(summary.monthIncomePaid).toBe(500000);
    expect(summary.monthExpensePaid).toBe(195000);
    expect(summary.monthNetResult).toBe(305000); // 5000 - 1950 = 3050
    expect(summary.pendingBillsCount).toBe(1);
    expect(summary.pendingBillsTotal).toBe(25000);
  });

  it('simulates savings projection correctly over given horizon', () => {
    const simulation = simulateSavings(50000, 3, 100000); // +500 monthly surplus, starts with 1000, 3 months
    expect(simulation.projectedTotalCents).toBe(250000);
    expect(simulation.monthlyProjections.length).toBe(3);
    expect(simulation.monthlyProjections[0].projectedBalanceCents).toBe(150000);
    expect(simulation.monthlyProjections[1].projectedBalanceCents).toBe(200000);
    expect(simulation.monthlyProjections[2].projectedBalanceCents).toBe(250000);
  });
});
