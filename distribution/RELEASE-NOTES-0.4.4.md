# Irrint 0.4.4 — laboratório 3D redesenhado

Esta versão leva ao APK o novo visual do laboratório 3D, já publicado na versão web. A maquete passou a usar sombreamento cartoon com contorno, componentes de gotejamento mais detalhados e um cenário inspirado no lavrado de Roraima. Contrato HTTP, API, simulação e cenários de teste não mudaram.

## O que mudou

- reservatório, bomba, válvula solenoide, gotejador, sensor e microcontrolador redesenhados;
- linhas de gotejamento em estacas, com tampão no fim, e tronco principal em PVC;
- cultivos ilustrativos de Roraima: cheiro-verde, pimenta-de-cheiro e melancia na área N; bananeira, açaí e cupuaçu na área S;
- caimbés, buritis, arbustos, mata ciliar e tepui no horizonte, com folhagem texturizada;
- modo leve automático em aparelhos lentos, que desliga contornos, sombras e cenário distante sem alterar dados ou indicadores.

As plantas e o cenário são ilustrativos. O simulador não modela espécie, crescimento, absorção nem produtividade.

## Como atualizar e testar

1. Instale `Irrint-0.4.4-publico.apk`; ele atualiza a versão 0.4.3 porque preserva o pacote e a assinatura.
2. Entre com `produtor@demo.local` e senha `irrigacao`.
3. Abra **Histórico → laboratório** e execute um teste.

## Validação

- pacote `br.com.irrint.app`, `versionCode 8` e `versionName 0.4.4`;
- 74 testes Vitest, build web e quatro fluxos E2E do laboratório aprovados;
- assinatura, SHA-256 e instalação por atualização no Galaxy S25 Ultra: pendentes até o build assinado.

O APK de contingência local permanece separado e não é anexado à release pública.
