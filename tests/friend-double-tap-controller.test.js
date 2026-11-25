const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("friend double-tap controller activates only on the second tap", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/friend-double-tap-controller.js", context);
  let nowMs = 1000;
  const controller = context.window.CuppyLandFriendDoubleTapController.createController({
    now: () => nowMs,
  });
  const friendState = { id: "pumpkin-1", type: "pumpkin-woman" };
  let activationCount = 0;
  const activate = () => { activationCount += 1; };

  assert.equal(controller.tryActivate(friendState, 450, activate), false);
  assert.equal(activationCount, 0);
  nowMs = 1400;
  assert.equal(controller.tryActivate(friendState, 450, activate), true);
  assert.equal(activationCount, 1);
  assert.equal(friendState.lastTapAtMs, 0);
});

test("friend double-tap controller expires an old first tap", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/friend-double-tap-controller.js", context);
  let nowMs = 1000;
  const controller = context.window.CuppyLandFriendDoubleTapController.createController({
    now: () => nowMs,
  });
  const friendState = { id: "pizza-1", type: "pizza-man-craft" };

  assert.equal(controller.tryActivate(friendState, 450, () => {}), false);
  nowMs = 1501;
  assert.equal(controller.tryActivate(friendState, 450, () => {}), false);
  assert.equal(friendState.lastTapAtMs, 1501);
});
