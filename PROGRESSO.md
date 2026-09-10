# Execução do plano · atualizado em 10 de setembro de 2026

Marco `v0.2.0` na linha atual `main`: **demonstração local funcional com UI mobile, API, dispositivos separados, testes e laboratório 3D**. Desenvolvido em `refactor/mobile-simulation`. A versão anterior, commit `bf847657a050383738c9914a63db4917e4c21b8d`, permanece em `legacy` e `v0.1.0-legacy`; veja [VERSOES.md](VERSOES.md).

## Etapas e situação

| Etapa do plano | Entrega atual | Trabalho restante |
| --- | --- | --- |
| E0 — Base e compatibilidade | Baseline compilado; React 18, Ionic React 9.0.3, Router 6.30.6 e Capacitor 8; compilação Android validada | Instalação e ciclo completo em aparelho |
| E1 — Contrato | Schemas Zod 1.0, IDs string, unidades, estados, sequência, prazos e idempotência; CONTRATO.md | OpenAPI e contrato de autenticação/propriedade |
| E2 — API e simulador | API HTTP local, persistência em arquivo, controle fora da UI e processo de dois dispositivos | Adaptador de nuvem, usuários, credenciais por dispositivo, migração e recuperação completa |
| E3 — UI mobile | Início, Áreas, Histórico, Ajustes e laboratório, estados de contato e confirmação | CRUD de áreas/dispositivos, fluxos de conta, acessibilidade formal e testes com usuários |
| E4 — Testes e evidências | 35 testes, 3 cenários reproduzíveis, métricas de água, replay e exportação JSON/CSV | Completar matriz do TCC; testes de armazenamento, autenticação, migração e E2E automatizado |
| E5 — Visualização 3D | Modelos detalhados, etiquetas, inspeção de objetos, corte do solo, gotejamento e consumo nominal | Orçamento de desempenho medido em celular, avaliação com usuários e ajustes decorrentes |
| E6 — Android e publicação | APK de depuração compilado e bundle web verificado em preview local | Conexão do APK à API, servidor persistente, preview externo e publicação na Vercel |
| E7 — Avaliação e TCC | Evidência técnica reproduzível e roteiro de apresentação | Aplicação do TAM, análise dos resultados e revisão do texto acadêmico |

O código atual é publicado no GitHub. A implantação pública permanece pendente: a etapa de ignorar build da Vercel impede que o push substitua o site por um frontend sem API hospedada. O código Firebase antigo foi removido da aplicação atual e pode ser consultado na versão legacy. Isso não exclui contas, dados ou funções já existentes no Firebase.

## Verificações realizadas

- Build original antes da refatoração: passou.
- Build da nova versão: TypeScript estrito e Vite passaram.
- `npm run test:report`: **35/35 testes**, distribuídos em controlador/dispositivo (16), API HTTP (8), experimentos (4) e contabilização de água (7).
- `npm run demo:evidence`: **9/9 critérios** nos três cenários, seed 2026. A evidência atual, com volumes e modelo v2, está em `.local/reports/2026-09-10T13-20-20.388Z/`. A execução anterior em `.local/reports/2026-09-10T02-44-16.705Z/` corresponde ao modelo v1; os horários estão em UTC.
- Navegador: início e parada manuais, navegação das abas, gravação de modo automático, carregamento 3D, execução dos três cenários, replay por teclado e acionamento da exportação CSV.
- Larguras de 390 e 360 px verificadas; em 360 px, a largura do conteúdo não ultrapassou a disponível. A maquete também foi inspecionada em 1280 px.
- No trecho sem comunicação do cenário correspondente, a interface apresentou “Sem confirmação atual” e “Último estado conhecido”.
- Preview do bundle de produção em `127.0.0.1:4173`: navegação, 3D e execução de cenário funcionaram; nenhum erro no console consultado.
- `cap sync android` e `assembleDebug` passaram. SDK Android 36 e Java 21. Não foi instalado em aparelho físico.

A mensagem “simulated disk failure” no teste CT19 é uma falha injetada intencionalmente: o teste verifica HTTP 500 e reversão integral da alteração em memória. Não indica falha da suíte.

## Resultados dos cenários

| Cenário de 90 s, seed 2026 | Critérios atendidos | Comandos confirmados | Válvula norte aberta |
| --- | ---: | ---: | ---: |
| Solo seco e recuperação | 3/3 | 3/3 | 21 s |
| Perda de comunicação | 3/3 | 1/1 | 12 s |
| Comando repetido | 3/3 | 1/1 | 12 s |

No cenário automático há uma parada confirmada e um novo início no final da janela; os 90 s não representam uma sessão encerrada com todas as válvulas desligadas. Os demais cenários verificam explicitamente o encerramento pelo prazo. A duração é medida no relógio virtual, com resolução de 1 s.

No modelo `linear-educational-v2`, a contagem foi corrigida para somar os intervalos entre amostras, sem acrescentar um segundo futuro no último instante. Por isso, o cenário automático passa de 22 para 21 s, com volume nominal de 0,210 L. Os dois outros cenários aplicam 0,120 L cada. A evidência antiga com 22 s permanece como registro da versão anterior.

