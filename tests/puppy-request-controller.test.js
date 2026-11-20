const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("puppy request completion only accepts an active matching request", () => {
  let celebrationCount = 0;
  const context = {
    window: {},
    setTimeout,
    clearTimeout,
  };
  loadBrowserScript("src/controllers/puppy-request-controller.js", context);

  const puppy = {
    id: "puppy-1",
    requestType: "food",
    requestExpiresAt: Date.now() + 10000,
  };
  const controller = context.window.CuppyLandPuppyRequestController.createController({
    worldCanvas: {
      querySelector: () => ({}),
    },
    triggerCelebration: () => {
      celebrationCount += 1;
    },
  });

  assert.equal(controller.complete(puppy, "drink"), false);
  assert.equal(controller.complete(puppy, "food"), true);
  assert.equal(celebrationCount, 1);
  assert.equal(puppy.requestType, null);
  assert.equal(puppy.requestExpiresAt, 0);
});
