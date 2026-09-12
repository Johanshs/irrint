# Execução do plano · 12 de setembro de 2026

Marco atual: aplicação Android `0.4.2` distribuível, aplicação web publicada, laboratório demonstrativo concluído, PostgreSQL hospedado, API acessível por HTTPS e LAN, APK público assinado, APK local configurável, segundo cliente sobre OpenAPI e E2E web automatizado. O serviço Heroku foi simplificado para o nome `irrint`; veja [VERSOES.md](VERSOES.md).

## Etapas e situação

| Etapa                | Entregue                                                                                                    | Restante                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| E0 — Base            | React 18, Ionic 9, Router 6, Capacitor 8, build web, identidade visual, APK público assinado e login físico 0.4.2 | Regressão física completa da variante de contingência                      |
| E1 — Contrato        | Zod 1.0, OpenAPI 3.1, sessões locais e hospedadas, isolamento, sequência, prazos, ACK e idempotência        | Gestão de contas reais, caso o protótipo evolua além da demonstração           |
| E2 — API/dispositivo | API local/hospedável, JSON recuperável local, PostgreSQL hospedado, runner e cliente OpenAPI independente   | Transações distribuídas, caso seja necessária escala com mais de uma instância |
| E3 — Mobile          | Login, áreas, vínculos, histórico, ajustes, estados operacionais e fluxo principal revisado em Android real | Remoção/revinculação, gestão de contas e regressão física de acessibilidade    |
| E4 — Evidências      | 73 testes; 4 E2E; 16 ensaios, 48 critérios; CT13/14/18/19/20/21/22; latência; relatórios e bancada Android  | Voltar, rotação, reconexão, fonte e métricas instrumentadas no aparelho        |
| E5 — 3D              | Peças, inspeção, etiquetas, corte, gotejamento e oito falhas; maquete e fluidez revisadas no S25 Ultra      | Avaliação de uso com participantes e métricas instrumentadas opcionais         |
| E6 — Distribuição    | Heroku `irrint`, Postgres, Vercel, HTTPS, E2E público, release 0.4.2 e APK público validado no S25 Ultra     | Instalar e validar fisicamente o APK local de contingência                      |
| E7 — TCC             | Escopo, limites, contrato e relatórios reproduzíveis documentados                                           | Instrumento, aplicação com produtores, análise e capítulos de resultados       |

## Validação deste marco

- **73/73 testes**: controlador/dispositivo (17), água (7), cenários/repetibilidade/exportação (26), API HTTP (15), armazenamento/reinício (4), cliente OpenAPI (1) e distribuição hospedada (3).
- **4/4 fluxos E2E no Chromium**: teclado e larguras 360/390/430 px com fonte a 125%; contingência WebGL; pausa, 10×, reinício; e dois visitantes isolados no modo hospedado.
- **48/48 critérios em 16 ensaios**, seed 2026: oito cenários executados em N e S com séries equivalentes sob os mesmos parâmetros.
- **CT14**: vínculos, leitura, confirmação e eventos persistem após reinício; um comando pendente reaparece vencido e a expiração é gravada.
- **CT18, web e bancada Android**: CORS/preflight cobre `https://localhost`, `capacitor://localhost` e a origem Vercel exata; host LAN privado, configuração HTTP exclusiva de debug, endpoint incorporado, foco por teclado, 360/390/430 px, fonte ampliada e contingência WebGL foram automatizados. O APK público `0.4.2` foi instalado no Galaxy S25 Ultra; login na API hospedada e carregamento da telemetria passaram após a correção CORS. Acionamento/parada do sul, áreas, ajustes, histórico e laboratório WebGL 2.0 já haviam funcionado no mesmo aparelho. Voltar, rotação, reconexão, fonte e FPS/memória ainda não têm coleta física instrumentada.
- **CT20**: `clients/openapi-device.ts` não importa controlador nem simulador, descobre rotas pelos `operationId` e completou ciclo automático por HTTP com `source: device`.
- **CT21**: fechamento rejeitado deixa estado incerto e a válvula interna segue aberta. O ensaio registra 89 s contabilizados e 0,890 L nominais em N e S.
- **CT22**: lease impede dois produtores simultâneos e permite substituição após 6 s; relatório vazio usa `not-measured` e `null`; o E2E confirma que pausar o replay não pausa o runner, aceleração/reinício funcionam e o segundo ensaio não altera o primeiro.
- **Execução LAN**: contrato 1.0.0 consultado pelo IPv4 do computador, CORS para `capacitor://localhost`, duas áreas com origem `device` e abertura/fechamento do sul confirmados pelo cliente alternativo.
- **Latência local de confirmação**: 30/30 comandos aplicados, sem erros ou timeouts; mediana 2015,44 ms, p95 2040,57 ms e máxima 2048,97 ms. A medição termina após ACK e telemetria coerente, com polling de 1000 ms, em processos aquecidos na mesma máquina.
- **Build web/TypeScript, APK público assinado e APK de contingência** concluídos. O responsável revisou anteriormente a fluidez no aparelho e a considerou adequada; o aviso de chunks grandes de Ionic/Three.js e essa revisão visual não equivalem a uma medição instrumentada de desempenho.

