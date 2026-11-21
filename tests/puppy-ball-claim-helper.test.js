const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("ball claim helper allows one puppy owner at a time", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/puppy-ball-claim-helper.js", context);
  const helper = context.window.CuppyLandPuppyBallClaimHelper;
  const ballState = { id: "ball-1" };

  assert.equal(helper.tryClaim(ballState, "puppy-a"), true);
  assert.equal(helper.tryClaim(ballState, "puppy-b"), false);
  helper.release(ballState, "puppy-b");
  assert.equal(ballState.claimedByPuppyId, "puppy-a");
  helper.release(ballState, "puppy-a");
  assert.equal(ballState.claimedByPuppyId, null);
  assert.equal(helper.tryClaim(ballState, "puppy-b"), true);
});
