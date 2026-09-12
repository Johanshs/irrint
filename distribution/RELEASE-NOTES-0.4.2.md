# Irrint 0.4.2 — endpoint Heroku atualizado

> **Versão substituída:** instale a [versão 0.4.3](https://github.com/Johanshs/irrint/releases/tag/v0.4.3), que adiciona a exportação de arquivos no Android.

Esta versão substitui a 0.4.1 depois que o aplicativo Heroku passou a se chamar `irrint`. O APK usa automaticamente a nova API HTTPS `https://irrint-79e47c1c9fa0.herokuapp.com` e mantém a mesma identidade de assinatura Android.

## Como testar

1. Baixe `Irrint-0.4.2-publico.apk` e permita a instalação de aplicativos da fonte usada no Android.
2. Entre com `produtor@demo.local` e senha `irrigacao`.
3. Acompanhe as áreas, acione e pare a irrigação, consulte o histórico e execute os testes do laboratório 3D.

Cada login cria uma sessão temporária isolada com duas áreas simuladas. O ambiente demonstra o aplicativo, o contrato HTTP e o comportamento dos dispositivos sem afirmar validação com hardware agrícola real.

O APK de contingência local permanece separado e não depende do endereço Heroku.
