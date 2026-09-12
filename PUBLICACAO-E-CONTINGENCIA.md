# Publicação contínua e contingência local

## Resultado esperado

A distribuição possui dois caminhos complementares:

- **demonstração pública**: frontend na Vercel, API HTTPS e simulador em um serviço supervisionado com armazenamento persistente;
- **defesa sem internet externa**: frontend local, API LAN, simuladores locais e APK de contingência com endpoint configurável.

Os dois caminhos preservam o mesmo contrato HTTP. O ambiente público cria duas áreas exclusivas a cada login, assina a sessão por 30 minutos e remove os dados expirados quando uma nova sessão é aberta. O limite padrão é de 12 sessões ativas.

## APK público

`npm run android:public` gera `distribution/Irrint-0.4.2-publico.apk` com:

- pacote `br.com.irrint.app` e nome **Irriga Inteligente**;
- API Heroku HTTPS incorporada ao bundle;
- configuração de IP local removida da interface;
- assinatura de release RSA 4096, preservada localmente para atualizações;
- ícone e splash próprios do Irrint.

O primeiro build cria `android/irrint-release.jks` e `android/keystore.properties`. Esses arquivos não entram no Git e devem ser guardados juntos em backup privado, conforme [android/ASSINATURA-APK.md](android/ASSINATURA-APK.md).

