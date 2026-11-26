function installSfxEventCapture(targetWindow) {
  const runtimeWindow = targetWindow || (typeof window !== "undefined" ? window : null);
  if (!runtimeWindow || !runtimeWindow.CuppyLandAudio) {
    return { installed: false, reason: "CuppyLandAudio is not available" };
  }
  const audio = runtimeWindow.CuppyLandAudio;
  if (runtimeWindow.CuppyLandSfxEventCapture?.installed) {
    return runtimeWindow.CuppyLandSfxEventCapture;
  }

  const events = [];
  const originals = {
    playSfxClip: audio.playSfxClip,
    playLoopingSfxClip: audio.playLoopingSfxClip,
    stopSfxClip: audio.stopSfxClip,
  };

  const pushEvent = (type, clipName, extras = {}) => {
    events.push({
      type,
      clipName,
      timestamp: Date.now(),
      world: runtimeWindow.CuppyLandGame?.state?.activeWorld || null,
      hidden: Boolean(runtimeWindow.document?.hidden),
      sfxVolume: Number(audio.audioState?.sfxVolume ?? 0),
      ...extras,
    });
  };

  if (typeof originals.playSfxClip === "function") {
    audio.playSfxClip = (clipName, onEnded = null) => {
      pushEvent("playSfxClip", clipName);
      const wrappedOnEnded = typeof onEnded === "function"
        ? () => {
          pushEvent("onEnded", clipName);
          onEnded();
        }
        : null;
      return originals.playSfxClip.call(audio, clipName, wrappedOnEnded);
    };
  }

  if (typeof originals.playLoopingSfxClip === "function") {
    audio.playLoopingSfxClip = (clipName) => {
      pushEvent("playLoopingSfxClip", clipName);
      return originals.playLoopingSfxClip.call(audio, clipName);
    };
  }

  if (typeof originals.stopSfxClip === "function") {
    audio.stopSfxClip = (clipName) => {
      pushEvent("stopSfxClip", clipName);
      return originals.stopSfxClip.call(audio, clipName);
    };
  }

  const capture = {
    installed: true,
    events,
    clear: () => {
      events.length = 0;
    },
    stop: () => {
      if (typeof originals.playSfxClip === "function") {
        audio.playSfxClip = originals.playSfxClip;
      }
      if (typeof originals.playLoopingSfxClip === "function") {
        audio.playLoopingSfxClip = originals.playLoopingSfxClip;
      }
      if (typeof originals.stopSfxClip === "function") {
        audio.stopSfxClip = originals.stopSfxClip;
      }
      capture.installed = false;
    },
  };

  runtimeWindow.CuppyLandSfxEventCapture = capture;
  return capture;
}

if (typeof module !== "undefined") {
  module.exports = {
    installSfxEventCapture,
  };
}
