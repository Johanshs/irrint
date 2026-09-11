# Contrato da demonstração local · versão 1.0

Os schemas executáveis em `shared/contracts.ts` e `shared/experiments.ts` validam a execução. A especificação OpenAPI 3.1 pode ser consultada em `GET /api/v1/openapi.json`. Persistência em nuvem e autenticação de produção continuam como etapas posteriores.

## Operador

| Método | Caminho                      | Entrada / resultado                                                                   |
| ------ | ---------------------------- | ------------------------------------------------------------------------------------- |
| GET    | `/api/v1/openapi.json`       | Especificação OpenAPI 3.1 para clientes de operador e dispositivo                     |
| POST   | `/api/v1/session`            | `email`, `password`; cria uma sessão local com duração máxima de 30 minutos           |
| GET    | `/api/v1/state`              | Snapshot: áreas, leituras, comandos, eventos, horário do servidor e prazo de contato  |
| POST   | `/api/v1/zones`              | Cadastra `name` e `crop`; vínculos demonstrativos são gerados quando omitidos         |
| PUT    | `/api/v1/zones/:id`          | Atualiza o nome e o cultivo sem perder o histórico ou os vínculos                     |
| POST   | `/api/v1/zones/:id/commands` | `action`, `idempotencyKey`; `durationSeconds` obrigatório somente para `open`         |
| PUT    | `/api/v1/zones/:id/rule`     | `mode`, `startBelow`, `stopAt`, `maxDurationSeconds`                                  |
| GET    | `/api/v1/report`             | Estado ao vivo retido e limites da evidência                                          |
| POST   | `/api/v1/experiments`        | `scenario`, `seed`, `zoneId` opcional; retorna relatório completo de execução isolada |

`north` e `south` são as áreas iniciais da conta demonstrativa. As demais rotas de operador exigem `Authorization: Bearer <token da sessão>` e retornam somente áreas, comandos, leituras e eventos da conta autenticada. Um `POST` de comando retorna HTTP 202 com estado `pending`: isso confirma recebimento, não execução física. A interface aguarda `applied` ou uma leitura coerente com `lastCommandId`.

Ao cadastrar uma área pela interface, a API cria identificadores únicos para dispositivo, sensor de umidade e válvula. Clientes de integração podem informar `id`, `deviceId`, `sensorId` e `valveId` no cadastro. O runner consulta `/device/v1/config` a cada 5 s e inicia um dispositivo simulado para vínculos novos. Esta etapa permite criar e editar; remoção e troca de componentes com histórico permanecem fora do fluxo atual.

## Dispositivo

| Método | Caminho                         | Entrada / resultado                                                          |
| ------ | ------------------------------- | ---------------------------------------------------------------------------- |
| GET    | `/device/v1/config`             | Áreas, dispositivos e últimas leituras necessárias ao runner                 |
| GET    | `/device/v1/commands/:deviceId` | Comandos pendentes e ainda válidos                                           |
| POST   | `/device/v1/telemetry`          | Leitura com sequência crescente, estado da válvula e último comando aplicado |
| POST   | `/device/v1/ack`                | `deviceId`, `commandId`, `status` (`applied`/`rejected`), `valve`            |

Rotas de dispositivo exigem `Authorization: Bearer <token local>` e `X-Runner-Id`. O token é gerado no início da API e armazenado em `.local/device-token`. Não deve ir para o frontend ou Git. Um lease de 6 s impede dois processos simultâneos usando a sessão. As credenciais por dispositivo/usuário de produção são trabalho futuro; esse token é apenas do processo local de demonstração.

Telemetria:

```json
{
  "schemaVersion": "1.0",
  "deviceId": "sim-north",
  "sequence": 1,
  "moisture": 34.2,
  "unit": "normalizedPercent",
  "valve": "closed",
  "lastCommandId": null,
  "source": "simulated",
  "water": { "totalLiters": 0.12, "flowLitersPerHour": 0 }
}
```

`receivedAt` e os prazos são atribuídos pelo servidor, em milissegundos Unix. A sequência deve superar a última aceita. O runner recupera a sequência antes de reiniciar. `moisture` aceita somente número finito entre 0 e 100. Campos inesperados são rejeitados.

`source` aceita `simulated` para o modelo demonstrativo e `device` para outro cliente que implemente o contrato. Esse campo identifica a origem da leitura e não altera as regras de controle.

O cliente de referência em `clients/openapi-device.ts` comprova o segundo caso: ele usa apenas o documento OpenAPI e HTTP, mantém tipos e estado próprios e não importa `shared/control.ts` nem `simulator/device.ts`. `npm run demo:start:reference` troca o runner da demonstração sem alterar a interface ou a API.

`water` é uma extensão opcional: estados anteriores continuam válidos e a interface mostra “—” quando não há volume disponível. Seus campos são números finitos não negativos: `totalLiters` é o acumulado nominal da área na sessão e `flowLitersPerHour` é a vazão nominal instantânea do dispositivo. O runner recupera o acumulado da última leitura persistida; um intervalo não transmitido antes de encerrar o processo não é recuperável. A precisão de saída é de seis casas decimais em litros, sem representar precisão de um instrumento físico.

O modelo usa 18 emissores de 2 L/h por área (36 L/h) e integra o relógio do dispositivo somente durante a abertura, respeitando o fechamento entre passos e o watchdog. Reinício começa fechado. Reenvio de comando não reinicia o contador nem prolonga o prazo. Umidade continua seguindo o modelo linear didático; não é calculada por balanço hídrico a partir desse volume.

