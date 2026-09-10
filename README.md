# irrint · monitoramento e controle de irrigação

Protótipo acadêmico com interface mobile em Ionic React, contrato HTTP, controlador de irrigação e dispositivos simulados executados fora do navegador. O laboratório oferece uma maquete 3D, experimentos reproduzíveis, replay e exportação de evidências.

**Estado desta versão:** demonstração local funcional. Autenticação, persistência em nuvem e integração com o site publicado ainda são etapas seguintes. A versão local não acessa as contas nem os dados Firebase existentes. Consulte [PROGRESSO.md](PROGRESSO.md) para ver a execução do plano.

**Versões:** `main` / `v0.2.0` é a versão atual. A versão anterior está preservada em `legacy` / `v0.1.0-legacy`. Veja [VERSOES.md](VERSOES.md) para consultar o histórico e a separação entre publicação no GitHub e implantação na Vercel.

## Começar

Requisitos: Node.js 22 ou 24 e npm. Desenvolvimento verificado no Windows com Node 24.

```sh
npm ci
npm run demo:start
```

Abra **http://127.0.0.1:5173** no mesmo computador. Um único comando inicia a API na porta 8787, os dois dispositivos simulados e a interface na porta 5173. Use **Ctrl+C** no terminal para encerrar os três processos. Não é necessário login nem configurar Firebase para esta demonstração.

`npm run dev` inicia somente a interface e pressupõe uma API já iniciada. Em três terminais separados, também é possível usar `npm run demo:api`, `npm run demo:device` e `npm run dev`.

## Roteiro de apresentação de 3 minutos

1. **Início:** selecione Horta norte. Inicie e pare a irrigação manual. Observe a solicitação, a confirmação e a mudança da umidade.
2. **Ajustes:** escolha Automático e salve. O controlador inicia abaixo de 35% e solicita parada em 45%. São valores didáticos, configuráveis por área.
3. **Histórico → Abrir laboratório 3D:** execute “Solo seco e recuperação”, seed 2026. Pause o replay, use **Ver corte do solo** e **Aproximar área**. Alterne os nomes e toque em um componente para examinar seu modelo e papel no sistema. Acompanhe o volume da área, os mL por planta e o consumo total. Veja o [roteiro detalhado e as referências](DEMONSTRACAO-3D.md).
4. Execute “Perda de comunicação”. No segundo 19, o operador vê um estado incerto. O gráfico do modelo permite mostrar que o dispositivo já fechou a válvula pelo prazo máximo de 12 s, mesmo sem contato.
5. Execute “Comando repetido”. Quatro solicitações com a mesma chave produzem um comando e não prolongam a irrigação.
6. Exporte **JSON** para preservar o experimento completo ou **CSV** para analisar a série em uma planilha. Abra os detalhes do modelo para explicar os parâmetros e as limitações.

Os experimentos são isolados: não alteram as áreas da demonstração ao vivo. A área norte fica no canteiro ao fundo da maquete; a área sul, à frente na posição inicial. Toque no solo ou nos cartões para selecionar uma área. Os cartões e o gráfico continuam disponíveis quando o aparelho não suporta WebGL.

**Para irrigar o canteiro sul:** no laboratório, use **Controlar ao vivo** se estiver em replay; em **Canteiro na maquete**, selecione **S · Canteiro sul**, escolha a duração e pressione **Irrigar Canteiro sul**. Ative **Animar água** para movimentar as gotas. **Parar Canteiro sul** encerra o acionamento. Os três cenários predefinidos irrigam apenas N para verificar que S permanece independente; selecionar S no replay apenas muda a área observada.

## O que funciona

- Navegação mobile com quatro abas: Início, Áreas, Histórico e Ajustes; laboratório dentro de Histórico.
- Duas áreas independentes, cada uma com um sensor, uma válvula e uma regra.
- Controle manual e automático com histerese, prazo máximo, idempotência e confirmação de execução.
- Estado pendente, expirado, sem comunicação e automático suspenso após parada manual ou encerramento de segurança.
- Processo de simulação separado da interface; fechar a aba não interrompe o controlador nem o dispositivo.
- Maquete em Three.js com reservatório, bomba, tubulações e dois conjuntos de microcontrolador/relé, válvula e sensor capacitivo. Etiquetas, inspeção 3D, corte do solo e gotejamento acompanham os dados; não geram decisões.
- Volume nominal por área, aplicação média por planta e consumo acumulado; registrados no dispositivo e exportados com os cenários.
- Três cenários de 90 s, com relógio virtual, seed, replay, verificações calculadas e gráficos.

