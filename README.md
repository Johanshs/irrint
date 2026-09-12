# irrint · monitoramento e controle de irrigação

Protótipo acadêmico com interface mobile em Ionic React, contrato HTTP, controlador de irrigação e dispositivos simulados executados fora do navegador. O laboratório oferece uma maquete 3D, experimentos reproduzíveis, replay e exportação de evidências.

**Estado desta versão:** demonstração local funcional e distribuição contínua preparada. O modo hospedado possui sessões temporárias isoladas, tokens assinados, armazenamento em volume, runner supervisionado, Docker e teste E2E próprio. A contratação do serviço, o endereço HTTPS e o corte da Vercel ainda dependem da configuração das contas externas. A versão atual não acessa as contas nem os dados Firebase existentes. Consulte [PROGRESSO.md](PROGRESSO.md) para ver a execução do plano.

**Versões:** `main` é a linha atual. A versão anterior está preservada em `legacy` / `v0.1.0-legacy`; as tags `v0.2.0` e `v0.3.0` conservam marcos da nova arquitetura. Veja [VERSOES.md](VERSOES.md) para consultar o histórico e a separação entre GitHub e implantação na Vercel.

## Começar

Requisitos: Node.js 22 ou 24 e npm. Desenvolvimento verificado no Windows com Node 24.

```sh
npm ci
npm run demo:start
```

Abra **http://127.0.0.1:5173** no mesmo computador. Um único comando inicia a API na porta 8787, os dois dispositivos simulados e a interface na porta 5173. Use **Ctrl+C** no terminal para encerrar os três processos. Entre com `produtor@demo.local` / `irrigacao`; não é necessário configurar Firebase.

`npm run dev` inicia somente a interface e pressupõe uma API já iniciada. Em três terminais separados, também é possível usar `npm run demo:api`, `npm run demo:device` e `npm run dev`.

## Roteiro de apresentação de 3 minutos

1. **Início:** selecione Horta norte. Inicie e pare a irrigação manual. Observe a solicitação, a confirmação e a mudança da umidade.
2. **Ajustes:** escolha Automático e salve. O controlador inicia abaixo de 35% e solicita parada em 45%. São valores didáticos, configuráveis por área.
3. **Histórico → laboratório:** escolha **Sistema: Canteiro sul (S)**, **Teste: Solo seco e recuperação** e use **Executar teste**. O mesmo fluxo funciona no norte. Use **Mostrar nomes** acima da maquete para exibir etiquetas com linhas e movimento suave. Peças e corte do solo ficam em **Visualização e componentes**; o inspetor abre com rotação automática.
4. Execute **Perda de comunicação**. Em **Entender o teste**, vá a 20 s: a API mantém 0,030 L recebidos e estado incerto, enquanto o simulador já fechou e acumulou 0,120 L. Toque na reconexão de 30 s para ver a atualização.
5. Compare **Confirmação perdida** (água liberada sem ACK) com **Comando não entregue** (nenhuma água). Os critérios explicam por que ausência de confirmação não prova ausência de efeito.
6. Em **Resultados**, confira as verificações e baixe **Relatório para impressão**, **Dados CSV** ou **Execução JSON**. Consulte o [guia completo, cenários e limites](DEMONSTRACAO-3D.md).

Os experimentos são isolados: não alteram as áreas da demonstração ao vivo. N fica ao fundo da maquete; S, à frente. O seletor **Sistema** define o alvo do teste; tocar em uma peça abre sua descrição. Indicadores, gráficos, cronologia e resultados não dependem do WebGL.

O laboratório tem um único acionamento de teste, sem controles ao vivo duplicados. Início e Áreas mantêm a operação manual. Use **Animar gotejamento / Ocultar gotejamento**, acima da maquete, para alternar gotas e anéis durante uma irrigação confirmada. O efeito pausa com o replay e não altera o consumo calculado.

## O que funciona

- Navegação mobile com quatro abas: Início, Áreas, Histórico e Ajustes; laboratório dentro de Histórico.
- Duas áreas independentes, cada uma com um sensor, uma válvula e uma regra.
- Controle manual e automático com histerese, prazo máximo, idempotência e confirmação de execução.
- Estado pendente, expirado, sem comunicação e automático suspenso após parada manual ou encerramento de segurança.
- Processo de simulação separado da interface; fechar a aba não interrompe o controlador nem o dispositivo.
- Maquete em Three.js com reservatório, bomba, tubulações e dois conjuntos de microcontrolador/relé, válvula e sensor capacitivo. Etiquetas, inspeção 3D, corte do solo e gotejamento acompanham os dados; não geram decisões.
- Volume nominal por área, aplicação média por planta e consumo acumulado; registrados no dispositivo e exportados com os cenários.
- Oito cenários de 90 s, selecionáveis em N/S: automático, parada manual, perda de comunicação, confirmação perdida, comando vencido, repetição, leituras inválidas e válvula travada aberta. Replay, dois gráficos, cronologia, critérios e comparação dos oito resultados nesta visita.

