# Validação Android · Galaxy S25 Ultra

Execução em 11 de setembro de 2026. Esta rodada valida o **cliente móvel do protótipo** conectado à API e aos dispositivos simulados na mesma rede. Ela não valida sensores, válvulas ou irrigação agrícola físicos.

## Ambiente observado

| Item             | Evidência                                                                             |
| ---------------- | ------------------------------------------------------------------------------------- |
| Aparelho         | Samsung Galaxy S25 Ultra, modelo `SM-S938B`                                           |
| Sistema          | Android 16, API 36                                                                    |
| Tela configurada | saída física `720 × 1560`; densidade física 300 e substituição ativa 280              |
| WebView          | viewport lógico `411 × 891`, DPR 1,75                                                 |
| Aplicativo       | `br.com.irrint.app`, versão 1.0, APK debug                                            |
| API da bancada   | contrato OpenAPI 1.0.0 em IPv4 privado, com dois clientes de referência independentes |
| APK validado     | SHA-256 `5617BBA91D0E36CED3DE72FB1987B6E9657138DB40FB6DF6CE5C6A796BA04265`            |

A resolução acima é a configuração retornada pelo aparelho durante o teste; não é uma afirmação sobre a resolução máxima comercial do modelo.

## Resultados

| Fluxo                      | Resultado e limite da evidência                                                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Instalação e abertura      | `adb install -r` concluiu com sucesso. A atividade iniciou a frio em 415 ms; esse número mede somente a atividade Android, não o tempo até interação completa.                                                       |
| Login e API                | A conta sintética abriu a sessão e o WebView consultou a API com HTTP 200. O estado permaneceu isolado da versão legacy.                                                                                             |
| Irrigação do sistema sul   | O comando manual de 15 s foi aceito e confirmado pelo cliente de dispositivo; a interface exibiu **Irrigando**. A parada também foi confirmada e retornou a **Irrigação desligada**.                                 |
| Áreas, ajustes e histórico | As páginas abriram sem rolagem horizontal. O ajuste do Canteiro sul foi salvo e o histórico exibiu os comandos confirmados.                                                                                          |
| Laboratório 3D             | WebGL 2.0 ficou disponível, sem acionar a contingência textual. A maquete do sistema sul criou canvas de 561 × 495 pixels e exibiu reservatório, bomba, microcontrolador, válvula, sensor e gotejador identificados. |
| Inspeção do componente     | O modal do Microcontrolador S abriu com canvas próprio, descrição do papel no contrato e rotação habilitada por padrão.                                                                                              |
| Revisão visual             | O responsável pelo projeto revisou diretamente o funcionamento, as animações e a fluidez no aparelho e considerou o desempenho adequado para a demonstração.                                                         |

O teste automatizado no WebView não encontrou erros de console nem requisições com falha durante a execução do laboratório. O build permaneceu com **69/69 testes**, **3/3 fluxos E2E** e **48/48 critérios dos 16 ensaios** aprovados.

## Correção encontrada na bancada

O primeiro APK permitia tráfego HTTP no manifesto debug, mas o WebView ainda bloqueava a API privada como conteúdo misto porque a aplicação local usa `https://localhost`. O build de depuração agora sobrepõe a configuração do Capacitor com `android.allowMixedContent: true` em `android/app/src/debug/assets/capacitor.config.json`.

A permissão fica restrita à variante debug. O manifesto e a configuração principais continuam sem liberar HTTP. Uma versão distribuída deve usar API HTTPS, autenticação persistente e banco apropriado.

## Capturas preservadas

- [Login](evidencias/android-s25-ultra/01-login.png)
- [Irrigação confirmada no sistema sul](evidencias/android-s25-ultra/02-irrigacao-sul.png)
- [Áreas e vínculos](evidencias/android-s25-ultra/03-areas.png)
- [Configuração salva](evidencias/android-s25-ultra/04-configuracao-salva.png)
- [Histórico](evidencias/android-s25-ultra/05-historico.png)

As capturas contêm apenas dados sintéticos. Arquivos transitórios de depuração continuam em `.local/` e não integram o repositório.

## Cobertura encerrada e pendências

Para a demonstração atual do TCC, há evidência de que o aplicativo híbrido instala, autentica, consulta telemetria simulada, controla os dois sistemas, apresenta confirmações e executa a maquete 3D em Android real. Isso sustenta a viabilidade do cliente móvel e do contrato desacoplado.

Esta rodada não gerou uma medição instrumentada confiável de FPS ou memória e não fechou casos físicos isolados para botão Voltar, rotação forçada, mudança da escala de fonte e perda/reconexão controlada. A revisão visual do responsável cobre a apresentação atual; esses itens ficam como regressão de distribuição. Fonte ampliada, larguras móveis, navegação por teclado e contingência sem WebGL seguem cobertas no Chromium pelo CT18.

Também permanecem fora desta evidência: hardware agrícola real, calibração do índice de umidade, pressão, infiltração, economia de água, produção multiusuário e avaliação com produtores.
