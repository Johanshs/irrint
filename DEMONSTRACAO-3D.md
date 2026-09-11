# Laboratório 3D — guia de apresentação e evidências

Entrega v0.3.0 · 10/09/2026. O laboratório demonstra o **controle de irrigação por software com contrato independente do hardware**. Não exige equipamento físico nem usa IA. A maquete observa uma execução; não toma decisões e não calcula água pelo número de gotas desenhadas.

## Fluxo único

1. Abra **Histórico → laboratório**.
2. Em **Sistema**, escolha **Horta norte (N)** ou **Canteiro sul (S)**.
3. Em **Teste**, escolha o cenário e pressione **Executar teste**.
4. Acompanhe a maquete; pause, mova o cursor de tempo ou altere a velocidade para 1×, 5× ou 10×.
5. Use **Entender o teste** para comparar aplicativo e simulador, ler os gráficos e tocar nos acontecimentos da linha do tempo.
6. Em **Resultados**, confira os critérios calculados, as medidas finais e exporte o ensaio.

Há um único acionamento de teste. Os antigos botões de irrigar/parar ao vivo foram retirados do laboratório; o controle operacional continua em **Início/Áreas**. Todos os sete cenários funcionam no sistema selecionado. O outro permanece como controle de isolamento, sem comandos nem consumo.

A tela inicial mostra apenas uma maquete preparada. Não apresenta a sessão ao vivo como se fosse um experimento. Mudar sistema, teste ou seed prepara um novo ensaio e limpa o replay exibido. Os últimos sete resultados permanecem na comparação **durante esta visita**, sem promessa de armazenamento permanente.

## Maquete sem excesso de controles

Os nomes começam ocultos. Em **Visualização e componentes** ficam:
- Mostrar/ocultar nomes, animar/pausar efeitos e corte do solo;
- recentrar e aproximar o sistema selecionado;
- lista de peças acessível por toque e teclado.

Arraste a maquete para girar e use pinça/roda para aproximar. Hover destaca a peça; clique ou toque abre seu modelo 3D e a descrição da integração. Inspecionar uma peça pausa o replay e não troca o sistema do teste. Escape fecha o modal e devolve o foco.

O sistema N fica ao fundo e S à frente, na posição inicial. No celular, etiquetas mostram os componentes comuns e os do sistema selecionado. Se o aparelho prefere movimento reduzido, os efeitos começam pausados: habilite **Animar água** para apresentar o gotejamento.

O corte revela raízes e regiões ilustrativas de umidade. Cor do solo, gotas e fluxo acompanham a informação recebida. Sem confirmação, a cena não inventa irrigação. Quando WebGL não está disponível, as descrições, indicadores, gráficos, cronologia e resultados continuam utilizáveis; a avaliação formal dessa contingência em aparelhos está pendente.

## Sete testes, dois sistemas

Todos duram 90 s, em passos virtuais de 1 s. Os resultados abaixo foram executados com seed 2026 em N e em S, com os mesmos valores.

| Teste | Intervenção e comportamento observado | Tempo aberto | Volume nominal | Comandos confirmados |
| --- | --- | ---: | ---: | ---: |
| Solo seco e recuperação | Abre em 1 s, fecha em 19 s e inicia novo ciclo em 87 s, depois de o solo voltar a secar | 21 s | 0,210 L | 3/3 |
| Parada manual prioritária | Interrompe o automático em 4 s, ainda abaixo de 35%; permanece suspenso | 3 s | 0,030 L | 2/2 |
| Perda de comunicação | Contato interrompido em 5 s, fechamento local em 13 s e reconexão em 30 s | 12 s | 0,120 L | 1/1 |
| Confirmação perdida | A abertura chega, mas o ACK e as leituras seguintes se perdem; a API mantém incerteza e o comando expira | 12 s | 0,120 L | 0/1 |
| Comando não entregue | Pedido expira em 9 s; tentativa tardia de entrega em 12 s é recusada pelo dispositivo | 0 s | 0 L | 0/1 |
| Comando repetido | Quatro solicitações com a mesma chave produzem uma aplicação, sem estender duração | 12 s | 0,120 L | 1/1 |
| Leituras inválidas e antigas | Rejeita 130%, -10%, unidade errada, valor ausente e sequência repetida entre 5–9 s; recebe leitura válida em 10 s | 0 s | 0 L | 0/0 |

**Zero consumo ou zero confirmações pode significar teste atendido.** Cada cenário possui três critérios calculados a partir de leituras, comandos, eventos e estado interno. O indicador não é um sucesso fixo por nome do cenário. São **42 critérios em 14 ensaios**, além da suíte de testes automatizados.

A janela automática termina com a válvula do modelo aberta, no segundo ciclo. Os 21 s somam somente os intervalos dentro dos 90 s: 18 s no primeiro ciclo e 3 s no segundo. A execução isolada termina ali; não continua irrigando a sessão ao vivo.

## Como explicar uma falha em dois minutos

Escolha **S → Perda de comunicação → Executar teste**. Pause e vá a **20 s**. Em **Entender o teste**:
- aplicativo: última válvula recebida aberta, leitura com 16 s de idade e 0,030 L recebidos; estado atual sem confirmação;
- observação interna: válvula fechada, vazão zero e 0,120 L acumulados;
- gráfico: curva recebida interrompida quando a leitura fica desatualizada; estado interno continua registrado.

Toque no acontecimento **Contato restabelecido · 30 s**: a leitura volta a chegar, o volume recebido passa a 0,120 L e o automático fica suspenso após a parada local.

