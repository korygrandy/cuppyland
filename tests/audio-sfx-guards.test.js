const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

function createAudioHarness(options = {}) {
  const clipPlayCounts = new Map();
  const clipLoadCounts = new Map();
  const clipPauseCounts = new Map();
  const audioInstances = [];

  class AudioStub {
    constructor(src) {
      this.src = src;
      this.loop = false;
      this.preload = "auto";
      this.volume = 1;
      this.currentTime = 0;
      this.paused = true;
      this.error = options.errorClipSrcs?.has(src) ? { code: 1 } : null;
      this.networkState = options.noSourceClipSrcs?.has(src) ? 3 : 1;
      this.listeners = new Map();
      audioInstances.push(this);
    }

    addEventListener(eventName, handler) {
      if (!this.listeners.has(eventName)) {
        this.listeners.set(eventName, new Set());
      }
      this.listeners.get(eventName).add(handler);
    }

    removeEventListener(eventName, handler) {
      this.listeners.get(eventName)?.delete(handler);
    }

    load() {
      clipLoadCounts.set(this.src, (clipLoadCounts.get(this.src) || 0) + 1);
    }

    play() {
      this.paused = false;
      clipPlayCounts.set(this.src, (clipPlayCounts.get(this.src) || 0) + 1);
      if (options.rejectClipSrcs?.has(this.src)) {
        return Promise.reject(new Error(`Rejected ${this.src}`));
      }
      return Promise.resolve();
    }

    pause() {
      this.paused = true;
      clipPauseCounts.set(this.src, (clipPauseCounts.get(this.src) || 0) + 1);
    }
  }

  const context = {
    window: {
      CuppyLandGame: {
        state: {
          currentScreen: "world",
          activeWorld: "playground",
        },
        audioConfig: {
          menu: "./sfx/Kailua_Breeze.ogg",
          worlds: {
            playground: "./sfx/theme-playground.ogg",
            "olivia-room": "./sfx/theme-olivias-room.ogg",
          },
          transitions: {},
          sfxClips: {
            testClip: "./sfx/test-clip.ogg",
            shimmer: "./sfx/shimmer.ogg",
            goldenPuppyActivated: "./sfx/golden-puppy-activated.ogg",
          },
        },
      },
      CuppyLandAudioEngine: {
        createAudioEngine: () => ({
          registerMusicTrack: () => {},
          setMusicVolume: () => {},
          setSfxVolume: () => {},
          playSfx: () => {},
          playMusic: () => {},
          stopAllMusic: () => {},
          stopAllSfx: () => {},
          unlock: () => {},
        }),
      },
    },
    document: {
      hidden: Boolean(options.hidden),
      getElementById: () => ({
        value: "75",
        textContent: "",
        setAttribute: () => {},
      }),
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
    },
    console: {
      warn: () => {},
    },
    Audio: AudioStub,
    HTMLMediaElement: {
      NETWORK_NO_SOURCE: 3,
    },
  };

  loadBrowserScript("src/audio/audio.js", context);
  return {
    audio: context.window.CuppyLandAudio,
    clipPlayCounts,
    clipLoadCounts,
    clipPauseCounts,
    audioInstances,
  };
}

test("playSfxClip completes callback immediately when document is hidden", () => {
  const harness = createAudioHarness({ hidden: true });
  let callbackCount = 0;
  harness.audio.playSfxClip("testClip", () => {
    callbackCount += 1;
  });

  assert.equal(callbackCount, 1);
  assert.equal(harness.clipPlayCounts.get("./sfx/test-clip.ogg") || 0, 0);
});

test("playSfxClip completes callback immediately when SFX volume is muted", () => {
  const harness = createAudioHarness();
  harness.audio.audioState.sfxVolume = 0;
  let callbackCount = 0;
  harness.audio.playSfxClip("testClip", () => {
    callbackCount += 1;
  });

  assert.equal(callbackCount, 1);
  assert.equal(harness.clipPlayCounts.get("./sfx/test-clip.ogg") || 0, 0);
});

test("playSfxClip rehydrates NETWORK_NO_SOURCE clips and still attempts playback", () => {
  const harness = createAudioHarness({
    noSourceClipSrcs: new Set(["./sfx/test-clip.ogg"]),
  });
  harness.audio.playSfxClip("testClip");
  assert.equal(harness.clipPlayCounts.get("./sfx/test-clip.ogg") || 0, 1);
  assert.equal(harness.clipLoadCounts.get("./sfx/test-clip.ogg") || 0, 1);
});

test("playSfxClip invokes callback once when playback promise rejects", async () => {
  const harness = createAudioHarness({
    rejectClipSrcs: new Set(["./sfx/test-clip.ogg"]),
  });
  let callbackCount = 0;
  harness.audio.playSfxClip("testClip", () => {
    callbackCount += 1;
  });

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(callbackCount, 1);
  assert.equal(harness.clipPlayCounts.get("./sfx/test-clip.ogg") || 0, 1);
});
