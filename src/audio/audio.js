(function () {
  const game = window.CuppyLandGame;
  const { audioConfig } = game;
  const audioEngine = window.CuppyLandAudioEngine.createAudioEngine({
    initialMusicVolume: 0.7,
    initialSfxVolume: 0.75,
    initialMasterVolume: 1,
    transitions: audioConfig.transitions || {},
  });

  const audioState = {
    unlocked: false,
    activeTrack: null,
    musicVolume: 0.7,
    sfxVolume: 0.75,
    previousMusicVolume: 0.7,
    previousSfxVolume: 0.75,
  };

  const audioStorageKey = "oliviaworld-audio-settings-v1";
  const playerToTrackName = new WeakMap();
  const sfxClipPlayers = {};

  const sfxProfiles = {
    standard: [
      { frequency: 720, duration: 0.04, gain: 0.055, type: "triangle", offset: 0 },
      { frequency: 980, duration: 0.05, gain: 0.045, type: "sine", offset: 0.035 },
    ],
    close: [
      { frequency: 320, duration: 0.06, gain: 0.06, type: "square", offset: 0 },
      { frequency: 240, duration: 0.07, gain: 0.05, type: "triangle", offset: 0.045 },
    ],
    yes: [
      { frequency: 640, duration: 0.045, gain: 0.05, type: "sine", offset: 0 },
      { frequency: 920, duration: 0.07, gain: 0.055, type: "triangle", offset: 0.04 },
    ],
    no: [
      { frequency: 520, duration: 0.05, gain: 0.05, type: "triangle", offset: 0 },
      { frequency: 360, duration: 0.07, gain: 0.055, type: "square", offset: 0.04 },
    ],
  };

  function getAudioElements() {
    return {
      musicVolumeInput: document.getElementById("musicVolumeInput"),
      sfxVolumeInput: document.getElementById("sfxVolumeInput"),
      musicVolumeValue: document.getElementById("musicVolumeValue"),
      sfxVolumeValue: document.getElementById("sfxVolumeValue"),
      musicMuteBtn: document.getElementById("musicMuteBtn"),
      sfxMuteBtn: document.getElementById("sfxMuteBtn"),
    };
  }

  function createAudioPlayer(src) {
    const sources = Array.isArray(src) ? src : [src];
    const audio = new Audio(sources[0]);
    audio.loop = true;
    audio.preload = "auto";

    if (sources.length > 1) {
      let sourceIndex = 0;
      audio.addEventListener("error", () => {
        if (sourceIndex >= sources.length - 1) {
          return;
        }
        sourceIndex += 1;
        audio.src = sources[sourceIndex];
        audio.load();
        if (audioState.activeTrack) {
          const playPromise = audio.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch((error) => {
              console.warn(`Unable to play fallback audio source "${sources[sourceIndex]}".`, error);
            });
          }
        }
      });
    }

    return audio;
  }

  function createSfxClipPlayer(src) {
    const audio = new Audio(src);
    audio.loop = false;
    audio.preload = "auto";
    return audio;
  }

  const audioPlayers = {
    menu: createAudioPlayer(audioConfig.menu),
    worlds: {
      playground: createAudioPlayer(audioConfig.worlds.playground),
      "olivia-room": createAudioPlayer(audioConfig.worlds["olivia-room"]),
    },
  };
  Object.entries(audioConfig.sfxClips || {}).forEach(([clipName, clipSrc]) => {
    if (typeof clipSrc === "string" && clipSrc.length > 0) {
      sfxClipPlayers[clipName] = createSfxClipPlayer(clipSrc);
    }
  });
  audioEngine.registerMusicTrack("menu", audioPlayers.menu);
  audioEngine.registerMusicTrack("playground", audioPlayers.worlds.playground);
  audioEngine.registerMusicTrack("olivia-room", audioPlayers.worlds["olivia-room"]);
  playerToTrackName.set(audioPlayers.menu, "menu");
  playerToTrackName.set(audioPlayers.worlds.playground, "playground");
  playerToTrackName.set(audioPlayers.worlds["olivia-room"], "olivia-room");

  function getAllAudioPlayers() {
    return [audioPlayers.menu, audioPlayers.worlds.playground, audioPlayers.worlds["olivia-room"]];
  }

  function applyMusicVolume() {
    audioEngine.setMusicVolume(audioState.musicVolume);
  }

  function updateAudioVolumeLabels() {
    const { musicVolumeValue, sfxVolumeValue, musicMuteBtn, sfxMuteBtn } = getAudioElements();
    musicVolumeValue.textContent = `${Math.round(audioState.musicVolume * 100)}%`;
    sfxVolumeValue.textContent = `${Math.round(audioState.sfxVolume * 100)}%`;
    const musicMuted = audioState.musicVolume <= 0;
    const sfxMuted = audioState.sfxVolume <= 0;
    musicMuteBtn.textContent = musicMuted ? "Unmute Music" : "Mute Music";
    sfxMuteBtn.textContent = sfxMuted ? "Unmute SFX" : "Mute SFX";
    musicMuteBtn.setAttribute("aria-pressed", String(musicMuted));
    sfxMuteBtn.setAttribute("aria-pressed", String(sfxMuted));
  }

  function clampVolume(value) {
    return Math.min(1, Math.max(0, value));
  }

  function saveAudioSettings() {
    const payload = {
      musicVolume: audioState.musicVolume,
      sfxVolume: audioState.sfxVolume,
      previousMusicVolume: audioState.previousMusicVolume,
      previousSfxVolume: audioState.previousSfxVolume,
    };

    try {
      localStorage.setItem(audioStorageKey, JSON.stringify(payload));
    } catch (error) {
      console.warn("Unable to persist audio settings.", error);
    }
  }

  function loadAudioSettings() {
    try {
      const raw = localStorage.getItem(audioStorageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (typeof parsed.musicVolume === "number") {
        audioState.musicVolume = clampVolume(parsed.musicVolume);
      }
      if (typeof parsed.sfxVolume === "number") {
        audioState.sfxVolume = clampVolume(parsed.sfxVolume);
      }
      if (typeof parsed.previousMusicVolume === "number") {
        audioState.previousMusicVolume = clampVolume(parsed.previousMusicVolume);
      }
      if (typeof parsed.previousSfxVolume === "number") {
        audioState.previousSfxVolume = clampVolume(parsed.previousSfxVolume);
      }
    } catch (error) {
      console.warn("Unable to load saved audio settings.", error);
    }
  }

  function syncAudioControlsUi() {
    const { musicVolumeInput, sfxVolumeInput } = getAudioElements();
    musicVolumeInput.value = String(Math.round(audioState.musicVolume * 100));
    sfxVolumeInput.value = String(Math.round(audioState.sfxVolume * 100));
    updateAudioVolumeLabels();
  }

  function handleMusicVolumeChange(event) {
    const volume = clampVolume(Number(event.target.value) / 100);
    audioState.musicVolume = volume;
    if (volume > 0) {
      audioState.previousMusicVolume = volume;
    }
    applyMusicVolume();
    if (audioState.unlocked && volume > 0) {
      syncAudioForCurrentScreen();
    }
    updateAudioVolumeLabels();
    saveAudioSettings();
  }

  function handleSfxVolumeChange(event) {
    const volume = clampVolume(Number(event.target.value) / 100);
    audioState.sfxVolume = volume;
    if (volume > 0) {
      audioState.previousSfxVolume = volume;
    }
    audioEngine.setSfxVolume(audioState.sfxVolume);
    updateAudioVolumeLabels();
    saveAudioSettings();
    playSfx("standard");
  }

  function toggleMusicMute() {
    if (audioState.musicVolume <= 0) {
      audioState.musicVolume = audioState.previousMusicVolume > 0 ? audioState.previousMusicVolume : 0.7;
    } else {
      audioState.previousMusicVolume = audioState.musicVolume;
      audioState.musicVolume = 0;
    }
    applyMusicVolume();
    if (audioState.unlocked && audioState.musicVolume > 0) {
      syncAudioForCurrentScreen();
    }
    syncAudioControlsUi();
    saveAudioSettings();
  }

  function toggleSfxMute() {
    if (audioState.sfxVolume <= 0) {
      audioState.sfxVolume = audioState.previousSfxVolume > 0 ? audioState.previousSfxVolume : 0.75;
      playSfx("standard");
    } else {
      audioState.previousSfxVolume = audioState.sfxVolume;
      audioState.sfxVolume = 0;
    }
    audioEngine.setSfxVolume(audioState.sfxVolume);
    syncAudioControlsUi();
    saveAudioSettings();
  }

  function playSfx(profileName) {
    if (document.hidden) {
      return;
    }
    if (audioState.sfxVolume <= 0) {
      return;
    }
    const profile = sfxProfiles[profileName] || sfxProfiles.standard;
    audioEngine.playSfx(profile);
  }

  function playSfxClip(clipName, onEnded = null) {
    if (document.hidden) {
      if (typeof onEnded === "function") {
        onEnded();
      }
      return;
    }
    if (audioState.sfxVolume <= 0) {
      if (typeof onEnded === "function") {
        onEnded();
      }
      return;
    }
    let clip = sfxClipPlayers[clipName];
    if (!clip && clipName === "goldenPuppyActivated") {
      clip = sfxClipPlayers.shimmer || null;
    }
    if (!clip) {
      if (typeof onEnded === "function") {
        onEnded();
      }
      return;
    }

    let endedCallbackActive = typeof onEnded === "function";
    const finish = () => {
      if (!endedCallbackActive) {
        return;
      }
      endedCallbackActive = false;
      clip.removeEventListener("ended", finish);
      clip.removeEventListener("error", finish);
      onEnded();
    };
    if (endedCallbackActive) {
      clip.addEventListener("ended", finish);
      clip.addEventListener("error", finish);
    }
    clip.volume = audioState.sfxVolume;
    clip.currentTime = 0;
    const playPromise = clip.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((error) => {
        console.warn(`Unable to play sfx clip "${clipName}".`, error);
        finish();
      });
    }
  }

  function playLoopingSfxClip(clipName) {
    if (document.hidden) {
      return;
    }
    if (audioState.sfxVolume <= 0) {
      return;
    }

    const clip = sfxClipPlayers[clipName];
    if (!clip) {
      return;
    }

    clip.loop = true;
    clip.volume = audioState.sfxVolume;
    if (!clip.paused) {
      return;
    }

    const playPromise = clip.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch((error) => {
        console.warn(`Unable to play looping sfx clip "${clipName}".`, error);
      });
    }
  }

  function stopSfxClip(clipName) {
    const clip = sfxClipPlayers[clipName];
    if (!clip) {
      return;
    }

    clip.pause();
    clip.currentTime = 0;
    clip.loop = false;
  }

  function playAudioTrack(player, trackName) {
    const resolvedTrack = trackName || playerToTrackName.get(player);
    if (!resolvedTrack) {
      return;
    }

    if (audioState.activeTrack === resolvedTrack && player && !player.paused) {
      return;
    }
    audioState.activeTrack = resolvedTrack;
    audioEngine.playMusic(resolvedTrack);
  }

  function syncAudioForCurrentScreen() {
    if (!audioState.unlocked) {
      return;
    }

    const currentScreen = game.state.currentScreen;

    if (currentScreen === "world") {
      if (game.state.activeWorld && audioPlayers.worlds[game.state.activeWorld]) {
        playAudioTrack(audioPlayers.worlds[game.state.activeWorld], game.state.activeWorld);
        return;
      }
      pauseAllAudio();
      audioState.activeTrack = null;
      return;
    }

    if (currentScreen === "splash" || currentScreen === "worldSelect") {
      playAudioTrack(audioPlayers.menu, "menu");
      return;
    }

    pauseAllAudio();
    audioState.activeTrack = null;
  }

  function unlockAudio() {
    if (audioState.unlocked) {
      return;
    }

    audioState.unlocked = true;
    audioEngine.unlock();
    audioEngine.setMusicVolume(audioState.musicVolume);
    audioEngine.setSfxVolume(audioState.sfxVolume);
    syncAudioForCurrentScreen();
  }

  function pauseAllAudio() {
    audioEngine.stopAllMusic();
    audioState.activeTrack = null;
  }

  function pauseAllSfx() {
    Object.values(sfxClipPlayers).forEach((clip) => {
      clip.pause();
      clip.currentTime = 0;
      clip.loop = false;
    });
    audioEngine.stopAllSfx();
  }

  function handleAppVisibilityChange() {
    if (document.hidden) {
      audioState.resumingFromHidden = true;
      pauseAllSfx();
      pauseAllAudio();
      return;
    }

    if (!audioState.unlocked || audioState.musicVolume <= 0) {
      return;
    }
    if (audioState.resumingFromHidden) {
      audioState.resumingFromHidden = false;
      audioState.activeTrack = null;
      syncAudioForCurrentScreen();
      return;
    }
    syncAudioForCurrentScreen();
  }

  audioEngine.setMusicVolume(audioState.musicVolume);
  audioEngine.setSfxVolume(audioState.sfxVolume);

  window.CuppyLandAudio = {
    audioState,
    audioEngine,
    createAudioPlayer,
    getAllAudioPlayers,
    applyMusicVolume,
    updateAudioVolumeLabels,
    saveAudioSettings,
    loadAudioSettings,
    syncAudioControlsUi,
    handleMusicVolumeChange,
    handleSfxVolumeChange,
    toggleMusicMute,
    toggleSfxMute,
    playSfx,
    playSfxClip,
    playLoopingSfxClip,
    stopSfxClip,
    pauseAllAudio,
    pauseAllSfx,
    handleAppVisibilityChange,
    playAudioTrack,
    unlockAudio,
    syncAudioForCurrentScreen,
  };
})();
