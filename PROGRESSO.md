# Execução do plano · 10 de setembro de 2026

Marco atual **v0.3.0**: laboratório demonstrativo local concluído com fluxo único, sete ensaios nos dois sistemas, maquete, explicação de falhas e relatórios. A base v0.2.0 e a versão legacy permanecem consultáveis; veja [VERSOES.md](VERSOES.md).

## Etapas e situação

| Etapa | Entregue | Restante |
| --- | --- | --- |
| E0 — Base | React 18, Ionic 9, Router 6 e Capacitor 8; build web | Validação da experiência atual em aparelho |
| E1 — Contrato | Zod 1.0 para controle/telemetria; relatório de experimentos 1.1; sequência, prazos, ACK e idempotência | OpenAPI, propriedade e autenticação |
| E2 — API/dispositivo | API local, persistência JSON, regras fora da UI, dois dispositivos em processo separado e ensaios isolados | Adaptador de nuvem, armazenamento transacional e recuperação/migração completas |
| E3 — Mobile | Início, Áreas, Histórico, Ajustes; estados conhecidos, pendentes e incertos | CRUD da topologia, contas, acessibilidade formal e avaliação com usuários |
| E4 — Evidências | 55 testes; 14 ensaios (7 × N/S), 42 critérios; CSV/JSON/HTML, gráficos, cronologia e comparação | Matriz completa do TCC, E2E automatizado, testes de contas e desempenho |
| E5 — 3D | Laboratório simplificado, peças identificáveis, inspeção, nomes opcionais, corte do solo e água nominal | Medição em celular e ajustes decorrentes de avaliação de uso |
| E6 — Distribuição | Código atual no GitHub; APK de depuração compilado no marco inicial | API hospedada, APK atual em aparelho e substituição controlada do site Vercel |
| E7 — TCC | Escopo e limites documentados, relatórios reproduzíveis | Aplicação de TAM e análise de resultados com participantes |

## Validação deste marco

- **55/55 testes**: controlador/dispositivo (16), cálculo de água (7), cenários/repetibilidade/exportação (23) e integração HTTP (9).
- **42/42 critérios em 14 ensaios**, seed 2026: sete cenários executados tanto no norte quanto no sul. Comparação canônica confirma as mesmas séries e métricas sob condições equivalentes.
- **Build web e TypeScript** verificados. Permanecem avisos de chunks grandes de Ionic/Three.js; não são uma medição de desempenho.
- Navegador: acionamento do sul pelo seletor único; perda de contato em 20 s com 0,030 L recebidos versus 0,120 L internos; cronologia, resultados e inspeção do microcontrolador. Modal inspecionado a 390 px, sem transbordamento horizontal.
- Exportação CSV verificada por teste, incluindo o canal sul desconectado e norte conectado. O gerador produz relatórios completos com a impressão das fontes.
- A compilação Android anterior não valida este refinamento em aparelho. E2E automatizado, teste forçado de perda de WebGL e acessibilidade formal continuam pendentes.

A mensagem de falha de disco no teste CT19 é intencional: valida HTTP 500 e reversão do estado. Os cenários visuais chamam o domínio com relógio virtual; os testes HTTP verificam o adaptador em loopback. São evidências complementares, não equivalentes a hardware.

## O que mudou no laboratório

O acionamento ao vivo e os testes predefinidos disputavam a mesma tela. A v0.3.0 usa **Sistema → Teste → Executar teste** e mantém o controle ao vivo nas telas operacionais. Cada ensaio funciona em N ou S. Nomes, câmera, corte e inspeção ficam em opções recolhidas.

A apresentação tem três visualizações: **Maquete 3D**, **Entender o teste** e **Resultados**. A maquete conserva o estado conhecido pelo aplicativo. A análise mostra separadamente o estado interno do simulador, curvas em unidades próprias e uma cronologia navegável. O resultado inclui critérios calculados e relatório para impressão, CSV e JSON.

O caso automático abre em 1 s, fecha em 19 s e volta a abrir em 87 s: 21 s e 0,210 L dentro da janela de 90 s. Ele não representa uma sessão encerrada com todas as válvulas fechadas. Os casos de prazo local encerram em 13 s, após 12 s de abertura; o ensaio de parada manual consome 0,030 L. Casos que bloqueiam atuação consomem zero.

Roteiro, tabela de resultados e mapeamento de requisitos: **[DEMONSTRACAO-3D.md](DEMONSTRACAO-3D.md)**.

## Limites mantidos

Duas áreas fixas; um sensor e uma válvula por área. Sem IA, clima, calibração agronômica, economia real de água, integração física ou compatibilidade universal comprovada. O volume é nominal e a divisão por planta não mede absorção.

A API local não possui contas de usuário nem persistência em nuvem. A trava de build Vercel permanece: publicar o frontend isolado deixaria a nova experiência sem backend acessível. A comparação de experimentos mantém no máximo sete execuções em memória; para preservar, exporte os relatórios.

A sessão ao vivo retém as últimas 2.000 leituras, 1.000 eventos e limita novos inícios depois de 500 comandos. O laboratório começa do zero e não depende desse histórico. Migração e validação integral do armazenamento ainda pertencem à próxima etapa.

## Próxima sequência

1. OpenAPI, abstração de armazenamento e validação/recuperação integral do estado.
2. Autenticação e isolamento por usuário/dispositivo em emuladores; migração com backup.
3. CRUD de áreas, sensores e vínculos.
4. Matriz restante, E2E da interface e latência HTTP medida fora do relógio virtual.
5. API acessível ao APK, instalação Android, desempenho, acessibilidade e retomada de conexão.
6. Backend e simulador hospedados; preview integrado antes de atualizar a Vercel.
7. TAM e redação dos resultados do TCC, restritos à evidência observada.