# Irrint — contexto para o Claude

Protótipo de TCC (TADS/IFRR): aplicativo mobile + API/contrato desacoplado do hardware + simulador de dispositivos para irrigação. Versão atual `0.4.3` (branch `main`). Migrado do Codex em 30/09/2026.

## Antes de qualquer tarefa

- Estado atual: leia `PROGRESSO.md`, `README.md`, `CONTRATO.md` e os `VALIDACAO-*.md`, e confira `git status`/`git log`.
- `RELATORIO.md` e `WIREFRAMES.md` são **históricos**. Eles ainda citam IA, Firebase e Tailwind, que não existem mais na versão atual. A versão antiga está na tag `v0.1.0-legacy`.
- Se o pedido for "diagnóstico" ou "plano", entregue diagnóstico, prioridades e critério de conclusão **antes** de editar. "Me diga como faríamos, não precisa mudar ainda" significa não editar.

## Escopo — o que pode e o que não pode ser afirmado

O escopo do TCC é **app mobile + contrato HTTP/OpenAPI + simulador**. Nunca afirmar como entregue:

- IA, clima, hardware físico obrigatório ou interoperabilidade universal;
- economia real de água, calibração ou validação agronômica;
- avaliação com produtores (**ainda não realizada**);
- "o software já funciona com hardware real".

Formulação segura para textos e apresentações: o software está **"preparado para operar com hardware real"**. Qualquer dispositivo ainda precisa de firmware/adaptador, calibração e validação física própria.

Testes (74/74), critérios (48/48), build, APK assinado e o laboratório 3D comprovam o **comportamento do software**. Não comprovam uso agrícola, desempenho físico medido nem usabilidade com produtores. Nunca inventar resultados, métricas de questionário ou dados regionais.

## Arquitetura

- `shared/` — contrato Zod (`contracts.ts`, `experiments.ts`), controlador (`control.ts`: regras, prazos, ACK, idempotência) e modelo de água (`water.ts`: 18 emissores × 2 L/h = 36 L/h nominais por área).
- `server/` — API `node:http` (`api.ts`), adaptador local loopback/LAN (`local.ts`), hospedado (`hosted.ts`), armazenamento JSON recuperável ou PostgreSQL (`storage.ts`), OpenAPI 3.1 (`openapi.ts`).
- `simulator/` — dispositivo simulado e runner. `clients/openapi-device.ts` é um cliente independente: **não** pode importar `shared/control.ts` nem `simulator/`.
- `src/features/irrigation/` — telas (Início, Áreas, Histórico, Ajustes, Login). `src/features/laboratory/` — maquete 3D Three.js, replay, gráficos, relatórios.
- `experiments/` — 8 cenários determinísticos por seed, com relógio virtual de 1 s, nas áreas N/S (matriz 3D fixa em N/S de propósito).

Invariantes que não devem ser quebrados:

- HTTP 202 = pedido **recebido**, não executado. A interface só mostra "confirmado" com `applied` ou leitura coerente com `lastCommandId`.
- Estado incerto é explícito: sem contato, não mostrar a válvula como fechada.
- A trava de reinício (leitura com `valve: 'closed'` após confirmação de abertura pausa o automático) é coberta por `tests/control.test.ts` e deve ser mantida.
- `FieldScene.tsx` e o replay **observam** snapshots: renderizar, pausar ou inspecionar nunca comanda nem avança a simulação.
- O modelo 3D é didático (umidade normalizada 0–100, vazão nominal). Rotular sempre como tal.

## Comandos

```sh
npm ci                  # Node 22
npm run demo:start      # API :8787 + runner + Vite :5173 (conta produtor@demo.local / irrigacao)
npm run typecheck
npm test                # Vitest
npm run test:e2e        # Playwright (npx playwright install chromium antes)
npm run build
```

- Antes de testar a interface, confirme que `http://127.0.0.1:8787` responde.
- Em sandbox, `demo:start` já falhou com `uv_os_get_passwd returned ENOMEM`. Rode fora dele.
- O build emite um aviso de chunk grande (Ionic/Three.js). Ele é conhecido e informativo.
- Formatação: Prettier (`singleQuote`, `printWidth: 110`, `trailingComma: all`, LF).

## Implantação

- API: Heroku `irrint` (`https://irrint-79e47c1c9fa0.herokuapp.com`), dyno Basic + Postgres Essential-0, coberto pelo GitHub Education. Frontend: Vercel `irrigacao-int.vercel.app`, com o endpoint em `.env.production`.
- `server/local.ts` é só loopback/LAN. Um `dist/` sozinho na Vercel não é implantação funcional.
- `VITE_ALLOW_API_OVERRIDE=true` existe apenas no APK de contingência (`scripts/contingency-build.mjs`).
- Identidade Android `br.com.irrint.app` e a chave de assinatura devem ser mantidas, para que o APK atualize o instalado. Renomeações seguem `PLANO-RENOMEACAO.md`.
- Nunca versionar `android/irrint-release.jks`, `android/keystore.properties`, `.local/` nem tokens.
- Antes de afirmar algo sobre os endereços públicos, verifique se estão no ar.

## Próximos passos (segundo `PROGRESSO.md`)

1. Validar fisicamente o APK de contingência `0.4.3-contingency` no Galaxy S25 Ultra.
2. Regressão física: Voltar, rotação, reconexão, fonte ampliada, FPS/memória.
3. Remoção e revinculação segura de componentes com histórico.
4. Decidir com o orientador entre avaliação com produtores (protocolo, TCLE, CEP/CNS 510/2016) e avaliação apenas técnica.
5. Escrever resultados e conclusão somente com as evidências coletadas.

## Texto do TCC (fora deste repositório)

- O TCC está no Google Docs, com uma cópia de revisão criada em 24/09 com RF/RNF, arquitetura, 10 cenários de teste, plano de avaliação e 19 referências. Faltam UML, capturas reais, paginação, ficha catalográfica e resultados reais.
- Normas: ABNT NBR 14724:2024, 6023:2025, 10520:2023 e o Manual TADS/IFRR.
- Redação acadêmica: nunca mencionar "Zotero" no texto. Descrever bases, termos e critérios de busca. Chamar de revisão narrativa/comparativa, não sistemática. Declarar a lacuna só "na amostra analisada".
- Antes de entregar qualquer texto, auditar citações nos dois sentidos: toda citação autor-data precisa ter referência completa, e toda referência precisa estar citada.
- Entregar prosa coesa e pronta para copiar. Não confirmar edição em documento sem verificar que ela aconteceu.