## Refinamento do laboratório · 10 de setembro

- Duas placas inspiradas no ESP32 DevKitC com pinos, módulo RF, antena, USB, botões e relés; sondas capacitivas e válvulas solenoides detalhadas. Componentes ilustrativos preservam a arquitetura desacoplada e explicam o que está implementado e o que exigiria integração física.
- Etiquetas com linhas de referência, alternância de nomes, destaque de peças, lista acessível, inspeção 3D com rotação, controle de movimento e fechamento por Escape com retorno do foco.
- Corte do solo, raízes, manchas de umidade, gotas descendentes, anéis de aplicação e atalho para aproximar a área.
- Volume calculado pelo relógio do dispositivo, independente de FPS/replay, preservado na última telemetria persistida. Exibição de mL por planta, litros por área e total; exportações distinguem estado interno e último recebido durante falhas.
- Reuso de geometrias por material e instâncias para elementos repetidos. CPU/GPU e bateria ainda não medidos em aparelho físico.
- Fichas e controles inspecionados no navegador em 1280 e 390 px. No modal a 390 px, a largura de rolagem horizontal foi igual à largura disponível. A compilação Android citada acima pertence ao marco anterior; este refinamento foi validado como aplicação web, sem novo APK.
- Replay: abrir o inspetor pausa a reprodução; no cenário sem contato, os cartões mostram 0,030 L aos 20 s e 0,120 L após reconexão aos 30 s. Exportação CSV baixada pelo navegador e conferida em disco, com 180 linhas de dados e colunas separadas para volume interno e recebido. Nenhum erro de console no trecho inspecionado.

Roteiro, parâmetros e referências: [DEMONSTRACAO-3D.md](DEMONSTRACAO-3D.md).

## Controle do canteiro sul no laboratório

O laboratório agora permite selecionar N ou S e iniciar/parar a área ao vivo, escolhendo a duração. Os controles não enviam comandos durante replay; a interface explica que os três cenários acionam apenas N e oferece retorno ao vivo. A animação pode ser habilitada em **Animar água** quando o aparelho usa movimento reduzido.

O acionamento de S foi verificado no navegador: confirmação, aumento de umidade e volume, seguido de parada. Um teste HTTP adicional valida abertura, volume acumulado, fechamento e persistência do sul com o norte permanecendo fechado e sem consumo.

## Decisões e limitações desta entrega

1. **Adaptador local primeiro.** A API usa arquivo JSON para permitir execução e testes sem credenciais ou cobrança. Firebase Auth e persistência por usuário continuam no plano; não foram substituídos como decisão definitiva.
2. **Duas áreas fixas.** A relação área/sensor/válvula já é explícita, mas cadastro e edição dessa topologia ainda não existem.
3. **Experimento e teste HTTP são distintos.** O laboratório executa o domínio com relógio virtual; os testes HTTP validam o adaptador. O modelo visual não é prova de hardware.
4. **Sem publicação nesta etapa.** O backend local não possui autenticação de usuário nem regras de produção. Publicar somente `dist/` deixaria a interface sem uma API utilizável.
5. **Desempenho mobile ainda não medido em aparelho.** O build mantém aviso de chunks grandes, principalmente Ionic e Three.js. O 3D carrega sob demanda, limita resolução e taxa de desenho, e pausa fora da tela; isso não substitui medição real de FPS, memória e bateria.
6. **Persistência em pasta sincronizada.** Foi observado bloqueio transitório de rename no OneDrive e adicionada repetição limitada com rollback. Para uso prolongado, a etapa seguinte precisa de armazenamento transacional e testes de recuperação.
7. **Dados ao vivo limitados.** A exportação contém a janela retida de leituras/eventos, não todo o histórico de uma sessão longa. Experimentos de 90 s exportam a série completa.

## Próxima sequência de implementação

1. Definir OpenAPI e separar o armazenamento por interfaces; introduzir validação integral do estado persistido e testes de recuperação/reinício.
2. Implementar Firebase Auth e repositório por usuário inicialmente em emuladores. Testar isolamento entre contas, credenciais de dispositivos e acesso negado. Criar migração versionada com relatório e backup antes de usar dados existentes.
3. Implementar CRUD de áreas e vínculos de sensores/válvulas. Validar a topologia no backend; manter o aplicativo consumindo o mesmo contrato.
4. Completar os cenários pendentes da matriz, automatizar os fluxos UI e medir latências com HTTP real separadamente do relógio virtual.
5. Configurar uma API acessível para o APK, testar em aparelho Android e medir o 3D. Otimizar materiais/instâncias, testar perda de WebGL, acessibilidade, retorno do segundo plano e reconexão.
6. Preparar hospedagem do simulador persistente, um preview web ligado à API e a migração controlada do site Vercel. Só então substituir a experiência publicada.
7. Aplicar TAM e documentar resultados observados no TCC, delimitando a evidência à simulação e ao protótipo.

## Reproduzir e apresentar

Veja [README.md](README.md) para os comandos, roteiro de três minutos, exportações e preparação de nova sessão. Os contratos implementados estão em [CONTRATO.md](CONTRATO.md).
