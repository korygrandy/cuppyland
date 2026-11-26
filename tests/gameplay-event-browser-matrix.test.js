const test = require("node:test");
const assert = require("node:assert/strict");
const { runCoreEventMatrix } = require("../scripts/validate-events-browser");

test("gameplay-event browser matrix runner reports deterministic pass/fail results", async () => {
  const runtimeWindow = {
    document: {
      getElementById: () => ({ click: () => {} }),
      querySelector: () => ({ click: () => {} }),
    },
    CuppyLandGame: {
      state: {
        activeWorld: "playground",
      },
    },
  };

  const result = await runCoreEventMatrix(runtimeWindow, {
    repeats: 2,
    actions: {
      openPlayground: async () => {
        runtimeWindow.CuppyLandGameplayEventCapture.start("open-playground");
        runtimeWindow.CuppyLandGameplayEventCapture.complete("open-playground");
      },
      recordTubeSlideSequence: async () => {
        runtimeWindow.CuppyLandGameplayEventCapture.start("tube-slide-sequence");
        runtimeWindow.CuppyLandGameplayEventCapture.step("tube-slide-sequence", { phase: "entering" });
        runtimeWindow.CuppyLandGameplayEventCapture.complete("tube-slide-sequence");
      },
      recordObjectStateTransition: async () => {
        runtimeWindow.CuppyLandGameplayEventCapture.start("object-state-transition");
        runtimeWindow.CuppyLandGameplayEventCapture.complete("object-state-transition");
      },
      recordCanvasEdgeClamp: async () => {
        runtimeWindow.CuppyLandGameplayEventCapture.start("canvas-edge-clamp");
        runtimeWindow.CuppyLandGameplayEventCapture.complete("canvas-edge-clamp");
      },
    },
  });

  assert.equal(result.valid, true);
  assert.equal(result.cases.length, 7);
  result.cases.forEach((matrixCase) => {
    assert.equal(matrixCase.passed, true, `${matrixCase.name} should pass`);
    assert.ok(matrixCase.trace.length > 0);
  });

  const firstPass = result.cases.filter((entry) => entry.repeat === 1 && entry.name !== "open-playground").map((entry) => entry.trace);
  const secondPass = result.cases.filter((entry) => entry.repeat === 2).map((entry) => entry.trace);
  assert.deepEqual(firstPass, secondPass);
});
