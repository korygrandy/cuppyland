const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("friends stay draggable and within canvas edges", () => {
  const context = { window: {}, setInterval: () => 1, clearInterval: () => {} };
  loadBrowserScript("src/controllers/friend-pointer-controller.js", context);

  const worldCanvas = {
    offsetWidth: 1200,
    offsetHeight: 700,
    querySelectorAll: () => [],
  };
  const controller = context.window.CuppyLandFriendPointerController.createController({
    state: {},
    worldCanvas,
    friendDragState: {},
    trySetPointerCapture: () => {},
    isPointerOutsideWorldCanvas: () => false,
    resolveFriendStateForElement: () => null,
    getElementDragScale: () => 1,
    getWorldPointFromClient: () => ({ worldX: 0, worldY: 0 }),
  });

  const ballElement = { offsetWidth: 72, offsetHeight: 72 };
  const ballState = { id: "ball-1", type: "dogtoy-ball" };
  const topLeft = controller.clampFriendPosition(ballElement, ballState, -20, -20);
  assert.equal(topLeft.worldX, 0);
  assert.equal(topLeft.worldY, 12);

  const bottomRight = controller.clampFriendPosition(ballElement, ballState, 1400, 900);
  assert.equal(bottomRight.worldX, 1128);
  assert.equal(bottomRight.worldY, 628);
});
