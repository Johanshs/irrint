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
| `IRRINT_DATA_DIR`        | diretório montado em armazenamento persistente                                                  |
| `PORT`                   | porta HTTP fornecida pelo provedor                                                              |

`DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` e `IRRINT_MAX_ACTIVE_SESSIONS` são opcionais. Os padrões são `produtor@demo.local`, `irrigacao` e `12`.

O `Dockerfile` permite usar qualquer provedor que execute contêiner Node 22 e ofereça volume persistente. O `render.yaml` descreve uma implantação de referência com health check em `/healthz` e disco de 1 GB. O disco e a instância contínua são recursos pagos no Render; a contratação deve ser aprovada antes da criação.

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

A implantação pública é uma demonstração multiusuário isolada, não um serviço agrícola de produção. O armazenamento em volume pressupõe uma única instância da API. O produto não comprova hardware físico, economia real de água nem resultado agronômico.
