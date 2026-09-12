# Identidade de assinatura Android

O comando `npm run android:public` cria, no primeiro uso, os arquivos locais `irrint-release.jks` e `keystore.properties`. Ambos são ignorados pelo Git e devem ser preservados juntos em backup privado. A mesma chave é necessária para publicar atualizações instaláveis sobre o APK público anterior.

O APK de contingência usa a assinatura de depuração e o pacote `br.com.irrint.contingency`, por isso pode permanecer instalado ao lado do aplicativo público `br.com.irrint.app`.