IA, recomendações preditivas, clima fixo e SSO com outra aplicação foram removidos desta versão. Não há chamadas pagas nem dependência de serviços externos em execução local.

## Testes e evidências

```sh
npm test
npm run test:report
npm run demo:evidence
npm run build
```

- `npm test`: testes do contrato, controlador, dispositivo, API HTTP e experimentos.
- `test:report`: a mesma suíte e um relatório em `.local/test-results.json`.
- `demo:evidence`: executa os três cenários sem precisar abrir o navegador; cria JSONs, um resumo Markdown e a impressão SHA-256 das fontes do modelo em `.local/reports/<data>/`.
- `build`: valida TypeScript e produz a aplicação web em `dist/`.

Os três critérios por cenário não representam toda a suíte nem toda a matriz de testes do TCC. Testes de usuários, hardware físico, isolamento por conta, dispositivos móveis reais e implantação continuam pendentes.

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

| Diretório | Responsabilidade |
| --- | --- |
| `shared/` | Contratos validados e decisões de controle |
| `server/` | Adaptador HTTP local e persistência |
| `simulator/` | Modelo do dispositivo e processo de comunicação |
| `experiments/` | Estímulos, relógio virtual, métricas e critérios |
| `src/features/irrigation/` | Monitoramento, comandos, áreas, regras e histórico |
| `src/features/laboratory/` | Maquete e visualização do experimento |
| `tests/` | Testes executáveis |

O adaptador local foi escolhido para validar o ciclo completo antes de migrar dados ou depender de credenciais e cobrança em nuvem. O plano continua prevendo Firebase Auth e um repositório persistente por usuário atrás da API. Isso não está implementado nesta entrega. O contrato atual está em [CONTRATO.md](CONTRATO.md).

## Android e publicação

```sh
npm run build
npm run android:sync
```

Com Java 21, SDK Android 36 e `ANDROID_HOME` configurado, execute em `android/`:

```powershell
.\gradlew.bat assembleDebug
```

Se o caminho tiver acentos no Windows, a verificação desta versão passou usando o argumento local `'-Pandroid.overridePathCheck=true'`. Prefira um checkout sem acentos para trabalho Android contínuo. O APK fica em `android/app/build/outputs/apk/debug/app-debug.apk`.

**A compilação Android não equivale a uma demonstração instalada e conectada.** A API atual só atende no computador. O pacote precisa de configuração e validação do transporte para um aparelho, autenticação e um endpoint apropriado antes de distribuição. Não há dispositivo conectado validado nesta entrega.

Esta versão não deve substituir o site Vercel enquanto a API de demonstração publicada não estiver pronta. `VITE_API_BASE_URL` é o ponto de configuração do cliente; só definir a variável não implementa CORS, autenticação nem hospedagem. O backend Node persistente não deve ser tratado como um processo em segundo plano dentro de uma função efêmera Vercel.

## Limites acadêmicos

Umidade é um índice normalizado. O volume exibido é estimado pela vazão nominal multiplicada pelo tempo aberto; não é medição física nem economia obtida. As manchas e o corte do solo são ilustrações do índice, sem cálculo de absorção, pressão ou infiltração. Os experimentos validam comportamento de software sob estímulos definidos. Não demonstram desempenho agronômico, interoperabilidade com qualquer hardware ou funcionamento em campo.

`RELATORIO.md`, `WIREFRAMES.md` e o DOCX de Firebase são registros históricos da versão anterior, preservados como referência. O código anterior permanece no histórico Git, a partir de `bf847657a050383738c9914a63db4917e4c21b8d`.

Base técnica: [Ionic React](https://ionicframework.com/docs/react), [Capacitor](https://capacitorjs.com/docs), [Three.js](https://threejs.org/docs/).
