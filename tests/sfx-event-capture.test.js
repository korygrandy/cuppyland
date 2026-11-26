const test = require("node:test");
const assert = require("node:assert/strict");
const { installSfxEventCapture } = require("../scripts/capture-sfx-events");

test("SFX event capture wraps play, loop, stop and onEnded deterministically", () => {
  const calls = [];
  const targetWindow = {
    document: { hidden: false },
    CuppyLandGame: {
      state: { activeWorld: "playground" },
    },
    CuppyLandAudio: {
      audioState: { sfxVolume: 0.75 },
      playSfxClip: (clipName, onEnded) => {
        calls.push(`play:${clipName}`);
        if (typeof onEnded === "function") {
          onEnded();
        }
      },
      playLoopingSfxClip: (clipName) => {
        calls.push(`loop:${clipName}`);
      },
      stopSfxClip: (clipName) => {
        calls.push(`stop:${clipName}`);
      },
    },
  };

  const capture = installSfxEventCapture(targetWindow);
  targetWindow.CuppyLandAudio.playSfxClip("playgroundIntroFx", () => {});
  targetWindow.CuppyLandAudio.playLoopingSfxClip("uke");
  targetWindow.CuppyLandAudio.stopSfxClip("uke");

  assert.equal(capture.installed, true);
  assert.deepEqual(calls, ["play:playgroundIntroFx", "loop:uke", "stop:uke"]);
  assert.equal(capture.events.length, 4);
  assert.equal(capture.events[0].type, "playSfxClip");
  assert.equal(capture.events[0].clipName, "playgroundIntroFx");
  assert.equal(capture.events[1].type, "onEnded");
  assert.equal(capture.events[2].type, "playLoopingSfxClip");
  assert.equal(capture.events[3].type, "stopSfxClip");

  capture.clear();
  assert.equal(capture.events.length, 0);
});

test("SFX event capture stop restores original methods", () => {
  const targetWindow = {
    document: { hidden: false },
    CuppyLandGame: {
      state: { activeWorld: "playground" },
    },
    CuppyLandAudio: {
      audioState: { sfxVolume: 0.75 },
      playSfxClip: () => "play",
      playLoopingSfxClip: () => "loop",
      stopSfxClip: () => "stop",
    },
  };

  const originalPlay = targetWindow.CuppyLandAudio.playSfxClip;
  const originalLoop = targetWindow.CuppyLandAudio.playLoopingSfxClip;
  const originalStop = targetWindow.CuppyLandAudio.stopSfxClip;
  const capture = installSfxEventCapture(targetWindow);
  assert.notEqual(targetWindow.CuppyLandAudio.playSfxClip, originalPlay);

  capture.stop();
  assert.equal(capture.installed, false);
  assert.equal(targetWindow.CuppyLandAudio.playSfxClip, originalPlay);
  assert.equal(targetWindow.CuppyLandAudio.playLoopingSfxClip, originalLoop);
  assert.equal(targetWindow.CuppyLandAudio.stopSfxClip, originalStop);
});
