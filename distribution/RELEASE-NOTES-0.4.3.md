# Irrint 0.4.3 — exportação de arquivos no Android

Esta versão corrige a exportação no APK. Relatórios JSON, CSV e HTML agora são preparados pelo armazenamento nativo e entregues ao seletor do Android, onde podem ser salvos em Arquivos, Drive ou compartilhados com outro aplicativo. No navegador, o download direto continua disponível.

## Como atualizar e testar

1. Instale `Irrint-0.4.3-publico.apk`; ele pode atualizar a versão 0.4.2 porque preserva o pacote e a assinatura.
2. Entre com `produtor@demo.local` e senha `irrigacao`.
3. Abra **Histórico** e toque em **Exportar JSON**.
4. Escolha no painel do Android onde salvar ou compartilhar o arquivo.
5. No laboratório, execute um teste, abra **Resultados** e exporte HTML, CSV ou JSON pelo mesmo fluxo.

## Validação

- pacote `br.com.irrint.app`, `versionCode 7` e `versionName 0.4.3`;
- assinatura APK v2 com o mesmo certificado RSA 4096 das versões anteriores;
- SHA-256 `131b278667d1f0b0fdb0452fb926876ee39921e96dc413486e85e3da21810b85`;
- atualização e exportação JSON confirmadas em Galaxy S25 Ultra com Android 16/API 36;
- 74 testes Vitest e cinco fluxos E2E aprovados.

Cada login cria uma sessão temporária isolada com duas áreas simuladas. O ambiente demonstra o aplicativo, o contrato HTTP e o comportamento dos dispositivos sem afirmar validação com hardware agrícola real.

O APK de contingência local permanece separado e não é anexado à release pública.
