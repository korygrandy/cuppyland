(function () {
  function clampVolume(value) {
    return Math.min(1, Math.max(0, value));
  }

  function toSeconds(milliseconds) {
    return Math.max(0, Number(milliseconds) || 0) / 1000;
  }

  function createAudioEngine(options = {}) {
    const transitions = options.transitions || {};
    const state = {
      unlocked: false,
      musicVolume: clampVolume(options.initialMusicVolume ?? 0.7),
      sfxVolume: clampVolume(options.initialSfxVolume ?? 0.75),
      masterVolume: clampVolume(options.initialMasterVolume ?? 1),
      activeTrackName: null,
    };

    const trackRegistry = new Map();
    let audioContext = null;
    let masterGainNode = null;
    let musicBusGainNode = null;
    let sfxBusGainNode = null;
    const activeSfxNodes = new Set();

    function getAudioContext() {
      if (audioContext) {
        return audioContext;
      }

      const ContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!ContextCtor) {
        return null;
      }

      audioContext = new ContextCtor();
      masterGainNode = audioContext.createGain();
      musicBusGainNode = audioContext.createGain();
      sfxBusGainNode = audioContext.createGain();

      musicBusGainNode.connect(masterGainNode);
      sfxBusGainNode.connect(masterGainNode);
      masterGainNode.connect(audioContext.destination);

      applyBusVolumes();
      return audioContext;
    }

    function applyFallbackElementVolumes() {
      const volume = state.masterVolume * state.musicVolume;
      trackRegistry.forEach((trackInfo) => {
        trackInfo.player.volume = volume;
      });
    }

    function applyBusVolumes() {
      const context = getAudioContext();
      if (!context || !masterGainNode || !musicBusGainNode || !sfxBusGainNode) {
        applyFallbackElementVolumes();
        return;
      }

      const now = context.currentTime;
      masterGainNode.gain.setValueAtTime(state.masterVolume, now);
      musicBusGainNode.gain.setValueAtTime(state.musicVolume, now);
      sfxBusGainNode.gain.setValueAtTime(state.sfxVolume, now);
    }

    function connectTrack(trackInfo) {
      if (trackInfo.connected) {
        return;
      }

      const context = getAudioContext();
      if (!context || !musicBusGainNode) {
        return;
      }

      const sourceNode = context.createMediaElementSource(trackInfo.player);
      const trackGainNode = context.createGain();
      trackGainNode.gain.setValueAtTime(0, context.currentTime);
      sourceNode.connect(trackGainNode);
      trackGainNode.connect(musicBusGainNode);
      trackInfo.sourceNode = sourceNode;
      trackInfo.trackGainNode = trackGainNode;
      trackInfo.connected = true;
      trackInfo.player.volume = 1;
    }

    function registerMusicTrack(trackName, player) {
      if (!trackName || !player) {
        return;
      }

      player.loop = true;
      player.preload = "auto";
      const trackInfo = {
        name: trackName,
        player,
        sourceNode: null,
        trackGainNode: null,
        connected: false,
      };
      trackRegistry.set(trackName, trackInfo);

      if (state.unlocked) {
        connectTrack(trackInfo);
      } else {
        applyFallbackElementVolumes();
      }
    }

    function setMasterVolume(value) {
      state.masterVolume = clampVolume(value);
      applyBusVolumes();
    }

    function setMusicVolume(value) {
      state.musicVolume = clampVolume(value);
      applyBusVolumes();
    }

    function setSfxVolume(value) {
      state.sfxVolume = clampVolume(value);
      applyBusVolumes();
    }

    function stopTrackFallback(trackInfo) {
      if (!trackInfo) {
        return;
      }
      trackInfo.player.pause();
    }

    function playMusic(trackName, overrideTransitions = {}) {
      const nextTrack = trackRegistry.get(trackName);
      if (!nextTrack) {
        return;
      }

      const fadeOutSeconds = toSeconds(overrideTransitions.fadeOutMs ?? transitions.fadeOutMs ?? 200);
      const fadeInSeconds = toSeconds(overrideTransitions.fadeInMs ?? transitions.fadeInMs ?? 240);
      const currentTrack = state.activeTrackName ? trackRegistry.get(state.activeTrackName) : null;
      const context = getAudioContext();

      if (state.activeTrackName === trackName && !nextTrack.player.paused) {
        return;
      }

      state.activeTrackName = trackName;

      if (!context || !state.unlocked) {
        trackRegistry.forEach((trackInfo, name) => {
          if (name !== trackName) {
            stopTrackFallback(trackInfo);
          }
        });
        nextTrack.player.volume = state.masterVolume * state.musicVolume;
        const playPromise = nextTrack.player.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch((error) => {
            console.warn(`Unable to play audio track "${trackName}".`, error);
          });
        }
        return;
      }

      connectTrack(nextTrack);
      if (currentTrack) {
        connectTrack(currentTrack);
      }

      const now = context.currentTime;
      if (currentTrack && currentTrack.trackGainNode) {
        currentTrack.trackGainNode.gain.cancelScheduledValues(now);
        currentTrack.trackGainNode.gain.setValueAtTime(currentTrack.trackGainNode.gain.value || 1, now);
        currentTrack.trackGainNode.gain.linearRampToValueAtTime(0, now + fadeOutSeconds);
        window.setTimeout(() => {
          if (state.activeTrackName !== currentTrack.name) {
            currentTrack.player.pause();
          }
        }, Math.ceil(fadeOutSeconds * 1000) + 40);
      }

      if (nextTrack.trackGainNode) {
        nextTrack.trackGainNode.gain.cancelScheduledValues(now);
        nextTrack.trackGainNode.gain.setValueAtTime(0, now);
        nextTrack.trackGainNode.gain.linearRampToValueAtTime(1, now + fadeInSeconds);
      }

      const playPromise = nextTrack.player.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((error) => {
          console.warn(`Unable to play audio track "${trackName}".`, error);
        });
      }
    }

    function stopAllMusic(overrideTransitions = {}) {
      const fadeOutSeconds = toSeconds(overrideTransitions.fadeOutMs ?? transitions.fadeOutMs ?? 200);
      const context = getAudioContext();
      const currentTrack = state.activeTrackName ? trackRegistry.get(state.activeTrackName) : null;

      state.activeTrackName = null;

      if (!context || !state.unlocked) {
        trackRegistry.forEach((trackInfo) => stopTrackFallback(trackInfo));
        return;
      }

      if (currentTrack && currentTrack.trackGainNode) {
        const now = context.currentTime;
        currentTrack.trackGainNode.gain.cancelScheduledValues(now);
        currentTrack.trackGainNode.gain.setValueAtTime(currentTrack.trackGainNode.gain.value || 1, now);
        currentTrack.trackGainNode.gain.linearRampToValueAtTime(0, now + fadeOutSeconds);
        window.setTimeout(() => {
          if (!state.activeTrackName) {
            currentTrack.player.pause();
          }
        }, Math.ceil(fadeOutSeconds * 1000) + 40);
      } else {
        trackRegistry.forEach((trackInfo) => stopTrackFallback(trackInfo));
      }
    }

    function playSfx(profile) {
      if (!Array.isArray(profile) || !profile.length || state.sfxVolume <= 0) {
        return;
      }

      const context = getAudioContext();
      if (!context || !sfxBusGainNode) {
        return;
      }

      const baseTime = context.currentTime;
      profile.forEach((tone) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        const startAt = baseTime + (tone.offset || 0);
        const endAt = startAt + (tone.duration || 0.04);
        const peakGain = Math.max(0.0001, tone.gain || 0.04);

        oscillator.type = tone.type || "sine";
        oscillator.frequency.setValueAtTime(tone.frequency || 440, startAt);
        gainNode.gain.setValueAtTime(0.0001, startAt);
        gainNode.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, endAt);

        oscillator.connect(gainNode);
        gainNode.connect(sfxBusGainNode);
        activeSfxNodes.add(oscillator);
        oscillator.addEventListener("ended", () => {
          activeSfxNodes.delete(oscillator);
          oscillator.disconnect();
          gainNode.disconnect();
        });
        oscillator.start(startAt);
        oscillator.stop(endAt + 0.01);
      });
    }

    function stopAllSfx() {
      activeSfxNodes.forEach((oscillator) => {
        try {
          oscillator.stop();
        } catch (error) {
          // Oscillator may have already ended.
        }
      });
      activeSfxNodes.clear();
    }

    function unlock() {
      if (state.unlocked) {
        return;
      }

      state.unlocked = true;
      const context = getAudioContext();
      if (!context) {
        applyFallbackElementVolumes();
        return;
      }

      trackRegistry.forEach((trackInfo) => {
        connectTrack(trackInfo);
      });

      if (context.state === "suspended") {
        context.resume().catch((error) => {
          console.warn("Unable to resume audio context.", error);
        });
      }
      applyBusVolumes();
    }

    return {
      state,
      registerMusicTrack,
      setMasterVolume,
      setMusicVolume,
      setSfxVolume,
      playMusic,
      stopAllMusic,
      playSfx,
      stopAllSfx,
      unlock,
    };
  }

  window.CuppyLandAudioEngine = {
    clampVolume,
    createAudioEngine,
  };
})();
