# FINORA AI — Assistente Financeiro Pessoal Inteligente

> **Versão 1.0 — MVP Oficial de Produção**  
> Inspirado na estética premium e experiência mobile fintech (Pierre Finance).

FINORA AI é uma aplicação financeira pessoal **Local-First**, segura, responsiva e instalável (PWA), equipada com um assistente conversacional de inteligência artificial contextual.

---

## 🚀 Principais Funcionalidades

1. **Dashboard Executivo (Início)**
   - Saldo líquido real consolidado com comparativo percentual em relação ao mês anterior.
   - Visão de receitas, despesas e resultado mensal (economia/déficit).
   - Gráfico de curva suave de gastos diários do mês com Recharts.
   - Cards de observação e insights contextuais gerados deterministicamente.
   - Progresso dos tetos de gastos por categoria.
   - Atividades recentes com status visual (*Pago* vs *Pendente*).

2. **Movimentações Financeiras Completas**
   - Lançamento de Receitas e Despesas com cálculo exato em centavos inteiros (sem erros de ponto flutuante).
   - Categorias padrão e personalizadas.
   - Filtro por mês de referência, categoria, tipo (Receitas/Despesas) e status.
   - Busca em tempo real por descrição, categoria ou anotações.
   - Diferenciação estrita entre contas pagas e contas futuras/pendentes (um clique para liquidar).
   - Suporte a recorrência mensal.

3. **Agente IA Financeiro Contextual (GPT-4o)**
   - Integração com endpoint serverless protegido (`/api/chat`).
   - Não inventa números: interpreta os dados deterministicamente calculados pelo motor financeiro.
   - Prompt pré-configurado para respostas objetivas, cálculos de economia, sugestão de organização orçamentária e simulação.
   - Histórico de chat persistido no dispositivo.
   - Controle de privacidade: exige autorização explícita do usuário antes de qualquer processamento externo.
   - Modo de contingência gracioso: caso a chave de API não esteja configurada no servidor, o app continua funcionando 100% nas funções locais e permite ao usuário inserir sua própria chave na aba Perfil se desejar.

4. **Planejamento Orçamentário & Metas**
   - Metas de economia com barra de progresso visual, valor acumulado, valor restante e aporte direto com microinteração de celebração (confetes).
   - Tetos de gastos por categoria com alertas visuais de estouro.
   - Gestão de contas futuras e compromissos a vencer.
   - Simulador interativo de patrimônio acumulado por prazo e economia mensal.

5. **Privacidade e Armazenamento Local-First**
   - Armazenamento em IndexedDB de alta performance via Dexie.
   - Exportação completa de backup em arquivo JSON.
   - Restauração de backup com validação de integridade.
   - Opção de restauração de fábrica com confirmação de segurança.

6. **PWA Mobile-First Instalável**
   - Suporte a instalação nativa no Android via Chrome/Edge (Add to Home Screen).
   - Suporte offline completo para todas as rotas e funções locais.
   - Ícones e manifesto PWA integrados.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite
- **Estilização:** Tailwind CSS v4, Lucide React
- **Gráficos:** Recharts
- **Banco de Dados Local:** Dexie.js (IndexedDB)
- **Engine Financeira:** Regras em centavos inteiros com testes unitários em Vitest
- **PWA:** vite-plugin-pwa com Service Worker Workbox
- **Backend Serverless:** Vercel Serverless Function (`/api/chat`)
- **Inteligência Artificial:** OpenAI API (GPT-4o / GPT-4o-mini)

---

## 🧪 Testes Unitários

O motor financeiro possui cobertura de testes para validação determinística de saldo, despesas pendentes, contas futuras, agrupamento por categoria, percentuais e simulações.

Para rodar os testes:
```bash
npm run test
# ou
npx vitest run
```

---

## 📦 Como Rodar Localmente

1. Clone o repositório ou navegue até o diretório:
```bash
cd finora
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Build de produção:
```bash
npm run build
```

---

## ☁️ Deploy na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Importe o projeto no painel da **Vercel** (`https://vercel.com/new`).
3. Em **Environment Variables**, adicione:
   - `OPENAI_API_KEY`: sua chave de API da OpenAI (`sk-...`).
4. Clique em **Deploy**. O Vercel detectará automaticamente a configuração do Vite e o endpoint de API serverless em `/api/chat.ts`.
