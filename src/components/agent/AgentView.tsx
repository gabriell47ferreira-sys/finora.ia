import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Shield,
  Bot,
  User as UserIcon,
  Trash2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  TrendingDown,
  Check,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { askFinancialAgent } from '../../services/aiService';
import { ChatMessage } from '../../types/finance';

export const AgentView: React.FC = () => {
  const { summary, goals, transactions, profile, updateProfile, setActiveTab } = useFinance();

  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat messages stored in Dexie
  const messages =
    useLiveQuery(
      () => db.chatMessages.orderBy('timestamp').toArray(),
      []
    ) || [];

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const quickPrompts = [
    'Quanto gastei este mês?',
    'Onde estou gastando mais?',
    'Quais contas ainda preciso pagar?',
    'Consigo economizar R$ 500 por mês?',
    'Como devo organizar meu salário?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    setInputMessage('');

    // Save user message
    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    await db.chatMessages.add(userMsg);

    setIsTyping(true);

    try {
      const response = await askFinancialAgent(
        text,
        summary,
        goals,
        transactions,
        profile,
        messages
      );

      const assistantMsg: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
      };
      await db.chatMessages.add(assistantMsg);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        role: 'assistant',
        content: `Ocorreu um erro ao consultar o assistente: ${err?.message || 'Erro inesperado.'}`,
        timestamp: new Date().toISOString(),
      };
      await db.chatMessages.add(errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Deseja limpar todo o histórico de conversas com o assistente?')) {
      await db.chatMessages.clear();
    }
  };

  const handleAuthorizeConsent = async () => {
    await updateProfile({ aiExternalConsent: true });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] px-4 pt-2 pb-20 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#B7FF35] text-black flex items-center justify-center font-bold shadow-md shadow-[#B7FF35]/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <span>Assistente FINORA AI</span>
              <span className="text-[9px] bg-[#B7FF35]/20 text-[#B7FF35] px-1.5 py-0.2 rounded-full font-bold">
                Gemini AI
              </span>
            </h1>
            <p className="text-[10px] text-[#A1A1A1]">Análise financeira contextual e consultoria</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="w-8 h-8 rounded-full bg-[#1c1c1c] text-[#777] hover:text-[#FF6464] flex items-center justify-center transition-colors cursor-pointer"
            title="Limpar histórico"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Consent Gate (Explicit authorization required by Specification) */}
      {!profile?.aiExternalConsent && (
        <div className="my-3 p-4 bg-gradient-to-b from-[#1c2214] to-[#151811] border border-[#B7FF35]/40 rounded-3xl space-y-2.5 shadow-xl">
          <div className="flex items-center gap-2 text-[#B7FF35]">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold">Autorização de Processamento Necessária</span>
          </div>
          <p className="text-[11px] text-[#ccc] leading-relaxed">
            Para que o assistente responda suas dúvidas, os totais consolidados calculados pelo sistema serão processados pelo modelo de IA. Nenhum dado pessoal sensível ou bancário é compartilhado.
          </p>
          <button
            onClick={handleAuthorizeConsent}
            className="w-full py-2.5 bg-[#B7FF35] text-black text-xs font-bold rounded-xl hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-md shadow-[#B7FF35]/20"
          >
            Autorizar e Ativar Assistente
          </button>
        </div>
      )}

      {/* Conversation Messages */}
      <div className="flex-1 overflow-y-auto space-y-3.5 py-3 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center px-4 space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-[#151515] border border-[#292929] flex items-center justify-center text-[#B7FF35] shadow-xl">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Olá, {profile?.name || 'como posso ajudar?'}</h2>
              <p className="text-xs text-[#888] max-w-xs mt-1">
                Conheço seu saldo de {summary.monthIncomePaid > 0 ? 'receitas' : 'partida'}, gastos categorizados e metas. Faça uma pergunta abaixo:
              </p>
            </div>

            {/* Suggested Prompts */}
            <div className="w-full max-w-sm space-y-2 pt-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full text-left p-3 rounded-2xl bg-[#151515] hover:bg-[#202020] border border-[#262626] hover:border-[#B7FF35]/40 text-xs text-white transition-all flex items-center justify-between group cursor-pointer"
                >
                  <span className="text-[#E0E0E0] group-hover:text-white">{prompt}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#666] group-hover:text-[#B7FF35] transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-[#B7FF35] text-black flex items-center justify-center font-bold text-xs shrink-0 mt-1 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 text-xs leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-[#B7FF35] text-black font-medium rounded-tr-xs'
                      : 'bg-[#151515] border border-[#262626] text-[#E0E0E0] rounded-tl-xs shadow-md'
                  }`}
                >
                  {msg.content}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-full bg-[#202020] border border-[#333] text-[#A1A1A1] flex items-center justify-center text-xs shrink-0 mt-1">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex gap-2.5 items-center">
            <div className="w-7 h-7 rounded-full bg-[#B7FF35] text-black flex items-center justify-center font-bold text-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="bg-[#151515] border border-[#262626] rounded-3xl rounded-tl-xs px-4 py-2.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B7FF35] animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#B7FF35] animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#B7FF35] animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            placeholder={
              profile?.aiExternalConsent
                ? 'Pergunte sobre seus gastos, metas ou finanças...'
                : 'Autorize a IA acima para enviar mensagens...'
            }
            disabled={!profile?.aiExternalConsent || isTyping}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="w-full bg-[#151515] border border-[#292929] rounded-2xl pl-4 pr-12 py-3 text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#B7FF35] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!profile?.aiExternalConsent || !inputMessage.trim() || isTyping}
            className="absolute right-2 w-8 h-8 rounded-xl bg-[#B7FF35] text-black flex items-center justify-center hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>
    </div>
  );
};
