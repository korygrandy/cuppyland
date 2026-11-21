const test = require("node:test");
const assert = require("node:assert/strict");
const { loadBrowserScript } = require("./test-helpers");

test("doghouse resolves ball and collar variants from attached puppy state", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/pet-asset-controller.js", context);

  const state = { activeWorld: "playground" };
  const worldFriends = [
    { id: "doghouse-1", type: "doghouse", activated: true },
    { id: "puppy-1", type: "golden-puppy", doghouseId: "doghouse-1", hasBall: true, hasCollar: false },
  ];
  const assetMap = {
    doghouse: "doghouse",
    "doghouse-with-dog": "doghouse-with-dog",
    "doghouse-with-ball": "doghouse-with-ball",
    "doghouse-with-collar": "doghouse-with-collar",
  };

  const controller = context.window.CuppyLandPetAssetController.createController({
    state,
    getWorldFriendList: () => worldFriends,
    getFriendAssetMap: () => assetMap,
  });

  assert.equal(controller.resolveDoghouse(worldFriends[0]), "doghouse-with-ball");

  worldFriends[1].hasBall = false;
  worldFriends[1].hasCollar = true;
  assert.equal(controller.resolveDoghouse(worldFriends[0]), "doghouse-with-collar");
});

test("golden puppy resolves squirrel sitting variant", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/pet-asset-controller.js", context);

  const controller = context.window.CuppyLandPetAssetController.createController({
    state: { activeWorld: "playground" },
    getWorldFriendList: () => [],
    getFriendAssetMap: () => ({
      "golden-puppy-sitting": "puppy-sit",
      "golden-puppy-sitting-with-squirrel": "puppy-sit-squirrel",
    }),
  });

  const asset = controller.resolveGoldenPuppy({
    type: "golden-puppy",
    hasSquirrel: true,
  });

  assert.equal(asset, "puppy-sit-squirrel");
});

test("golden puppy active sequence preserves the playing asset", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/pet-asset-controller.js", context);

  const controller = context.window.CuppyLandPetAssetController.createController({
    state: { activeWorld: "playground" },
    getWorldFriendList: () => [],
    getFriendAssetMap: () => ({
      "golden-puppy-sitting": "puppy-sit",
      "golden-puppy-sitting-with-ball": "puppy-sit-ball",
    }),
  });

  const asset = controller.resolveGoldenPuppy({
    type: "golden-puppy",
    sequenceActive: true,
    sequencePlayingAsset: "puppy-playing-ball",
    hasBall: true,
  });

  assert.equal(asset, "puppy-playing-ball");
});

test("doghouse resolves every puppy variant and the collar-added matrix", () => {
  const context = { window: {} };
  loadBrowserScript("src/controllers/pet-asset-controller.js", context);

  const assetMap = {
    doghouse: "doghouse",
    "doghouse-with-dog": "doghouse-with-dog",
    "doghouse-with-ball": "doghouse-with-ball",
    "doghouse-with-bone": "doghouse-with-bone",
    "doghouse-with-rope": "doghouse-with-rope",
    "doghouse-with-squirrel": "doghouse-with-squirrel",
    "doghouse-with-collar": "doghouse-with-collar",
  };
  const variants = [
    { name: "plain", state: {}, expected: "doghouse-with-dog" },
    { name: "ball", state: { hasBall: true }, expected: "doghouse-with-ball" },
    { name: "bone", state: { hasBone: true }, expected: "doghouse-with-bone" },
    { name: "rope", state: { hasRope: true }, expected: "doghouse-with-rope" },
    { name: "squirrel", state: { hasSquirrel: true }, expected: "doghouse-with-squirrel" },
  ];

  variants.forEach((variant) => {
    const doghouse = { id: "doghouse-1", type: "doghouse", activated: true };
    const puppy = {
      id: "puppy-1",
      type: "golden-puppy",
      doghouseId: doghouse.id,
      hasCollar: false,
      ...variant.state,
    };
    const controller = context.window.CuppyLandPetAssetController.createController({
      state: { activeWorld: "playground" },
      getWorldFriendList: () => [doghouse, puppy],
      getFriendAssetMap: () => assetMap,
    });

    assert.equal(controller.resolveDoghouse(doghouse), variant.expected, `${variant.name} puppy doghouse`);

    puppy.hasCollar = true;
    if (!puppy.hasBall && !puppy.hasSquirrel && !puppy.hasBone && !puppy.hasRope) {
      assert.equal(controller.resolveDoghouse(doghouse), "doghouse-with-collar", `${variant.name} puppy with collar`);
    } else {
      const collarExpected = puppy.hasBall
        ? "doghouse-with-ball"
        : puppy.hasSquirrel
          ? "doghouse-with-squirrel"
          : puppy.hasBone
            ? "doghouse-with-bone"
            : "doghouse-with-rope";
      assert.equal(controller.resolveDoghouse(doghouse), collarExpected, `${variant.name} puppy with collar`);
    }
  });
});
