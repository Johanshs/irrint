# Execução do plano · 11 de setembro de 2026

Marco atual: laboratório demonstrativo concluído, contrato/persistência reforçados, API acessível em rede local por opção explícita, APK configurável, segundo cliente sobre OpenAPI e E2E web automatizado. A base v0.2.0 e a versão legacy permanecem consultáveis; veja [VERSOES.md](VERSOES.md).

## Etapas e situação

| Etapa                | Entregue                                                                                                                       | Restante                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| E0 — Base            | React 18, Ionic 9, Router 6, Capacitor 8, build web e APK debug atual                                                          | Instalação e medição em aparelho físico                                  |
| E1 — Contrato        | Zod 1.0, OpenAPI 3.1, sessão local de 30 min, isolamento por proprietário, sequência, prazos, ACK e idempotência               | Autenticação e regras persistentes para produção                         |
| E2 — API/dispositivo | API local, gravação atômica, backup, reinício validado, processo simulado e cliente OpenAPI independente                       | Adaptador de nuvem, credenciais por dispositivo e migrações futuras      |
| E3 — Mobile          | Login, criação/edição de áreas, vínculos automáticos, histórico por área/período, ajustes e estados conhecido/pendente/incerto | Remoção/revinculação, gestão de contas e acessibilidade em aparelho      |
| E4 — Evidências      | 69 testes; 3 E2E; 16 ensaios, 48 critérios; CT13/14/18/19/20/21/22; latência; CSV/JSON/HTML e relatório Playwright             | Desempenho, reconexão e repetição da latência no aparelho                |
| E5 — 3D              | Peças identificáveis, inspeção, etiquetas, corte, gotejamento, oito falhas e indicação do fluxo interno na válvula travada     | Medição de FPS/memória no celular e ajustes da avaliação de uso          |
| E6 — Distribuição    | Código atual no GitHub; modo LAN opt-in; APK debug com endpoint por ambiente                                                   | Aparelho validado, API HTTPS hospedada e troca controlada do Vercel      |
| E7 — TCC             | Escopo, limites, contrato e relatórios reproduzíveis documentados                                                              | Instrumento, aplicação com produtores, análise e capítulos de resultados |

## Validação deste marco

- **69/69 testes**: controlador/dispositivo (17), água (7), cenários/repetibilidade/exportação (26), API HTTP (15), armazenamento/reinício (3) e cliente OpenAPI (1).
- **3/3 fluxos E2E no Chromium**: teclado e larguras 360/390/430 px com fonte a 125%; contingência WebGL; pausa, 10×, reinício e duas execuções isoladas.
- **48/48 critérios em 16 ensaios**, seed 2026: oito cenários executados em N e S com séries equivalentes sob os mesmos parâmetros.
- **CT14**: vínculos, leitura, confirmação e eventos persistem após reinício; um comando pendente reaparece vencido e a expiração é gravada.
- **CT18, parte automatizável**: CORS/preflight do Capacitor, host LAN privado, Network Security Config exclusiva de debug, endpoint incorporado, APK compilado, foco por teclado, controles sem corte horizontal nas três larguras com fonte ampliada e alternativa textual quando WebGL falha. `adb devices -l` não encontrou aparelho; validação física segue pendente.
- **CT20**: `clients/openapi-device.ts` não importa controlador nem simulador, descobre rotas pelos `operationId` e completou ciclo automático por HTTP com `source: device`.
- **CT21**: fechamento rejeitado deixa estado incerto e a válvula interna segue aberta. O ensaio registra 89 s contabilizados e 0,890 L nominais em N e S.
- **CT22**: lease impede dois produtores simultâneos e permite substituição após 6 s; relatório vazio usa `not-measured` e `null`; o E2E confirma que pausar o replay não pausa o runner, aceleração/reinício funcionam e o segundo ensaio não altera o primeiro.
- **Execução LAN**: contrato 1.0.0 consultado pelo IPv4 do computador, CORS para `capacitor://localhost`, duas áreas com origem `device` e abertura/fechamento do sul confirmados pelo cliente alternativo.
- **Latência local de confirmação**: 30/30 comandos aplicados, sem erros ou timeouts; mediana 2015,44 ms, p95 2040,57 ms e máxima 2048,97 ms. A medição termina após ACK e telemetria coerente, com polling de 1000 ms, em processos aquecidos na mesma máquina.
- **Build web/TypeScript e APK debug** concluídos. O aviso de chunks grandes de Ionic/Three.js não equivale a medição de desempenho.

A mensagem de falha de disco no CT19 é intencional: valida HTTP 500 e reversão do estado. Os cenários visuais chamam o domínio com relógio virtual; os testes HTTP e a passagem LAN exercitam o adaptador real. Nenhuma dessas camadas equivale a hardware agrícola.

## Produto demonstrável

O fluxo operacional permite entrar, cadastrar ou editar uma área, acompanhar telemetria, configurar regra, solicitar abertura/fechamento, observar ACK, filtrar histórico e exportar o estado. Cada área possui dispositivo, sensor e válvula identificados sem exigir configuração técnica do produtor.

O laboratório usa **Sistema → Teste → Executar teste**. As visualizações **Maquete 3D**, **Entender o teste** e **Resultados** mostram replay, estado recebido, observação interna, umidade, água, cronologia e critérios. O caso de válvula travada preserva a distinção: a API não declara parada e a maquete identifica quando mostra o fluxo interno da falha.

O cliente OpenAPI alternativo demonstra que outro processo pode integrar-se sem reutilizar a implementação do simulador. O resultado sustenta viabilidade arquitetural para o protótipo; não sustenta compatibilidade universal com qualquer hardware.

Roteiros e detalhes: [DEMONSTRACAO-3D.md](DEMONSTRACAO-3D.md) e [VALIDACAO-MOBILE-OPENAPI.md](VALIDACAO-MOBILE-OPENAPI.md).

## Limites mantidos

O fluxo aceita novas áreas, mas a matriz 3D permanece fixa em N/S para manter comparabilidade. Não há IA, clima, calibração agronômica, economia real de água ou integração física comprovada. Volume e divisão por planta são estimativas nominais.

A conta e os tokens são locais; o modo LAN serve apenas à bancada na mesma rede. HTTP sem TLS é permitido somente no APK debug. A trava de build Vercel permanece porque o frontend atual precisa de backend persistente acessível.

A sessão ao vivo retém as últimas 2.000 leituras e 1.000 eventos e bloqueia novos inícios depois de 500 comandos. A comparação conserva até oito ensaios na visita; exporte os arquivos para retenção. Migrações entre futuras versões de schema seguem pendentes.

## Próxima sequência

1. Conectar um Android físico, instalar o APK e registrar login, comandos, Voltar, teclado, reconexão, orientação, 360/390/430 px, fonte ampliada, fallback WebGL, FPS e memória.
2. Repetir a latência em aparelho/rede reais sem comparar esse resultado com os processos locais aquecidos.
3. Se a demonstração pública for necessária, implementar autenticação/banco persistentes e API HTTPS antes de substituir o Vercel legacy.
4. Preparar e pilotar tarefas, TCLE e questionário de facilidade/utilidade com produtores.
5. Executar a avaliação e redigir método realizado, resultados, discussão e conclusão somente com as evidências coletadas.
