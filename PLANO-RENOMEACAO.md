# Plano de renomeação do Irrint

Este inventário deve ser usado sempre que o nome **Irrint** ou algum identificador de infraestrutura precisar mudar. Nome visual, nome de serviço e identidade técnica têm impactos diferentes e não devem ser alterados em bloco sem decidir o alcance.

## Níveis de mudança

| Nível | Exemplos | Impacto |
| --- | --- | --- |
| Marca exibida | Irrint, Irriga Inteligente, logo e textos | Interface, ícones, documentos, relatórios e artefatos |
| Serviços públicos | nome do Heroku, projeto/domínio Vercel e repositório GitHub | URLs, builds, integrações e links externos |
| Identidade Android | `applicationId`, namespace, esquema e certificado | Atualização do app instalado, coexistência e distribuição |

Em uma troca apenas de marca, mantenha `br.com.irrint.app` e a chave Android existentes. O identificador não aparece para o usuário e preservá-lo permite que o novo APK atualize o aplicativo já instalado. Mudar o `applicationId` cria, na prática, outro aplicativo Android.

## Procedimento recomendado

1. Definir o novo nome, grafia curta, nome completo e escopo da mudança.
2. Criar uma lista dos domínios, pacotes e integrações que permanecerão estáveis.
3. Fazer busca global pelo nome e pelos endereços antigos, excluindo dependências e binários.
4. Preparar textos, título HTML, nome Capacitor, rótulo Android, logo, splash, favicon e nomes dos APKs.
5. Se houver mudança de backend, obter primeiro o novo domínio real. Aplicativos Heroku atuais recebem `NOME-IDENTIFICADOR.herokuapp.com`; o identificador não é previsível.
6. Atualizar `.env.production`, gerar o frontend, publicar a Vercel e validar CORS, login, telemetria, comandos e histórico.
7. Incrementar `versionCode` e `versionName`, recompilar o APK público com a mesma chave e verificar pacote, certificado, endpoint e checksum.
8. Publicar nova tag e GitHub Release. Marcar a versão anterior como substituída quando ela contiver um endpoint desativado.
9. Atualizar README, documentos de publicação, validação, versões, plano do TCC e materiais de apresentação.
10. Testar o site, o APK público e a contingência em aparelho físico antes da banca.

## Inventário do projeto

| Item | Local principal | Decisão ao renomear |
| --- | --- | --- |
| Nome e versão npm | `package.json`, `package-lock.json` | Alterar o nome somente se também quiser mudar o identificador técnico do pacote npm |
| Nome Capacitor | `capacitor.config.json` | Atualizar o texto exibido; manter `appId` para conservar a identidade Android |
| Android | `android/app/build.gradle`, manifestos e `res/values/strings.xml` | Atualizar rótulos e versões; manter pacote e chave por padrão |
| Assinatura | `android/irrint-release.jks`, `android/keystore.properties` | Manter e guardar juntos em backup privado |
| API pública | Heroku e `.env.production` | Ler o domínio novo no painel; nunca deduzi-lo pelo nome |
| Frontend | Vercel, `index.html`, `public/` | Atualizar domínio, título, favicon e implantação |
| GitHub | repositório, tags, Releases e links Markdown | Renomear somente com redirecionamentos conferidos |
| Código e relatórios | `src/`, `server/`, `shared/`, `experiments/` | Atualizar textos apresentados e metadados exportados |
| Documentação acadêmica | README e documentos do TCC | Preservar a cronologia: registrar o nome usado em cada versão |
| Contingência | `contingency/` e scripts de build | Manter endpoint LAN configurável e atualizar somente o nome exibido, se desejado |

## Redução de risco

O domínio padrão do Heroku muda imediatamente e o anterior deixa de responder. Para evitar que futuras renomeações obriguem a lançar outro APK, a evolução recomendada é adotar um domínio estável próprio, como `api.exemplo.com`, apontado para o Heroku. Os clientes usam esse domínio e somente o DNS é alterado quando o provedor ou o nome do serviço mudar.

Sem domínio próprio, reserve uma janela curta de manutenção: renomeie o Heroku, copie o domínio gerado, publique o frontend e o APK novos e valide tudo na mesma sequência. Renomear o aplicativo de volta também pode gerar outro identificador; consulte sempre o domínio mostrado no painel.

## Critérios de conclusão

- nenhum bundle atual contém o endpoint desativado;
- `/healthz`, login, isolamento, telemetria e abrir/parar funcionam no domínio novo;
- Vercel e APK público usam o mesmo endpoint HTTPS;
- o APK conserva pacote e certificado quando deve atualizar a instalação existente;
- contingência continua utilizável sem internet externa;
- busca global encontra o nome antigo apenas em registros históricos explicitamente identificados.