## Regras e estados

- Automático abre somente quando `moisture < startBelow`; fecha quando `moisture >= stopAt`. O limite inferior precisa ser menor que o superior.
- Duração de 5 a 600 s. A regra define o prazo das aberturas automáticas; comandos manuais têm prazo explícito dentro do mesmo limite global.
- A abertura requer leitura recebida há menos de 10 s. Sem contato, o valor mostrado é histórico e o estado atual fica incerto.
- Comando pendente expira em 8 s. Confirmação tardia não transforma um comando expirado em executado. O operador pode solicitar parada e revisar antes de reiniciar.
- Mesma chave UUID e mesmo conteúdo devolvem o comando original; mesma chave com outro conteúdo retorna 409. A deduplicação é preservada na sessão.
- Parada manual supera comandos pendentes da área e suspende o automático. Salvar a configuração no modo automático retoma a regra.
- O watchdog vive no dispositivo simulado. Ele fecha ao fim do prazo mesmo se a API ou a interface não estiverem disponíveis. A API só conhece essa parada após uma leitura; ao reconhecê-la, suspende o automático.
- Uma confirmação não inventa leitura de umidade nem renova sua validade.
- Estados de comando: `pending`, `applied`, `rejected`, `expired`, `superseded`.

## Execução e armazenamento

A API serializa operações e grava apenas alterações de estado. Antes de aceitar ou gravar, o adaptador valida integralmente as áreas, vínculos, regras, leituras, comandos e eventos. Arquivo temporário e troca atômica evitam gravação parcial. A versão anterior permanece em `state.json.bak`; se o arquivo principal estiver inválido, ele é preservado com o sufixo `.corrupt-<instante>` e a cópia válida é restaurada. Erro de persistência reverte a alteração em memória. Migrações entre futuras versões do schema continuam como etapa posterior.

Por padrão, o adaptador aceita somente loopback e origens web locais nas portas 5173 e 4173. `npm run demo:start:lan` ativa explicitamente a bancada móvel: Host limitado a endereços privados/locais, CORS para frontend local e `capacitor://localhost`, com preflight de `Authorization`, `Content-Type` e `X-Runner-Id`. JSON permanece limitado a 64 KiB. A conta é sintética, configurável por `DEMO_USER_EMAIL` e `DEMO_USER_PASSWORD`, e as sessões permanecem apenas na memória do processo. Esse mecanismo comprova o isolamento da API local, mas não substitui TLS, Firebase Auth, regras de banco ou gestão de contas de produção. Não expor este adaptador por túnel ou publicar como backend de produção.

## Experimentos

Aceita `automatic`, `manual-stop`, `connection-loss`, `unconfirmed`, `command-timeout`, `duplicate`, `invalid-reading` e `stuck-valve`. Seed inteira de 1 a 2147483646. `zoneId` aceita `north` ou `south`; a omissão mantém `north` por compatibilidade. Um identificador desconhecido retorna 422. Cada execução usa novas instâncias de controlador e dois dispositivos, sem alterar o estado ao vivo.

Em `stuck-valve`, a abertura automática é confirmada, o fechamento posterior é rejeitado com a válvula ainda aberta e o fluxo interno continua durante o restante da janela. O aplicativo conserva o comando rejeitado como estado incerto; a visualização identifica explicitamente que as gotas representam a observação interna do ensaio, sem declarar uma parada que não ocorreu.

Exemplo: `{"scenario":"connection-loss","seed":2026,"zoneId":"south"}`. O relatório de experimentos tem `version: "1.1"` e modelo `linear-educational-v3`; isso não altera a versão 1.0 da telemetria/controle. `input` retorna os parâmetros normalizados, incluindo o sistema. `moments` registra instante, origem (teste/controlador/dispositivo), tipo, descrição e, quando existe, ID do comando. Instantes dentro do mesmo segundo são agrupados por etapa de apresentação, sem resolução de latência.

`deviceMoisture`, `deviceOpen` e `deviceWater` são observações internas por sistema; `zones[].latest` continua sendo exclusivamente a última informação recebida. `communication` descreve o canal do sistema sob teste; o outro sistema mantém comunicação. A API retorna as duas áreas em cada frame. Métricas de tempo e água referem-se ao sistema selecionado.

O experimento chama o domínio diretamente com relógio virtual de 1 s; o teste de API usa HTTP real em loopback. São camadas diferentes de evidência. O relatório informa a versão do modelo, os estímulos, as séries e as verificações. A reprodução visual não recalcula resultados e a posição do replay não altera a simulação ao vivo.

Cada frame representa o estado após o passo e os comandos daquele segundo. A duração aberta integra esses estados em intervalos de 1 s; resolução temporal de 1 s. A leitura de umidade precede a aplicação de comandos do mesmo passo. A maquete do operador usa confirmação e validade da leitura; o gráfico azul permite inspecionar o estado interno do modelo durante falhas.

Modelo atual: `linear-educational-v3`. Cada frame também contém `deviceWater` por área; esses dados internos continuam avançando durante a falha simulada, enquanto `zones[].latest.water` permanece na última telemetria recebida. `metrics.totalLiters` soma os volumes internos finais. O último instante não acrescenta um intervalo futuro à duração. O CSV distingue volume interno, vazão nominal, aplicação média em mL/planta e volume recebido pela API. Pausar, acelerar, retroceder ou abrir o inspetor não recalcula essas séries.
