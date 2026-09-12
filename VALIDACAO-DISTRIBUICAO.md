# Validação da distribuição 0.4.0

Data: 11 de setembro de 2026.

## Serviço hospedável

O modo `start:hosted` foi iniciado localmente com o mesmo conjunto de variáveis exigido pelo contêiner. O supervisor manteve a API e o cliente de dispositivo OpenAPI no mesmo serviço, em processos separados.

Verificações observadas:

- `/healthz` respondeu `status: ok`;
- dois logins consecutivos receberam proprietários diferentes;
- cada proprietário recebeu duas áreas;
- os dois conjuntos de identificadores não se repetiram;
- o runner descobriu os quatro dispositivos pelo contrato OpenAPI 1.0.0;
- ambas as sessões receberam telemetria;
- um comando de abertura chegou a `applied` e a telemetria informou `open`;
- o comando de fechamento chegou a `applied` e a telemetria voltou a `closed`;
- o arquivo de estado foi criado no diretório persistente configurado.

O teste automatizado `tests/e2e-hosted/public-demo.spec.ts` repetiu o fluxo com dois contextos do Chromium e confirmou que irrigar na primeira sessão não abriu as válvulas da segunda.

## Contingência local

`npm run contingency:start` detectou os endereços IPv4 privados, iniciou a API em modo LAN, os dois dispositivos simulados e o Vite. Pela API iniciada, foram confirmados login, duas áreas, telemetria e `environment: local-simulation`.

`npm run contingency:build -- --api=http://192.168.137.1:8787` concluiu:

- build TypeScript/Vite;
- sincronização do Capacitor;
- `:app:assembleDebug` com Android SDK 36;
- APK com pacote `br.com.irrint.app`, versão `0.4.0`, `minSdk 24` e `targetSdk 36`;
- assinatura Android Debug válida pelo esquema APK Signature v2;
- inclusão da tela para configurar o endpoint LAN;
- permissão HTTP restrita ao build de depuração.

O artefato fica em `contingency/Irrint-contingencia-debug.apk`. A compilação produz também `Irrint-contingencia-debug.apk.sha256`.

Não havia aparelho conectado por ADB nesta validação. O APK novo foi verificado estruturalmente e pela assinatura, mas a instalação física desta compilação 0.4.0 ainda deve ser repetida no Galaxy S25 Ultra. A versão anterior do fluxo já havia sido instalada e exercitada nesse aparelho.

## Suíte

- 72/72 testes Vitest;
- 3/3 E2E anteriores do aplicativo;
- 1/1 E2E novo da distribuição hospedada;
- build web concluído;
- APK de contingência concluído.

O aviso de chunks grandes de Ionic e Three.js permanece informativo. Ele não impediu build, execução ou o teste Android anterior.
