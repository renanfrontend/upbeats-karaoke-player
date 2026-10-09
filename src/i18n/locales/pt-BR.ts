
export default {
  navigation: {
    home: 'Início',
    search: 'Buscar',
    library: 'Biblioteca',
    karaoke: 'Modo Karaokê',
    songs: 'Músicas',
    playlists: {
      title: 'Playlists',
      liked: 'Músicas Curtidas',
      recent: 'Tocadas Recentemente',
      new: 'Nova Playlist'
    }
  },
  search: {
    placeholder: 'Buscar músicas, artistas ou letras...',
    results: 'Resultados para',
    noResults: 'Nenhum resultado encontrado',
    tryDifferent: 'Tente palavras diferentes ou verifique a ortografia',
    typeToSearch: 'Digite algo para buscar',
    genres: {
      pop: 'Pop',
      rock: 'Rock',
      hiphop: 'Hip Hop',
      electronic: 'Eletrônica'
    }
  },
  home: {
    welcome: 'Bem-vindo ao UP! BEATS Karaokê',
    description: 'Solte a voz: busque milhares de músicas, acompanhe a letra sincronizada em tempo real e tire a voz original para cantar por cima.',
    tryKaraoke: 'Experimente o Modo Karaokê',
    popularArtists: 'Artistas Populares',
    viewAll: 'Ver Todos',
    popularTracks: 'Músicas Populares para Karaokê'
  },
  library: {
    title: 'Sua Biblioteca',
    likedSongs: 'Músicas Curtidas',
    recentlyPlayed: 'Reproduzidas Recentemente',
    yourPlaylists: 'Suas Playlists',
    createPlaylist: 'Crie Sua Primeira Playlist',
    playlistDescription: 'É fácil organizar suas músicas favoritas em playlists',
    createButton: 'Criar Playlist',
    songsCount: '{{count}} músicas',

    like: 'Curtir',

    unlike: 'Descurtir',

    emptyLiked: 'Toque no coração de uma música para ela aparecer aqui.',

    emptyRecent: 'As músicas que você tocar aparecem aqui.',

    localSong: 'Arquivo do aparelho',
    playAll: 'Reproduzir Tudo'
  },
  karaoke: {
    title: 'Modo Karaokê',
    back: 'Voltar',
    playingNow: 'Reproduzindo Agora',
    noLyrics: 'Letras Indisponíveis',
    noLyricsDesc: 'As letras sincronizadas desta música não estão disponíveis no momento.',
    loadingLyrics: 'Carregando letras...',
    previewNote: 'Reproduzindo uma prévia de 30 segundos — toque na linha sendo cantada para calibrar a letra.',
    selectSong: 'Selecione uma música para iniciar o karaokê',
    searchSongs: 'Buscar Músicas',
    suggestedSongs: 'Músicas Sugeridas',
    micEnabled: 'Microfone habilitado',
    micDisabled: 'Microfone desabilitado',
    micPermissionDenied: 'Permissão do microfone negada',
    micOn: 'Mic Ligado',
    micOff: 'Mic Desligado',
    micUnsupported: 'Seu navegador não permite usar o microfone aqui',
    micVolume: 'Sua voz',
    micEcho: 'Eco',
    micEnvSpeakers: 'Caixas de som',
    micEnvHeadphones: 'Fones',
    micEnvSpeakersTip: 'Cancelamento de eco ligado para evitar microfonia nas caixas de som.',
    micEnvHeadphonesTip: 'Com fones, sua voz sai mais natural e sem cancelamento.',
    yourVoice: 'Cantar com o microfone',
    yourVoiceDesc: 'Ouça a sua própria voz junto com a música',
    voiceMix: 'Voz original da música',
    voiceMixDesc: 'Escolha entre manter, abaixar ou remover a voz do cantor original',
    voiceOriginal: 'Original',
    voiceGuide: 'Guia',
    voiceKaraoke: 'Karaokê',
    voiceLevel: 'Nível',
    vocalControlUnavailable: 'Esta faixa não permite processar o áudio — use "Cantar com minha música" para ter o controle de voz.',
    previewRestarted: 'A prévia de 30 s acabou e recomeçou. Para cantar a música inteira, use "Cantar com minha música".',
    musicVolume: 'Volume da música',
    seek: 'Posição da música',
    useMyMusic: 'Adicionar minhas músicas',
    useMyMusicDesc: 'Escolha uma ou várias músicas do seu aparelho (ou arraste os arquivos para cá). Elas ficam salvas neste aparelho para cantar quando quiser, inteiras e com controle de voz.',
    localArtist: 'Sua música',
    localLoaded: 'Música carregada!',
    mySongs: 'Minhas músicas',
    mySongsEmpty: 'Nenhuma música salva ainda. Toque em "Adicionar minhas músicas" e escolha um arquivo de áudio.',
    mySongsHint: 'Dica: nomeie o arquivo como "Artista - Música" para a letra vir sozinha.',
    songsSaved_one: '{{count}} música salva em Minhas músicas',
    songsSaved_other: '{{count}} músicas salvas em Minhas músicas',
    songNotSaved: 'Não foi possível salvar neste aparelho; a música toca agora, mas não ficará na lista.',
    songMissing: 'Não achei o arquivo desta música. Adicione de novo.',
    songRemoved: 'Música removida da lista',
    removeSong: 'Remover da lista',
    dropHere: 'Solte as músicas aqui',
    notAudio: 'Esse arquivo não é de áudio',
    lyricsSync: 'Ajustar letra',
    lyricsEarlier: 'Adiantar letra',
    lyricsLater: 'Atrasar letra',
    lyricsSyncReset: 'Zerar ajuste',
    lyricsSynced: 'Letra sincronizada!',
    tapToSync: 'Dica: toque na linha que está sendo cantada para calibrar a letra'
  },
  auth: {
    signIn: 'Entrar com Google',
    signOut: 'Sair',
    signInError: 'Não foi possível entrar agora. Tente de novo.',
    signOutError: 'Não foi possível sair agora.',
    sync: {
      off: 'Sincronização desligada',
      syncing: 'Sincronizando…',
      synced: 'Sincronizado',
      error: 'Sem conexão com a nuvem'
    }
  },
  common: {
    play: 'Reproduzir',
    pause: 'Pausar',
    stop: 'Parar',
    next: 'Próximo',
    previous: 'Anterior',
    chooseFromSuggested: 'Escolha entre as músicas sugeridas ou busque mais'
  },
  player: {
    playbackError: 'Erro ao reproduzir esta faixa',
    noPreview: 'Nenhuma prévia de áudio disponível para esta faixa',
    selectSong: 'Selecione uma música',
    artistName: 'Nome do artista'
  }
};
