const test = require("node:test");
const assert = require("node:assert/strict");
const { installGameplayEventCapture } = require("../scripts/capture-gameplay-events");

test("gameplay event capture records start/step/complete/cancel deterministically", () => {
  const runtimeWindow = {
    CuppyLandGame: {
      state: {
        activeWorld: "playground",
      },
    },
  };

  const capture = installGameplayEventCapture(runtimeWindow);
  capture.start("tube-slide", { sourceId: "friend-1" });
  capture.step("tube-slide", { phase: "entering" });
  capture.complete("tube-slide", { phase: "reanchor" });
  capture.cancel("tube-slide", { reason: "world-switch" });

  assert.equal(capture.installed, true);
  assert.equal(capture.events.length, 4);
  assert.equal(capture.events[0].type, "eventStart");
  assert.equal(capture.events[1].type, "eventStep");
  assert.equal(capture.events[2].type, "eventComplete");
  assert.equal(capture.events[3].type, "eventCancel");

  capture.clear();
  assert.equal(capture.events.length, 0);
  capture.stop();
  assert.equal(capture.installed, false);
});