A versão atual está em [GitHub Releases v0.4.2](https://github.com/Johanshs/irrint/releases/tag/v0.4.2). Somente o APK público e seu checksum são anexados; a contingência permanece local.

## Serviço hospedado

O processo `npm run start:hosted` supervisiona:

1. `server/hosted.ts`, que expõe a API, valida as origens, assina sessões e grava o estado;
2. `clients/openapi-device.ts`, que descobre os dispositivos pelo OpenAPI, envia telemetria e confirma comandos.

Variáveis do serviço hospedado:

| Variável                 | Uso                                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| `IRRINT_SESSION_SECRET`  | segredo aleatório com pelo menos 32 bytes para assinar sessões                                  |
| `IRRINT_DEVICE_TOKEN`    | credencial privada compartilhada somente entre API e runner                                     |
| `IRRINT_ALLOWED_ORIGINS` | origens exatas separadas por vírgula, incluindo a Vercel e, para o APK, `capacitor://localhost` |
| `DATABASE_URL`           | conexão PostgreSQL fornecida automaticamente pela Heroku                                        |
| `IRRINT_DATA_DIR`        | diretório persistente usado apenas quando `DATABASE_URL` não existe                             |
| `PORT`                   | porta HTTP fornecida pelo provedor                                                              |

`DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` e `IRRINT_MAX_ACTIVE_SESSIONS` são opcionais. Os padrões são `produtor@demo.local`, `irrigacao` e `12`.

Quando `DATABASE_URL` está presente, o serviço cria a tabela `irrint_state` e usa PostgreSQL. Sem essa variável, mantém o arquivo JSON, de modo que a execução local e o contêiner de referência continuam compatíveis.

## Heroku com GitHub Education

A implantação recomendada para os meses de apresentação usa o benefício estudantil:

| Recurso                       | Valor mensal | Comportamento                        |
| ----------------------------- | ------------ | ------------------------------------ |
| 1 dyno Heroku Basic           | US$ 7        | processo web permanentemente ativo   |
| Heroku Postgres Essential-0   | US$ 5        | 1 GB de persistência                 |
| Total                         | US$ 12       | coberto pelo crédito de US$ 13/mês   |
| Margem restante dentro do mês | US$ 1        | não deve ser usada por outro recurso |

O GitHub Student Developer Pack oferece US$ 13 mensais por 24 meses. O crédito não utilizado não acumula. Antes da criação, confirme no painel da Heroku que o benefício está ativo; a Heroku solicita conta verificada e dados de cobrança mesmo quando o crédito cobre os recursos.

O arquivo `app.json` declara o Basic, o banco Essential-0, os segredos e as origens. O `Procfile` inicia `npm start`, e o backend usa `DATABASE_URL` automaticamente. Procedimento:

1. resgatar a oferta Heroku no GitHub Student Developer Pack;
2. confirmar no Billing da Heroku que os créditos estudantis estão ativos;
3. criar o aplicativo a partir de `https://github.com/Johanshs/irrint` usando o `app.json`;
4. confirmar que existe exatamente um dyno `web` Basic e um banco `heroku-postgresql:essential-0`;
5. configurar implantação automática da branch `main` somente após a homologação;
6. validar `/healthz`, isolamento, telemetria e comandos antes do corte da Vercel.

O `Dockerfile` e o `render.yaml` permanecem como alternativa portável, mas o Render não é o caminho escolhido enquanto houver o crédito estudantil.

### Implantação ativa

- Aplicativo Heroku: `irrint`;
- API HTTPS: `https://irrint-79e47c1c9fa0.herokuapp.com`;
- recursos: um dyno Basic e um Postgres Essential-0;
- crédito confirmado antes da criação: US$ 312;
- custo nominal dos recursos: US$ 12/mês, limitado aos produtos cobertos pelo benefício.

A conexão automática Heroku–GitHub é opcional e ainda depende da autorização OAuth da conta. O serviço atual foi criado diretamente do repositório pelo `app.json`; atualizações de backend podem ser publicadas por implantação manual até essa autorização ser concluída.

Em 12 de setembro de 2026, o aplicativo foi renomeado de `irrint-2026-7f93a1` para `irrint`. O Heroku gerou um novo domínio padrão com identificador aleatório. O procedimento e o inventário de impacto estão em [PLANO-RENOMEACAO.md](PLANO-RENOMEACAO.md).

Depois da troca, `/healthz` respondeu `ok`, a Vercel publicou o bundle com o novo endpoint e o E2E hospedado confirmou duas sessões isoladas, telemetria e comando. O endereço antigo passou a responder HTTP 404 e não deve permanecer em clientes atuais.

## Corte da Vercel concluído

Em 11 de setembro de 2026:

1. `/healthz` respondeu `ok` pela API HTTPS;
2. dois visitantes receberam proprietários diferentes e quatro áreas sem identificadores repetidos;
3. a telemetria pública informou `source: device`;
4. abertura e fechamento chegaram a `applied` e a válvula terminou fechada;
5. `.env.production` recebeu o endereço da API;
6. `ignoreCommand` foi removido de `vercel.json`;
7. o bundle novo foi promovido em `https://irrigacao-int.vercel.app/`;
8. login, umidade conectada, irrigação e parada foram conferidos no site publicado.

O deployment anterior e a branch `legacy` permanecem como rollback.

O teste `npm run test:e2e:hosted` automatiza os passos de isolamento e comando antes do corte.

## Contingência local

Gere o APK reutilizável:

```powershell
npm run contingency:build
```

O endpoint inicial é `http://192.168.137.1:8787`, endereço comum do ponto de acesso do Windows. Também é possível escolher outro:

```powershell
npm run contingency:build -- --api=http://192.168.1.20:8787
```

O arquivo fica em `contingency/Irrint-contingencia-debug.apk`, acompanhado por um SHA-256. No aparelho, a seção **Conexão local de contingência** permite trocar o endereço sem recompilar. Seu pacote é `br.com.irrint.contingency`, permitindo instalação simultânea com o APK público.

No dia da apresentação, execute:

```powershell
npm run contingency:start
```

O inicializador mostra os IPv4 privados do notebook, inicia API, dois dispositivos simulados e frontend, e mantém os processos unidos à mesma janela. Notebook e celular precisam estar na mesma rede, mas essa rede não precisa ter acesso à internet. O procedimento completo está em [contingency/LEIA-ME.md](contingency/LEIA-ME.md).

## Limites

A implantação pública é uma demonstração multiusuário isolada, não um serviço agrícola de produção. O estado PostgreSQL é gravado como um documento validado e o desenho pressupõe uma única instância da API. O produto não comprova hardware físico, economia real de água nem resultado agronômico.