A mensagem de falha de disco no CT19 é intencional: valida HTTP 500 e reversão do estado. Os cenários visuais chamam o domínio com relógio virtual; os testes HTTP e a passagem LAN exercitam o adaptador real. Nenhuma dessas camadas equivale a hardware agrícola.

## Produto demonstrável

O fluxo operacional permite entrar, cadastrar ou editar uma área, acompanhar telemetria, configurar regra, solicitar abertura/fechamento, observar ACK, filtrar histórico e exportar o estado. Cada área possui dispositivo, sensor e válvula identificados sem exigir configuração técnica do produtor.

O laboratório usa **Sistema → Teste → Executar teste**. As visualizações **Maquete 3D**, **Entender o teste** e **Resultados** mostram replay, estado recebido, observação interna, umidade, água, cronologia e critérios. O caso de válvula travada preserva a distinção: a API não declara parada e a maquete identifica quando mostra o fluxo interno da falha.

O cliente OpenAPI alternativo demonstra que outro processo pode integrar-se sem reutilizar a implementação do simulador. O resultado sustenta viabilidade arquitetural para o protótipo; não sustenta compatibilidade universal com qualquer hardware.

Roteiros e detalhes: [DEMONSTRACAO-3D.md](DEMONSTRACAO-3D.md), [VALIDACAO-MOBILE-OPENAPI.md](VALIDACAO-MOBILE-OPENAPI.md), [VALIDACAO-ANDROID-S25-ULTRA.md](VALIDACAO-ANDROID-S25-ULTRA.md) e [VALIDACAO-DISTRIBUICAO.md](VALIDACAO-DISTRIBUICAO.md).

## Limites mantidos

O fluxo aceita novas áreas, mas a matriz 3D permanece fixa em N/S para manter comparabilidade. Não há IA, clima, calibração agronômica, economia real de água ou integração física comprovada. Volume e divisão por planta são estimativas nominais.

No modo LAN, a conta e os tokens permanecem somente na memória e o serviço serve apenas à bancada na mesma rede. HTTP sem TLS é permitido somente no APK debug. Em produção, a Vercel usa a API HTTPS da Heroku declarada em `.env.production`.

O adaptador hospedado usa tokens assinados que continuam válidos após reinício, cria duas áreas por visitante e persiste o estado em PostgreSQL quando `DATABASE_URL` existe. Ele limita a 12 sessões ativas por padrão e remove áreas expiradas na abertura de uma nova sessão. A configuração Heroku Basic + Essential-0 totaliza US$ 12/mês e cabe no crédito de US$ 13/mês do GitHub Education após o benefício ser ativado.

A sessão ao vivo retém as últimas 2.000 leituras e 1.000 eventos e bloqueia novos inícios depois de 500 comandos. A comparação conserva até oito ensaios na visita; exporte os arquivos para retenção. Migrações entre futuras versões de schema seguem pendentes.

## Próxima sequência

1. Instalar e validar no Galaxy o APK local de contingência `0.4.2-contingency`.
2. Repetir Voltar, rotação, reconexão, escala de fonte, FPS/memória e latência como regressão física de distribuição.
3. Preparar e pilotar tarefas, TCLE e questionário de facilidade/utilidade com produtores.
4. Executar a avaliação e redigir método realizado, resultados, discussão e conclusão somente com as evidências coletadas.
