# Wireframes - Sistema de Irrigação Inteligente

## Visão Geral

Este documento descreve os wireframes completos do aplicativo mobile de Irrigação Inteligente, desenvolvido com React, TypeScript e Tailwind CSS.

## Paleta de Cores

### Cores Principais
- **Verde Floresta** `#2d5a4a` - Cor primária, usado em botões principais, headers e elementos de destaque
- **Azul Petróleo** `#1e4d5c` - Cor secundária, usado em elementos de suporte e variações

### Cores de Suporte
- **Background** `#f8faf9` - Cor de fundo clara
- **Foreground** `#1a2e1a` - Cor de texto principal
- **Success** `#4a8c6f` - Verde claro para estados positivos
- **Warning** `#e8a836` - Amarelo para alertas
- **Muted** `#5a7368` - Cinza esverdeado para textos secundários

## Estrutura do Aplicativo

### 1. Tela de Boas-Vindas (Welcome Screen)
**Rota:** `/`

**Elementos:**
- Gradiente de fundo (Verde Floresta → Azul Petróleo)
- Ícones grandes de gota d'água e planta
- Título "Irrigação Inteligente"
- Descrição do sistema
- Botão "Começar" (CTA principal)
- Botão "Ver Wireframes" (CTA secundário)
- Versão do app no rodapé

**Funcionalidades:**
- Navegação para o Dashboard
- Acesso aos wireframes
- Primeira impressão do usuário

---

### 2. Dashboard Principal
**Rota:** `/dashboard`

**Elementos:**
- **Header:**
  - Nome do app + subtítulo com cultura ativa
  - Botão para voltar à tela inicial
  - Botão para adicionar nova cultura (+)
  - Ícone de notificações com badge contador
  - Botão para ver wireframes
- **Navegação:** Tabs (Dashboard, Válvulas, Sensores, Análises Web)
- **Banner:** Card com gradiente mostrando cultura ativa
- **Cards de Métricas:** 
  - Válvulas Ativas (2/3)
  - Sensores Online (4/4)
  - Alertas (2)
- **Painel de Válvulas:** Lista com status e fluxo
- **Painel de Sensores:** Lista com umidade e alertas

**Funcionalidades:**
- Visão geral do sistema
- Acesso rápido a todas as seções
- Monitoramento em tempo real
- Indicadores visuais de status

---

### 3. Controle de Válvulas
**Rota:** `/valves`

**Elementos:**
- Header com título "Controle de Válvulas" e botão "Configurar"
- Grid 2x2 de cards de válvulas
- Cada card contém:
  - Ícone de gota d'água
  - Nome da válvula
  - Status (Ativa/Inativa)
  - Botão liga/desliga
  - Métricas: Fluxo (L/min), Pressão (bar), Última ativação
  - Barra de progresso da capacidade

**Funcionalidades:**
- Ligar/Desligar válvulas individualmente
- Visualizar métricas em tempo real
- Indicador visual de status (cor verde = ativo, cinza = inativo)
- Configurações avançadas

---

### 4. Monitoramento de Sensores
**Rota:** `/sensors`

**Elementos:**
- Header com título e indicador "Online"
- Grid 3x2 de cards de sensores
- Cada card contém:
  - Nome e localização do sensor
  - Badge de status (Normal/Seco/Úmido)
  - Barra de progresso de umidade (colorida por status)
  - Temperatura
  - Pressão atmosférica
- Card de resumo do sistema:
  - Umidade média
  - Temperatura média
  - Sensores ativos
  - Alertas ativos

