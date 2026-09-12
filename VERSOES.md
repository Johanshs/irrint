# Versões do Irrint

## Atual: main

A branch [`main`](https://github.com/Johanshs/irrint/tree/main) é a linha atual: interface Ionic/Capacitor, API HTTP local/LAN, cliente de dispositivo derivado do OpenAPI, APK público assinado, APK de contingência configurável e laboratório com oito cenários em N/S.

A tag [`v0.3.0`](https://github.com/Johanshs/irrint/tree/v0.3.0) preserva o marco que simplificou o laboratório para um acionamento de teste e sete cenários. Os avanços posteriores permanecem na `main` até o próximo marco versionado.

A tag [`v0.4.0`](https://github.com/Johanshs/irrint/tree/v0.4.0) preserva o marco publicado: sessões isoladas, PostgreSQL, runner supervisionado, API Heroku, interface Vercel, teste E2E multiusuário e APK local de contingência.

A tag [`v0.4.1`](https://github.com/Johanshs/irrint/tree/v0.4.1) preserva a distribuição Android: marca própria, APK público com API HTTPS fixa e assinatura de release, além do APK local em pacote separado para instalação simultânea.

A tag [`v0.2.0`](https://github.com/Johanshs/irrint/tree/v0.2.0) preserva o marco anterior da nova arquitetura, inclusive os controles ao vivo que existiam no laboratório. Nenhuma tag anterior foi movida.

Para executar: `npm ci` e `npm run demo:start`. Os próximos itens estão em [PROGRESSO.md](PROGRESSO.md).

## Preservada: legacy

A versão anterior foi mantida integralmente na branch [`legacy`](https://github.com/Johanshs/irrint/tree/legacy) e na tag [`v0.1.0-legacy`](https://github.com/Johanshs/irrint/tree/v0.1.0-legacy), ambas apontando para `bf847657a050383738c9914a63db4917e4c21b8d`.

Essa referência contém a interface anterior, os módulos de IA, a integração Firebase e os arquivos originais. Não houve reescrita do histórico. Use a tag para consultar o marco preservado, pois branches podem receber alterações futuras. A troca de versão no repositório não apaga dados ou contas externas do Firebase.

Para consultar sem misturar arquivos com a versão atual, com o repositório limpo:

```sh
git worktree add ../irrint-legacy v0.1.0-legacy
```

## GitHub e site publicado

Código atual no GitHub e implantação pública permanecem artefatos distintos. A distribuição Android está na versão `0.4.1`; o serviço web continua usando a base funcional homologada em `0.4.0`, acrescida somente da identidade visual no próximo deploy da `main`.

A API está em `https://irrint-2026-7f93a1-42d8a0dfb354.herokuapp.com`, com um dyno Basic e Postgres Essential-0 cobertos pelo GitHub Education. A interface atual está em [irrigacao-int.vercel.app](https://irrigacao-int.vercel.app/), e `.env.production` registra o endereço da API utilizado pelo bundle. A trava anterior foi removida de `vercel.json` somente após a homologação pública.
