const test = require("node:test");
const assert = require("node:assert/strict");
const { runCoreSfxMatrix } = require("../scripts/validate-sfx-browser");

test("core SFX browser matrix runner reports deterministic pass/fail cases", async () => {
  const events = [];
  const runtimeWindow = {
    document: {
      hidden: false,
      getElementById: () => ({ click: () => {} }),
      querySelector: () => ({ click: () => {}, style: {} }),
    },
    CuppyLandGame: {
      state: {
        activeWorld: "playground",
        worlds: {
          playground: {
            friends: [],
          },
        },
      },
    },
    CuppyLandAudio: {
      audioState: { sfxVolume: 0.75 },
      playSfxClip: (clipName, onEnded = null) => {
        events.push(clipName);
        if (typeof onEnded === "function") {
          onEnded();
        }
      },
      playLoopingSfxClip: () => {},
      stopSfxClip: () => {},
    },
  };

  const result = await runCoreSfxMatrix(runtimeWindow, {
    repeats: 2,
    actions: {
      openPlayground: async () => {
        runtimeWindow.CuppyLandAudio.playSfxClip("playgroundIntroFx");
      },
      triggerBarbieTubeSlide: async () => {
        runtimeWindow.CuppyLandAudio.playSfxClip("barbieBlondeSnap");
      },
      triggerBarbieBabyTubeSlide: async () => {
        runtimeWindow.CuppyLandAudio.playSfxClip("barbieBlondeBabySnap");
      },
      triggerMutedBarbieBabySnap: async () => {
        runtimeWindow.CuppyLandAudio.audioState.sfxVolume = 0;
        runtimeWindow.CuppyLandAudio.playSfxClip("barbieBlondeBabySnap");
        runtimeWindow.CuppyLandAudio.audioState.sfxVolume = 0.75;
      },
    },
  });

  assert.equal(result.valid, true);
  assert.equal(result.cases.length, 7);
  result.cases.forEach((matrixCase) => {
    assert.equal(matrixCase.passed, true, `${matrixCase.name} should pass`);
    assert.ok(matrixCase.eventClips.length > 0);
  });
});
