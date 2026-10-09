# Login com Google e sincronização (Firebase)

Com o login, a **biblioteca** acompanha a pessoa em qualquer aparelho: músicas curtidas, tocadas recentemente, ajustes de letra e a lista de **Minhas músicas** (só os nomes: os arquivos de áudio continuam em cada aparelho). O login usa o Firebase Authentication (Google) e os dados ficam no Firestore, no plano gratuito.

Enquanto o Firebase não estiver configurado, o botão "Entrar com Google" não aparece e o app funciona só com os dados do aparelho.

## O que o dono do projeto precisa fazer (uma vez)

São passos com a sua conta Google; nenhum deles precisa de cartão de crédito. Não cole chaves nem o arquivo `google-services.json` em conversas, issues ou no código: eles vão nos segredos do GitHub.

### 1. Criar o projeto

1. Acesse https://console.firebase.google.com → **Adicionar projeto** → nome `upbeats-karaoke` → pode desligar o Google Analytics.

### 2. Ligar o login com Google

1. **Build → Authentication → Começar → Sign-in method → Google → Ativar**. Escolha o e-mail de suporte e salve.
2. Em **Authentication → Settings → Domínios autorizados**, adicione `renanfrontend.github.io` (o `localhost` já vem na lista).

### 3. Criar o banco e aplicar as regras

1. **Build → Firestore Database → Criar banco de dados** → local `southamerica-east1` (São Paulo) → **modo de produção**.
2. Na aba **Regras**, apague o conteúdo, cole o arquivo [`firestore.rules`](../firestore.rules) deste repositório e clique em **Publicar**.

### 4. App Web (site e base do app)

1. **Configurações do projeto (engrenagem) → Seus apps → `</>` Web** → apelido `upbeats-web` → Registrar.
2. Copie os valores de `firebaseConfig` e crie estes **segredos do repositório** no GitHub (**Settings → Secrets and variables → Actions → New repository secret**):

| Segredo | Valor em `firebaseConfig` |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

Para testar no computador, coloque os mesmos valores num arquivo `.env.local` (modelo em [`.env.example`](../.env.example)); ele não vai para o Git.

### 5. App Android

1. **Seus apps → Adicionar app → Android** → nome do pacote `br.com.renanaugusto.upbeats`.
2. Em **Certificados de assinatura**, adicione as duas impressões digitais da chave do app (a mesma em todos os APKs gerados pela nuvem):

```text
SHA-1:   1D:19:E3:F0:A2:F9:9A:30:23:17:83:F8:50:FC:23:60:98:E2:4D:48
SHA-256: A0:94:8D:50:4B:27:05:AE:14:D4:D7:B3:77:D9:46:34:04:09:C5:B8:DD:CE:37:51:C3:5D:91:57:A4:8C:05:F2
```

3. Baixe o `google-services.json`, abra-o num editor de texto, copie **todo** o conteúdo e crie o segredo `GOOGLE_SERVICES_JSON` com ele.

### 6. Publicar

Depois dos segredos, faça um novo deploy do site (**Actions → Deploy to GitHub Pages → Run workflow**) e gere um APK novo (**Actions → Android APK → Run workflow**). O botão **Entrar com Google** aparece no menu.

## Como funciona

- **Site:** login por janela do Google (ou redirecionamento, se o navegador bloquear a janela).
- **Android:** o Google não permite login dentro da WebView, então o app usa o login nativo (`@capacitor-firebase/authentication`) e repassa o token para o Firebase.
- **Sincronização** (`src/services/auth.ts`): ao entrar, junta a biblioteca do aparelho com a da nuvem e salva o resultado; depois, cada mudança é enviada em até 2 segundos, e mudanças de outros aparelhos chegam sozinhas. Em conflitos vale o registro mais recente; curtidas e músicas removidas também são removidas nos outros aparelhos.
- **Dados guardados:** `users/<uid>` com `liked`, `recent` (até 30), `offsets`, `songs` (nomes de Minhas músicas) e marcações de remoção. Nenhum áudio vai para a nuvem.
- **Ao sair**, os dados continuam no aparelho.
