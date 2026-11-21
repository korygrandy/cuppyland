const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("close puppy proximity pushes the ball away instead of starting a sequence", () => {
  const context = {
    window: {
      clearTimeout: () => {},
      setTimeout: () => 1,
    },
  };
  loadBrowserScript("src/controllers/friend-proximity-controller.js", context);

  const dogState = { id: "puppy-1", type: "golden-puppy", activated: false, hasBall: false };
  const ballState = { id: "ball-1", worldX: 200, worldY: 200 };
  let pushedClassAdded = false;
  let removed = false;
  let sequenceStarts = 0;

  const dogElement = {
    getBoundingClientRect: () => ({ left: 100, right: 150, top: 100, bottom: 150 }),
  };
  const ballElement = {
    getBoundingClientRect: () => ({ left: 120, right: 170, top: 120, bottom: 170 }),
    offsetWidth: 50,
    offsetHeight: 50,
    style: {},
    classList: {
      add: () => { pushedClassAdded = true; },
      remove: () => {},
    },
  };

  const controller = context.window.CuppyLandFriendProximityController.createController({
    state: {},
    worldCanvas: {
      offsetWidth: 1200,
      offsetHeight: 700,
      querySelectorAll: () => [ballElement],
    },
    resolveFriendStateForElement: () => ballState,
    removeFriendInstance: () => {
      removed = true;
      return true;
    },
    playGoldenPuppyWithBall: () => {
      sequenceStarts += 1;
      return true;
    },
  });

  controller.syncBallAvoidance(dogElement, dogState);

  assert.equal(sequenceStarts, 0);
  assert.equal(removed, false);
  assert.equal(pushedClassAdded, true);
  assert.equal(ballState.worldX > 200, true);
});

test("pushed squirrel resyncs trampoline overlap immediately", () => {
  const context = {
    window: {
      clearTimeout: () => {},
      setTimeout: () => 1,
    },
  };
  loadBrowserScript("src/controllers/friend-proximity-controller.js", context);

  const dogState = { id: "puppy-1", type: "golden-puppy", activated: false };
  const squirrelState = { id: "squirrel-1", type: "squirrel", worldX: 400, worldY: 300 };
  let syncCount = 0;

  const dogElement = {
    getBoundingClientRect: () => ({ left: 100, right: 220, top: 100, bottom: 220 }),
  };
  const squirrelElement = {
    offsetWidth: 120,
    offsetHeight: 120,
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
    },
    getBoundingClientRect: () => ({
      left: squirrelState.worldX,
      right: squirrelState.worldX + 120,
      top: squirrelState.worldY,
      bottom: squirrelState.worldY + 120,
    }),
    querySelector: () => ({
      style: {},
    }),
  };

  const controller = context.window.CuppyLandFriendProximityController.createController({
    state: {},
    worldCanvas: {
      offsetWidth: 1200,
      offsetHeight: 700,
      querySelectorAll: () => [squirrelElement],
    },
    resolveFriendStateForElement: () => squirrelState,
    getFriendAssetMap: () => ({
      squirrel: "squirrel",
      "squirrel-running": "squirrel-running",
    }),
    syncFriendActivation: (state, element) => {
      syncCount += 1;
      assert.equal(state, squirrelState);
      assert.equal(element, squirrelElement);
    },
  });

  controller.syncSquirrelAvoidance(dogElement, dogState);

  assert.equal(squirrelState.worldX > 400, true);
  assert.equal(syncCount, 1);
});

test("pushed squirrel re-entry reactivates after leaving the trampoline hitbox", () => {
  const context = {
    window: {
      clearTimeout: () => {},
      setTimeout: () => 1,
    },
  };
  loadBrowserScript("src/controllers/friend-proximity-controller.js", context);

  const dogState = { id: "puppy-1", type: "golden-puppy", activated: false };
  const squirrelState = { id: "squirrel-1", type: "squirrel", worldX: 700, worldY: 300 };
  const syncStates = [];

  const dogElement = {
    getBoundingClientRect: () => ({ left: 600, right: 720, top: 100, bottom: 220 }),
  };
  const squirrelElement = {
    offsetWidth: 120,
    offsetHeight: 120,
    style: {},
    classList: { add: () => {}, remove: () => {} },
    getBoundingClientRect: () => ({
      left: squirrelState.worldX,
      right: squirrelState.worldX + 120,
      top: squirrelState.worldY,
      bottom: squirrelState.worldY + 120,
    }),
    querySelector: () => ({ style: {} }),
  };

  const controller = context.window.CuppyLandFriendProximityController.createController({
    state: {},
    worldCanvas: {
      offsetWidth: 1200,
      offsetHeight: 700,
      querySelectorAll: () => [squirrelElement],
    },
    resolveFriendStateForElement: () => squirrelState,
    getFriendAssetMap: () => ({ squirrel: "squirrel", "squirrel-running": "run" }),
    syncFriendActivation: (state) => {
      syncStates.push({ ...state });
    },
  });

  controller.syncSquirrelAvoidance(dogElement, dogState);
  assert.equal(squirrelState.worldX > 700, true);

  squirrelState.worldX = 300;
  squirrelState.worldY = 300;
  controller.syncSquirrelAvoidance(dogElement, dogState);
  assert.equal(syncStates.length >= 2, true);
});
