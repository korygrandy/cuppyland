const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("pizza man step config uses the previous 100px wobble steps with one-second pauses", () => {
  const context = {
    window: {},
  };
  loadBrowserScript("src/controllers/friend-motion-controller.js", context);

  const controller = context.window.CuppyLandFriendMotionController.createController({
    state: {},
    worldCanvas: { offsetWidth: 1200, offsetHeight: 700, querySelector: () => null },
    findFriendById: () => null,
  });

  assert.equal(controller.getPizzaManStepConfig().stepDistancePx, 100);
  assert.equal(controller.getPizzaManStepConfig().pauseMs, 1000);
  assert.equal(controller.getPizzaManStepConfig().skewDeg, 18);
});
