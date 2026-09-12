# Validação da distribuição 0.4.2

Data: 12 de setembro de 2026.

## Renomeação do serviço e APK 0.4.2

Em 12 de setembro de 2026, o aplicativo Heroku foi renomeado de `irrint-2026-7f93a1` para `irrint`. O painel confirmou o novo domínio `https://irrint-79e47c1c9fa0.herokuapp.com`, e `/healthz` respondeu `status: ok`. O domínio anterior passou a responder HTTP 404, comportamento esperado pelo Heroku após a troca.

`npm run android:public` gerou `distribution/Irrint-0.4.2-publico.apk` com:

- pacote `br.com.irrint.app`, versão `0.4.2`, `versionCode 6`, `minSdk 24` e `targetSdk 36`;
- certificado de atualização preservado, SHA-256 `668fa1395e373e704730bb8081b27d6ff11a8848fe4912d5a517be095f773e4a` e chave RSA 4096;
- SHA-256 do APK `2678378a9fd5419d77cd6e8e241192d6d8dfbed6b499f0b308eb793e3df01684`;
- domínio novo presente no bundle, domínio antigo ausente e interface de IP ausente.

O APK de contingência foi recompilado como `0.4.2-contingency`, `versionCode 6`, mantendo `br.com.irrint.contingency`, o endpoint LAN e a interface de configuração. Seu SHA-256 é `cce258a4e96111a73d4a4a87cf902699afaecb441348e2e8ca7b048162a4fa69`.

## Marco anterior: APK público 0.4.1

`npm run android:public` concluiu o build de release com Android SDK 36. O artefato `distribution/Irrint-0.4.1-publico.apk` apresentou:

- pacote `br.com.irrint.app`, versão `0.4.1`, `versionCode 5`, `minSdk 24` e `targetSdk 36`;
- nome **Irriga Inteligente**;
- assinatura APK v2 válida, certificado RSA 4096 próprio do projeto;
- SHA-256 `efc490252ce06dc935c81e6a95296116d11bd2691f3dce73863895bf93557361`;
- API fixa `https://irrint-2026-7f93a1-42d8a0dfb354.herokuapp.com` no bundle;
- ausência do texto e do endpoint da interface de contingência no bundle público;
- launcher adaptativo, ícones legados, splash e favicon derivados da nova marca.

A chave e suas credenciais permanecem somente no ambiente local, ignoradas pelo Git. Não havia aparelho conectado por ADB; a validação desta compilação foi estrutural, de conteúdo e assinatura.

O APK e o checksum foram publicados em [GitHub Releases v0.4.1](https://github.com/Johanshs/irrint/releases/tag/v0.4.1). O APK de contingência não foi anexado à release.

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

## Homologação pública

Em 11 de setembro de 2026, a implantação `irrint-2026-7f93a1` foi criada depois de o Billing registrar US$ 312 em créditos do GitHub Education. O painel confirmou um dyno `web` Basic ativo, comando `npm start`, e um Heroku Postgres Essential-0.

Na API `https://irrint-2026-7f93a1-42d8a0dfb354.herokuapp.com` foram observados:

- `/healthz` com `status: ok`;
- dois proprietários diferentes, duas áreas por proprietário e quatro IDs exclusivos;
- telemetria com origem `device`;
- abertura `applied` e evento de confirmação;
- fechamento `applied`, válvula final `closed` e histórico de leituras;
- ambiente informado como `hosted-demo`.

Na interface [https://irrigacao-int.vercel.app/](https://irrigacao-int.vercel.app/), o bundle publicado continha o endereço da API. Login, conexão da área, atualização da umidade, início da irrigação e parada confirmada foram exercitados no navegador.

## Preparação para GitHub Education

O armazenamento hospedado passou a selecionar PostgreSQL quando a Heroku fornece `DATABASE_URL`; sem essa variável, continua usando o arquivo JSON da contingência. O teste de armazenamento confirmou criação da tabela, carga inicial, atualização, nova carga e encerramento da conexão. A conexão real com o Heroku Postgres permanece parte da homologação externa.

Foram validados:

- `app.json` sintaticamente válido, com um dyno Basic e `heroku-postgresql:essential-0`;
- `Procfile` com um único processo `web`;
- `pg` e `tsx` presentes nas dependências de produção;
- Node 22 declarado para coincidir com o contêiner e a execução hospedada;
- orçamento nominal de US$ 12/mês dentro do crédito estudantil de US$ 13/mês.

`npm audit --omit=dev` não apontou alerta para a nova dependência PostgreSQL. Permanecem três alertas moderados no React Router 6; a correção automática exige React Router 8 e quebra a combinação atualmente suportada pelo Ionic Router. A atualização forçada não foi aplicada.

## Contingência local

`npm run contingency:start` detectou os endereços IPv4 privados, iniciou a API em modo LAN, os dois dispositivos simulados e o Vite. Pela API iniciada, foram confirmados login, duas áreas, telemetria e `environment: local-simulation`.

`npm run contingency:build -- --api=http://192.168.137.1:8787` concluiu:

- build TypeScript/Vite;
- sincronização do Capacitor;
- `:app:assembleDebug` com Android SDK 36;
- APK com pacote `br.com.irrint.contingency`, versão `0.4.1-contingency`, `versionCode 5`, `minSdk 24` e `targetSdk 36`;
- assinatura Android Debug válida pelo esquema APK Signature v2;
- inclusão da tela para configurar o endpoint LAN;
- permissão HTTP restrita ao build de depuração.

O artefato fica em `contingency/Irrint-contingencia-debug.apk`. A compilação produz também `Irrint-contingencia-debug.apk.sha256`.

O SHA-256 observado foi `6340fd65dd377bc8a4a5df78b76fc82f37c195d0aa223d98ae4f319fff2fe563`. A extração do bundle confirmou a presença de **Conexão local de contingência** e do endpoint inicial `http://192.168.137.1:8787`.

Não havia aparelho conectado por ADB nesta validação. Os dois APKs novos foram verificados estruturalmente e pela assinatura, mas a instalação física da compilação 0.4.1 ainda deve ser repetida no Galaxy S25 Ultra. A versão anterior do fluxo já havia sido instalada e exercitada nesse aparelho.

## Suíte

- 73/73 testes Vitest;
- 3/3 E2E anteriores do aplicativo;
- 1/1 E2E novo da distribuição hospedada;
- build web concluído;
- APK público de release e APK de contingência concluídos.

O aviso de chunks grandes de Ionic e Three.js permanece informativo. Ele não impediu build, execução ou o teste Android anterior.
