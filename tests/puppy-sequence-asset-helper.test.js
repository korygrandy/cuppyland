const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("ball sequence keeps current toy animation until completion when puppy has other toy", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/puppy-sequence-asset-helper.js", context);
  const helper = context.window.CuppyLandPuppySequenceAssetHelper;
  const assetMap = {
    "golden-puppy-playing": "playing",
    "golden-puppy-playing-rope": "playing-rope",
    "golden-puppy-playing-bone": "playing-bone",
    "golden-puppy-playing-with-ball": "playing-ball",
  };

  const ropeFirst = helper.resolvePlayingAsset({
    toyType: "ball",
    friendState: { hasBall: false, hasRope: true, hasBone: false },
    assetMap,
  });
  assert.equal(ropeFirst, "playing-rope");

  const boneFirst = helper.resolvePlayingAsset({
    toyType: "ball",
    friendState: { hasBall: false, hasRope: false, hasBone: true },
    assetMap,
  });
  assert.equal(boneFirst, "playing-bone");

  const noOtherToy = helper.resolvePlayingAsset({
    toyType: "ball",
    friendState: { hasBall: false, hasRope: false, hasBone: false },
    assetMap,
  });
  assert.equal(noOtherToy, "playing-ball");
});
