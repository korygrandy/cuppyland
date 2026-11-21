const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("puppy sequence blocks overlapping starts while active", () => {
  const friendState = {
    id: "puppy-1",
    type: "golden-puppy",
    worldX: 100,
    worldY: 100,
    hasBall: false,
    hasRope: false,
    hasBone: false,
  };
  const art = {
    style: {},
  };
  const friendElement = {
    offsetWidth: 120,
    offsetHeight: 120,
    style: {},
    querySelector: (selector) => {
      if (selector === ".friend-character-art") {
        return art;
      }
      return null;
    },
    appendChild: () => {},
  };
  const context = {
    window: {},
    document: {
      createElement: () => ({
        className: "",
        style: {},
        remove: () => {},
      }),
    },
    setTimeout,
    clearTimeout,
  };
  loadBrowserScript("src/controllers/puppy-sequence-controller.js", context);
  const controller = context.window.CuppyLandPuppySequenceController.createController({
    state: {},
    worldCanvas: {
      offsetWidth: 1200,
      offsetHeight: 700,
      querySelector: () => friendElement,
      querySelectorAll: () => [],
    },
    findFriendById: (id) => (id === friendState.id ? friendState : null),
    getFriendAssetMap: () => ({
      "golden-puppy-playing": "playing",
      "golden-puppy-playing-with-ball": "playing-ball",
    }),
    timerLifecycle: {
      clearPrefix: () => {},
      set: () => 123,
    },
  });

  assert.equal(controller.playWithBall(friendState.id), true);
  assert.equal(friendState.sequenceActive, true);
  assert.equal(controller.playWithBone(friendState.id), false);
});

test("stopping puppy sequence restores pre-sequence pose and orientation", () => {
  const friendState = {
    id: "puppy-2",
    type: "golden-puppy",
    worldX: 210,
    worldY: 175,
    hasBall: false,
    hasRope: false,
    hasBone: false,
  };
  const art = {
    style: {
      transform: "scaleX(-1)",
      transformOrigin: "center bottom",
    },
  };
  const friendElement = {
    offsetWidth: 120,
    offsetHeight: 120,
    style: {},
    querySelector: (selector) => {
      if (selector === ".friend-character-art") {
        return art;
      }
      return null;
    },
    appendChild: () => {},
  };
  const context = {
    window: {},
    document: {
      createElement: () => ({
        className: "",
        style: {},
        remove: () => {},
      }),
    },
    setTimeout,
    clearTimeout,
  };
  loadBrowserScript("src/controllers/puppy-sequence-controller.js", context);
  const controller = context.window.CuppyLandPuppySequenceController.createController({
    state: {},
    worldCanvas: {
      offsetWidth: 1200,
      offsetHeight: 700,
      querySelector: () => friendElement,
      querySelectorAll: () => [],
    },
    findFriendById: (id) => (id === friendState.id ? friendState : null),
    getFriendAssetMap: () => ({
      "golden-puppy-playing": "playing",
      "golden-puppy-playing-with-ball": "playing-ball",
    }),
    timerLifecycle: {
      clearPrefix: () => {},
      set: () => 456,
    },
  });

  assert.equal(controller.playWithBall(friendState.id), true);
  assert.notEqual(friendState.worldX, 210);
  assert.equal(friendState.sequenceActive, true);

  controller.stop(friendState.id);
  assert.equal(friendState.worldX, 210);
  assert.equal(friendState.worldY, 175);
  assert.equal(friendState.sequenceActive, false);
  assert.equal(art.style.transform, "scaleX(-1)");
  assert.equal(art.style.transformOrigin, "center bottom");
});
