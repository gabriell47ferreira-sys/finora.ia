import React, { useState, useRef } from 'react';
import {
  User,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Smartphone,
  Sparkles,
  Check,
  AlertTriangle,
  Info,
  Key,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  exportDatabaseBackup,
  restoreDatabaseBackup,
  resetDatabase,
} from '../../db/database';
import { formatCurrency, toCents, fromCents } from '../../utils/formatters';

export const ProfileView: React.FC = () => {
  const { profile, updateProfile, summary } = useFinance();

  const [name, setName] = useState(profile?.name || '');
  const [initialBalanceStr, setInitialBalanceStr] = useState(
    profile ? (profile.initialBalance / 100).toFixed(2) : '0.00'
  );
  const [apiKeyCustom, setApiKeyCustom] = useState(profile?.apiKeyCustom || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const balanceCents = toCents(initialBalanceStr);
    await updateProfile({
      name: name.trim() || 'Usuário',
      initialBalance: balanceCents,
      apiKeyCustom: apiKeyCustom.trim() || undefined,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleToggleConsent = async () => {
    if (!profile) return;
    const nextConsent = !profile.aiExternalConsent;
    await updateProfile({ aiExternalConsent: nextConsent });
  };

  const handleExportBackup = async () => {
    const jsonStr = await exportDatabaseBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finora-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      if (confirm('A restauração substituirá os dados atuais pelo conteúdo do backup. Deseja continuar?')) {
        const result = await restoreDatabaseBackup(content);
        setRestoreStatus(result.message);
        setTimeout(() => setRestoreStatus(null), 5000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetData = async () => {
    if (confirm('ATENÇÃO: Isso apagará todas as suas movimentações, metas e configurações locais. Deseja restaurar os dados de fábrica?')) {
      await resetDatabase();
      alert('Banco de dados restaurado aos padrões iniciais!');
      window.location.reload();
    }
  };

  return (
    <div className="px-5 py-2 space-y-5 animate-fadeIn pb-28">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight">Perfil & Configurações</h1>
        <p className="text-xs text-[#A1A1A1]">Privacidade, backup e preferências do FINORA</p>
      </div>

      {/* 1. Informações Básicas do Usuário */}
      <form onSubmit={handleSaveProfile} className="bg-[#151515] border border-[#262626] rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#262626]">
          <User className="w-4 h-4 text-[#B7FF35]" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Dados Pessoais & Saldo Inicial
          </h2>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#A1A1A1] mb-1.5">
            Seu Nome
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#292929] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#B7FF35]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#A1A1A1] mb-1.5">
            Saldo Inicial de Partida (R$)
          </label>
          <input
            type="number"
            step="0.01"
            value={initialBalanceStr}
            onChange={(e) => setInitialBalanceStr(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#292929] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#B7FF35]"
          />
          <p className="text-[10px] text-[#666] mt-1">
            Valor de saldo que você possuía antes de iniciar os registros no FINORA.
          </p>
        </div>

        {/* Custom AI Key */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#A1A1A1] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#B7FF35]" />
              Chave de API do Assistente (Gemini / OpenAI)
            </label>
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="text-[10px] text-[#888] hover:text-white"
            >
              {showApiKey ? 'Ocultar' : 'Exibir'}
            </button>
          </div>
          <input
            type={showApiKey ? 'text' : 'password'}
            placeholder="Chave do Gemini ou OpenAI"
            value={apiKeyCustom}
            onChange={(e) => setApiKeyCustom(e.target.value)}
            className="w-full bg-[#1c1c1c] border border-[#292929] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#B7FF35] font-mono text-[11px]"
          />
          <p className="text-[10px] text-[#666] mt-1">
            Conectada ao modelo de alta velocidade <strong>Gemini 3.8 Flash</strong> com raciocínio financeiro.
          </p>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-[#B7FF35] text-black text-xs font-bold rounded-xl hover:opacity-90 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" /> Dados Salvos!
            </>
          ) : (
            'Salvar Alterações'
          )}
        </button>
      </form>

      {/* 2. Consentimento e Privacidade de IA */}
      <div className="bg-[#151515] border border-[#262626] rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#262626]">
          <Shield className="w-4 h-4 text-[#38BDF8]" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Privacidade & Processamento de IA
          </h2>
        </div>

        <p className="text-xs text-[#A1A1A1] leading-relaxed">
          Para responder a dúvidas contextuais, o FINORA envia ao modelo de IA apenas os totais consolidados e categorias relevantes calculadas pelo motor financeiro. Nenhum dado pessoal identificável ou credencial bancária é transmitido.
        </p>

        <div className="bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white">Autorizar Análise por IA Externa</div>
            <div className="text-[10px] text-[#777]">
              {profile?.aiExternalConsent ? 'Status: Autorizado' : 'Status: Não autorizado (assistente desativado)'}
            </div>
          </div>

          <button
            onClick={handleToggleConsent}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              profile?.aiExternalConsent ? 'bg-[#B7FF35]' : 'bg-[#333]'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-black absolute top-0.5 transition-transform ${
                profile?.aiExternalConsent ? 'right-0.5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Armazenamento Local e Backup */}
      <div className="bg-[#151515] border border-[#262626] rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#262626]">
          <Download className="w-4 h-4 text-[#FBBF24]" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Backup Local (Local-First)
          </h2>
        </div>

        <div className="bg-[#1c1c1c] border border-[#292929] rounded-2xl p-3 text-xs text-[#A1A1A1] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#FBBF24] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Seus dados estão gravados exclusivamente neste dispositivo (IndexedDB). Limpar o histórico do navegador sem fazer backup prévio pode apagar seus registros. Recomendamos exportar regularmente.
          </p>
        </div>

        {restoreStatus && (
          <div className="p-3 bg-[#32D583]/15 border border-[#32D583]/30 rounded-xl text-xs text-[#32D583] font-semibold">
            {restoreStatus}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportBackup}
            className="py-2.5 px-3 bg-[#202020] hover:bg-[#252525] border border-[#2e2e2e] rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5 text-[#B7FF35]" /> Exportar JSON
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="py-2.5 px-3 bg-[#202020] hover:bg-[#252525] border border-[#2e2e2e] rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Upload className="w-3.5 h-3.5 text-[#38BDF8]" /> Restaurar Backup
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".json,application/json"
            className="hidden"
          />
        </div>

        <button
          onClick={handleResetData}
          className="w-full py-2 bg-[#201414] hover:bg-[#2a1717] border border-[#FF6464]/30 rounded-xl text-xs font-semibold text-[#FF6464] transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrões de Fábrica
        </button>
      </div>

      {/* 4. Instalação PWA no Celular */}
      <div className="bg-[#151515] border border-[#262626] rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#262626]">
          <Smartphone className="w-4 h-4 text-[#B7FF35]" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Instalar App no Celular (PWA)
          </h2>
        </div>

        <div className="space-y-2 text-xs text-[#A1A1A1]">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#202020] text-[#B7FF35] font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
            <p>No Chrome ou Edge do seu celular Android, toque nos <strong>3 pontinhos (Menu)</strong> no canto superior direito.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#202020] text-[#B7FF35] font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
            <p>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#202020] text-[#B7FF35] font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
            <p>O FINORA AI abrirá em tela cheia como um app nativo, mesmo sem conexão à internet.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