**Funcionalidades:**
- Monitoramento em tempo real
- Alertas visuais por cores:
  - Verde (#4a8c6f) = Normal
  - Amarelo (#e8a836) = Solo Seco
  - Azul (#1e4d5c) = Solo Úmido
- Resumo estatístico
- Identificação rápida de problemas

---

### 5. Análises Web
**Rota:** `/analytics`

**Elementos:**
- **Banner Hero:**
  - Gradiente de fundo
  - Título "Análises e Gráficos Avançados"
  - Descrição dos recursos
  - Botão "Acessar Plataforma Web"
- **Cards de Recursos:** (3 cards)
  - Gráficos Detalhados
  - Análises Avançadas
  - Relatórios Periódicos
- **Lista de Funcionalidades:** 8 itens com bullets
- **Card Informativo:** Sincronização automática

**Funcionalidades:**
- Apresentar recursos da plataforma web
- Redirecionar para site externo
- Informar sobre funcionalidades avançadas
- Destacar integração app-web

---

### 6. Modal Nova Cultura
**Componente:** Overlay modal

**Elementos:**
- Overlay escuro semi-transparente (bg-black/50)
- Modal centralizado branco
- Header com título "Nova Cultura" e botão fechar (X)
- **Formulário:**
  - Campo: Nome da Cultura (text input)
  - Campo: Área em hectares (number input)
  - Campo: Data de Plantio (date picker)
- Botão "Adicionar Cultura" com ícone +

**Funcionalidades:**
- Cadastrar nova cultura
- Validação de campos obrigatórios
- Fechar modal (X ou ESC)
- Adicionar cultura à lista

---

## Sistema de Notificações

**Componente:** NotificationPanel (dropdown)

**Elementos:**
- Ícone de sino no header
- Badge com contador de não lidas
- Dropdown com lista de notificações
- Cada notificação contém:
  - Ícone colorido por tipo
  - Título do alerta
  - Localização (qual sensor)
  - Timestamp
  - Botão "Marcar como lida"
  - Botão remover (X)
- Botão "Limpar todas"

**Tipos de Notificação:**
- ⚠️ Solo Muito Seco (amarelo #e8a836)
- 💧 Solo Muito Úmido (azul #1e4d5c)
- ℹ️ Informações gerais (verde #2d5a4a)

**Automação:**
- Notificações aparecem automaticamente via toast
- Sistema verifica sensores a cada 60 segundos
- Alertas quando umidade < 40% ou > 80%

---

## Componentes Reutilizáveis

### Buttons
- **Primary:** bg-[#2d5a4a], texto branco, rounded-xl
- **Secondary:** bg-white, texto verde, border
- **Icon:** Apenas ícone, hover com background

### Cards
- Background branco
- Border 2px com #2d5a4a/20
- Rounded-xl (12px)
- Padding de 16-24px
- Shadow-sm com hover para shadow-md

### Inputs
- Background #f8faf9
- Border 2px com #2d5a4a/20
- Rounded-xl
- Focus com ring #2d5a4a

### Badges
- Rounded-full
- Padding horizontal
- Cores por contexto (success, warning, info)

### Progress Bars
- Background #e8f0ed
- Fill com gradiente ou cor sólida
- Height 8-10px
- Rounded-full

---

## Navegação

### Estrutura de Rotas
```
/ (Welcome)
  ├── /dashboard
  ├── /valves
  ├── /sensors
  └── /analytics
```

### Tabs de Navegação
Sempre visíveis no header após login:
1. Dashboard (ícone Home)
2. Válvulas (ícone Droplets)
3. Sensores (ícone Thermometer)
4. Análises Web (ícone BarChart3)

### Menu Mobile
- Hamburguer menu no header
- Slide-in lateral
- Mesmas opções das tabs
- Backdrop escuro com dismiss

---

## Responsividade

### Breakpoints
- Mobile: < 768px (1 coluna)
- Tablet: 768px - 1024px (2 colunas)
- Desktop: > 1024px (3 colunas)

### Grid Systems
- **Dashboard:** 3 cols → 2 cols → 1 col
- **Válvulas:** 2 cols → 1 col
- **Sensores:** 3 cols → 2 cols → 1 col

---

## Interações e Estados

### Hover States
- Botões: Escurecer 10-15%
- Cards: Aumentar shadow
- Inputs: Destacar border

### Loading States
- Skeleton screens para cards
- Spinner para ações
- Progress bar para uploads

### Error States
- Border vermelha em inputs
- Mensagem de erro abaixo do campo
- Toast notification para erros globais

### Success States
- Toast notification verde
- Ícone de check
- Animação de fade-out

---

## Acessibilidade

- Contraste mínimo WCAG AA (4.5:1)
- Elementos focáveis com outline
- Labels para todos os inputs
- ARIA labels para ícones
- Suporte a navegação por teclado
- Alt text para imagens

---

## Tecnologias Utilizadas

- **React 18.3.1** - Framework UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS v4** - Estilização
- **React Router v7** - Navegação
- **Lucide React** - Biblioteca de ícones
- **Sonner** - Toast notifications
- **Vite** - Build tool

---

## Como Visualizar os Wireframes

1. **No App:** Clique no botão "Ver Wireframes" na tela de boas-vindas
2. **No Dashboard:** Clique no ícone de layout no header
3. **Navegação:** Use as setas ou os indicadores de página
4. **Mobile:** Todos os wireframes são responsivos

---

## Próximos Passos

- [ ] Implementar tema escuro (dark mode)
- [ ] Adicionar animações com Motion
- [ ] Criar gráficos interativos com Recharts
- [ ] Integração com API real
- [ ] Testes E2E com Cypress
- [ ] PWA para instalação mobile
- [ ] Notificações push
- [ ] Modo offline com cache

---

**Última atualização:** 08/06/2026  
**Versão:** 1.0.0  
**Autor:** Claude Code + Anthropic
