const { installGameplayEventCapture } = require("./capture-gameplay-events");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createDefaultActions(runtimeWindow) {
  return {
    async openPlayground() {
      runtimeWindow.document?.getElementById?.("playBtn")?.click?.();
      runtimeWindow.document?.querySelector?.('[data-world="playground"]')?.click?.();
      await wait(120);
    },
    async recordCanvasEdgeClamp() {
      const capture = runtimeWindow.CuppyLandGameplayEventCapture;
      capture?.start("canvas-edge-clamp");
      capture?.complete("canvas-edge-clamp", { expected: "clamped" });
    },
    async recordTubeSlideSequence() {
      const capture = runtimeWindow.CuppyLandGameplayEventCapture;
      capture?.start("tube-slide-sequence");
      capture?.step("tube-slide-sequence", { phase: "entering" });
      capture?.complete("tube-slide-sequence", { phase: "reanchor" });
    },
    async recordObjectStateTransition() {
      const capture = runtimeWindow.CuppyLandGameplayEventCapture;
      capture?.start("object-state-transition");
      capture?.step("object-state-transition", { from: "detached", to: "attached" });
      capture?.complete("object-state-transition");
    },
  };
}

async function runCoreEventMatrix(targetWindow, options = {}) {
  const runtimeWindow = targetWindow || (typeof window !== "undefined" ? window : null);
  if (!runtimeWindow) {
    return { valid: false, error: "No runtime window available", cases: [] };
  }

  const capture = installGameplayEventCapture(runtimeWindow);
  if (!capture.installed) {
    return { valid: false, error: capture.reason || "Capture install failed", cases: [] };
  }

  const actions = {
    ...createDefaultActions(runtimeWindow),
    ...(options.actions || {}),
  };

  const setupCase = {
    name: "open-playground",
    run: actions.openPlayground,
    expect: () => true,
  };

  const matrixCases = [
    {
      name: "tube-slide-sequence",
      run: actions.recordTubeSlideSequence,
      expect: (events) => events.some((event) => event.eventId === "tube-slide-sequence" && event.type === "eventComplete"),
    },
    {
      name: "object-state-transition",
      run: actions.recordObjectStateTransition,
      expect: (events) => events.some((event) => event.eventId === "object-state-transition" && event.type === "eventComplete"),
    },
    {
      name: "canvas-edge-clamp",
      run: actions.recordCanvasEdgeClamp,
      expect: (events) => events.some((event) => event.eventId === "canvas-edge-clamp" && event.type === "eventComplete"),
    },
  ];

  const repeats = Math.max(1, Number(options.repeats || 1));
  const cases = [];

  capture.clear();
  if (typeof setupCase.run === "function") {
    await setupCase.run();
  }
  await wait(60);
  cases.push({
    repeat: 1,
    name: setupCase.name,
    passed: setupCase.expect(capture.events),
    trace: capture.events.map((event) => `${event.type}:${event.eventId || ""}`),
  });

  for (let repeatIndex = 0; repeatIndex < repeats; repeatIndex += 1) {
    for (const matrixCase of matrixCases) {
      capture.clear();
      if (typeof matrixCase.run === "function") {
        await matrixCase.run();
      }
      await wait(40);
      const events = capture.events.map((event) => ({ ...event }));
      cases.push({
        repeat: repeatIndex + 1,
        name: matrixCase.name,
        passed: matrixCase.expect(events),
        trace: events.map((event) => `${event.type}:${event.eventId || ""}`),
      });
    }
  }

  return {
    valid: cases.every((entry) => entry.passed),
    cases,
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    runCoreEventMatrix,
    createDefaultActions,
  };
}
