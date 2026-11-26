const { installSfxEventCapture } = require("./capture-sfx-events");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getLastFriendByType(runtimeWindow, friendType) {
  const friends = runtimeWindow.CuppyLandGame?.state?.worlds?.playground?.friends || [];
  for (let index = friends.length - 1; index >= 0; index -= 1) {
    if (friends[index]?.type === friendType) {
      return friends[index];
    }
  }
  return null;
}

function createDefaultActions(runtimeWindow) {
  return {
    async openPlayground() {
      runtimeWindow.document?.getElementById?.("playBtn")?.click?.();
      runtimeWindow.document?.querySelector?.('[data-world="playground"]')?.click?.();
      await wait(120);
    },
    async triggerBarbieTubeSlide() {
      runtimeWindow.applyInventorySelection?.("friend", "barbie-blonde", null, { worldX: 4940, worldY: 240 });
      const friend = getLastFriendByType(runtimeWindow, "barbie-blonde");
      const friendElement = friend
        ? runtimeWindow.document?.querySelector?.(`.friend-character[data-friend-id="${friend.id}"]`)
        : null;
      if (friend && friendElement) {
        friend.worldX = 4940;
        friend.worldY = 240;
        friendElement.style.left = "4940px";
        friendElement.style.top = "240px";
        runtimeWindow.CuppyLandTubeSlideRuntime?.syncFriend?.(friend, friendElement);
      }
      await wait(80);
    },
    async triggerBarbieBabyTubeSlide() {
      runtimeWindow.applyInventorySelection?.("friend", "barbie-blonde-baby", null, { worldX: 4940, worldY: 240 });
      const friend = getLastFriendByType(runtimeWindow, "barbie-blonde-baby");
      const friendElement = friend
        ? runtimeWindow.document?.querySelector?.(`.friend-character[data-friend-id="${friend.id}"]`)
        : null;
      if (friend && friendElement) {
        friend.worldX = 4940;
        friend.worldY = 240;
        friendElement.style.left = "4940px";
        friendElement.style.top = "240px";
        runtimeWindow.CuppyLandTubeSlideRuntime?.syncFriend?.(friend, friendElement);
      }
      await wait(80);
    },
    async triggerMutedBarbieBabySnap() {
      const audioState = runtimeWindow.CuppyLandAudio?.audioState;
      const previousVolume = audioState?.sfxVolume;
      if (audioState) {
        audioState.sfxVolume = 0;
      }
      runtimeWindow.applyInventorySelection?.("friend", "barbie-blonde-baby", null, { worldX: 4920, worldY: 240 });
      await wait(40);
      if (audioState) {
        audioState.sfxVolume = previousVolume;
      }
    },
  };
}

async function runCoreSfxMatrix(targetWindow, options = {}) {
  const runtimeWindow = targetWindow || (typeof window !== "undefined" ? window : null);
  if (!runtimeWindow) {
    return { valid: false, error: "No runtime window available", cases: [] };
  }

  const capture = installSfxEventCapture(runtimeWindow);
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
    expect: (events) => events.some((event) => event.clipName === "playgroundIntroFx"),
  };

  const matrixCases = [
    {
      name: "barbie-tube-slide",
      run: actions.triggerBarbieTubeSlide,
      expect: (events) => events.some((event) => event.clipName === "barbieBlondeSnap"),
    },
    {
      name: "barbie-baby-tube-slide",
      run: actions.triggerBarbieBabyTubeSlide,
      expect: (events) => events.some((event) => event.clipName === "barbieBlondeBabySnap"),
    },
    {
      name: "muted-barbie-baby",
      run: actions.triggerMutedBarbieBabySnap,
      expect: (events) => events.some((event) => event.clipName === "barbieBlondeBabySnap" && event.sfxVolume === 0),
    },
  ];

  const repeats = Math.max(1, Number(options.repeats || 1));
  const cases = [];

  capture.clear();
  if (typeof setupCase.run === "function") {
    await setupCase.run();
  }
  await wait(60);
  const setupEvents = capture.events.map((event) => ({
    type: event.type,
    clipName: event.clipName,
    sfxVolume: event.sfxVolume,
    world: event.world,
  }));
  cases.push({
    repeat: 1,
    name: setupCase.name,
    passed: setupCase.expect(setupEvents),
    eventClips: setupEvents.map((event) => `${event.type}:${event.clipName}:${event.sfxVolume}`),
  });

  for (let repeatIndex = 0; repeatIndex < repeats; repeatIndex += 1) {
    for (const matrixCase of matrixCases) {
      capture.clear();
      if (typeof matrixCase.run === "function") {
        await matrixCase.run();
      }
      await wait(60);
      const events = capture.events.map((event) => ({
        type: event.type,
        clipName: event.clipName,
        sfxVolume: event.sfxVolume,
        world: event.world,
      }));
      const passed = matrixCase.expect(events);
      cases.push({
        repeat: repeatIndex + 1,
        name: matrixCase.name,
        passed,
        eventClips: events.map((event) => `${event.type}:${event.clipName}:${event.sfxVolume}`),
      });
    }
  }

  return {
    valid: cases.every((item) => item.passed),
    cases,
  };
}

if (typeof module !== "undefined") {
  module.exports = {
    runCoreSfxMatrix,
    createDefaultActions,
  };
}
