# Controle Financeiro Inteligente (Finance App)

Um aplicativo mobile ultrarrápido projetado para capturar despesas diárias e extrair dados de notas fiscais usando Inteligência Artificial (Google Gemini). Seu maior diferencial é a arquitetura de dados otimizada que permite integração direta, nativa e em tempo real com o **Microsoft Excel** via Power Query, transferindo toda a carga de análises complexas e dashboards para a planilha.

---

## 🚀 Principais Funcionalidades

- **Registro Rápido de Despesas:** Interface focada em agilidade com suporte a despesas únicas, parceladas e fixas. Suporta digitação flexível de centavos com vírgula ou ponto.
- **Pré-geração de Recorrências:** As despesas fixas são pré-geradas para os próximos 24 meses. Despesas vinculadas no mesmo grupo atualizam em lote (editar ou deletar uma parcela afeta as futuras automaticamente).
- **Scanner Inteligente de Cupons Fiscais:** Integração com a Vision API do Gemini para ler fotos de recibos de supermercado, identificando nome do mercado, valor total e todos os itens individualmente.
- **Gestos Deslizantes (Swipe):** Na visualização de meses, é possível alterar o mês corrente deslizando o dedo para a esquerda ou direita na tela, além do re-foco automático para o mês atual ao entrar na aba.
- **Integração Nativa com Excel:** Usa o driver Npgsql para que o Excel baixe os dados ao vivo do Supabase sem necessidade de arquivos `.csv`.
- **Notificações Push Automatizadas:** Lembretes diários de contas a pagar processados diretamente no Supabase Edge Functions e `pg_cron`.
- **Menu de Contexto (ActionModal):** Interface limpa sem botões excessivos, ativada ao tocar nos cartões.

---

## 🛠️ Stack Tecnológico

- **Framework Mobile:** React Native com Expo (SDK 54) e Expo Router
- **Backend & Banco de Dados:** Supabase (PostgreSQL)
- **Inteligência Artificial:** `@google/generative-ai` (Gemini 2.5 Flash Vision)
- **Gerenciamento de Estado/Armazenamento:** `AsyncStorage` (para configuração local de Categorias)
- **Acesso Nativo à Câmera:** `expo-image-picker`
- **Build & Distribuição:** EAS Build (Expo Application Services)

---

## 📋 Pré-requisitos

Para rodar este projeto em sua máquina, você vai precisar de:

- **Node.js** (versão 18 ou superior)
- **Conta no Supabase** (com um projeto novo criado)
- **Chave de API do Google Gemini** (Google AI Studio)
- Conta no **Expo** e o CLI do EAS instalado (`npm install -g eas-cli`)
- Aplicativo **Expo Go** no celular ou um emulador Android/iOS.

---

## 🏁 Como Rodar o Projeto (Local)

### 1. Clonar o Repositório e Instalar

```bash
git clone <url-do-seu-repositorio>
cd finance-app
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz da pasta `finance-app` (esse arquivo será ignorado pelo git por segurança):

```bash
EXPO_PUBLIC_GEMINI_API_KEY=sua_chave_do_google_aqui
EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase_aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 3. Configurar o Banco de Dados (Supabase)