Depois execute **Confirmação perdida**: aos 5 s, a válvula interna está aberta, mas o aplicativo ainda aguarda confirmação. Aos 9 s, o comando expira. Mesmo com reconexão, ele não ganha um ACK retroativo. Essa distinção demonstra por que enviar um comando não comprova sua aplicação.

## Três maneiras de visualizar

- **Maquete 3D:** estado confirmado ao operador, leitura de solo, volume recebido e estimativa por planta no instante do replay. Etiquetas e inspeção são opcionais.
- **Entender o teste:** painéis lado a lado (empilhados no celular), curva de umidade, curva de água e cronologia com origem de cada acontecimento. O cursor acompanha os gráficos completos; tocar na cronologia pausa naquele instante.
- **Resultados:** ensaio completo, tempo aberto, litros nominais, mL por planta, confirmações e critérios com evidência. Comparação de até sete execuções da visita.

A cronologia agrupa acontecimentos do mesmo segundo por etapa de apresentação. Ela não mede ordem ou latência de subsegundos. O comando possui ID para correlação no JSON.

## Medir, exportar e apresentar

Em **Resultados**:
- **Relatório para impressão:** HTML independente com parâmetros, métricas, critérios, cronologia e limites. Abra no navegador e use Imprimir para salvar em PDF.
- **Dados CSV:** 180 linhas, uma por sistema/segundo; distingue valores recebidos, idade da leitura, estado de comando, umidade interna, válvula, comunicação, volume e vazão.
- **Execução JSON:** relatório completo, parâmetros normalizados, frames, leituras, eventos, acontecimentos e verificações.

Para gerar a matriz inteira sem navegador:

```sh
npm run test:report
npm run demo:evidence
npm run build
```

O gerador cria 14 JSONs, 14 CSVs, 14 relatórios HTML e **RESUMO.md** em uma pasta nova de `.local/reports/<data>/`. Os JSONs da matriz incluem SHA-256 das fontes do modelo. A suíte de 55 testes gera `.local/test-results.json`; compreende controlador/dispositivo (16), água (7), experimentos/exportação (23) e HTTP (9). O caso de falha de disco emite uma mensagem intencional para verificar rollback.

## Relação com o planejamento

| Requisito / casos da matriz inicial | Evidência desta entrega | Limite |
| --- | --- | --- |
| RF02 — leituras / CT08 | Rejeição de amostras inválidas, idade, sequência e recuperação | Sem calibração física |
| RF03/RF04 — controlar / CT02, CT04, CT10 | Ciclo automático, prioridade da parada e repetição idempotente | Duração e taxas didáticas; a suíte de domínio cobre fronteiras |
| RF06 — falhas / CT05, CT07, CT09 | Perda de rede, ausência de ACK, watchdog e recusa de comando vencido | Não comprova válvula física travada nem segurança hidráulica |
| RF01 — vínculo / CT11 | Isolamento N/S no domínio e por HTTP | Topologia fixa; CRUD ainda pendente |
| RF07 — demonstrar / CT12, CT17 | Mesma seed, escolha N/S, replay sem comandos e fontes de estado distintas | E2E automatizado e avaliação com usuários pendentes |
| RF08 — evidenciar | CSV, JSON, relatório imprimível e comparação de execuções | Comparação apenas durante a visita; sem arquivo de experimentos no servidor |
| RF09 / CT13 | Fora deste marco | Autenticação e isolamento por usuário ainda não implementados |

O plano original e sua matriz continuam sendo referências históricas de escopo, não laudos de execução de todos os casos. Esta entrega **conclui o laboratório demonstrativo local**, não todas as etapas do projeto. Hospedagem de API, contas, persistência em nuvem, dispositivos dinâmicos, Android físico, desempenho, acessibilidade formal, matriz restante e TAM continuam em [PROGRESSO.md](PROGRESSO.md).

## Modelos e limites

Há 18 plantas e 18 emissores por sistema, a 2 L/h cada: **36 L/h**. Litros = vazão × tempo aberto / 3600. A divisão por 18 é uma distribuição nominal uniforme, não água absorvida pela planta.

Umidade é um índice normalizado: +0,85 ponto/s aberto, -0,15 parado, com ruído de até 0,02 ponto por passo. O índice e o volume são modelos didáticos separados. Não calculamos infiltração física, pressão, perdas, esgotamento do tanque, demanda por cultura ou produtividade. Nenhum resultado demonstra economia real de água.

Modelos procedurais em Three.js, com instâncias para elementos repetidos e agrupamento de geometrias estáticas por material. Sem ativos 3D baixados ou chamadas pagas. Desenho limitado e suspenso fora da tela; recursos liberados ao desmontar. A renderização não avança o dispositivo nem contabiliza volume. FPS, memória e bateria em aparelho ainda precisam de medição.

Referências visuais e técnicas consultadas no refinamento anterior:
- [DFRobot — SEN0193](https://wiki.dfrobot.com/sen0193): forma da sonda capacitiva.
- [Espressif — ESP32 DevKitC V4](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32/esp32-devkitc/user_guide.html): placa, pinos, módulo RF, USB e botões.
- [Smart Garden IoT com Wokwi](https://github.com/hkhuang07/smart-garden-iot): separação entre dispositivo simulado e aplicação; não é fonte de física 3D.
- [Three.js — InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html) e [partículas](https://threejs.org/examples/webgl_points_waves.html): repetição de elementos e efeitos visuais.

As placas, sondas, válvulas e bomba são exemplos identificáveis. Outros componentes exigem adaptador/firmware, calibração e validação do contrato; a maquete não promete compatibilidade universal.