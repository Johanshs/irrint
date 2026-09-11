# Execução do plano · 10 de setembro de 2026

Marco atual **v0.3.0 + fundação da próxima etapa**: laboratório demonstrativo local concluído e contrato/persistência reforçados para a evolução operacional. A base v0.2.0 e a versão legacy permanecem consultáveis; veja [VERSOES.md](VERSOES.md).

## Etapas e situação

| Etapa                | Entregue                                                                                                                                                | Restante                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| E0 — Base            | React 18, Ionic 9, Router 6 e Capacitor 8; build web                                                                                                    | Validação da experiência atual em aparelho                                                    |
| E1 — Contrato        | Zod 1.0; OpenAPI 3.1; sessão local de 30 min; isolamento por proprietário; sequência, prazos, ACK e idempotência                                        | Firebase Auth e regras de produção                                                            |
| E2 — API/dispositivo | API local, estado integralmente validado, gravação atômica, backup recuperável, regras fora da UI, dispositivos em processo separado e ensaios isolados | Adaptador de nuvem, armazenamento transacional multiusuário e migrações entre futuras versões |
| E3 — Mobile          | Login, criação/edição de áreas com vínculos automáticos, Histórico, Ajustes e estados conhecidos/pendentes/incertos                                     | Remoção/revinculação, gestão de contas, acessibilidade formal e avaliação com usuários        |
| E4 — Evidências      | 62 testes; 14 ensaios (7 × N/S), 42 critérios; CT13 e RF01 locais; CSV/JSON/HTML, gráficos, cronologia e comparação                                     | Matriz completa do TCC, E2E automatizado, regras Firebase e desempenho                        |
| E5 — 3D              | Laboratório simplificado, peças identificáveis, inspeção, nomes opcionais, corte do solo e água nominal                                                 | Medição em celular e ajustes decorrentes de avaliação de uso                                  |
| E6 — Distribuição    | Código atual no GitHub; APK de depuração compilado no marco inicial                                                                                     | API hospedada, APK atual em aparelho e substituição controlada do site Vercel                 |
| E7 — TCC             | Escopo e limites documentados, relatórios reproduzíveis                                                                                                 | Aplicação de TAM e análise de resultados com participantes                                    |

## Validação deste marco

- **62/62 testes**: controlador/dispositivo (17), cálculo de água (7), cenários/repetibilidade/exportação (23), integração HTTP (13) e armazenamento/migração local (2).
- **42/42 critérios em 14 ensaios**, seed 2026: sete cenários executados tanto no norte quanto no sul. Comparação canônica confirma as mesmas séries e métricas sob condições equivalentes.
- **Build web e TypeScript** verificados. Permanecem avisos de chunks grandes de Ionic/Three.js; não são uma medição de desempenho.
- Navegador: acionamento do sul pelo seletor único; perda de contato em 20 s com 0,030 L recebidos versus 0,120 L internos; cronologia, resultados e inspeção do microcontrolador. Modal inspecionado a 390 px, sem transbordamento horizontal.
- Exportação CSV verificada por teste, incluindo o canal sul desconectado e norte conectado. O gerador produz relatórios completos com a impressão das fontes.
- A compilação Android anterior não valida este refinamento em aparelho. E2E automatizado, teste forçado de perda de WebGL e acessibilidade formal continuam pendentes.

A mensagem de falha de disco no teste CT19 é intencional: valida HTTP 500 e reversão do estado. Os cenários visuais chamam o domínio com relógio virtual; os testes HTTP verificam o adaptador em loopback. São evidências complementares, não equivalentes a hardware.

## O que mudou no laboratório

O acionamento ao vivo e os testes predefinidos disputavam a mesma tela. A v0.3.0 usa **Sistema → Teste → Executar teste** e mantém o controle ao vivo nas telas operacionais. Cada ensaio funciona em N ou S. Os controles de nomes e gotejamento ficam visíveis acima da maquete; câmera, corte e lista de peças ficam recolhidos. As etiquetas têm linhas ligadas às peças e movimento suave; o inspetor abre girando, com opção de pausa.

A apresentação tem três visualizações: **Maquete 3D**, **Entender o teste** e **Resultados**. A maquete conserva o estado conhecido pelo aplicativo. A análise mostra separadamente o estado interno do simulador, curvas em unidades próprias e uma cronologia navegável. O resultado inclui critérios calculados e relatório para impressão, CSV e JSON.

O ajuste posterior de etiquetas e gotejamento foi verificado no navegador: linhas partindo das peças e terminando nas caixas, inspetor aberto com rotação ativa e alternância de gotas sem mudar as medições de um replay pausado. Build web aprovado; controlador, contrato e modelo de consumo permanecem os mesmos do marco testado.

O caso automático abre em 1 s, fecha em 19 s e volta a abrir em 87 s: 21 s e 0,210 L dentro da janela de 90 s. Ele não representa uma sessão encerrada com todas as válvulas fechadas. Os casos de prazo local encerram em 13 s, após 12 s de abertura; o ensaio de parada manual consome 0,030 L. Casos que bloqueiam atuação consomem zero.

Roteiro, tabela de resultados e mapeamento de requisitos: **[DEMONSTRACAO-3D.md](DEMONSTRACAO-3D.md)**.

## Limites mantidos

O fluxo operacional aceita novas áreas com um sensor e uma válvula por área; o laboratório 3D e sua matriz continuam deliberadamente fixos nos sistemas N/S para manter relatórios comparáveis. Sem IA, clima, calibração agronômica, economia real de água, integração física ou compatibilidade universal comprovada. O volume é nominal e a divisão por planta não mede absorção.

A API local possui uma conta sintética e comprova isolamento por proprietário, mas ainda não usa Firebase Auth nem persistência em nuvem. A trava de build Vercel permanece: publicar o frontend isolado deixaria a nova experiência sem backend acessível. A comparação de experimentos mantém no máximo sete execuções em memória; para preservar, exporte os relatórios.

A sessão ao vivo retém as últimas 2.000 leituras, 1.000 eventos e limita novos inícios depois de 500 comandos. O laboratório começa do zero e não depende desse histórico. O estado local agora é validado integralmente e tem recuperação por backup; a migração entre futuras versões do schema ainda pertence à próxima etapa.

## Próxima sequência

1. Adaptadores Firebase Auth/Firestore em emuladores, com regras de isolamento.
2. Matriz restante, E2E da interface e latência HTTP medida fora do relógio virtual.
3. API acessível ao APK, instalação Android, desempenho, acessibilidade e retomada de conexão.
4. Backend e simulador hospedados; preview integrado antes de atualizar a Vercel.
5. Instrumento de avaliação com produtores e redação dos resultados, restritos à evidência observada.
