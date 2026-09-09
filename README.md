# 💧 Irrigação Inteligente - MVP TCC

> Sistema Preditivo e Autônomo de Gestão Hídrica para Pequenos Produtores

Este repositório contém a aplicação Minimum Viable Product (MVP) para o Trabalho de Conclusão de Curso (TCC). O objetivo é provar a viabilidade técnica e prática de um sistema de irrigação inteligente que utiliza simulações, algoritmos preditivos e dados meteorológicos para otimizar o uso da água na agricultura e jardinagem.

## ✨ Destaques do Projeto (O que testar na Demo)

1. **Simulador de Sensores em Tempo Real**: Os dados não são mais fixos. A aplicação possui um motor (tick) a cada 10 segundos que simula evaporação, influência da temperatura no solo, e variações de sensores. O sistema de simulação roda no browser.
2. **Recomendação e Saúde do Solo por IA**: Utilizando uma versão simplificada do método de evapotranspiração Penman-Monteith acoplada ao histórico de dados local.
3. **Detecção de Anomalias (Z-Score)**: Alertas automáticos ao detectar quedas bruscas de umidade (vazamento ou descalibração de sensor).
4. **Integração Meteorológica**: Fetch de dados climáticos via *Open-Meteo API* (Coordenadas de SP).
5. **Automação Inteligente**: Cadastre plantios e configure automações. A IA calcula a necessidade hídrica no dashboard de acordo com a cultura ativa.
6. **Interface Acessível e Responsiva**: Componentes criados do zero, sem bloat de bibliotecas desnecessárias.

## 🚀 Tecnologias Utilizadas

- **React 18** com TypeScript
- **Vite** para build super-rápida
- **React Router** para roteamento
- **Recharts** para gráficos interativos de tempo real e histórico
- **Lucide React** para iconografia
- **Tailwind CSS** para estilização utilitária e design responsivo

## 📦 Como rodar o projeto localmente

1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse no navegador em `http://localhost:5173`. 
*(Para fins de demonstração, o login aceita qualquer email válido com senha livre).*

## 🏗️ Arquitetura de Componentes

- `src/app/App.tsx`: Roteamento e providers globais.
- `src/app/components/MainLayout.tsx`: Container central de Layout e onde o simulador de tempo real/IA operam, gerenciando o estado principal.
- `src/app/components/Dashboard.tsx`: Dashboard de status integrado com previsão climática e recomendação inteligente.
- `src/app/data/aiEngine.ts`: Lógicas de cálculo para anomalia e recomendação de irrigação.
- `src/app/data/sensorSimulator.ts`: Motor que emula ambiente e altera leitura dos sensores em loop.

## 👥 Autoria e Contexto
Projeto acadêmico desenvolvido em contexto de Trabalho de Conclusão de Curso (TCC).
