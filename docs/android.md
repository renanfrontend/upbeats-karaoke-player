# App Android

O app é o mesmo karaokê empacotado com o [Capacitor](https://capacitorjs.com): o site roda dentro de uma WebView, com ícone, abertura e permissão de microfone próprios. Letra sincronizada, remoção de voz, microfone e **Minhas músicas** funcionam como no site, e as músicas salvas ficam guardadas no aparelho.

- Id do app: `br.com.renanaugusto.upbeats` · Nome: **UP! BEATS** · Android 7.0 (API 24) ou superior.

## Instalar no celular (APK de depuração)

1. No GitHub: **Actions → Android APK → Run workflow** (ou abra a execução mais recente).
2. Baixe o arquivo `upbeats-karaoke-debug-apk` em **Artifacts**, descompacte e abra o `app-debug.apk` no celular.
3. Na primeira vez, o Android pede para permitir a instalação de apps de fontes desconhecidas para o navegador ou o gerenciador de arquivos que você usou.
4. Ao ligar o microfone dentro do app, o Android pergunta se permite o acesso.

O APK de depuração serve para uso próprio e testes. Ele **não** pode ser enviado para a Play Store.

## Gerar uma versão nova

O fluxo `.github/workflows/android.yml` faz tudo na nuvem (sem Android Studio): instala as dependências, gera o site para o app, sincroniza com o projeto Android e compila o APK. Ele roda sozinho em PRs que mexem em `android/` e pode ser disparado à mão.

No computador, com [Android Studio](https://developer.android.com/studio) instalado:

```bash
npm ci
npm run build:app   # build do site na raiz + sincronização com android/
npm run app:open    # abre o projeto no Android Studio (Run ▶ para instalar no aparelho)
```

A cada mudança no site, rode `npm run build:app` de novo antes de compilar o app. O ícone e a abertura saem das imagens de `assets/` (`npx capacitor-assets generate --android`).

## Publicar na Play Store (passos que só o dono pode fazer)

1. Criar uma conta de desenvolvedor no Google Play Console (taxa única).
2. Criar uma chave de assinatura (keystore) e guardá-la com segurança: sem ela não há como publicar atualizações.
3. Gerar um pacote assinado (`.aab`) pelo Android Studio (**Build → Generate Signed Bundle**) ou configurar a assinatura no fluxo com segredos do repositório.
4. Preencher a ficha da loja: descrição, capturas de tela, classificação indicativa e política de privacidade.

Pontos de atenção para a loja:
- O app usa o microfone, então a ficha deve explicar o motivo (cantar com a própria voz) e a política de privacidade deve dizer que o áudio **não** é gravado nem enviado.
- Músicas, capas e letras de terceiros (iTunes e LRCLIB) só aparecem como demonstração; para publicar na loja, avalie com cuidado os termos dessas fontes.

## Limites conhecidos

- O áudio pode parar com a tela bloqueada ou o app em segundo plano, porque roda numa WebView.
- Os testes foram feitos no navegador e na geração do APK; ainda falta validar em um aparelho Android de verdade.