Acesse o [Painel do Supabase](https://supabase.com/), vá na aba **SQL Editor** e execute os arquivos de esquema.

**Opcional:** Crie as seguintes tabelas manualmente se não usar o schema pré-definido:
- `expenses` (despesas comuns)
- `grocery_receipts` (cabeçalho dos recibos de mercado lidos pela IA)
- `grocery_items` (itens do supermercado atrelados ao `receipt_id`)

### 4. Rodar o Servidor de Desenvolvimento

```bash
# Limpar o cache (importante quando se altera o arquivo .env)
npx expo start --clear

# Se o seu celular não estiver na mesma rede Wi-Fi, use o tunnel:
npx expo start --tunnel
```

Escaneie o QR Code com o aplicativo da Câmera (iOS) ou o Expo Go (Android).

---

## 🏗️ Arquitetura e Fluxo de Dados

### Estrutura de Diretórios

```
finance-app/
├── app/                  # Sistema de Rotas Baseadas em Arquivos (Expo Router)
│   ├── (tabs)/           # Abas inferiores (Home, Meses, Mercado)
│   ├── _layout.tsx       # Configuração global de navegação
│   └── grocery-scan.tsx  # Tela Modal em Tela Cheia para a Câmera/IA
├── src/
│   ├── components/       # Componentes visuais isolados (ActionModal, Cards, etc.)
│   ├── services/         # Lógica de negócio e APIs (grocery.ts)
│   └── lib/              # Configuração de clientes globais (supabase.ts)
├── assets/               # Imagens e Ícones
└── supabase/             # Scripts SQL e configurações do banco (grocery_schema.sql)
```

### O Fluxo da Inteligência Artificial

Quando o usuário tira uma foto na aba **Mercado**:
1. O aplicativo usa o `expo-image-picker` para capturar a foto e a converte para Base64.
2. A função `analyzeReceiptImage` (`src/services/grocery.ts`) aciona o SDK oficial `@google/generative-ai`.
3. O modelo `gemini-2.5-flash` analisa os pixels, extrai cada item do papel usando *OCR Visual* avançado e devolve um formato estruturado (JSON).
4. O app exibe os dados para revisão do usuário e os persiste no Supabase em duas tabelas relacionais (`grocery_receipts` e `grocery_items`).

---

## 📊 Integração com o Excel

Para conectar sua planilha aos dados inseridos via aplicativo:

1. Instale o driver [Npgsql](https://github.com/npgsql/npgsql/releases) no seu Windows.
2. No Excel, vá em **Dados > Obter Dados > De Outras Fontes > De Banco de Dados ODBC** (ou nativo do PostgreSQL se estiver na versão Office 365 ProPlus).
3. Preencha as credenciais com o Host, Password, User e Database encontrados nas configurações da sua conta do Supabase em **Project Settings > Database**.
4. Desmarque o protocolo IPv6 se ocorrer erro de Timeout.

---

## 🚀 Como Gerar o APK (Produção)

Para instalar o aplicativo no celular sem precisar do computador:

### 1. Criar e Salvar os Segredos no EAS
A sua chave do Google não foi enviada para o git no arquivo `.env`. Por isso, ensine ela diretamente ao servidor do Expo:
```bash
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_GEMINI_API_KEY --value "SUA_CHAVE_AQUI" --type string
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "SUA_URL_DO_SUPABASE_AQUI" --type string
npx eas-cli secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "SUA_CHAVE_ANONIMA_DO_SUPABASE" --type string
```

### 2. Rodar o Build
```bash
npx eas-cli build --profile preview --platform android
```
No final do processo (leva em torno de 5 a 10 minutos), um link será gerado no terminal para baixar o `.apk`.

*(Nota: O uso de Gradle 9.0+ e Android SDK requeridos pela Nova Arquitetura do React Native já está devidamente configurado no `eas.json` com `EXPO_USE_NEW_ARCHITECTURE: "1"`).*

---

## 🔧 Troubleshooting (Solução de Problemas)

### O App fecha sozinho ao abrir no celular (APK)
- **Causa:** O Supabase exige `URL` e `Anon Key` no segundo zero da execução. Se o `.env` não for transferido pro EAS e as chaves não estiverem no código, ele fecha instantaneamente.
- **Solução:** Como as chaves `Anon` e `URL` são seguras de serem públicas, mantenha-as gravadas como fallback dentro de `src/lib/supabase.ts`.

### Erro "Reanimated requires new architecture"
- **Causa:** Versões modernas do `react-native-reanimated` ou módulos de animação.
- **Solução:** O `eas.json` já contém o bloqueio para ligar a Nova Arquitetura.

### Erro do Hermes / Syntax Error na geração do EAS
- **Causa:** O pacote `@supabase/supabase-js` em suas versões `2.40+` introduziu o *OpenTelemetry*, cujo código contém *imports* dinâmicos mal lidos pelo motor Hermes.
- **Solução:** Mantemos a versão do Supabase "congelada" em `2.39.3` no `package.json`.

---

**Desenvolvido com 🩵 usando React Native, IA & Supabase.**
