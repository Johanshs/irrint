# Demonstração 3D · guia de apresentação

Abra **Histórico → Laboratório** na demonstração local. A maquete é uma representação didática da arquitetura atual: duas áreas, dois dispositivos simulados, sensores, válvulas e regras independentes. Reservatório e bomba explicam o abastecimento; não são recursos controlados pelo contrato atual.

## Explorar o campo

1. Use **Mostrar/Ocultar nomes** para alternar etiquetas com linhas apontando para as peças. No celular, as etiquetas apresentam o abastecimento e a área selecionada; toque no outro canteiro ou em seu cartão para mudar a seleção.
2. Passe o mouse sobre uma peça ou etiqueta: ela recebe destaque. Toque/clique para abrir o modelo ampliado, a descrição e o papel possível de diferentes componentes na integração. Todos os gotejadores respondem ao clique.
3. No inspetor, arraste para examinar, aproxime com pinça/roda do mouse e controle a rotação. A preferência do aparelho por movimento reduzido inicia a rotação pausada. Escape ou o botão de fechar retornam ao campo e preservam o foco.
4. **Ver corte do solo** revela raízes e regiões de umidade na face frontal dos canteiros. Cor do solo, manchas superficiais e bulbos acompanham a última leitura recebida.
5. **Aproximar área** enquadra o canteiro selecionado; **Recentrar** recupera a vista geral. Os emissores têm gotas descendentes e anéis no ponto de aplicação. As gotas são ampliadas para ficar visíveis. **Animar água/Pausar efeitos** controla o movimento visual; em aparelhos com movimento reduzido, ele inicia pausado. Um replay pausado também mantém os efeitos congelados.
6. A lista **Explorar componentes** oferece os mesmos objetos por teclado e toque, inclusive quando as etiquetas estão ocultas ou WebGL está indisponível.

## Demonstrar e mensurar

Para acionar **S**, use a demonstração **ao vivo**: selecione **S · Canteiro sul** no campo **Canteiro na maquete**, escolha a duração e pressione **Irrigar Canteiro sul**. Ative **Animar água** se os efeitos estiverem pausados. Para encerrar, use **Parar Canteiro sul**. Os três replays predefinidos mantêm S desligado para testar independência; selecionar S durante replay apenas muda a observação. O botão **Controlar ao vivo** permite sair do replay antes de enviar comandos.

Execute **Solo seco e recuperação**, seed **2026**. Pause perto do segundo 10: explique o sensor, a decisão na API, a confirmação do dispositivo e a válvula liberando água. Abrir uma ficha pausa o replay; use Reproduzir para continuar. Velocidades 1×, 5× e 10× mudam somente a reprodução.

Os cartões acompanham o instante selecionado: índice do solo, aplicação média em mL por planta, volume na área e soma das áreas. Os resultados abaixo mostram a execução completa. São duas janelas de observação diferentes, identificadas na interface.

| Cenário de 90 s | Tempo norte efetivamente aberto | Volume total nominal | Verificações |
| --- | ---: | ---: | ---: |
| Solo seco e recuperação | 21 s | 0,210 L | 3/3 |
| Perda de comunicação | 12 s | 0,120 L | 3/3 |
| Comando repetido | 12 s | 0,120 L | 3/3 |

Parâmetros: **18 plantas e 18 emissores por área**, **2 L/h por emissor**, **36 L/h por área**. Volume = vazão × segundos abertos / 3600. Água por planta = volume da área / 18. A segunda área permanece sem comandos nesses três cenários.

Em **Perda de comunicação**, compare o instante 20 s com 30 s. Sem contato, os cartões preservam a última telemetria: não adivinham o fechamento ou o volume. O dispositivo simulado continua contabilizando até o watchdog fechar. A reconexão atualiza o acumulado. Os JSONs/CSVs distinguem esses valores internos dos recebidos pela API.

Exporte **CSV** para analisar a série e **JSON** para preservar parâmetros, leituras, comandos, eventos, verificações e métricas. `npm run demo:evidence` gera os três relatórios e a impressão SHA-256 das fontes em `.local/reports/`.

## Como os efeitos foram construídos

Modelos procedurais originais em Three.js, sem modelos baixados ou serviços pagos. Geometrias estáticas de uma peça são agrupadas por material. Folhas, gotas, anéis e regiões de umidade usam instâncias. A cena limita resolução e desenho, suspende quando oculta e libera recursos ao desmontar. O campo pausa o desenho durante a inspeção de um objeto. O desempenho em aparelho físico ainda precisa ser medido.

A queda usa uma trajetória acelerada visual, os anéis se expandem e as manchas variam com a leitura normalizada. A renderização não avança o dispositivo nem soma volume. Não há simulação de fluidos, absorção radicular, pressão, perdas, esgotamento do tanque ou calibração agronômica. O modelo de umidade e a estimativa de volume são modelos didáticos separados.

## Referências consultadas

- [DFRobot — SEN0193](https://wiki.dfrobot.com/sen0193): formato alongado, circuito superior e conector de três vias orientaram a ilustração da sonda capacitiva.
- [Espressif — ESP32 DevKitC V4](https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32/esp32-devkitc/user_guide.html): fileiras de pinos, módulo RF, USB e botões orientaram a representação do controlador. A placa é um exemplo visual, não uma integração já implementada.
- [Smart Garden IoT — projeto com Wokwi](https://github.com/hkhuang07/smart-garden-iot): documenta nós ESP32 simulados, umidade e acionamento por relé, com visualização em aplicação. Serviu como referência para separar dispositivo, comunicação e interface; não como fonte de uma simulação 3D de fluidos.
- [Three.js — InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html) e [exemplo de partículas](https://threejs.org/examples/webgl_points_waves.html): referências técnicas para elementos repetidos e animação de partículas. O gotejamento e o corte do solo foram construídos especificamente para o Irrint.

O propósito demonstrado é um software capaz de organizar o controle de irrigação através de um contrato. Outro sensor, microcontrolador ou atuador dependeria de adaptação, calibração e validação; a maquete não comprova compatibilidade universal.
