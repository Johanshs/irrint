# Validação mobile e interoperabilidade

Este marco prepara a demonstração Android em rede local e comprova uma segunda implementação de cliente usando o contrato HTTP/OpenAPI. Ele não representa validação com hardware agrícola nem implantação de produção.

## Resultados executados em 11 de setembro de 2026

| Caso                        | Evidência                                                                                                                                                       | Resultado                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| CT14 — reinício             | Estado JSON recarregado com vínculos, leitura e evento confirmado; comando pendente reaparece vencido e sua expiração é persistida                              | Atendido por teste automatizado                            |
| CT18 — transporte mobile    | Preflight local, host LAN privado, Network Security Config e conteúdo misto exclusivos de debug, APK instalado e API acessível pelo WebView                     | Atendido na bancada Android                                |
| CT18 — usabilidade          | Playwright: teclado, fonte 125%, 360/390/430 px e fallback WebGL; S25 Ultra: login, comandos, páginas principais e laboratório WebGL 2.0                        | Atendido para o marco; regressão física detalhada pendente |
| CT20 — cliente independente | `clients/openapi-device.ts` descobre quatro operações por `operationId`, executa abertura/fechamento e envia `source: device` sem importar domínio ou simulador | Atendido por teste e execução LAN                          |
| CT21 — válvula travada      | Fechamento rejeitado, estado incerto, válvula interna aberta e volume crescente durante 89 s contabilizados                                                     | Atendido em N e S                                          |
| CT22 — execução/relatório   | Lease com substituição após vencimento; `not-measured` no relatório vazio; replay pausado com runner ativo, 10×, reinício e dois resultados isolados            | Atendido por integração e E2E                              |

Resultados agregados: **69/69 testes**, **3/3 fluxos E2E** e **48/48 critérios em 16 ensaios**. A pasta local mais recente é criada por `npm run demo:evidence` e contém JSON, CSV, HTML, `RESUMO.md` e a impressão SHA-256 das fontes usadas.

O ensaio `npm run measure:latency` executou 30 comandos alternados no cliente OpenAPI: 30 aplicados, nenhum erro e nenhum timeout. Mediana **2015,44 ms**, p95 **2040,57 ms** e máxima **2048,97 ms**, medidos do pedido até ACK e telemetria coerente. O runner usava polling de 1000 ms e ambos os processos estavam aquecidos na mesma máquina; o resultado não representa ESP32, Internet ou campo.

## Demonstração na rede local

Descubra o IPv4 do computador com `ipconfig`. Com o telefone e o computador na mesma rede, inicie:

```powershell
npm run demo:start:lan
```

O modo LAN vincula API e Vite a todas as interfaces, mas a API aceita apenas Host de loopback, IPv4 privado ou endereço local IPv6. Origens permitidas continuam limitadas ao frontend local e aos esquemas usados pelo contêiner Capacitor. `npm run demo:start` mantém o comportamento seguro anterior, somente em `127.0.0.1`.

Para demonstrar que a API não depende do modelo original de dispositivo:

```powershell
npm run demo:start:reference -- --lan
```

O cliente de referência busca `/api/v1/openapi.json`, localiza as rotas pelos identificadores de operação e implementa seu próprio ciclo de umidade, volume, watchdog, aplicação idempotente e ACK. A interface permanece igual.

## APK configurado para a LAN

```powershell
$env:IRRINT_API_URL = "http://SEU-IP-LAN:8787"
npm run android:debug:lan
```

O script valida o endpoint, executa TypeScript/Vite, sincroniza o Capacitor, localiza o SDK Android e gera `android/app/build/outputs/apk/debug/app-debug.apk`. O identificador do aplicativo é `br.com.irrint.app`.

HTTP local sem TLS existe apenas em `android/app/src/debug`: o manifesto principal não habilita texto claro. O overlay debug também ativa `android.allowMixedContent`, necessário porque o WebView serve os arquivos locais em `https://localhost` e a API de bancada usa HTTP privado. Essas permissões não devem ser usadas como configuração de distribuição. Para produção, use API HTTPS e autenticação persistente.

Com um aparelho autorizado por USB:

```powershell
adb devices -l
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

O Galaxy S25 Ultra `SM-S938B`, com Android 16/API 36, foi autorizado por USB. O APK foi instalado e abriu login, API, irrigação/parada do Canteiro sul, Áreas, Ajustes, Histórico e laboratório WebGL 2.0. A revisão visual do responsável considerou animações e desempenho adequados. A configuração observada foi 720 × 1560, densidade substituída 280, com viewport lógico 411 × 891 e DPR 1,75. Voltar, rotação forçada, reconexão, escala de fonte e FPS/memória não receberam coleta física instrumentada nesta rodada. Consulte [VALIDACAO-ANDROID-S25-ULTRA.md](VALIDACAO-ANDROID-S25-ULTRA.md).

## Evidência E2E reproduzível

```powershell
npx playwright install chromium
npm run test:e2e
```

O Playwright usa um único worker porque a API/runner são compartilhados. Ele conserva trace e captura somente quando há falha, grava o resultado estruturado em `.local/playwright-results.json` e produz um relatório navegável em `.local/playwright-report/index.html`. O CT22 correlaciona as respostas reais de `/api/v1/experiments` com a interface e verifica IDs distintos e métricas próprias para duas execuções.

## Repetição das evidências

```powershell
npm run test:report
npm run test:e2e
npm run demo:evidence
npm run measure:latency
npm run build
```

Para registrar o APK produzido sem versionar o binário:

```powershell
Get-FileHash android/app/build/outputs/apk/debug/app-debug.apk -Algorithm SHA256
```

O teste LAN realizado neste marco consultou o contrato `1.0.0` pelo IPv4 do computador, recebeu CORS para `capacitor://localhost`, observou as duas áreas com `source: device` e executou no sistema sul uma abertura seguida de fechamento. A leitura confirmou `open`, depois `closed`, e acumulou 0,02005 L nominais nessa passagem. Esse valor descreve o modelo e não uma medição física.
