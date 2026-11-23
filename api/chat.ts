import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ChatRequestBody {
  message: string;
  chatHistory?: Array<{ role: string; content: string }>;
  financialContext: {
    userName: string;
    currency: string;
    currentBalance: string;
    projectedBalance: string;
    monthIncomePaid: string;
    monthIncomePending: string;
    monthExpensePaid: string;
    monthExpensePending: string;
    monthNetResult: string;
    growthRates: {
      incomeGrowth: string;
      expenseGrowth: string;
    };
    categoryExpenses: Array<{
      category: string;
      amount: string;
      percentage: number;
      budgetLimit?: string;
      isOverBudget?: boolean;
    }>;
    pendingBills: Array<{
      description: string;
      amount: string;
      date: string;
      category: string;
    }>;
    goals: Array<{
      title: string;
      targetAmount: string;
      currentAmount: string;
      progressPercentage: number;
      remainingAmount: string;
      deadline?: string;
    }>;
  };
  customApiKey?: string;
}

const GEMINI_MODELS_POOL = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, chatHistory = [], financialContext, customApiKey } = (req.body || {}) as ChatRequestBody;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Mensagem inválida ou ausente.' });
  }

  const geminiKey = customApiKey?.startsWith('AQ.')
    ? customApiKey
    : process.env.GEMINI_API_KEY || (customApiKey && !customApiKey.startsWith('sk-') ? customApiKey : null);

  const openaiKey = (!geminiKey && customApiKey?.startsWith('sk-'))
    ? customApiKey
    : process.env.OPENAI_API_KEY;

  if (!geminiKey && !openaiKey) {
    return res.status(503).json({
      error: 'AI_KEY_NOT_CONFIGURED',
      message: 'Nenhuma chave de API (Gemini ou OpenAI) foi configurada.',
    });
  }

  const userName = financialContext?.userName || 'você';

  const systemInstructionText = `Você é o FINORA, assistente e parceiro financeiro pessoal de ${userName}.

DIRETRIZES DE PERSONALIDADE E HUMANIZAÇÃO:
1. NUNCA REPITA APRESENTAÇÕES ROBÓTICAS OU MENSAGENS PADRÃO:
   - PROIBIDO começar respostas com introduções decoradas como: "Olá, ${userName}! É um prazer imenso falar com você. Como o FINORA AI, meu propósito é atuar como seu consultor de elite...", "Analisando seu perfil neste momento vejo que...", etc.
   - Fale como uma pessoa real: natural, acolhedor, inteligente, perspicaz e direto ao ponto.
   - Em uma conversa já iniciada, continue o diálogo com naturalidade ("Com certeza!", "Boa pergunta!", "Olha só:", ou entre direto na resposta).

2. USO ORGÂNICO DOS DADOS FINANCEIROS:
   - Saldo Atual: ${financialContext?.currentBalance} | Receitas: ${financialContext?.monthIncomePaid} | Despesas: ${financialContext?.monthExpensePaid}
   - Contas pendentes: ${JSON.stringify(financialContext?.pendingBills || [])}
   - Metas: ${JSON.stringify(financialContext?.goals || [])}
   - Categorias: ${JSON.stringify(financialContext?.categoryExpenses || [])}
   - Use esses dados apenas quando for relevante para a pergunta. Se a pessoa perguntou sobre suas capacidades ou conselhos gerais, responda a isso diretamente sem ler o extrato inteiro desnecessariamente.
   - NUNCA invente números, datas ou contas.

3. ESTILO DE RESPOSTA:
   - Português do Brasil, tom amigável e consultivo.
   - Respostas fluidas e limpas, fáceis de ler no celular, usando negrito nos pontos-chave e listas curtas quando necessário.`;

  try {
    // 1. Try Gemini models pool with automatic fallback
    if (geminiKey) {
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      for (const h of chatHistory) {
        if (h.content && h.content.trim()) {
          contents.push({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.content }],
          });
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      for (const model of GEMINI_MODELS_POOL) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const geminiResponse = await fetch(geminiUrl, {
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
          });

          if (geminiResponse.ok) {
            const data = await geminiResponse.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              return res.status(200).json({ content: text });
            }
          }
        } catch (mErr) {
          console.warn(`Error on ${model}, falling back...`, mErr);
        }
      }
    }

    // 2. OpenAI Fallback if configured
    if (openaiKey) {
      const openAiMessages = [
        { role: 'system', content: systemInstructionText },
        ...chatHistory.map((h) => ({
          role: h.role === 'model' ? 'assistant' : 'user',
          content: h.content,
        })),
        { role: 'user', content: message },
      ];

      const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: openAiMessages,
          temperature: 0.6,
          max_tokens: 800,
        }),
      });

      if (openAiRes.ok) {
        const openAiData = await openAiRes.json();
        const text = openAiData?.choices?.[0]?.message?.content;
        if (text) {
          return res.status(200).json({ content: text });
        }
      }
    }

    return res.status(503).json({
      error: 'HIGH_DEMAND',
      message: 'Os modelos de IA estão com alta demanda temporária no momento.',
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: error?.message || 'Erro ao processar inteligência financeira.',
    });
  }
}
