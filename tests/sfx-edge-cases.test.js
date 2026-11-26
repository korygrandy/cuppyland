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

function createDomElement({ left = 0, top = 0, width = 120, height = 120 } = {}) {
  return {
    style: {},
    dataset: {},
    classList: createClassList(),
    offsetWidth: width,
    offsetHeight: height,
    getBoundingClientRect: () => ({
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height,
    }),
  };
}

function createTubeSlideHarness() {
  const hitboxCalls = [];
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
        friendTypes: ["barbie-blonde"],
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
          playSfxClip("barbieBlondeSnap");
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
    playSfxClip: () => {},
  });
  controller.render("playground");

  return {
    controller,
    hitboxCalls,
  };
}

test("rapid re-entry does not duplicate Tube Slide activation while sequence is active", () => {
  const { controller, hitboxCalls } = createTubeSlideHarness();
  const friendState = { id: "barbie-1", type: "barbie-blonde", worldX: 120, worldY: 120 };
  const friendElement = createDomElement({ left: 120, top: 120, width: 120, height: 120 });

  controller.syncFriend(friendState, friendElement);
  controller.syncFriend(friendState, friendElement);
  controller.syncFriend(friendState, friendElement);

  assert.equal(controller.hasActiveSequence("friend:barbie-1"), true);
  assert.deepEqual(hitboxCalls, ["barbie-blonde"]);
});

test("temporary overlap loss does not cancel active Tube Slide sequence", () => {
  const { controller } = createTubeSlideHarness();
  const friendState = { id: "barbie-2", type: "barbie-blonde", worldX: 120, worldY: 120 };
  const overlapElement = createDomElement({ left: 120, top: 120, width: 120, height: 120 });
  const outsideElement = createDomElement({ left: 500, top: 500, width: 120, height: 120 });

  controller.syncFriend(friendState, overlapElement);
  assert.equal(controller.hasActiveSequence("friend:barbie-2"), true);

  controller.syncFriend(friendState, outsideElement);
  assert.equal(controller.hasActiveSequence("friend:barbie-2"), true);
});

test("world switch interrupts Tube Slide sequence cleanup deterministically", () => {
  const { controller } = createTubeSlideHarness();
  const friendState = { id: "barbie-3", type: "barbie-blonde", worldX: 120, worldY: 120 };
  const friendElement = createDomElement({ left: 120, top: 120, width: 120, height: 120 });

  controller.syncFriend(friendState, friendElement);
  assert.equal(controller.hasActiveSequence("friend:barbie-3"), true);

  controller.render("olivia-room");
  assert.equal(controller.hasActiveSequence("friend:barbie-3"), false);
});
