# Relatório do Projeto: Irrigação Inteligente

## Visão Geral
O projeto **Irrigação Inteligente** é uma aplicação web focada na gestão eficiente de recursos hídricos para agricultura, oferecendo controle e monitoramento através de sensores e válvulas automatizadas. A interface foi desenvolvida para ser intuitiva e facilitar a vida do produtor rural ou administrador da propriedade, permitindo acompanhar o desenvolvimento dos plantios.

Recentemente, a aplicação passou por melhorias significativas em sua arquitetura de interface e fluxo de usuário, incluindo:
- **Nomenclatura Adequada:** Substituição do termo genérico "Cultura" por "Plantio", que se aproxima mais do vocabulário do usuário final.
- **Flexibilidade de Medidas:** Agora é possível cadastrar a dimensão do plantio escolhendo entre Hectares (ha), Metros quadrados (m²) ou Quantidade de mudas, democratizando o uso do sistema para pequenos, médios e grandes produtores.
- **Múltiplos Plantios Ativos:** O sistema permite ativar simultaneamente mais de um plantio, refletindo a realidade de propriedades que mantêm várias áreas sendo irrigadas de forma paralela.
- **Irrigação Inteligente (IA):** Foi introduzido um módulo simulado de recomendação de irrigação utilizando IA. O produtor informa o tamanho da área e o sistema gera automaticamente os horários e durações mais recomendadas, dispensando configurações manuais complexas.
- **Interface Otimizada:** O cabeçalho foi simplificado para oferecer uma experiência mais limpa e focada no dashboard principal.

## Tecnologias Utilizadas
- **Frontend:** React, TypeScript, Vite.
- **Roteamento:** React Router DOM para navegação de telas (Dashboard, Sensores, Válvulas, Análises).
- **Estilização e Ícones:** TailwindCSS para estilo rápido e responsivo, aliado a componentes baseados em Lucide React para iconografia moderna.
- **Notificações:** Sonner para feedbacks visuais amigáveis (toasts).

## Como Acessar a Aplicação
O projeto está configurado para ser implantado de forma fácil na plataforma **Vercel**.

**Para acessar o site (se já estiver em produção):**
1. O site costuma ser implantado conectando o repositório do GitHub ao Vercel, gerando um link automático (como `https://irrigacaoint.vercel.app` dependendo do nome definido na Vercel).
2. Acesse pelo navegador em qualquer dispositivo (desktop, tablet ou celular), a aplicação é responsiva.

**Para rodar e testar localmente:**
1. Certifique-se de ter o `Node.js` e o `npm` ou `pnpm` instalados.
2. Abra o terminal na pasta do projeto e rode `npm install` para instalar as dependências.
3. Rode o comando `npm run dev` para iniciar o servidor local.
4. Acesse `http://localhost:5173` no seu navegador.
