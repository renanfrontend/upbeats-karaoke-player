
export default {
  navigation: {
    home: 'Home',
    search: 'Search',
    library: 'Library',
    karaoke: 'Karaoke Mode',
    songs: 'Songs',
    playlists: {
      title: 'Playlists',
      liked: 'Liked Songs',
      recent: 'Recently Played',
      new: 'New Playlist'
    }
  },
  search: {
    placeholder: 'Search for songs, artists, or lyrics...',
    results: 'Results for',
    noResults: 'No results found',
    tryDifferent: 'Try different keywords or check your spelling',
    typeToSearch: 'Type something to search',
    genres: {
      pop: 'Pop',
      rock: 'Rock',
      hiphop: 'Hip Hop',
      electronic: 'Electronic'
    }
  },
  home: {
    welcome: 'Welcome to UP! BEATS Karaoke',
    description: 'Sing your heart out with our karaoke experience. Access thousands of songs and enjoy real-time lyrics display.',
    tryKaraoke: 'Try Karaoke Mode',
    popularArtists: 'Popular Artists',
    viewAll: 'View All',
    popularTracks: 'Popular Tracks for Karaoke'
  },
  library: {
    title: 'Your Library',
    likedSongs: 'Liked Songs',
    recentlyPlayed: 'Recently Played',
    yourPlaylists: 'Your Playlists',
    createPlaylist: 'Create Your First Playlist',
    playlistDescription: "It's easy to organize your favorite songs into playlists",
    createButton: 'Create Playlist',
    songsCount: '{{count}} songs',

    like: 'Like',

    unlike: 'Unlike',

    emptyLiked: 'Tap the heart on a song to see it here.',

    emptyRecent: 'Songs you play show up here.',

    localSong: 'File on this device',
    playAll: 'Play All'
  },
  karaoke: {
    title: 'Karaoke Mode',
    back: 'Back',
    playingNow: 'Playing Now',
    noLyrics: 'No Lyrics Available',
    noLyricsDesc: 'Synced lyrics for this song are not available at the moment.',
    loadingLyrics: 'Loading lyrics...',
    previewNote: 'Playing a 30-second preview — tap the line being sung to calibrate the lyrics.',
    selectSong: 'Select a song to start karaoke',
    searchSongs: 'Search for Songs',
    suggestedSongs: 'Suggested Songs',
    micEnabled: 'Microphone enabled',
    micDisabled: 'Microphone disabled',
    micPermissionDenied: 'Microphone permission denied',
    micOn: 'Mic On',
    micOff: 'Mic Off',
    micUnsupported: 'Your browser does not allow using the microphone here',
    micVolume: 'Your voice',
    micEcho: 'Echo',
    micEnvSpeakers: 'Speakers',
    micEnvHeadphones: 'Headphones',
    micEnvSpeakersTip: 'Echo cancellation is on to prevent feedback through the speakers.',
    micEnvHeadphonesTip: 'With headphones your voice sounds more natural, without cancellation.',
    yourVoice: 'Sing with the microphone',
    yourVoiceDesc: 'Hear your own voice along with the music',
    voiceMix: 'Original voice in the track',
    voiceMixDesc: 'Keep, lower, or remove the original singer',
    voiceOriginal: 'Original',
    voiceGuide: 'Guide',
    voiceKaraoke: 'Karaoke',
    voiceLevel: 'Level',
    vocalControlUnavailable: "This track's audio can't be processed — use \"Sing with my music\" to get voice control.",
    previewRestarted: 'The 30 s preview ended and restarted. To sing the full song, use "Sing with my music".',
    musicVolume: 'Music volume',
    seek: 'Track position',
    useMyMusic: 'Add my songs',
    useMyMusicDesc: 'Pick one or more songs from your device (or drag the files here). They stay saved on this device so you can sing them anytime, in full and with voice control.',
    localArtist: 'Your music',
    localLoaded: 'Track loaded!',
    mySongs: 'My songs',
    mySongsEmpty: 'No saved songs yet. Tap "Add my songs" and choose an audio file.',
    mySongsHint: 'Tip: name the file "Artist - Song" so the lyrics load by themselves.',
    songsSaved_one: '{{count}} song saved to My songs',
    songsSaved_other: '{{count}} songs saved to My songs',
    songNotSaved: "Couldn't save to this device; the song plays now but won't stay in the list.",
    songMissing: "Couldn't find this song's file. Add it again.",
    songRemoved: 'Song removed from the list',
    removeSong: 'Remove from list',
    dropHere: 'Drop your songs here',
    notAudio: 'That file is not audio',
    lyricsSync: 'Adjust lyrics',
    lyricsEarlier: 'Lyrics earlier',
    lyricsLater: 'Lyrics later',
    lyricsSyncReset: 'Reset adjustment',
    lyricsSynced: 'Lyrics synced!',
    tapToSync: 'Tip: tap the line being sung to calibrate the lyrics'
  },
  auth: {
    signIn: 'Sign in with Google',
    signOut: 'Sign out',
    signInError: "Couldn't sign in right now. Please try again.",
    signOutError: "Couldn't sign out right now.",
    sync: {
      off: 'Sync off',
      syncing: 'Syncing…',
      synced: 'Synced',
      error: "Can't reach the cloud"
    }
  },
  common: {
    play: 'Play',
    pause: 'Pause',
    stop: 'Stop',
    next: 'Next',
    previous: 'Previous',
    chooseFromSuggested: 'Choose from the suggested songs or search for more'
  },
  player: {
    playbackError: 'Error playing this track',
    noPreview: 'No audio preview available for this track',
    selectSong: 'Select a song',
    artistName: 'Artist name'
  }
};
