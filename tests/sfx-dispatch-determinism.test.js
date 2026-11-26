const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

function createClassList() {
  const classes = new Set();
  return {
    add: (...names) => names.forEach((name) => classes.add(name)),
    remove: (...names) => names.forEach((name) => classes.delete(name)),
    contains: (name) => classes.has(name),
  };
}

function createDomElement({ left = 0, top = 0, right = 0, bottom = 0, width = 120, height = 120 } = {}) {
  return {
    style: {},
    dataset: {},
    classList: createClassList(),
    offsetWidth: width,
    offsetHeight: height,
    getBoundingClientRect: () => ({
      left,
      top,
      right: right || left + width,
      bottom: bottom || top + height,
      width,
      height,
    }),
  };
}

test("tube slide dispatch triggers Barbie hitbox SFX deterministically", () => {
  const hitboxCalls = [];
  const clipCalls = [];
  const container = {
    querySelectorAll: () => [],
    appendChild: () => {},
  };
  const worldCanvas = {
    offsetWidth: 1000,
    offsetHeight: 1000,
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 1000,
      width: 1000,
      height: 1000,
    }),
    querySelectorAll: () => [],
  };
  const context = {
    window: {
      CuppyLandGame: {
        friendTypes: ["barbie-blonde", "barbie-blonde-baby"],
        backgroundObjectAnchors: {
          playground: [{
            id: "tube-slide",
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            hitboxOffsetX: 0,
            hitboxOffsetY: 0,
            hitboxWidth: 100,
            hitboxHeight: 100,
            reanchorOffsetX: 100,
            reanchorOffsetY: 100,
            reanchorWidth: 132,
            reanchorHeight: 132,
          }],
        },
      },
      CuppyLandObjectSfxTriggerRegistry: {
        playHitboxSfx: (friendType, playSfxClip) => {
          hitboxCalls.push(friendType);
          playSfxClip("blondeBarbieActivated");
        },
      },
    },
    document: {
      createElement: () => createDomElement(),
    },
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: () => 1,
    clearTimeout: () => {},
  };

  loadBrowserScript("src/controllers/tube-slide-controller.js", context);
  const controller = context.window.CuppyLandTubeSlideController.createController({
    container,
    worldCanvas,
    playSfxClip: (clipName) => clipCalls.push(clipName),
  });
  controller.render("playground");

  const friendState = { id: "barbie-1", type: "barbie-blonde", worldX: 120, worldY: 120 };
  const friendElement = createDomElement({ left: 120, top: 120, width: 120, height: 120 });
  controller.syncFriend(friendState, friendElement);

  assert.deepEqual(hitboxCalls, ["barbie-blonde"]);
  assert.deepEqual(clipCalls, ["blondeBarbieActivated"]);
  assert.equal(controller.hasActiveSequence("friend:barbie-1"), true);
});

test("tube slide dispatch stops rabbit and turtle motion before sequence start", () => {
  const stopCalls = [];
  const container = {
    querySelectorAll: () => [],
    appendChild: () => {},
  };
  const worldCanvas = {
    offsetWidth: 1000,
    offsetHeight: 1000,
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 1000,
      width: 1000,
      height: 1000,
    }),
    querySelectorAll: () => [],
  };
  const context = {
    window: {
      CuppyLandGame: {
        friendTypes: ["rabbit-bead-craft", "turtle-bead-craft"],
        backgroundObjectAnchors: {
          playground: [{
            id: "tube-slide",
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            hitboxOffsetX: 0,
            hitboxOffsetY: 0,
            hitboxWidth: 100,
            hitboxHeight: 100,
            reanchorOffsetX: 100,
            reanchorOffsetY: 100,
            reanchorWidth: 132,
            reanchorHeight: 132,
          }],
        },
      },
    },
    document: {
      createElement: () => createDomElement(),
    },
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: () => 1,
    clearTimeout: () => {},
  };

  loadBrowserScript("src/controllers/tube-slide-controller.js", context);
  const controller = context.window.CuppyLandTubeSlideController.createController({
    container,
    worldCanvas,
    stopRabbitAnimation: (friendId) => stopCalls.push(`rabbit:${friendId}`),
    stopTurtleAnimation: (friendId) => stopCalls.push(`turtle:${friendId}`),
  });
  controller.render("playground");

  const rabbitState = { id: "rabbit-1", type: "rabbit-bead-craft", worldX: 120, worldY: 120 };
  const turtleState = { id: "turtle-1", type: "turtle-bead-craft", worldX: 130, worldY: 130 };
  const rabbitElement = createDomElement({ left: 120, top: 120, width: 120, height: 120 });
  const turtleElement = createDomElement({ left: 130, top: 130, width: 120, height: 120 });

  controller.syncFriend(rabbitState, rabbitElement);
  controller.syncFriend(turtleState, turtleElement);

  assert.deepEqual(stopCalls, ["rabbit:rabbit-1", "turtle:turtle-1"]);
  assert.equal(controller.hasActiveSequence("friend:rabbit-1"), true);
  assert.equal(controller.hasActiveSequence("friend:turtle-1"), true);
});
