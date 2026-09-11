# Validação mobile e interoperabilidade

Este marco prepara a demonstração Android em rede local e comprova uma segunda implementação de cliente usando o contrato HTTP/OpenAPI. Ele não representa validação com hardware agrícola nem implantação de produção.

## Resultados executados em 11 de setembro de 2026

| Caso                        | Evidência                                                                                                                                                       | Resultado                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| CT14 — reinício             | Estado JSON recarregado com vínculos, leitura e evento confirmado; comando pendente reaparece vencido e sua expiração é persistida                              | Atendido por teste automatizado                     |
| CT18 — transporte mobile    | Preflight de `capacitor://localhost`, host LAN privado, manifesto debug com Network Security Config e APK com endpoint configurado                              | Atendido até a compilação; aparelho físico pendente |
| CT20 — cliente independente | `clients/openapi-device.ts` descobre quatro operações por `operationId`, executa abertura/fechamento e envia `source: device` sem importar domínio ou simulador | Atendido por teste e execução LAN                   |
| CT21 — válvula travada      | Fechamento rejeitado, estado incerto, válvula interna aberta e volume crescente durante 89 s contabilizados                                                     | Atendido em N e S                                   |

Resultados agregados: **68/68 testes** e **48/48 critérios em 16 ensaios**. A pasta local mais recente é criada por `npm run demo:evidence` e contém JSON, CSV, HTML, `RESUMO.md` e a impressão SHA-256 das fontes usadas.

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

HTTP local sem TLS existe apenas em `android/app/src/debug`: o manifesto principal não habilita texto claro. Essa permissão serve para a bancada na mesma rede e não deve ser usada como configuração de distribuição. Para produção, use API HTTPS e autenticação persistente.

Com um aparelho autorizado por USB:

```powershell
adb devices -l
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Na execução deste marco, `adb devices -l` retornou a lista vazia. Portanto ainda faltam instalação, login, comandos, reconexão, 360/390/430 px, fonte ampliada, foco/teclado, perda de WebGL, FPS e memória em dispositivo real.

## Repetição das evidências

```powershell
npm run test:report
npm run demo:evidence
npm run measure:latency
npm run build
```

Para registrar o APK produzido sem versionar o binário:

```powershell
Get-FileHash android/app/build/outputs/apk/debug/app-debug.apk -Algorithm SHA256
```

O teste LAN realizado neste marco consultou o contrato `1.0.0` pelo IPv4 do computador, recebeu CORS para `capacitor://localhost`, observou as duas áreas com `source: device` e executou no sistema sul uma abertura seguida de fechamento. A leitura confirmou `open`, depois `closed`, e acumulou 0,02005 L nominais nessa passagem. Esse valor descreve o modelo e não uma medição física.
