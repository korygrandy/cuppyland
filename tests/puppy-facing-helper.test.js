const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { loadBrowserScript } = require("./test-helpers");

test("puppy facing helper separates facing and movement logic", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/puppy-facing-helper.js", context);
  const helper = context.window.CuppyLandPuppyFacingHelper;

  assert.equal(helper.resolveFacing({ walkingFacing: "left" }), "left");
  assert.equal(helper.resolveFacing({}), "right");

  const friendState = { type: "golden-puppy", hasLeash: true };
  helper.updateFacingFromMovement(friendState, 100, 60);
  assert.equal(friendState.walkingFacing, "right");
  helper.updateFacingFromMovement(friendState, 60, 100);
  assert.equal(friendState.walkingFacing, "left");
});
