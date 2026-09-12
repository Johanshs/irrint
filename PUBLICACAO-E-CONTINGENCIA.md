# Publicação contínua e contingência local

## Resultado esperado

A distribuição possui dois caminhos complementares:

- **demonstração pública**: frontend na Vercel, API HTTPS e simulador em um serviço supervisionado com armazenamento persistente;
- **defesa sem internet externa**: frontend local, API LAN, simuladores locais e APK de contingência com endpoint configurável.

Os dois caminhos preservam o mesmo contrato HTTP. O ambiente público cria duas áreas exclusivas a cada login, assina a sessão por 30 minutos e remove os dados expirados quando uma nova sessão é aberta. O limite padrão é de 12 sessões ativas.

## Serviço hospedado

O processo `npm run start:hosted` supervisiona:

1. `server/hosted.ts`, que expõe a API, valida as origens, assina sessões e grava o estado;
2. `clients/openapi-device.ts`, que descobre os dispositivos pelo OpenAPI, envia telemetria e confirma comandos.

Variáveis obrigatórias:

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

## Corte controlado da Vercel

O `vercel.json` continua impedindo a promoção automática da interface nova. Execute o corte somente após estes passos:

1. implantar o backend e confirmar `GET https://API/healthz`;
2. abrir duas sessões e confirmar que seus identificadores de área não se repetem;
3. abrir e fechar uma válvula e observar `applied`, telemetria e histórico;
4. configurar `VITE_API_BASE_URL=https://API` no projeto Vercel;
5. incluir o domínio final em `IRRINT_ALLOWED_ORIGINS`;
6. gerar um Preview da Vercel e executar o roteiro principal;
7. remover `ignoreCommand` de `vercel.json` e promover para produção;
8. conservar o deployment anterior e a branch `legacy` como rollback.

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

O arquivo fica em `contingency/Irrint-contingencia-debug.apk`, acompanhado por um SHA-256. No aparelho, a seção **Conexão local de contingência** permite trocar o endereço sem recompilar.

No dia da apresentação, execute:

```powershell
npm run contingency:start
```

O inicializador mostra os IPv4 privados do notebook, inicia API, dois dispositivos simulados e frontend, e mantém os processos unidos à mesma janela. Notebook e celular precisam estar na mesma rede, mas essa rede não precisa ter acesso à internet. O procedimento completo está em [contingency/LEIA-ME.md](contingency/LEIA-ME.md).

## Limites

A implantação pública é uma demonstração multiusuário isolada, não um serviço agrícola de produção. O estado PostgreSQL é gravado como um documento validado e o desenho pressupõe uma única instância da API. O produto não comprova hardware físico, economia real de água nem resultado agronômico.