IA, recomendações preditivas, clima fixo e SSO com outra aplicação foram removidos desta versão. Não há chamadas pagas nem dependência de serviços externos em execução local.

## Testes e evidências

Na primeira execução dos testes de interface, instale o Chromium compatível com a versão fixada do Playwright: `npx playwright install chromium`.

```sh
npm test
npm run test:report
npm run test:e2e
npm run demo:evidence
npm run measure:latency
npm run build
```

- `npm test`: testes do contrato, controlador, dispositivo, API HTTP e experimentos.
- `test:report`: a mesma suíte e um relatório em `.local/test-results.json`.
- `test:e2e`: abre o aplicativo no Chromium e valida teclado, 360/390/430 px com fonte ampliada, alternativa sem WebGL e reprodução/isolamento do CT22. Gera `.local/playwright-report/index.html` e `.local/playwright-results.json`.
- `demo:evidence`: executa os oito cenários em ambos os sistemas; cria 16 JSONs, 16 CSVs, 16 relatórios HTML, resumo Markdown e impressão SHA-256 das fontes em `.local/reports/<data>/`.
- `measure:latency`: com a demonstração ativa, alterna 30 aberturas/fechamentos e mede do pedido até ACK mais telemetria coerente; grava JSON e resumo em `.local/latency/<data>/`.
- `build`: valida TypeScript e produz a aplicação web em `dist/`.

Validação deste marco: **72 testes, 4 fluxos E2E e 48 critérios em 16 ensaios**, além de instalação e fluxo principal no Galaxy S25 Ultra. O quarto E2E abre dois navegadores contra o modo hospedado, comprova áreas diferentes e verifica que o comando de uma sessão não altera a outra. Os critérios dos cenários não representam toda a matriz do TCC. A avaliação com produtores e a ativação das contas de hospedagem continuam pendentes.

## Dados locais

O estado ao vivo fica em `.local/state.json`, ignorado pelo Git. A gravação usa arquivo temporário, troca atômica e novas tentativas para bloqueios transitórios no Windows. Se a gravação falhar, a API reverte a alteração em memória e devolve erro.

Para começar uma sessão nova, encerre a demonstração e execute:

```sh
npm run demo:new-session
npm run demo:start
```

A sessão anterior é preservada em `.local/archive/`. O laboratório sempre começa do zero e normalmente dispensa essa operação.

Limites desta implementação: últimas 2.000 leituras e 1.000 eventos na sessão ao vivo. Depois de 500 comandos, novos inícios são bloqueados; a parada continua permitida. Exporte e arquive a sessão. Esses limites não afetam as séries completas dos experimentos de 90 s. O modelo usa dados arbitrários para demonstração, não calibração de solo.

## Arquitetura

```text
Interface Ionic React / Capacitor
               │ HTTP /api/v1
               ▼
API local ── Controlador ── persistência JSON
    ▲             ▲
    │ HTTP        └── experimentos isolados com relógio virtual
    │ /device/v1
Dispositivos simulados (processo Node independente)
```

| Diretório                  | Responsabilidade                                   |
| -------------------------- | -------------------------------------------------- |
| `shared/`                  | Contratos validados e decisões de controle         |
| `server/`                  | Adaptador HTTP local e persistência                |
| `simulator/`               | Modelo do dispositivo e processo de comunicação    |
| `experiments/`             | Estímulos, relógio virtual, métricas e critérios   |
| `src/features/irrigation/` | Monitoramento, comandos, áreas, regras e histórico |
| `src/features/laboratory/` | Maquete e visualização do experimento              |
| `tests/`                   | Testes executáveis                                 |

O adaptador local foi escolhido para validar o ciclo completo antes de migrar dados ou depender de credenciais e cobrança em nuvem. O plano continua prevendo Firebase Auth e um repositório persistente por usuário atrás da API. Isso não está implementado nesta entrega. O contrato legível está em [CONTRATO.md](CONTRATO.md) e a descrição OpenAPI 3.1 é servida em `GET /api/v1/openapi.json`.

O armazenamento local valida o estado completo antes de carregar ou gravar, mantém `state.json.bak` e preserva um arquivo inválido antes de restaurar a última cópia utilizável.

