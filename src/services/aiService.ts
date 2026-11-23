import { FinancialSummary, Goal, Transaction, UserProfile, ChatMessage } from '../types/finance';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export interface AIResponse {
  success: boolean;
  content: string;
  isUnavailable?: boolean;
}

const DEFAULT_GEMINI_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || '';

// Resilient models pool with automatic fallback in case of high demand spikes
const GEMINI_MODELS_POOL = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];

export async function askFinancialAgent(
  userQuestion: string,
  summary: FinancialSummary,
  goals: Goal[],
  transactions: Transaction[],
  profile: UserProfile | null,
  chatHistory: ChatMessage[] = []
): Promise<AIResponse> {
  const activeKey = profile?.apiKeyCustom?.trim() || DEFAULT_GEMINI_KEY;

  // 1. Prepare structured financial context
  const pendingBills = transactions
    .filter((tx) => tx.type === 'expense' && tx.status === 'pending')
    .map((b) => ({
      description: b.description,
      amount: formatCurrency(b.amount),
      date: b.date,
      category: b.category,
    }));

  const structuredGoals = goals.map((g) => {
    const progress = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
    return {
      title: g.title,
      targetAmount: formatCurrency(g.targetAmount),
      currentAmount: formatCurrency(g.currentAmount),
      progressPercentage: progress,
      remainingAmount: formatCurrency(remaining),
      deadline: g.deadline,
    };
  });

  const structuredCategories = summary.categoryExpenses.map((c) => ({
    category: c.category,
    amount: formatCurrency(c.amount),
    percentage: c.percentage,
    budgetLimit: c.budgetLimit ? formatCurrency(c.budgetLimit) : undefined,
    isOverBudget: c.isOverBudget,
  }));

  const historyPayload = chatHistory.slice(-8).map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    content: m.content,
  }));

  const payload = {
    message: userQuestion,
    chatHistory: historyPayload,
    financialContext: {
      userName: profile?.name || 'Você',
      currency: 'BRL',
      currentBalance: formatCurrency(summary.currentBalance),
      projectedBalance: formatCurrency(summary.projectedBalance),
      monthIncomePaid: formatCurrency(summary.monthIncomePaid),
      monthIncomePending: formatCurrency(summary.monthIncomePending),
      monthExpensePaid: formatCurrency(summary.monthExpensePaid),
      monthExpensePending: formatCurrency(summary.monthExpensePending),
      monthNetResult: formatCurrency(summary.monthNetResult),
      growthRates: {
        incomeGrowth: formatPercentage(summary.incomeGrowthRate),
        expenseGrowth: formatPercentage(summary.expenseGrowthRate),
      },
      categoryExpenses: structuredCategories,
      pendingBills,
      goals: structuredGoals,
    },
    customApiKey: activeKey,
  };

  // Try serverless endpoint first (/api/chat)
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.content) {
        return { success: true, content: data.content };
      }
    }
  } catch {
    // If local without /api server, use direct client call
  }

  // Direct resilient Gemini API call with multiturn conversation and natural humanized training
  return await callDirectGeminiWithFallback(
    userQuestion,
    payload.financialContext,
    historyPayload,
    activeKey
  );
}

async function callDirectGeminiWithFallback(
  userQuestion: string,
  context: any,
  history: Array<{ role: string; content: string }>,
  apiKey: string
): Promise<AIResponse> {
  const userName = context.userName || 'você';

  const systemInstructionText = `Você é o FINORA, o assistente e consultor financeiro pessoal de ${userName}.

DIRETRIZES FUNDAMENTAIS DE COMPORTAMENTO E PERSONALIDADE:
1. NUNCA REPITA APRESENTAÇÕES ROBÓTICAS OU MENSAGENS PADRÃO:
   - PROIBIDO começar respostas com frases decoradas como: "Olá, ${userName}! É um prazer imenso falar com você. Como o FINORA AI, meu propósito é atuar como seu consultor de elite...", "Analisando seu perfil neste momento vejo que...", etc.
   - Fale como uma pessoa real: acolhedor, inteligente, perspicaz, ágil e direto ao ponto.
   - Se a conversa já está em andamento, responda com naturalidade ("Com certeza!", "Boa pergunta!", "Olha só:", ou entre direto na resposta).

2. USO NATURAL DOS DADOS FINANCEIROS:
   - Você tem acesso aos dados reais de ${userName}:
     - Saldo Atual: ${context.currentBalance}
     - Receitas do mês: ${context.monthIncomePaid}
     - Despesas do mês: ${context.monthExpensePaid}
     - Contas pendentes: ${JSON.stringify(context.pendingBills)}
     - Metas: ${JSON.stringify(context.goals)}
     - Categorias: ${JSON.stringify(context.categoryExpenses)}
   - Use esses dados APENAS quando fizer sentido para a pergunta. Se a pessoa perguntou "qual é a sua capacidade", explique suas habilidades e como pode ajudá-la de forma prática, sem precisar despejar o extrato bancário inteiro se não foi pedido.
   - NUNCA invente números, datas ou contas que não existem no contexto acima.

3. ESTILO DE RESPOSTA:
   - Em Português do Brasil, tom amigável, moderno e consultivo.
   - Respostas fluidas e limpas, fáceis de ler no celular, usando negrito nos pontos-chave e listas curtas quando necessário.`;

  // Build multiturn conversation history
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  for (const h of history) {
    if (h.content && h.content.trim()) {
      contents.push({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.content }],
      });
    }
  }

  // Add current user prompt
  contents.push({
    role: 'user',
    parts: [{ text: userQuestion }],
  });

  let lastErrorMsg = '';

  for (const model of GEMINI_MODELS_POOL) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemInstructionText }],
            },
            contents,
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 1000,
            },
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return {
          success: true,
          content: data.candidates[0].content.parts[0].text,
        };
      }

      lastErrorMsg = data?.error?.message || `Status ${response.status}`;
      console.warn(`Model ${model} unavailable (${lastErrorMsg}), attempting fallback...`);
    } catch (err: any) {
      lastErrorMsg = err?.message || 'Erro de conexão';
      console.warn(`Model ${model} connection error (${lastErrorMsg}), attempting fallback...`);
    }
  }

  return {
    success: false,
    content: `Os servidores de IA estão com alta demanda temporária. Por favor, tente enviar novamente em alguns segundos. (Detalhe: ${lastErrorMsg})`,
  };
}
