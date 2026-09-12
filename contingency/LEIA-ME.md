# Contingência local para a defesa

Este modo mantém o aplicativo operacional quando a internet externa não estiver disponível. Ele usa a API, a persistência JSON e os dispositivos simulados já validados em rede local.

## Preparação antes da apresentação

1. Com internet, execute `npm ci` na raiz do projeto.
2. Gere o APK com `npm run contingency:build`.
3. Instale `contingency/Irrint-contingencia-debug.apk` no aparelho Android.
4. Abra o APK uma vez e confirme que aparece a seção **Conexão local de contingência**.
5. Mantenha uma cópia completa do projeto e do diretório `node_modules` no notebook da defesa.

## Uso no dia

1. Conecte notebook e celular à mesma rede. Um ponto de acesso local também serve; internet externa não é necessária.
2. Clique com o botão direito em `Iniciar-Irrint.ps1` e escolha **Executar com PowerShell**.
3. Mantenha a janela aberta. Ela exibirá o endereço da API, por exemplo `http://192.168.137.1:8787`.
4. No APK, expanda **Conexão local de contingência**, informe esse endereço e entre.
5. Se o celular não estiver disponível, abra `http://127.0.0.1:5173` no navegador do notebook.

Credenciais: `produtor@demo.local` / `irrigacao`.

O APK é de depuração e permite HTTP apenas para a bancada privada. A versão pública deve usar a API hospedada em HTTPS.
