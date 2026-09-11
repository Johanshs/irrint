# Versões do Irrint

## Atual: main

A branch [`main`](https://github.com/Johanshs/irrint/tree/main) é a linha atual: interface Ionic/Capacitor, API HTTP local/LAN, cliente de dispositivo derivado do OpenAPI, APK de depuração configurável e laboratório com oito cenários em N/S.

A tag [`v0.3.0`](https://github.com/Johanshs/irrint/tree/v0.3.0) preserva o marco que simplificou o laboratório para um acionamento de teste e sete cenários. Os avanços posteriores permanecem na `main` até o próximo marco versionado.

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

Código atual no GitHub e implantação pública são etapas diferentes. A `main` depende da API e do runner locais; o frontend estático isolado não substitui a demonstração completa.

O `vercel.json` executa `scripts/vercel-ignore-build.mjs`, que retorna 0 para a [etapa de ignorar build da Vercel](https://vercel.com/docs/project-configuration/vercel-json#ignorecommand). Isso impede que este envio promova automaticamente uma interface sem backend e mantém o deployment existente. A hospedagem do backend, autenticação, transporte do APK e publicação da nova experiência continuam no plano.

Ao preparar a implantação, configure e valide a API hospedada, ajuste `VITE_API_BASE_URL`, CORS e autenticação, e remova a trava de build de forma deliberada. Nenhuma configuração de domínio ou conta Vercel foi alterada nesta entrega.
