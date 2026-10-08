# UP! BEATS Karaokê

Karaokê que roda direto no navegador: busque uma música, acompanhe a **letra sincronizada**, tire a
**voz original em tempo real** e cante com o **seu microfone**, com eco e retorno de áudio.

**Acesse:** https://renanfrontend.github.io/upbeats-karaoke-player/

![UP! BEATS Karaokê: controles de voz original e microfone](public/og-image.png)

## O que dá para fazer

- **Buscar músicas** e abrir qualquer faixa no modo karaokê (prévias de 30 s da API do iTunes).
- **Cantar com a letra sincronizada** linha a linha (LRCLIB). Se a letra estiver adiantada ou
  atrasada, basta tocar na linha que está sendo cantada para calibrar. O ajuste fica salvo por música.
- **Controlar a voz original**: *Original*, *Guia* (voz baixinha, só para orientar) ou *Karaokê*
  (voz removida), com um controle fino de nível.
- **Cantar com o microfone** ouvindo a própria voz junto com a música, com volume, eco e medidor de
  nível. Há dois modos: **caixas de som** (cancelamento de eco ligado, para evitar microfonia) e
  **fones** (voz mais natural).
- **Cantar com a sua música**: abra um arquivo do seu aparelho para tocar a faixa inteira. Como o
  arquivo é local, o controle de voz sempre funciona.
- Interface em **português, inglês e espanhol**, com músicas curtidas e tocadas recentemente.

## Como a remoção de voz funciona

Todo o áudio passa por **um único grafo da Web Audio API** (`src/audio/karaokeEngine.ts`), então a
música e o microfone são mixados pelo próprio navegador e ficam sincronizados:

```text
<audio> ─► fonte ─┬─► original ─────────────────────────────┐
                  ├─► (E − D) lateral ──┐                    │
                  ├─► passa-baixa 130 Hz ┼─► instrumental ───┤
                  └─► passa-alta 8,5 kHz ┘                   ├─► música ─┐
                                                                         ├─► saída
mic ─► fonte ─► passa-alta 80 Hz ─► compressor ─► ganho ─┬─► seco ─┐     │
                                                         └─► eco ──┴─► mic ┘
```

- A voz principal quase sempre fica **no centro do estéreo** (igual nos dois canais). Subtrair o
  canal direito do esquerdo (E − D) cancela a voz e mantém os instrumentos abertos nas laterais.
- Grave e bumbo também ficam no centro, então eles voltam por filtros em cascata (4ª ordem) que ficam
  fora da faixa da voz, junto com o brilho dos pratos.
- O controle de voz faz um *crossfade* entre a mixagem original e a instrumental, mantendo o volume
  constante. Mudanças usam rampas curtas para não estalar.
- No microfone: corte de graves e plosivas, compressor contra picos e microfonia, e um *delay* com
  realimentação para o eco de "salão de karaokê".

**Limitação conhecida:** a técnica depende de a voz estar no centro da mixagem. Em gravações com voz
estéreo, efeitos largos ou ao vivo, sobra um pouco da voz original. Prévias de streaming de outros
domínios também podem bloquear o processamento de áudio (CORS); para esses casos existe o
"Cantar com minha música".

## Tecnologias

- React 18, TypeScript e Vite
- Web Audio API (remoção de voz, mixagem, análise de espectro e medidor do microfone)
- Tailwind CSS e shadcn/ui
- TanStack Query (cache das buscas e das letras)
- React Router (HashRouter, compatível com GitHub Pages)
- i18next (pt-BR, en, es)
- Deploy automático no GitHub Pages com GitHub Actions

### Dados de terceiros

- [iTunes Search API](https://performance-partners.apple.com/search-api): busca, capas e prévias de 30 s.
- [LRCLIB](https://lrclib.net): letras sincronizadas, API aberta.

Músicas, capas e letras pertencem aos seus respectivos donos e são exibidas só como demonstração.

## Rodando localmente

```bash
npm ci
npm run dev
```

O app abre em `http://localhost:8080/upbeats-karaoke-player/`. O microfone exige `localhost` ou
HTTPS (regra dos navegadores para `getUserMedia`).

```bash
npm run build
```

O build vai para `dist/`. Cada push na `main` publica no GitHub Pages
(`.github/workflows/deploy.yml`).

## Autor

**Renan Augusto**, desenvolvedor frontend sênior · [renanaugusto.com.br](https://www.renanaugusto.com.br) ·
[LinkedIn](https://www.linkedin.com/in/renan-augusto-santos/) · Up Technology Innovations