`clients/openapi-device.ts` é uma segunda implementação de dispositivo. Ela não importa o controlador nem `SimulatedDevice`: descobre as rotas pelos `operationId` do OpenAPI, envia telemetria com `source: "device"`, consulta comandos, confirma a execução e mantém watchdog e volume próprios. Para substituir o simulador padrão nessa demonstração:

```sh
npm run demo:start:reference
```

Ao abrir o aplicativo, use a conta sintética `produtor@demo.local` e a senha `irrigacao`. Ela cria uma sessão local de 30 minutos e só recebe as áreas vinculadas a `demo-producer`. As credenciais podem ser substituídas pelas variáveis `DEMO_USER_EMAIL` e `DEMO_USER_PASSWORD`; esse acesso não consulta o Firebase legacy.

Em **Áreas**, o produtor pode cadastrar e editar a identificação de um cultivo. O cadastro gera vínculos únicos para dispositivo, sensor e válvula; o runner detecta a nova área em até 5 s e começa a enviar leituras simuladas. Os identificadores ficam visíveis no cartão como evidência do vínculo, mas não exigem configuração técnica do produtor.

## Android e publicação

```sh
npm run build
npm run android:sync
```

Para gerar um APK de depuração ligado à API do computador na mesma rede:

```powershell
$env:IRRINT_API_URL = "http://192.168.1.20:8787"
npm run android:debug:lan
```

Em outro terminal, inicie o serviço opt-in de rede local com `npm run demo:start:lan`. O modo padrão continua limitado ao loopback. A API LAN aceita apenas hosts privados e origens locais/Capacitor; o manifesto permite HTTP sem TLS somente no build `debug`. Consulte [VALIDACAO-MOBILE-OPENAPI.md](VALIDACAO-MOBILE-OPENAPI.md).

Com Java 21, SDK Android 36 e `ANDROID_HOME` configurado, execute em `android/`:

```powershell
.\gradlew.bat assembleDebug
```

O checkout oficial permanece no diretório `IRRIGAÇÃO AUTÔNOMA`; por isso, `android/gradle.properties` registra a exceção de caminho necessária no Windows. O APK fica em `android/app/build/outputs/apk/debug/app-debug.apk`.

O APK atual foi instalado e conectado à API de bancada em um Galaxy S25 Ultra com Android 16. Login, acionamento/parada do Canteiro sul, Áreas, Ajustes, Histórico e laboratório WebGL 2.0 foram exercitados; o responsável considerou a apresentação e a fluidez adequadas. Voltar, rotação forçada, reconexão, escala de fonte e métricas de FPS/memória permanecem como regressão instrumentada de distribuição. Consulte [VALIDACAO-ANDROID-S25-ULTRA.md](VALIDACAO-ANDROID-S25-ULTRA.md).

Para preparar o modo offline da defesa, execute `npm run contingency:build` e depois `npm run contingency:start`. O APK gerado permite informar o endereço LAN mostrado pelo inicializador, sem nova compilação. Consulte [PUBLICACAO-E-CONTINGENCIA.md](PUBLICACAO-E-CONTINGENCIA.md).

`npm run start:hosted` inicia a API pública e o cliente de dispositivo OpenAPI sob um único supervisor. O `Dockerfile` e o `render.yaml` fornecem a implantação de referência; `npm run test:e2e:hosted` valida duas sessões simultâneas.

Os resultados desta etapa estão em [VALIDACAO-DISTRIBUICAO.md](VALIDACAO-DISTRIBUICAO.md).

Esta versão não deve substituir o site Vercel enquanto a API de demonstração publicada não estiver pronta. `VITE_API_BASE_URL` é o ponto de configuração do cliente. O corte controlado está documentado em [PUBLICACAO-E-CONTINGENCIA.md](PUBLICACAO-E-CONTINGENCIA.md); o bloqueio atual evita publicar somente o frontend.

## Limites acadêmicos

Umidade é um índice normalizado. O volume exibido é estimado pela vazão nominal multiplicada pelo tempo aberto; não é medição física nem economia obtida. As manchas e o corte do solo são ilustrações do índice, sem cálculo de absorção, pressão ou infiltração. Os experimentos validam comportamento de software sob estímulos definidos. Não demonstram desempenho agronômico, interoperabilidade com qualquer hardware ou funcionamento em campo.

`RELATORIO.md`, `WIREFRAMES.md` e o DOCX de Firebase são registros históricos da versão anterior, preservados como referência. O código anterior permanece no histórico Git, a partir de `bf847657a050383738c9914a63db4917e4c21b8d`.

Base técnica: [Ionic React](https://ionicframework.com/docs/react), [Capacitor](https://capacitorjs.com/docs), [Three.js](https://threejs.org/docs/).
