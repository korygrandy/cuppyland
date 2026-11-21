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

test("squirrel sequence resolves the playing-with-squirrel asset", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/puppy-sequence-asset-helper.js", context);
  const helper = context.window.CuppyLandPuppySequenceAssetHelper;

  const asset = helper.resolvePlayingAsset({
    toyType: "squirrel",
    friendState: { hasSquirrel: false },
    assetMap: {
      "golden-puppy-playing": "playing",
      "golden-puppy-playing-with-squirrel": "playing-squirrel",
    },
  });

  assert.equal(asset, "playing-squirrel");
});

test("every toy resolves the correct playing and final assets across sitting variants", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/puppy-sequence-asset-helper.js", context);
  const helper = context.window.CuppyLandPuppySequenceAssetHelper;
  const assetMap = {
    "golden-puppy-playing": "playing",
    "golden-puppy-playing-rope": "playing-rope",
    "golden-puppy-playing-bone": "playing-bone",
    "golden-puppy-playing-with-ball": "playing-ball",
    "golden-puppy-playing-with-squirrel": "playing-squirrel",
    "golden-puppy-sitting": "sit",
    "golden-puppy-with-rope-sitting": "sit-rope",
    "golden-puppy-with-bone-sitting": "sit-bone",
    "golden-puppy-sitting-with-ball": "sit-ball",
    "golden-puppy-sitting-with-squirrel": "sit-squirrel",
  };
  const sittingVariants = [
    { name: "plain", state: {} },
    { name: "rope", state: { hasRope: true } },
    { name: "bone", state: { hasBone: true } },
    { name: "ball", state: { hasBall: true } },
    { name: "squirrel", state: { hasSquirrel: true } },
  ];
  const toys = [
    { type: "rope", expectedPlaying: "playing-rope", expectedFinal: "sit-rope", finalState: { hasRope: true } },
    { type: "bone", expectedPlaying: "playing-bone", expectedFinal: "sit-bone", finalState: { hasBone: true } },
    { type: "ball", expectedPlaying: "playing-ball", expectedFinal: "sit-ball", finalState: { hasBall: true } },
    { type: "squirrel", expectedPlaying: "playing-squirrel", expectedFinal: "sit-squirrel", finalState: { hasSquirrel: true } },
  ];

  sittingVariants.forEach((variant) => {
    toys.forEach((toy) => {
      let expectedPlaying = toy.expectedPlaying;
      if (toy.type === "ball" && variant.state.hasRope) {
        expectedPlaying = "playing-rope";
      } else if (toy.type === "ball" && variant.state.hasBone) {
        expectedPlaying = "playing-bone";
      }
      const playingAsset = helper.resolvePlayingAsset({
        toyType: toy.type,
        friendState: variant.state,
        assetMap,
      });
      assert.equal(playingAsset, expectedPlaying, `${variant.name} sitting puppy + ${toy.type}`);

      const finalAsset = helper.resolveFinalAsset({
        friendState: toy.finalState,
        assetMap,
      });
      assert.equal(finalAsset, toy.expectedFinal, `${variant.name} sitting puppy final for ${toy.type}`);
    });
  });
});
