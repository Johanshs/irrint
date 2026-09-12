const json = (schema: object) => ({ content: { 'application/json': { schema } } });
const response = (description: string, schema: object) => ({ description, ...json(schema) });
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

/** Machine-readable contract for operator and device clients. */
export const openApiDocument = {
  openapi: '3.1.0',
  info: {
    title: 'Irrigação Inteligente API',
    version: '1.0.0',
    description:
      'Contrato independente de hardware para a demonstração local. Resultados de água e umidade são simulados.',
  },
  servers: [{ url: 'http://127.0.0.1:8787', description: 'Demonstração local' }],
  paths: {
    '/api/v1/session': {
      post: {
        operationId: 'createSession',
        summary: 'Cria uma sessão local de demonstração por 30 minutos',
        requestBody: { required: true, ...json(ref('SessionLogin')) },
        responses: {
          '200': response('Sessão criada', ref('SessionInfo')),
          '401': response('Credenciais inválidas', ref('Error')),
          '422': response('Conteúdo inválido', ref('Error')),
        },
      },
    },
    '/api/v1/state': {
      get: {
        operationId: 'getState',
        summary: 'Consulta o estado conhecido pelo aplicativo',
        security: [{ operatorSession: [] }],
        responses: { '200': response('Snapshot atual', ref('Snapshot')) },
      },
    },
    '/api/v1/report': {
      get: {
        operationId: 'exportLiveReport',
        summary: 'Exporta o estado retido da sessão ao vivo',
        security: [{ operatorSession: [] }],
        responses: { '200': response('Relatório da sessão', ref('LiveReport')) },
      },
    },
    '/api/v1/experiments': {
      post: {
        operationId: 'runExperiment',
        summary: 'Executa um cenário isolado e reproduzível',
        security: [{ operatorSession: [] }],
        requestBody: { required: true, ...json(ref('ExperimentInput')) },
        responses: {
          '200': response('Relatório completo do experimento', { type: 'object' }),
          '422': response('Cenário ou sistema inválido', ref('Error')),
        },
      },
    },
    '/api/v1/zones': {
      post: {
        operationId: 'createZone',
        summary: 'Cadastra uma área e seus vínculos de demonstração',
        security: [{ operatorSession: [] }],
        requestBody: { required: true, ...json(ref('ZoneCreate')) },
        responses: {
          '201': response('Área cadastrada', ref('Zone')),
          '409': response('Identificador já vinculado ou limite atingido', ref('Error')),
          '422': response('Conteúdo inválido', ref('Error')),
        },
      },
    },
    '/api/v1/zones/{zoneId}': {
      put: {
        operationId: 'updateZone',
        summary: 'Atualiza o nome e o cultivo da área',
        security: [{ operatorSession: [] }],
        parameters: [{ $ref: '#/components/parameters/ZoneId' }],
        requestBody: { required: true, ...json(ref('ZoneUpdate')) },
        responses: {
          '200': response('Área atualizada', ref('Zone')),
          '403': response('Área de outra conta', ref('Error')),
          '422': response('Conteúdo inválido', ref('Error')),
        },
      },
    },
    '/api/v1/zones/{zoneId}/commands': {
      post: {
        operationId: 'requestCommand',
        summary: 'Solicita abertura ou fechamento da válvula da área',
        security: [{ operatorSession: [] }],
        parameters: [{ $ref: '#/components/parameters/ZoneId' }],
        requestBody: { required: true, ...json(ref('CommandInput')) },
        responses: {
          '202': response('Comando recebido e aguardando confirmação', ref('Command')),
          '409': response('Estado não permite a solicitação', ref('Error')),
          '422': response('Conteúdo inválido', ref('Error')),
        },
      },
    },
    '/api/v1/zones/{zoneId}/rule': {
      put: {
        operationId: 'configureRule',
        summary: 'Configura a regra manual ou automática da área',
        security: [{ operatorSession: [] }],
        parameters: [{ $ref: '#/components/parameters/ZoneId' }],
        requestBody: { required: true, ...json(ref('Rule')) },
        responses: {
          '200': response('Área atualizada', ref('Zone')),
          '422': response('Regra inválida', ref('Error')),
        },
      },
    },
    '/device/v1/config': {
      get: {
        operationId: 'getDeviceConfiguration',
        summary: 'Consulta os vínculos necessários ao processo de dispositivos',
        security: [{ deviceToken: [] }],
        parameters: [{ $ref: '#/components/parameters/RunnerId' }],
        responses: {
          '200': response('Áreas e últimas leituras vinculadas', {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'deviceId', 'latest'],
              properties: {
                id: { type: 'string' },
                deviceId: { type: 'string' },
                latest: { anyOf: [ref('Reading'), { type: 'null' }] },
              },
            },
          }),
          '401': response('Credencial ausente ou inválida', ref('Error')),
        },
      },
    },
    '/device/v1/commands/{deviceId}': {
      get: {
        operationId: 'pollCommands',
        summary: 'Consulta comandos pendentes do dispositivo',
        security: [{ deviceToken: [] }],
        parameters: [
          { $ref: '#/components/parameters/DeviceId' },
          { $ref: '#/components/parameters/RunnerId' },
        ],
        responses: {
          '200': response('Comandos pendentes', { type: 'array', items: ref('Command') }),
          '401': response('Credencial ausente ou inválida', ref('Error')),
        },
      },
    },
    '/device/v1/telemetry': {
      post: {
        operationId: 'sendTelemetry',
        summary: 'Envia uma leitura ordenada do dispositivo',
        security: [{ deviceToken: [] }],
        parameters: [{ $ref: '#/components/parameters/RunnerId' }],
        requestBody: { required: true, ...json(ref('Telemetry')) },
        responses: {
          '200': response('Leitura recebida', ref('Reading')),
          '409': response('Leitura antiga ou dispositivo não vinculado', ref('Error')),
          '422': response('Telemetria fora do contrato', ref('Error')),
        },
      },
    },
    '/device/v1/ack': {
      post: {
        operationId: 'acknowledgeCommand',
        summary: 'Confirma ou rejeita um comando',
        security: [{ deviceToken: [] }],
        parameters: [{ $ref: '#/components/parameters/RunnerId' }],
        requestBody: { required: true, ...json(ref('Ack')) },
        responses: {
          '200': response('Confirmação processada', ref('Command')),
          '409': response('Comando superado', ref('Error')),
          '422': response('Confirmação incompatível', ref('Error')),
        },
      },
    },
  },
  components: {
    securitySchemes: {
      operatorSession: { type: 'http', scheme: 'bearer' },
      deviceToken: { type: 'http', scheme: 'bearer' },
    },
    parameters: {
      ZoneId: { name: 'zoneId', in: 'path', required: true, schema: { type: 'string' } },
      DeviceId: { name: 'deviceId', in: 'path', required: true, schema: { type: 'string' } },
      RunnerId: {
        name: 'X-Runner-Id',
        in: 'header',
        required: true,
        schema: { type: 'string', minLength: 1, maxLength: 80 },
      },
    },
    schemas: {
      SessionLogin: {
        type: 'object',
        additionalProperties: false,
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1, maxLength: 200 },
        },
      },
      SessionInfo: {
        type: 'object',
        required: ['token', 'expiresAt', 'user'],
        properties: {
          token: { type: 'string' },
          expiresAt: { type: 'integer' },
          user: {
            type: 'object',
            required: ['id', 'name', 'email'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
            },
          },
        },
      },
      Error: {
        type: 'object',
        additionalProperties: false,
        required: ['error'],
        properties: { error: { type: 'string' } },
      },
      Rule: {
        type: 'object',
        additionalProperties: false,
        required: ['mode', 'startBelow', 'stopAt', 'maxDurationSeconds'],
        properties: {
          mode: { type: 'string', enum: ['manual', 'automatic'] },
          startBelow: { type: 'number', minimum: 0, maximum: 99 },
          stopAt: { type: 'number', minimum: 1, maximum: 100 },
          maxDurationSeconds: { type: 'integer', minimum: 5, maximum: 600 },
        },
      },
      CommandInput: {
        type: 'object',
        additionalProperties: false,
        required: ['action', 'idempotencyKey'],
        properties: {
          action: { type: 'string', enum: ['open', 'close'] },
          durationSeconds: { type: 'integer', minimum: 5, maximum: 600 },
          idempotencyKey: { type: 'string', format: 'uuid' },
        },
      },
      Command: {
        allOf: [
          ref('CommandInput'),
          {
            type: 'object',
            required: [
              'id',
              'zoneId',
              'deviceId',
              'origin',
              'status',
              'requestedAt',
              'expiresAt',
              'appliedAt',
            ],
            properties: {
              id: { type: 'string', format: 'uuid' },
              zoneId: { type: 'string' },
              deviceId: { type: 'string' },
              origin: { type: 'string', enum: ['manual', 'automatic'] },
              status: { type: 'string', enum: ['pending', 'applied', 'rejected', 'expired', 'superseded'] },
              requestedAt: { type: 'integer' },
              expiresAt: { type: 'integer' },
              appliedAt: { type: ['integer', 'null'] },
            },
          },
        ],
      },
      Water: {
        type: 'object',
        additionalProperties: false,
        required: ['totalLiters', 'flowLitersPerHour'],
        properties: {
          totalLiters: { type: 'number', minimum: 0 },
          flowLitersPerHour: { type: 'number', minimum: 0 },
        },
      },
      Telemetry: {
        type: 'object',
        additionalProperties: false,
        required: [
          'schemaVersion',
          'deviceId',
          'sequence',
          'moisture',
          'unit',
          'valve',
          'lastCommandId',
          'source',
        ],
        properties: {
          schemaVersion: { const: '1.0' },
          deviceId: { type: 'string', minLength: 1, maxLength: 80 },
          sequence: { type: 'integer', minimum: 0 },
          moisture: { type: 'number', minimum: 0, maximum: 100 },
          unit: { const: 'normalizedPercent' },
          valve: { type: 'string', enum: ['open', 'closed'] },
          lastCommandId: { type: ['string', 'null'], format: 'uuid' },
          source: { type: 'string', enum: ['simulated', 'device'] },
          water: ref('Water'),
        },
      },
      Ack: {
        type: 'object',
        additionalProperties: false,
        required: ['deviceId', 'commandId', 'status', 'valve'],
        properties: {
          deviceId: { type: 'string' },
          commandId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['applied', 'rejected'] },
          valve: { type: 'string', enum: ['open', 'closed'] },
        },
      },
      Reading: {
        allOf: [
          ref('Telemetry'),
          {
            type: 'object',
            required: ['zoneId', 'receivedAt'],
            properties: { zoneId: { type: 'string' }, receivedAt: { type: 'integer' } },
          },
        ],
      },
      Zone: {
        type: 'object',
        required: [
          'id',
          'ownerId',
          'name',
          'crop',
          'deviceId',
          'sensorId',
          'valveId',
          'rule',
          'automaticPaused',
          'latest',
          'activeCommandId',
        ],
        properties: {
          id: { type: 'string' },
          ownerId: { type: 'string' },
          name: { type: 'string' },
          crop: { type: 'string' },
          deviceId: { type: 'string' },
          sensorId: { type: 'string' },
          valveId: { type: 'string' },
          rule: ref('Rule'),
          automaticPaused: { type: 'boolean' },
          latest: { anyOf: [ref('Reading'), { type: 'null' }] },
          activeCommandId: { type: ['string', 'null'], format: 'uuid' },
        },
      },
      ZoneCreate: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'crop'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 80 },
          crop: { type: 'string', minLength: 2, maxLength: 80 },
          id: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
          deviceId: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
          sensorId: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
          valveId: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
        },
      },
      ZoneUpdate: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'crop'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 80 },
          crop: { type: 'string', minLength: 2, maxLength: 80 },
        },
      },
      Snapshot: {
        type: 'object',
        required: [
          'schemaVersion',
          'createdAt',
          'zones',
          'commands',
          'readings',
          'events',
          'serverTime',
          'environment',
          'offlineAfterMs',
        ],
        properties: {
          schemaVersion: { const: '1.0' },
          createdAt: { type: 'integer' },
          zones: { type: 'array', items: ref('Zone') },
          commands: { type: 'array', items: ref('Command') },
          readings: { type: 'array', items: ref('Reading') },
          events: { type: 'array', items: { type: 'object' } },
          serverTime: { type: 'integer' },
          environment: { type: 'string', enum: ['local-simulation', 'hosted-demo'] },
          offlineAfterMs: { type: 'integer' },
        },
      },
      MeasurementSummary: {
        type: 'object',
        additionalProperties: false,
        required: ['zoneId', 'measurementStatus', 'moisturePercent', 'totalLiters', 'measuredAt'],
        properties: {
          zoneId: { type: 'string' },
          measurementStatus: { type: 'string', enum: ['measured', 'not-measured'] },
          moisturePercent: { type: ['number', 'null'], minimum: 0, maximum: 100 },
          totalLiters: { type: ['number', 'null'], minimum: 0 },
          measuredAt: { type: ['integer', 'null'] },
        },
      },
      LiveReport: {
        allOf: [
          ref('Snapshot'),
          {
            type: 'object',
            required: ['exportedAt', 'reportVersion', 'measurements', 'limitation'],
            properties: {
              exportedAt: { type: 'integer' },
              reportVersion: { const: '1.1' },
              measurements: { type: 'array', items: ref('MeasurementSummary') },
              limitation: { type: 'string' },
            },
          },
        ],
      },
      ExperimentInput: {
        type: 'object',
        additionalProperties: false,
        required: ['scenario', 'seed'],
        properties: {
          scenario: {
            type: 'string',
            enum: [
              'automatic',
              'manual-stop',
              'connection-loss',
              'unconfirmed',
              'command-timeout',
              'duplicate',
              'invalid-reading',
              'stuck-valve',
            ],
          },
          seed: { type: 'integer', minimum: 1, maximum: 2147483646 },
          zoneId: { type: 'string', enum: ['north', 'south'], default: 'north' },
        },
      },
    },
  },
} as const;
